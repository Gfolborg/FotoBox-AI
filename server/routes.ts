import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import multer from "multer";
import sharp from "sharp";
import { GoogleGenAI, Modality } from "@google/genai";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Helper function to convert hex color to RGB values
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace(/^#/, "");

  // Handle 3-char hex
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((c) => c + c)
          .join("")
      : cleanHex;

  return {
    r: parseInt(fullHex.substring(0, 2), 16),
    g: parseInt(fullHex.substring(2, 4), 16),
    b: parseInt(fullHex.substring(4, 6), 16),
  };
}

type RGB = { r: number; g: number; b: number };

async function trimUniformBorders(
  buffer: Buffer,
): Promise<{ buffer: Buffer; trimmed: boolean }> {
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const sampleSize = 10;
  const colorThreshold = 12;
  const maxTrimRatio = 0.35;
  const sampleStep = Math.max(4, Math.floor(Math.min(width, height) / 100));

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const sampleBlock = (startX: number, startY: number): RGB => {
    const safeStartX = clamp(startX, 0, width - 1);
    const safeStartY = clamp(startY, 0, height - 1);
    const endX = clamp(safeStartX + sampleSize, 0, width);
    const endY = clamp(safeStartY + sampleSize, 0, height);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let y = safeStartY; y < endY; y += 1) {
      for (let x = safeStartX; x < endX; x += 1) {
        const idx = (y * width + x) * channels;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count += 1;
      }
    }
    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
    };
  };

  const corners = [
    sampleBlock(0, 0),
    sampleBlock(width - sampleSize, 0),
    sampleBlock(0, height - sampleSize),
    sampleBlock(width - sampleSize, height - sampleSize),
  ];

  const avgCorner = corners.reduce(
    (acc, c) => ({
      r: acc.r + c.r,
      g: acc.g + c.g,
      b: acc.b + c.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  const background: RGB = {
    r: Math.round(avgCorner.r / corners.length),
    g: Math.round(avgCorner.g / corners.length),
    b: Math.round(avgCorner.b / corners.length),
  };

  const cornerVariance = corners.some((c) => {
    const diff =
      Math.abs(c.r - background.r) +
      Math.abs(c.g - background.g) +
      Math.abs(c.b - background.b);
    return diff > colorThreshold * 3;
  });

  if (cornerVariance) {
    return { buffer, trimmed: false };
  }

  const alphaThreshold = 12;

  const isBackgroundPixel = (idx: number) => {
    if (channels >= 4) {
      const alpha = data[idx + 3];
      if (alpha <= alphaThreshold) {
        return true;
      }
    }
    const diff =
      Math.abs(data[idx] - background.r) +
      Math.abs(data[idx + 1] - background.g) +
      Math.abs(data[idx + 2] - background.b);
    return diff <= colorThreshold * 3;
  };

  const isBackgroundRow = (y: number) => {
    let total = 0;
    let matches = 0;
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * channels;
      total += 1;
      if (isBackgroundPixel(idx)) {
        matches += 1;
      }
    }
    return matches / total >= 0.98;
  };

  const isBackgroundColumn = (x: number) => {
    let total = 0;
    let matches = 0;
    for (let y = 0; y < height; y += sampleStep) {
      const idx = (y * width + x) * channels;
      total += 1;
      if (isBackgroundPixel(idx)) {
        matches += 1;
      }
    }
    return matches / total >= 0.98;
  };

  const maxTrimTop = Math.floor(height * maxTrimRatio);
  const maxTrimBottom = Math.floor(height * maxTrimRatio);
  const maxTrimLeft = Math.floor(width * maxTrimRatio);
  const maxTrimRight = Math.floor(width * maxTrimRatio);

  let top = 0;
  while (top < maxTrimTop && isBackgroundRow(top)) top += 1;

  let bottom = 0;
  while (
    bottom < maxTrimBottom &&
    isBackgroundRow(height - 1 - bottom)
  ) {
    bottom += 1;
  }

  let left = 0;
  while (left < maxTrimLeft && isBackgroundColumn(left)) left += 1;

  let right = 0;
  while (
    right < maxTrimRight &&
    isBackgroundColumn(width - 1 - right)
  ) {
    right += 1;
  }

  const trimmedWidth = width - left - right;
  const trimmedHeight = height - top - bottom;

  if (
    trimmedWidth <= 0 ||
    trimmedHeight <= 0 ||
    (top === 0 && bottom === 0 && left === 0 && right === 0)
  ) {
    return { buffer, trimmed: false };
  }

  const trimmedBuffer = await sharp(buffer)
    .extract({ left, top, width: trimmedWidth, height: trimmedHeight })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { buffer: trimmedBuffer, trimmed: true };
}

// Lifestyle scene environment prompts
const LIFESTYLE_ENVIRONMENTS: Record<string, string> = {
  kitchen:
    "Place this product on a modern kitchen counter with natural lighting streaming through a window, marble or granite surface, with subtle kitchen background elements like wooden cutting boards or fresh herbs. The scene should feel clean, bright, and aspirational.",
  outdoor:
    "Place this product in a natural outdoor setting with soft golden-hour sunlight, lush greenery or flowers in the background, creating a fresh and organic atmosphere. The lighting should be warm and inviting.",
  studio:
    "Place this product in a professional photography studio with soft box lighting, clean neutral background with subtle shadows, creating a high-end commercial look. The lighting should be even and flattering.",
  living:
    "Place this product in a cozy, well-decorated living room setting with warm ambient lighting, comfortable textiles like throws or cushions visible, creating a homey and inviting atmosphere.",
  office:
    "Place this product on a clean, modern office desk with a professional workspace background, good natural or artificial lighting, perhaps with a plant or minimalist decor elements visible.",
  minimal:
    "Place this product on a clean, minimalist surface with a soft gradient or solid neutral background, using even studio-like lighting to create a sophisticated, modern aesthetic.",
  cafe: "Place this product on a rustic wooden table in a sunlit cafe, with subtle background elements like a latte art cup, a book, or a potted plant, creating a relaxed and inviting atmosphere.",
  bedroom:
    "Place this product on a minimalist nightstand in a serene bedroom with soft, indirect lighting, featuring neutral tones and cozy textiles in the background.",
  garden:
    "Place this product amidst lush green foliage in a vibrant garden, with dappled sunlight and a natural, organic feel. The background should be slightly blurred to keep the focus on the product.",
  industrial:
    "Place this product on a concrete surface in an industrial-chic loft, with exposed brick or metal accents in the background, and strong, directional lighting to create a modern, edgy look.",
};

const PLATFORM_ASPECT_RATIOS: Record<string, string> = {
  amazon: "1:1",
  shopify: "1:1",
  etsy: "1:1",
  ebay: "1:1",
  walmart: "1:1",
  facebook: "1:1",
  google: "1:1",
  pinterest: "2:3",
};

const SUPPORTED_ASPECT_RATIOS = new Set([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
]);

function getAspectRatioForPlatform(
  platform?: string,
): string | undefined {
  if (!platform) return undefined;
  const ratio = PLATFORM_ASPECT_RATIOS[platform];
  if (!ratio || !SUPPORTED_ASPECT_RATIOS.has(ratio)) return undefined;
  return ratio;
}

function getLifestyleScenePrompt(
  environment: string,
  isCustom: boolean,
  productDescription?: string,
  shadowControl?: string,
): string {
  let basePrompt: string;

  if (isCustom) {
    // The 'environment' is a custom user-written prompt
    if (productDescription) {
      basePrompt = `Place a product described as "${productDescription}" into the following scene: ${environment}.`;
    } else {
      basePrompt = `Place the product into the following scene: ${environment}.`;
    }
  } else {
    // The 'environment' is a key for a predefined scene
    const sceneDescription =
      LIFESTYLE_ENVIRONMENTS[environment] || LIFESTYLE_ENVIRONMENTS.minimal;
    if (productDescription) {
      basePrompt = `A product described as "${productDescription}" is in a scene. ${sceneDescription}`;
    } else {
      basePrompt = sceneDescription;
    }
  }

 return `${basePrompt}

CRITICAL INSTRUCTIONS:
 - Keep the product EXACTLY the same (do not modify, repaint, or change any details of the product).
 - The product should be the clear focal point of the image.
 - Generate a photorealistic lifestyle scene.
 - Maintain ${shadowControl || "natural"} shadows and reflections consistent with the environment lighting.
 - The scene must fill the entire frame edge-to-edge. Do NOT add padding, borders, or solid-color bars.
 - The scene should look like a professional product photography shoot.
 - Output a photorealistic image with no text, no watermark, no borders.
 - The composition should be balanced and aesthetically pleasing.`;
}

// Generate prompt with explicit background color specification
function getGenericMainPrompt(
  backgroundColor: string,
  platform: string,
): string {
  const rgb = hexToRGB(backgroundColor);
  const isWhite = rgb.r === 255 && rgb.g === 255 && rgb.b === 255;

  let platformSpecificInstructions = "";
  if (platform === "amazon") {
    platformSpecificInstructions = `- The product should fill about 85% of a square frame with safe margins.
- Output a square image, 2000x2000.`;
  } else if (platform === "shopify") {
    platformSpecificInstructions = `- The product should be centered and well-lit.
- Output a square image, 2048x2048, or a 4:3 aspect ratio image (e.g., 2048x1536).
- Ensure high resolution for zoom functionality (min 800x800).`;
  } else if (platform === "etsy") {
    platformSpecificInstructions = `- The product should be clearly visible and well-lit.
- Output an image with a 4:3 aspect ratio (e.g., 3000x2250) or a square image (e.g., 2000x2000).
- Use original product photo (no renderings/stock).`;
  }

  return `Remove the background from this product photo and replace it with a solid RGB(${rgb.r}, ${rgb.g}, ${rgb.b}) color${isWhite ? " (pure white)" : ""}.

RULES:
1. DO NOT move, rotate, resize, or reposition the product in any way
2. DO NOT alter, enhance, retouch, or modify the product itself
3. ONLY remove the background - everything that is not the product
4. Replace ALL background pixels with exactly RGB(${rgb.r}, ${rgb.g}, ${rgb.b})
5. Keep clean edges around the product with no halos or artifacts
6. DO NOT add any text, watermarks, labels, annotations, or any markings to the image
7. The output image must be completely clean with only the product and solid background
${platformSpecificInstructions}

The product must remain IDENTICAL to the original - same position, same angle, same size, same appearance. Only the background changes. Output a clean image with no text or annotations.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.post(
    "/api/main-image",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }

        const geminiApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
        const geminiBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
        if (!geminiApiKey || !geminiBaseUrl) {
          console.error(
            "[/api/main-image] Missing Gemini config",
            JSON.stringify({
              hasApiKey: Boolean(geminiApiKey),
              hasBaseUrl: Boolean(geminiBaseUrl),
            }),
          );
          return res.status(500).json({
            error:
              "Gemini AI integration is not configured. Please set up the AI integration.",
          });
        }

        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: {
            apiVersion: "",
            baseUrl: geminiBaseUrl,
          },
        });

        // Parse background color from query param or body (default to white)
        const backgroundColor =
          (req.query.backgroundColor as string) ||
          (req.body?.backgroundColor as string) ||
          "#FFFFFF";
        // Extract platform parameter, default to 'amazon'
        const platform =
          (req.query.platform as string)?.toLowerCase() || "amazon";

        // Fix EXIF orientation by auto-rotating the image before processing
        // This ensures the image is displayed correctly regardless of camera orientation
        const normalizedBuffer = await sharp(req.file.buffer)
          .rotate() // Auto-rotate based on EXIF orientation
          .jpeg({ quality: 100 })
          .toBuffer();
        
        const base64Image = normalizedBuffer.toString("base64");
        const mimeType = "image/jpeg";

        // Generate prompt with the specified background color and platform
        const prompt = getGenericMainPrompt(backgroundColor, platform);

        const generateImage = async () => {
          return ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Image,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });
        };

        console.log("[/api/main-image] Calling Gemini API...");
        console.log("[/api/main-image] Using base URL:", process.env.AI_INTEGRATIONS_GEMINI_BASE_URL);
        console.log("[/api/main-image] Prompt:", prompt);
        console.log("[/api/main-image] Image size:", normalizedBuffer.length, "bytes, mimeType:", mimeType);
        
        let response = await generateImage();
        let candidate = response.candidates?.[0];
        let imagePart = candidate?.content?.parts?.find(
          (part: { inlineData?: { data?: string; mimeType?: string } }) =>
            part.inlineData,
        );

        console.log("[/api/main-image] Response received:", {
          hasCandidates: !!response.candidates,
          candidateCount: response.candidates?.length || 0,
          partsCount: candidate?.content?.parts?.length || 0,
          hasImagePart: !!imagePart?.inlineData?.data,
          imageDataLength: imagePart?.inlineData?.data?.length || 0,
        });

        if (!imagePart?.inlineData?.data) {
          console.warn(
            "[/api/main-image] No image in response, retrying once",
            JSON.stringify({
              candidates: response.candidates?.length || 0,
              hasParts: candidate?.content?.parts?.length || 0,
            }),
          );
          response = await generateImage();
          candidate = response.candidates?.[0];
          imagePart = candidate?.content?.parts?.find(
            (part: { inlineData?: { data?: string; mimeType?: string } }) =>
              part.inlineData,
          );
        }

        if (!imagePart?.inlineData?.data) {
          console.error(
            "[/api/main-image] AI did not return image data",
            JSON.stringify({
              candidates: response.candidates?.length || 0,
              hasParts: candidate?.content?.parts?.length || 0,
            }),
          );
          return res.status(500).json({
            error: "AI did not return an image. Please try again.",
          });
        }

        let generatedImageBuffer = Buffer.from(
          imagePart.inlineData.data,
          "base64",
        );

        // Check if the background was actually replaced with the expected color
        // by sampling corners of the output image
        const expectedRGB = hexToRGB(backgroundColor);
        
        async function checkBackgroundColor(buffer: Buffer): Promise<{ hasCorrectBackground: boolean; avgDiff: number }> {
          try {
            const image = sharp(buffer);
            const metadata = await image.metadata();
            const width = metadata.width || 1000;
            const height = metadata.height || 1000;
            
            // Sample 4 corner regions (10x10 pixels each)
            const cornerSize = 10;
            const corners = [
              { left: 0, top: 0 }, // top-left
              { left: width - cornerSize, top: 0 }, // top-right
              { left: 0, top: height - cornerSize }, // bottom-left
              { left: width - cornerSize, top: height - cornerSize }, // bottom-right
            ];
            
            let totalDiff = 0;
            let sampledCorners = 0;
            
            for (const corner of corners) {
              try {
                const { data } = await sharp(buffer)
                  .extract({ left: corner.left, top: corner.top, width: cornerSize, height: cornerSize })
                  .raw()
                  .toBuffer({ resolveWithObject: true });
                
                // Calculate average color of this corner
                let r = 0, g = 0, b = 0;
                const pixelCount = cornerSize * cornerSize;
                for (let i = 0; i < data.length; i += 3) {
                  r += data[i];
                  g += data[i + 1];
                  b += data[i + 2];
                }
                r = Math.round(r / pixelCount);
                g = Math.round(g / pixelCount);
                b = Math.round(b / pixelCount);
                
                // Calculate difference from expected background
                const diff = Math.abs(r - expectedRGB.r) + Math.abs(g - expectedRGB.g) + Math.abs(b - expectedRGB.b);
                totalDiff += diff;
                sampledCorners++;
              } catch {
                // Skip this corner if extraction fails
              }
            }
            
            const avgDiff = sampledCorners > 0 ? totalDiff / sampledCorners : 999;
            // Allow some tolerance (30 per channel = 90 total) for compression artifacts
            return { hasCorrectBackground: avgDiff < 90, avgDiff };
          } catch {
            return { hasCorrectBackground: true, avgDiff: 0 }; // Assume OK if check fails
          }
        }
        
        const bgCheck = await checkBackgroundColor(generatedImageBuffer);
        console.log("[/api/main-image] Background check:", {
          expectedColor: backgroundColor,
          avgColorDifference: bgCheck.avgDiff.toFixed(1),
          hasCorrectBackground: bgCheck.hasCorrectBackground,
        });

        // If background doesn't match expected color, retry with reinforced prompt
        if (!bgCheck.hasCorrectBackground) {
          console.warn("[/api/main-image] Background color mismatch, retrying with reinforced prompt...");
          
          const reinforcedPrompt = `CRITICAL: You MUST remove the background from this product photo and replace it with a solid RGB(${expectedRGB.r}, ${expectedRGB.g}, ${expectedRGB.b}) color.

${prompt}

The background MUST be completely removed and replaced with the exact solid color specified. The corners and edges of the image should be the solid background color.`;

          const reinforcedResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Image,
                    },
                  },
                  { text: reinforcedPrompt },
                ],
              },
            ],
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          const reinforcedCandidate = reinforcedResponse.candidates?.[0];
          const reinforcedImagePart = reinforcedCandidate?.content?.parts?.find(
            (part: { inlineData?: { data?: string; mimeType?: string } }) =>
              part.inlineData,
          );

          if (reinforcedImagePart?.inlineData?.data) {
            const reinforcedBuffer = Buffer.from(reinforcedImagePart.inlineData.data, "base64");
            const reinforcedBgCheck = await checkBackgroundColor(reinforcedBuffer);
            
            console.log("[/api/main-image] Reinforced attempt background check:", {
              avgColorDifference: reinforcedBgCheck.avgDiff.toFixed(1),
              hasCorrectBackground: reinforcedBgCheck.hasCorrectBackground,
            });

            // Use reinforced result if it has better background color
            if (reinforcedBgCheck.avgDiff < bgCheck.avgDiff) {
              generatedImageBuffer = reinforcedBuffer;
              bgCheck.avgDiff = reinforcedBgCheck.avgDiff;
              bgCheck.hasCorrectBackground = reinforcedBgCheck.hasCorrectBackground;
            }
          }
        }

        // Final check - if background still doesn't match after retry, log warning
        const finalBgCheck = await checkBackgroundColor(generatedImageBuffer);
        const backgroundVerified = finalBgCheck.hasCorrectBackground;
        
        console.log("[/api/main-image] Final result:", {
          backgroundVerified,
          avgColorDifference: finalBgCheck.avgDiff.toFixed(1),
        });

        const imageMimeType =
          imagePart.inlineData.mimeType || "image/jpeg";

        res.set("Content-Type", imageMimeType);
        res.set(
          "Content-Disposition",
          `attachment; filename="${platform}-main.${imageMimeType.split("/")[1] || "jpg"}"`,
        );
        // Add header to indicate if background was verified
        res.set("X-Background-Verified", backgroundVerified ? "true" : "false");
        res.send(generatedImageBuffer);
      } catch (error) {
        console.error("Error processing image:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to process image: ${errorMessage}`,
        });
      }
    },
  );

  // Image editing endpoint - handles brightness, contrast, saturation, rotation, crop
  app.post(
    "/api/edit-image",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }

        // Parse editing parameters from query or body
        const brightness = parseFloat(
          (req.query.brightness as string) || req.body?.brightness || "0",
        );
        const contrast = parseFloat(
          (req.query.contrast as string) || req.body?.contrast || "1",
        );
        const saturation = parseFloat(
          (req.query.saturation as string) || req.body?.saturation || "1",
        );
        const rotation = parseInt(
          (req.query.rotation as string) || req.body?.rotation || "0",
        );

        // New advanced adjustments
        const exposure = parseFloat(
          (req.query.exposure as string) || req.body?.exposure || "0",
        );
        const highlights = parseFloat(
          (req.query.highlights as string) || req.body?.highlights || "0",
        );
        const shadows = parseFloat(
          (req.query.shadows as string) || req.body?.shadows || "0",
        );
        const warmth = parseFloat(
          (req.query.warmth as string) || req.body?.warmth || "0",
        );

        // Flip/Mirror transforms
        const flipHorizontal =
          (req.query.flipHorizontal as string) === "true" ||
          req.body?.flipHorizontal === true;
        const flipVertical =
          (req.query.flipVertical as string) === "true" ||
          req.body?.flipVertical === true;

        // Crop parameters (optional, as percentages 0-1)
        const cropX = parseFloat(
          (req.query.cropX as string) || req.body?.cropX || "0",
        );
        const cropY = parseFloat(
          (req.query.cropY as string) || req.body?.cropY || "0",
        );
        const cropWidth = parseFloat(
          (req.query.cropWidth as string) || req.body?.cropWidth || "1",
        );
        const cropHeight = parseFloat(
          (req.query.cropHeight as string) || req.body?.cropHeight || "1",
        );

        const imageBuffer = req.file.buffer;

        // Start with the original image
        let pipeline = sharp(imageBuffer);

        // Get image metadata to calculate crop dimensions
        const metadata = await pipeline.metadata();
        const imageWidth = metadata.width || 0;
        const imageHeight = metadata.height || 0;

        // Apply crop if parameters are provided
        if (cropWidth < 1 || cropHeight < 1 || cropX > 0 || cropY > 0) {
          const left = Math.round(cropX * imageWidth);
          const top = Math.round(cropY * imageHeight);
          const width = Math.round(cropWidth * imageWidth);
          const height = Math.round(cropHeight * imageHeight);

          if (left >= 0 && top >= 0 && width > 0 && height > 0) {
            pipeline = pipeline.extract({ left, top, width, height });
          }
        }

        // Apply flip/mirror transforms
        if (flipHorizontal) {
          pipeline = pipeline.flop();
        }
        if (flipVertical) {
          pipeline = pipeline.flip();
        }

        // Apply rotation
        if (rotation !== 0) {
          pipeline = pipeline.rotate(rotation, {
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          });
        }

        // Apply exposure adjustment (photographic-style brightness)
        // exposure: -2 to 2, where 0 is unchanged
        // Uses exponential scaling: 2^exposure
        if (exposure !== 0) {
          const exposureMult = Math.pow(2, exposure);
          pipeline = pipeline.modulate({ brightness: exposureMult });
        }

        // Apply highlights adjustment (adjust bright areas)
        // highlights: -1 to 1, where 0 is unchanged
        // Negative values darken highlights using gamma (Sharp only supports gamma >= 1.0)
        // Positive values brighten highlights using linear adjustment
        if (highlights !== 0) {
          if (highlights < 0) {
            // Darken highlights using gamma (higher gamma = darker)
            const gamma = Math.min(3.0, 1 + Math.abs(highlights) * 0.5);
            pipeline = pipeline.gamma(gamma);
          } else {
            // Brighten highlights using linear adjustment
            const mult = 1 + highlights * 0.3;
            pipeline = pipeline.linear(mult, 0);
          }
        }

        // Apply shadows adjustment (lift/lower dark areas)
        // shadows: -1 to 1, where 0 is unchanged
        // Positive values lift shadows (brighten), negative values lower them (darken)
        if (shadows !== 0) {
          const shadowLift = shadows * 20;
          pipeline = pipeline.linear(1, shadowLift);
        }

        // Apply brightness adjustment using modulate
        // brightness: -1 to 1, where 0 is unchanged, -1 is darkest, 1 is brightest
        // Sharp's modulate expects lightness in percentage, so we map -1 to 1 to 50 to 150
        const sharpBrightness = 100 + brightness * 50;

        // Apply brightness and saturation using modulate
        // saturation: 0 to 2, where 1 is normal
        pipeline = pipeline.modulate({
          brightness: sharpBrightness / 100,
          saturation: saturation,
        });

        // Apply contrast using linear adjustment
        // contrast: 0.5 to 2, where 1 is normal
        // Sharp doesn't have direct contrast in modulate, use linear() instead
        if (contrast !== 1) {
          const a = contrast; // Multiplier
          const b = 128 * (1 - contrast); // Offset to keep middle gray stable
          pipeline = pipeline.linear(a, b);
        }

        // Apply warmth adjustment (color temperature)
        // warmth: -1 to 1, where 0 is unchanged
        // Negative values = cooler (blue tint), positive = warmer (orange tint)
        if (warmth !== 0) {
          const tintColor =
            warmth > 0
              ? { r: 255, g: Math.round(200 + warmth * 55), b: 150 } // Warm orange
              : { r: 150, g: 200, b: 255 }; // Cool blue

          pipeline = pipeline.tint(tintColor);
        }

        // Convert to JPEG with high quality
        const editedBuffer = await pipeline.jpeg({ quality: 100 }).toBuffer();

        res.set("Content-Type", "image/jpeg");
        res.set(
          "Content-Disposition",
          'attachment; filename="edited-image.jpg"',
        );
        res.send(editedBuffer);
      } catch (error) {
        console.error("Error editing image:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to edit image: ${errorMessage}`,
        });
      }
    },
  );

  // Lifestyle scene generation endpoint
  app.post(
    "/api/lifestyle-scene",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }

        if (
          !process.env.AI_INTEGRATIONS_GEMINI_API_KEY ||
          !process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
        ) {
          return res.status(500).json({
            error:
              "Gemini AI integration is not configured. Please set up the AI integration.",
          });
        }

        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        // Parse parameters from query
        const environment = (req.query.environment as string) || "minimal";
        const isCustom = (req.query.isCustom as string) === "true";
        const productDescription = req.query.productDescription as string;
        const shadowControl = req.query.shadowControl as string;
        const platform = (req.query.platform as string | undefined)?.toLowerCase();
        const aspectRatio = getAspectRatioForPlatform(platform);

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString("base64");
        const mimeType = req.file.mimetype || "image/jpeg";

        // Generate prompt for the specified environment
        const prompt = getLifestyleScenePrompt(
          environment,
          isCustom,
          productDescription,
          shadowControl,
        );

        console.log("[/api/lifestyle-scene] Prompt:", prompt);

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          config: aspectRatio
            ? {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
                imageConfig: { aspectRatio },
              }
            : {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
              },
        });

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (part: { inlineData?: { data?: string; mimeType?: string } }) =>
            part.inlineData,
        );

        if (!imagePart?.inlineData?.data) {
          return res.status(500).json({
            error: "AI did not return an image. Please try again.",
          });
        }

        const generatedImageBuffer = Buffer.from(
          imagePart.inlineData.data,
          "base64",
        );
        const trimmedResult = await trimUniformBorders(generatedImageBuffer);

        res.set("Content-Type", "image/png");
        res.set(
          "Content-Disposition",
          'attachment; filename="lifestyle-scene.png"',
        );
        res.set("X-Trimmed-Borders", trimmedResult.trimmed ? "true" : "false");
        res.send(trimmedResult.buffer);
      } catch (error) {
        console.error("Error generating lifestyle scene:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to generate lifestyle scene: ${errorMessage}`,
        });
      }
    },
  );

  // Mockup generation endpoint
  app.post(
    "/api/mockup",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }

        if (
          !process.env.AI_INTEGRATIONS_GEMINI_API_KEY ||
          !process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
        ) {
          return res.status(500).json({
            error:
              "Gemini AI integration is not configured. Please set up the AI integration.",
          });
        }

        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        // Parse mockup parameters from body
        const prompt =
          req.body?.prompt || "Create a professional product mockup";
        const mockupType = req.body?.mockupType || "generic";
        const sceneVibe = req.body?.sceneVibe || "casual";
        const cameraOption = req.body?.cameraOption || "medium";
        const mockupColor = req.body?.mockupColor;

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString("base64");
        const mimeType = req.file.mimetype || "image/jpeg";

        // Build enhanced prompt for mockup generation
        const enhancedPrompt = `${prompt}

Additional requirements:
- The design/logo from the input image should be clearly visible and properly placed on the product
- Maintain realistic proportions and perspective
- Use professional lighting that matches the scene vibe
- The mockup should look like a real photograph, not a digital render
- High quality, photorealistic result
- No text watermarks or borders`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                  },
                },
                { text: enhancedPrompt },
              ],
            },
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (part: { inlineData?: { data?: string; mimeType?: string } }) =>
            part.inlineData,
        );

        if (!imagePart?.inlineData?.data) {
          return res.status(500).json({
            error: "AI did not return an image. Please try again.",
          });
        }

        const generatedImageBuffer = Buffer.from(
          imagePart.inlineData.data,
          "base64",
        );

        // Resize and format to 2000x2000 JPEG
        const finalBuffer = await sharp(generatedImageBuffer)
          .resize(2000, 2000, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255 },
          })
          .jpeg({ quality: 100 })
          .toBuffer();

        // Return as base64 data URI for easy handling on client
        const base64Result = finalBuffer.toString("base64");
        const resultUri = `data:image/jpeg;base64,${base64Result}`;

        res.json({
          resultUri,
          mockupType,
          sceneVibe,
          cameraOption,
        });
      } catch (error) {
        console.error("Error generating mockup:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to generate mockup: ${errorMessage}`,
        });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}

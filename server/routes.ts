import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import multer from "multer";
import sharp from "sharp";
import { GoogleGenAI, Modality } from "@google/genai";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// Helper function to convert hex color to RGB values
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace(/^#/, '');

  // Handle 3-char hex
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  return {
    r: parseInt(fullHex.substring(0, 2), 16),
    g: parseInt(fullHex.substring(2, 4), 16),
    b: parseInt(fullHex.substring(4, 6), 16),
  };
}

// Lifestyle scene environment prompts
const LIFESTYLE_ENVIRONMENTS: Record<string, string> = {
  kitchen: "Place this product on a modern kitchen counter with natural lighting streaming through a window, marble or granite surface, with subtle kitchen background elements like wooden cutting boards or fresh herbs. The scene should feel clean, bright, and aspirational.",
  outdoor: "Place this product in a natural outdoor setting with soft golden-hour sunlight, lush greenery or flowers in the background, creating a fresh and organic atmosphere. The lighting should be warm and inviting.",
  studio: "Place this product in a professional photography studio with soft box lighting, clean neutral background with subtle shadows, creating a high-end commercial look. The lighting should be even and flattering.",
  living: "Place this product in a cozy, well-decorated living room setting with warm ambient lighting, comfortable textiles like throws or cushions visible, creating a homey and inviting atmosphere.",
  office: "Place this product on a clean, modern office desk with a professional workspace background, good natural or artificial lighting, perhaps with a plant or minimalist decor elements visible.",
  minimal: "Place this product on a clean, minimalist surface with a soft gradient or solid neutral background, using even studio-like lighting to create a sophisticated, modern aesthetic.",
};

function getLifestyleScenePrompt(environment: string): string {
  const basePrompt = LIFESTYLE_ENVIRONMENTS[environment] || LIFESTYLE_ENVIRONMENTS.minimal;

  return `${basePrompt}

CRITICAL INSTRUCTIONS:
- Keep the product EXACTLY the same (do not modify, repaint, or change any details of the product).
- The product should be the clear focal point of the image.
- Generate a photorealistic lifestyle scene.
- Maintain natural shadows and reflections consistent with the environment lighting.
- The scene should look like a professional product photography shoot.
- Output a square image, photorealistic, no text, no watermark, no borders.
- The composition should be balanced and aesthetically pleasing.`;
}

// Generate prompt with explicit background color specification
function getAmazonMainPrompt(backgroundColor: string): string {
  const rgb = hexToRGB(backgroundColor);
  const isWhite = rgb.r === 255 && rgb.g === 255 && rgb.b === 255;

  return `Edit this product photo for an Amazon main listing image.

CRITICAL INSTRUCTIONS:
- Keep the product EXACTLY the same (do not repaint, retouch, change colors, patterns, logos, labels, or shape).
- Remove the entire background (walls, floors, tables, clutter, and any other non-product elements).
- REPLACE the background with a solid color: RGB(${rgb.r}, ${rgb.g}, ${rgb.b})${isWhite ? ' - pure white' : ''}.
- The ENTIRE background must be this exact RGB color - no gradients, no variations.
- Keep product edges clean with no halos, fringing, or artifacts.
- Center the product and scale it to fill about 85% of the frame.
- Output a square image, photorealistic, no text, no watermark, no borders.

REMEMBER: The background color is RGB(${rgb.r}, ${rgb.g}, ${rgb.b}) - apply this color to ALL background pixels.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.post(
    "/api/amazon-main",
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

        // Parse background color from query param or body (default to white)
        const backgroundColor = (req.query.backgroundColor as string) ||
                                (req.body?.backgroundColor as string) ||
                                '#FFFFFF';

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString("base64");
        const mimeType = req.file.mimetype || "image/jpeg";

        // Generate prompt with the specified background color
        const prompt = getAmazonMainPrompt(backgroundColor);

        // DEBUG: Log the color being used
        console.log("=== IMAGE PROCESSING ===");
        console.log("Background Color (Hex):", backgroundColor);
        const rgb = hexToRGB(backgroundColor);
        console.log("Background Color (RGB):", `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`);
        console.log("Full Prompt sent to Gemini:");
        console.log(prompt);
        console.log("======================");

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
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (part: { inlineData?: { data?: string; mimeType?: string } }) =>
            part.inlineData
        );

        if (!imagePart?.inlineData?.data) {
          return res.status(500).json({
            error: "AI did not return an image. Please try again.",
          });
        }

        const generatedImageBuffer = Buffer.from(
          imagePart.inlineData.data,
          "base64"
        );

        // Get the RGB values for the selected background color
        const bgRgb = hexToRGB(backgroundColor);

        // Simple resize and format to 2000x2000 JPEG
        // Gemini has already applied the background color
        const finalBuffer = await sharp(generatedImageBuffer)
          .resize(2000, 2000, {
            fit: "contain",
            background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b },
          })
          .flatten({ background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b } })
          .jpeg({ quality: 95 })
          .toBuffer();

        res.set("Content-Type", "image/jpeg");
        res.set(
          "Content-Disposition",
          'attachment; filename="amazon-main.jpg"'
        );
        res.send(finalBuffer);
      } catch (error) {
        console.error("Error processing image:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to process image: ${errorMessage}`,
        });
      }
    }
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
        const brightness = parseFloat((req.query.brightness as string) || req.body?.brightness || "0");
        const contrast = parseFloat((req.query.contrast as string) || req.body?.contrast || "1");
        const saturation = parseFloat((req.query.saturation as string) || req.body?.saturation || "1");
        const rotation = parseInt((req.query.rotation as string) || req.body?.rotation || "0");

        // New advanced adjustments
        const exposure = parseFloat((req.query.exposure as string) || req.body?.exposure || "0");
        const highlights = parseFloat((req.query.highlights as string) || req.body?.highlights || "0");
        const shadows = parseFloat((req.query.shadows as string) || req.body?.shadows || "0");
        const warmth = parseFloat((req.query.warmth as string) || req.body?.warmth || "0");

        // Flip/Mirror transforms
        const flipHorizontal = (req.query.flipHorizontal as string) === "true" || req.body?.flipHorizontal === true;
        const flipVertical = (req.query.flipVertical as string) === "true" || req.body?.flipVertical === true;

        // Crop parameters (optional, as percentages 0-1)
        const cropX = parseFloat((req.query.cropX as string) || req.body?.cropX || "0");
        const cropY = parseFloat((req.query.cropY as string) || req.body?.cropY || "0");
        const cropWidth = parseFloat((req.query.cropWidth as string) || req.body?.cropWidth || "1");
        const cropHeight = parseFloat((req.query.cropHeight as string) || req.body?.cropHeight || "1");

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
          pipeline = pipeline.rotate(rotation, { background: { r: 255, g: 255, b: 255, alpha: 1 } });
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
            const mult = 1 + (highlights * 0.3);
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
          const a = contrast;  // Multiplier
          const b = 128 * (1 - contrast);  // Offset to keep middle gray stable
          pipeline = pipeline.linear(a, b);
        }

        // Apply warmth adjustment (color temperature)
        // warmth: -1 to 1, where 0 is unchanged
        // Negative values = cooler (blue tint), positive = warmer (orange tint)
        if (warmth !== 0) {
          const tintColor = warmth > 0
            ? { r: 255, g: Math.round(200 + warmth * 55), b: 150 }  // Warm orange
            : { r: 150, g: 200, b: 255 };  // Cool blue

          pipeline = pipeline.tint(tintColor);
        }

        // Convert to JPEG with high quality
        const editedBuffer = await pipeline
          .jpeg({ quality: 95 })
          .toBuffer();

        console.log("=== IMAGE EDITING ===");
        console.log("Basic:", { brightness, contrast, saturation, rotation });
        console.log("Advanced:", { exposure, highlights, shadows, warmth });
        console.log("Transform:", { flipHorizontal, flipVertical });
        console.log("Crop:", { cropX, cropY, cropWidth, cropHeight });
        console.log("======================");

        res.set("Content-Type", "image/jpeg");
        res.set(
          "Content-Disposition",
          'attachment; filename="edited-image.jpg"'
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
    }
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

        // Parse environment from query param or body (default to minimal)
        const environment = (req.query.environment as string) ||
                           (req.body?.environment as string) ||
                           'minimal';

        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString("base64");
        const mimeType = req.file.mimetype || "image/jpeg";

        // Generate prompt for the specified environment
        const prompt = getLifestyleScenePrompt(environment);

        console.log("=== LIFESTYLE SCENE GENERATION ===");
        console.log("Environment:", environment);
        console.log("Full Prompt sent to Gemini:");
        console.log(prompt);
        console.log("================================");

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
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (part: { inlineData?: { data?: string; mimeType?: string } }) =>
            part.inlineData
        );

        if (!imagePart?.inlineData?.data) {
          return res.status(500).json({
            error: "AI did not return an image. Please try again.",
          });
        }

        const generatedImageBuffer = Buffer.from(
          imagePart.inlineData.data,
          "base64"
        );

        // Resize and format to 2000x2000 JPEG
        const finalBuffer = await sharp(generatedImageBuffer)
          .resize(2000, 2000, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255 },
          })
          .jpeg({ quality: 95 })
          .toBuffer();

        res.set("Content-Type", "image/jpeg");
        res.set(
          "Content-Disposition",
          'attachment; filename="lifestyle-scene.jpg"'
        );
        res.send(finalBuffer);
      } catch (error) {
        console.error("Error generating lifestyle scene:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to generate lifestyle scene: ${errorMessage}`,
        });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}

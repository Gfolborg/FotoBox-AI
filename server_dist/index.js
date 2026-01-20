// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";
import multer from "multer";
import sharp from "sharp";
import { GoogleGenAI, Modality } from "@google/genai";

// server/index.ts
import * as fs from "fs";
import * as path from "path";
let upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
let ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
  }
});
function hexToRGB(hex) {
  const cleanHex = hex.replace(/^#/, "");
  const fullHex = cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex;
  return {
    r: parseInt(fullHex.substring(0, 2), 16),
    g: parseInt(fullHex.substring(2, 4), 16),
    b: parseInt(fullHex.substring(4, 6), 16)
  };
}
let LIFESTYLE_ENVIRONMENTS = {
  kitchen: "Place this product on a modern kitchen counter with natural lighting streaming through a window, marble or granite surface, with subtle kitchen background elements like wooden cutting boards or fresh herbs. The scene should feel clean, bright, and aspirational.",
  outdoor: "Place this product in a natural outdoor setting with soft golden-hour sunlight, lush greenery or flowers in the background, creating a fresh and organic atmosphere. The lighting should be warm and inviting.",
  studio: "Place this product in a professional photography studio with soft box lighting, clean neutral background with subtle shadows, creating a high-end commercial look. The lighting should be even and flattering.",
  living: "Place this product in a cozy, well-decorated living room setting with warm ambient lighting, comfortable textiles like throws or cushions visible, creating a homey and inviting atmosphere.",
  office: "Place this product on a clean, modern office desk with a professional workspace background, good natural or artificial lighting, perhaps with a plant or minimalist decor elements visible.",
  minimal: "Place this product on a clean, minimalist surface with a soft gradient or solid neutral background, using even studio-like lighting to create a sophisticated, modern aesthetic."
};
function getLifestyleScenePrompt(environment, isCustom, productDescription) {
  let basePrompt;
  if (isCustom) {
    if (productDescription) {
      basePrompt = `Place a product described as "${productDescription}" into the following scene: ${environment}.`;
    } else {
      basePrompt = `Place the product into the following scene: ${environment}.`;
    }
  } else {
    const sceneDescription = LIFESTYLE_ENVIRONMENTS[environment] || LIFESTYLE_ENVIRONMENTS.minimal;
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
- Maintain natural shadows and reflections consistent with the environment lighting.
- The scene should look like a professional product photography shoot.
- Output a square image, photorealistic, no text, no watermark, no borders.
- The composition should be balanced and aesthetically pleasing.`;
}
function getAmazonMainPrompt(backgroundColor) {
  const rgb = hexToRGB(backgroundColor);
  const isWhite = rgb.r === 255 && rgb.g === 255 && rgb.b === 255;
  return `Edit this product photo for an Amazon main listing image.

CRITICAL INSTRUCTIONS:
- Keep the product EXACTLY the same (do not repaint, retouch, change colors, patterns, logos, labels, or shape).
- Remove the entire background (walls, floors, tables, clutter, and any other non-product elements).
- REPLACE the background with a solid color: RGB(${rgb.r}, ${rgb.g}, ${rgb.b})${isWhite ? " - pure white" : ""}.
- The ENTIRE background must be this exact RGB color - no gradients, no variations.
- Keep product edges clean with no halos, fringing, or artifacts.
- Center the product and scale it to fill about 85% of the frame.
- Output a square image, photorealistic, no text, no watermark, no borders.

REMEMBER: The background color is RGB(${rgb.r}, ${rgb.g}, ${rgb.b}) - apply this color to ALL background pixels.`;
}
async function registerRoutes(app2) {
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app2.post(
    "/api/amazon-main",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }
        if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY || !process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
          return res.status(500).json({
            error: "Gemini AI integration is not configured. Please set up the AI integration."
          });
        }
        const backgroundColor = req.query.backgroundColor || req.body?.backgroundColor || "#FFFFFF";
        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString("base64");
        const mimeType = req.file.mimetype || "image/jpeg";
        const prompt = getAmazonMainPrompt(backgroundColor);
        console.log("=== IMAGE PROCESSING ===");
        console.log("Background Color (Hex):", backgroundColor);
        const rgb = hexToRGB(backgroundColor);
        console.log(
          "Background Color (RGB):",
          `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`
        );
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
                    mimeType,
                    data: base64Image
                  }
                },
                { text: prompt }
              ]
            }
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE]
          }
        });
        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (part) => part.inlineData
        );
        if (!imagePart?.inlineData?.data) {
          return res.status(500).json({
            error: "AI did not return an image. Please try again."
          });
        }
        const generatedImageBuffer = Buffer.from(
          imagePart.inlineData.data,
          "base64"
        );
        const bgRgb = hexToRGB(backgroundColor);
        const finalBuffer = await sharp(generatedImageBuffer).resize(2e3, 2e3, {
          fit: "contain",
          background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b }
        }).flatten({ background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b } }).jpeg({ quality: 95 }).toBuffer();
        res.set("Content-Type", "image/jpeg");
        res.set(
          "Content-Disposition",
          'attachment; filename="amazon-main.jpg"'
        );
        res.send(finalBuffer);
      } catch (error) {
        console.error("Error processing image:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to process image: ${errorMessage}`
        });
      }
    }
  );
  app2.post(
    "/api/edit-image",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }
        const brightness = parseFloat(
          req.query.brightness || req.body?.brightness || "0"
        );
        const contrast = parseFloat(
          req.query.contrast || req.body?.contrast || "1"
        );
        const saturation = parseFloat(
          req.query.saturation || req.body?.saturation || "1"
        );
        const rotation = parseInt(
          req.query.rotation || req.body?.rotation || "0"
        );
        const exposure = parseFloat(
          req.query.exposure || req.body?.exposure || "0"
        );
        const highlights = parseFloat(
          req.query.highlights || req.body?.highlights || "0"
        );
        const shadows = parseFloat(
          req.query.shadows || req.body?.shadows || "0"
        );
        const warmth = parseFloat(
          req.query.warmth || req.body?.warmth || "0"
        );
        const flipHorizontal = req.query.flipHorizontal === "true" || req.body?.flipHorizontal === true;
        const flipVertical = req.query.flipVertical === "true" || req.body?.flipVertical === true;
        const cropX = parseFloat(
          req.query.cropX || req.body?.cropX || "0"
        );
        const cropY = parseFloat(
          req.query.cropY || req.body?.cropY || "0"
        );
        const cropWidth = parseFloat(
          req.query.cropWidth || req.body?.cropWidth || "1"
        );
        const cropHeight = parseFloat(
          req.query.cropHeight || req.body?.cropHeight || "1"
        );
        const imageBuffer = req.file.buffer;
        let pipeline = sharp(imageBuffer);
        const metadata = await pipeline.metadata();
        const imageWidth = metadata.width || 0;
        const imageHeight = metadata.height || 0;
        if (cropWidth < 1 || cropHeight < 1 || cropX > 0 || cropY > 0) {
          const left = Math.round(cropX * imageWidth);
          const top = Math.round(cropY * imageHeight);
          const width = Math.round(cropWidth * imageWidth);
          const height = Math.round(cropHeight * imageHeight);
          if (left >= 0 && top >= 0 && width > 0 && height > 0) {
            pipeline = pipeline.extract({ left, top, width, height });
          }
        }
        if (flipHorizontal) {
          pipeline = pipeline.flop();
        }
        if (flipVertical) {
          pipeline = pipeline.flip();
        }
        if (rotation !== 0) {
          pipeline = pipeline.rotate(rotation, {
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          });
        }
        if (exposure !== 0) {
          const exposureMult = Math.pow(2, exposure);
          pipeline = pipeline.modulate({ brightness: exposureMult });
        }
        if (highlights !== 0) {
          if (highlights < 0) {
            const gamma = Math.min(3, 1 + Math.abs(highlights) * 0.5);
            pipeline = pipeline.gamma(gamma);
          } else {
            const mult = 1 + highlights * 0.3;
            pipeline = pipeline.linear(mult, 0);
          }
        }
        if (shadows !== 0) {
          const shadowLift = shadows * 20;
          pipeline = pipeline.linear(1, shadowLift);
        }
        const sharpBrightness = 100 + brightness * 50;
        pipeline = pipeline.modulate({
          brightness: sharpBrightness / 100,
          saturation
        });
        if (contrast !== 1) {
          const a = contrast;
          const b = 128 * (1 - contrast);
          pipeline = pipeline.linear(a, b);
        }
        if (warmth !== 0) {
          const tintColor = warmth > 0 ? { r: 255, g: Math.round(200 + warmth * 55), b: 150 } : { r: 150, g: 200, b: 255 };
          pipeline = pipeline.tint(tintColor);
        }
        const editedBuffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to edit image: ${errorMessage}`
        });
      }
    }
  );
  app2.post(
    "/api/lifestyle-scene",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }
        if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY || !process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
          return res.status(500).json({
            error: "Gemini AI integration is not configured. Please set up the AI integration."
          });
        }
        const environment = req.query.environment || "minimal";
        const isCustom = req.query.isCustom === "true";
        const productDescription = req.query.productDescription;
        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString("base64");
        const mimeType = req.file.mimetype || "image/jpeg";
        const prompt = getLifestyleScenePrompt(
          environment,
          isCustom,
          productDescription
        );
        console.log("=== LIFESTYLE SCENE GENERATION ===");
        console.log("Environment:", environment);
        console.log("Is Custom:", isCustom);
        if (productDescription) {
          console.log("Product Description:", productDescription);
        }
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
                    mimeType,
                    data: base64Image
                  }
                },
                { text: prompt }
              ]
            }
          ],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE]
          }
        });
        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (part) => part.inlineData
        );
        if (!imagePart?.inlineData?.data) {
          return res.status(500).json({
            error: "AI did not return an image. Please try again."
          });
        }
        const generatedImageBuffer = Buffer.from(
          imagePart.inlineData.data,
          "base64"
        );
        const finalBuffer = await sharp(generatedImageBuffer).resize(2e3, 2e3, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255 }
        }).jpeg({ quality: 95 }).toBuffer();
        res.set("Content-Type", "image/jpeg");
        res.set(
          "Content-Disposition",
          'attachment; filename="lifestyle-scene.jpg"'
        );
        res.send(finalBuffer);
      } catch (error) {
        console.error("Error generating lifestyle scene:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: `Failed to generate lifestyle scene: ${errorMessage}`
        });
      }
    }
  );
  const httpServer = createServer(app2);
  return httpServer;
}
let app = express();
let log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    } else if (!origin) {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0"
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();

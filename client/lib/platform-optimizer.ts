/**
 * Platform optimizer - Skia-based image optimization for e-commerce platforms
 */

import { Skia, ImageFormat, rect } from "@shopify/react-native-skia";
import type { SkImage, SkCanvas } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import {
  PlatformRequirement,
  getExportDimensions,
} from "./platform-requirements";
import { saveToFotoBoxAlbum, ensureMediaLibraryPermission } from "./save-to-album";

export interface ComplianceResult {
  compliant: boolean;
  currentWidth: number;
  currentHeight: number;
  currentRatio: number;
  issues: string[];
  suggestions: string[];
}

export interface OptimizationResult {
  uri: string; // Base64 data URI
  width: number;
  height: number;
  format: string;
  platformId: string;
}

export interface BatchOptimizationProgress {
  platformId: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  result?: OptimizationResult;
}

interface OptimizationOptions {
  backgroundColor?: string;
  requiresWatermark?: boolean;
}

/**
 * Draw a "FotoBox" watermark on a Skia canvas (bottom-right corner).
 * Matches the server-side watermark style: bold white text at 70% opacity
 * with a dark shadow at 30% opacity.
 */
function drawWatermark(canvas: SkCanvas, width: number, height: number) {
  const fontSize = Math.floor(Math.min(width, height) * 0.05);
  const padding = fontSize * 0.6;
  const text = "FotoBox";

  try {
    const fontMgr = Skia.FontMgr.System();
    const typeface = fontMgr.matchFamilyStyle("", { weight: 700 });
    const font = Skia.Font(typeface, fontSize);

    const textRect = font.measureText(text);
    const textWidth = textRect.width;

    const x = width - textWidth - padding;
    const y = height - padding;

    // Shadow
    const shadowPaint = Skia.Paint();
    shadowPaint.setColor(Skia.Color("rgba(0, 0, 0, 0.3)"));
    shadowPaint.setAntiAlias(true);
    canvas.drawText(text, x + 2, y + 2, shadowPaint, font);

    // Main text
    const textPaint = Skia.Paint();
    textPaint.setColor(Skia.Color("rgba(255, 255, 255, 0.7)"));
    textPaint.setAntiAlias(true);
    canvas.drawText(text, x, y, textPaint, font);
  } catch (error) {
    console.warn("[PlatformOptimizer] Could not draw watermark:", error);
  }
}

/**
 * Check if an image meets platform requirements
 */
export function checkCompliance(
  imageWidth: number,
  imageHeight: number,
  platform: PlatformRequirement,
): ComplianceResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const exportDims = getExportDimensions(platform);

  // Check minimum dimensions
  if (imageWidth < platform.minWidth) {
    issues.push(
      `Width ${imageWidth}px is below minimum ${platform.minWidth}px`,
    );
    suggestions.push(
      `Image will be upscaled to ${exportDims.width}px width`,
    );
  }
  if (imageHeight < platform.minHeight) {
    issues.push(
      `Height ${imageHeight}px is below minimum ${platform.minHeight}px`,
    );
    suggestions.push(
      `Image will be upscaled to ${exportDims.height}px height`,
    );
  }

  // Check aspect ratio
  const currentRatio = imageWidth / imageHeight;
  const targetRatio = platform.aspectRatio;
  const ratioDiff = Math.abs(currentRatio - targetRatio);

  if (ratioDiff > 0.05) {
    const currentLabel =
      currentRatio > 1 ? "landscape" : currentRatio < 1 ? "portrait" : "square";
    issues.push(
      `Current ratio is ${currentRatio.toFixed(2)} (${currentLabel})`,
    );
    suggestions.push(`Will be center-cropped to ${platform.aspectRatioLabel}`);
  }

  return {
    compliant: issues.length === 0,
    currentWidth: imageWidth,
    currentHeight: imageHeight,
    currentRatio,
    issues,
    suggestions,
  };
}

/**
 * Load a Skia image from a URI (file path or data URI)
 */
async function loadSkiaImage(imageUri: string) {
  let base64String: string;

  if (imageUri.startsWith("data:")) {
    // Extract base64 from data URI
    base64String = imageUri.split(",")[1];
  } else {
    // Load file as base64
    let fileUri = imageUri;
    if (!fileUri.startsWith("file://") && fileUri.startsWith("/")) {
      fileUri = `file://${fileUri}`;
    }

    base64String = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  // Decode base64 to Uint8Array
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create Skia Data and decode image
  const skData = Skia.Data.fromBytes(bytes);
  const decodedImage = Skia.Image.MakeImageFromEncoded(skData);

  if (!decodedImage) {
    throw new Error("Failed to decode image");
  }

  return decodedImage;
}

/**
 * Get image dimensions from a URI
 */
export async function getImageDimensions(
  imageUri: string,
): Promise<{ width: number; height: number }> {
  const image = await loadSkiaImage(imageUri);
  return {
    width: image.width(),
    height: image.height(),
  };
}

/**
 * Optimize an image for a specific platform
 * This function:
 * 1. Loads the source image
 * 2. Center-crops to the target aspect ratio
 * 3. Resizes to optimal dimensions
 * 4. Encodes in the correct format and quality
 */
export async function optimizeForPlatform(
  imageUri: string,
  platform: PlatformRequirement,
  options?: OptimizationOptions,
): Promise<OptimizationResult> {
  console.log(`[PlatformOptimizer] Optimizing for ${platform.name}`);

  // 1. Load source image
  const sourceImage = await loadSkiaImage(imageUri);
  const srcWidth = sourceImage.width();
  const srcHeight = sourceImage.height();

  console.log(
    `[PlatformOptimizer] Source dimensions: ${srcWidth}x${srcHeight}`,
  );

  // 2. Calculate crop rectangle for target aspect ratio
  const targetRatio = platform.aspectRatio;
  const srcRatio = srcWidth / srcHeight;

  let cropX = 0;
  let cropY = 0;
  let cropWidth = srcWidth;
  let cropHeight = srcHeight;

  if (Math.abs(srcRatio - targetRatio) > 0.01) {
    if (srcRatio > targetRatio) {
      cropWidth = Math.round(srcHeight * targetRatio);
      cropX = Math.round((srcWidth - cropWidth) / 2);
      cropHeight = srcHeight;
      cropY = 0;
    } else {
      cropHeight = Math.round(srcWidth / targetRatio);
      cropY = Math.round((srcHeight - cropHeight) / 2);
      cropWidth = srcWidth;
      cropX = 0;
    }
  }

  console.log(
    `[PlatformOptimizer] Crop rect: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`,
  );

  // 3. Create output surface at optimal dimensions
  const { width: outputWidth, height: outputHeight } =
    getExportDimensions(platform);

  const surface = Skia.Surface.Make(outputWidth, outputHeight);
  if (!surface) {
    throw new Error("Failed to create Skia surface");
  }

  const canvas = surface.getCanvas();

  // 4. Draw cropped and scaled image
  const srcRect = rect(cropX, cropY, cropWidth, cropHeight);
  const dstRect = rect(0, 0, outputWidth, outputHeight);

  const paint = Skia.Paint();
  canvas.drawImageRect(sourceImage, srcRect, dstRect, paint);

  // 4b. Draw watermark if required (after crop/resize, before snapshot)
  if (options?.requiresWatermark) {
    drawWatermark(canvas, outputWidth, outputHeight);
  }

  // 5. Get snapshot and encode
  const snapshot = surface.makeImageSnapshot();
  if (!snapshot) {
    throw new Error("Failed to create snapshot");
  }

  console.log(
    `[PlatformOptimizer] Output dimensions: ${snapshot.width()}x${snapshot.height()}`,
  );

  // Encode based on platform format preference
  const format = platform.format === "PNG" ? ImageFormat.PNG : ImageFormat.JPEG;
  const base64 = snapshot.encodeToBase64(format, platform.quality);

  if (!base64) {
    throw new Error("Failed to encode image to base64");
  }

  const mimeType = platform.format.toLowerCase();
  const dataUri = `data:image/${mimeType};base64,${base64}`;

  console.log(
    `[PlatformOptimizer] Successfully optimized for ${platform.name}`,
  );

  return {
    uri: dataUri,
    width: outputWidth,
    height: outputHeight,
    format: platform.format,
    platformId: platform.id,
  };
}

/**
 * Optimize an image for multiple platforms
 */
export async function optimizeForPlatforms(
  imageUri: string,
  platforms: PlatformRequirement[],
  onProgress?: (progress: BatchOptimizationProgress) => void,
  options?: OptimizationOptions,
): Promise<Map<string, OptimizationResult>> {
  const results = new Map<string, OptimizationResult>();

  for (const platform of platforms) {
    // Report progress
    onProgress?.({
      platformId: platform.id,
      status: "processing",
    });

    try {
      const result = await optimizeForPlatform(imageUri, platform, options);
      results.set(platform.id, result);

      onProgress?.({
        platformId: platform.id,
        status: "completed",
        result,
      });
    } catch (error) {
      console.error(
        `[PlatformOptimizer] Failed to optimize for ${platform.name}:`,
        error,
      );

      onProgress?.({
        platformId: platform.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Save optimized images to gallery
 */
export async function saveOptimizedImages(
  optimizedImages: Map<string, OptimizationResult>,
  onProgress?: (platformId: string, success: boolean, error?: string) => void,
): Promise<{ successful: number; failed: number }> {
  let successful = 0;
  let failed = 0;

  const hasPermission = await ensureMediaLibraryPermission();
  if (!hasPermission) {
    throw new Error("Permission to access gallery was denied");
  }

  for (const [platformId, result] of optimizedImages) {
    try {
      const saveResult = await saveToFotoBoxAlbum(
        result.uri,
        `${platformId}_product`,
        { skipPermissionCheck: true },
      );

      if (saveResult.success) {
        successful++;
        onProgress?.(platformId, true);
      } else {
        failed++;
        onProgress?.(platformId, false, saveResult.error);
      }
    } catch (error) {
      failed++;
      onProgress?.(
        platformId,
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  return { successful, failed };
}

/**
 * Batch optimize and save multiple images for multiple platforms
 */
export async function batchOptimizeAndSave(
  imageUris: string[],
  platforms: PlatformRequirement[],
  backgroundColors?: Array<string | undefined>,
  onProgress?: (
    imageIndex: number,
    platformId: string,
    status: "optimizing" | "saving" | "done" | "failed",
  ) => void,
  options?: { cacheOptimized?: boolean; requiresWatermark?: boolean },
): Promise<{
  totalImages: number;
  totalSaved: number;
  totalFailed: number;
  cached?: Array<{
    imageIndex: number;
    platformId: string;
    uri: string;
    format: string;
  }>;
}> {
  let totalSaved = 0;
  let totalFailed = 0;
  const cached: Array<{
    imageIndex: number;
    platformId: string;
    uri: string;
    format: string;
  }> = [];

  const hasPermission = await ensureMediaLibraryPermission();
  if (!hasPermission) {
    throw new Error("Permission to access gallery was denied");
  }

  for (let i = 0; i < imageUris.length; i++) {
    const imageUri = imageUris[i];
    const backgroundColor = backgroundColors?.[i];

    for (const platform of platforms) {
      try {
        // Optimize
        onProgress?.(i, platform.id, "optimizing");
        const optimized = await optimizeForPlatform(imageUri, platform, {
          backgroundColor,
          requiresWatermark: options?.requiresWatermark,
        });
        if (options?.cacheOptimized) {
          const base64Data = optimized.uri.split(",")[1];
          const ext = optimized.format === "PNG" ? "png" : "jpg";
          const cachePath = `${FileSystem.cacheDirectory}fotobox_export_${i + 1}_${platform.id}.${ext}`;
          await FileSystem.writeAsStringAsync(cachePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          cached.push({
            imageIndex: i,
            platformId: platform.id,
            uri: cachePath,
            format: optimized.format,
          });
        }

        // Save
        onProgress?.(i, platform.id, "saving");
        const saveResult = await saveToFotoBoxAlbum(
          optimized.uri,
          `${platform.id}_product_${i + 1}`,
          { skipPermissionCheck: true },
        );

        if (saveResult.success) {
          totalSaved++;
          onProgress?.(i, platform.id, "done");
        } else {
          totalFailed++;
          onProgress?.(i, platform.id, "failed");
        }
      } catch (error) {
        totalFailed++;
        onProgress?.(i, platform.id, "failed");
        console.error(
          `[PlatformOptimizer] Batch error for image ${i}, platform ${platform.id}:`,
          error,
        );
      }
    }
  }

  return {
    totalImages: imageUris.length,
    totalSaved,
    totalFailed,
    cached: options?.cacheOptimized ? cached : undefined,
  };
}

/**
 * Platform optimizer - Skia-based image optimization for e-commerce platforms
 */

import { Skia, ImageFormat, rect } from "@shopify/react-native-skia";
import type { SkImage, ImageInfo } from "@shopify/react-native-skia";
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
}

type RGB = { r: number; g: number; b: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const parseHexColor = (color?: string): RGB | null => {
  if (!color) return null;
  const hex = color.trim().toLowerCase();
  if (!hex.startsWith("#")) return null;
  const raw = hex.slice(1);
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const getCornerAverage = (image: SkImage) => {
  const info = image.getImageInfo() as ImageInfo;
  const pixels = image.readPixels(0, 0, info) as Uint8Array | null;
  if (!pixels) return null;

  const width = info.width;
  const height = info.height;
  const maxDim = Math.max(width, height);
  const step = Math.max(1, Math.floor(maxDim / 800));
  const cornerSize = Math.max(8, Math.floor(maxDim * 0.04));

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  const sample = (startX: number, startY: number) => {
    const endX = Math.min(width, startX + cornerSize);
    const endY = Math.min(height, startY + cornerSize);
    for (let y = startY; y < endY; y += step) {
      const rowOffset = y * width * 4;
      for (let x = startX; x < endX; x += step) {
        const idx = rowOffset + x * 4;
        const a = pixels[idx + 3];
        if (a < 10) continue;
        rSum += pixels[idx];
        gSum += pixels[idx + 1];
        bSum += pixels[idx + 2];
        count += 1;
      }
    }
  };

  sample(0, 0);
  sample(width - cornerSize, 0);
  sample(0, height - cornerSize);
  sample(width - cornerSize, height - cornerSize);

  if (!count) return null;

  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
};

const getContentBounds = (image: SkImage, bg: RGB) => {
  const info = image.getImageInfo() as ImageInfo;
  const pixels = image.readPixels(0, 0, info) as Uint8Array | null;
  if (!pixels) return null;

  const width = info.width;
  const height = info.height;
  const maxDim = Math.max(width, height);
  const step = Math.max(1, Math.floor(maxDim / 800));
  const tolerance = 28;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y += step) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x += step) {
      const idx = rowOffset + x * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (a < 10) continue;

      const diff = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
      if (diff > tolerance) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  const pad = Math.max(1, step * 2);
  return {
    minX: clamp(minX - pad, 0, width - 1),
    minY: clamp(minY - pad, 0, height - 1),
    maxX: clamp(maxX + pad, 0, width - 1),
    maxY: clamp(maxY + pad, 0, height - 1),
  };
};

const getSmartCropRect = (
  width: number,
  height: number,
  targetRatio: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
) => {
  const srcRatio = width / height;
  let cropX = 0;
  let cropY = 0;
  let cropWidth = width;
  let cropHeight = height;

  if (Math.abs(srcRatio - targetRatio) <= 0.01) {
    return { cropX, cropY, cropWidth, cropHeight };
  }

  if (srcRatio > targetRatio) {
    cropWidth = Math.round(height * targetRatio);
    cropHeight = height;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    cropX = Math.round(centerX - cropWidth / 2);
    cropX = clamp(cropX, 0, width - cropWidth);

    if (bounds.minX < cropX) {
      cropX = clamp(bounds.minX, 0, width - cropWidth);
    } else if (bounds.maxX > cropX + cropWidth) {
      cropX = clamp(bounds.maxX - cropWidth, 0, width - cropWidth);
    }
  } else {
    cropHeight = Math.round(width / targetRatio);
    cropWidth = width;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    cropY = Math.round(centerY - cropHeight / 2);
    cropY = clamp(cropY, 0, height - cropHeight);

    if (bounds.minY < cropY) {
      cropY = clamp(bounds.minY, 0, height - cropHeight);
    } else if (bounds.maxY > cropY + cropHeight) {
      cropY = clamp(bounds.maxY - cropHeight, 0, height - cropHeight);
    }
  }

  return { cropX, cropY, cropWidth, cropHeight };
};

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
    let useSmartCrop = false;
    let backgroundRgb = parseHexColor(options?.backgroundColor);
    if (!backgroundRgb) {
      backgroundRgb = getCornerAverage(sourceImage);
    }
    if (backgroundRgb) {
      console.log(
        `[PlatformOptimizer] Detected background RGB: ${backgroundRgb.r},${backgroundRgb.g},${backgroundRgb.b}`,
      );
    } else {
      console.log("[PlatformOptimizer] No background color detected");
    }

    if (platform.id === "pinterest" && backgroundRgb) {
      const bounds = getContentBounds(sourceImage, backgroundRgb);
      if (bounds) {
        console.log(
          `[PlatformOptimizer] Content bounds: minX=${bounds.minX}, maxX=${bounds.maxX}, minY=${bounds.minY}, maxY=${bounds.maxY}`,
        );
      } else {
        console.log("[PlatformOptimizer] Content bounds not found");
      }
      if (bounds) {
        const smartRect = getSmartCropRect(
          srcWidth,
          srcHeight,
          targetRatio,
          bounds,
        );
        cropX = smartRect.cropX;
        cropY = smartRect.cropY;
        cropWidth = smartRect.cropWidth;
        cropHeight = smartRect.cropHeight;
        useSmartCrop = true;
      }
    }
    console.log(
      `[PlatformOptimizer] Smart crop ${useSmartCrop ? "enabled" : "disabled"}`,
    );

    if (!useSmartCrop) {
      if (srcRatio > targetRatio) {
        // Source is wider than target - crop sides (center crop)
        cropWidth = Math.round(srcHeight * targetRatio);
        cropX = Math.round((srcWidth - cropWidth) / 2);
        cropHeight = srcHeight;
        cropY = 0;
      } else {
        // Source is taller than target - crop top/bottom (center crop)
        cropHeight = Math.round(srcWidth / targetRatio);
        cropY = Math.round((srcHeight - cropHeight) / 2);
        cropWidth = srcWidth;
        cropX = 0;
      }
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
  options?: { cacheOptimized?: boolean },
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

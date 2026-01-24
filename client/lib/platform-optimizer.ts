/**
 * Platform optimizer - Skia-based image optimization for e-commerce platforms
 */

import { Skia, ImageFormat, rect } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { PlatformRequirement } from "./platform-requirements";
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

  // Check minimum dimensions
  if (imageWidth < platform.minWidth) {
    issues.push(
      `Width ${imageWidth}px is below minimum ${platform.minWidth}px`,
    );
    suggestions.push(
      `Image will be upscaled to ${platform.optimalWidth}px width`,
    );
  }
  if (imageHeight < platform.minHeight) {
    issues.push(
      `Height ${imageHeight}px is below minimum ${platform.minHeight}px`,
    );
    suggestions.push(
      `Image will be upscaled to ${platform.optimalHeight}px height`,
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

  console.log(
    `[PlatformOptimizer] Crop rect: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`,
  );

  // 3. Create output surface at optimal dimensions
  const outputWidth = platform.optimalWidth;
  const outputHeight = platform.optimalHeight;

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
): Promise<Map<string, OptimizationResult>> {
  const results = new Map<string, OptimizationResult>();

  for (const platform of platforms) {
    // Report progress
    onProgress?.({
      platformId: platform.id,
      status: "processing",
    });

    try {
      const result = await optimizeForPlatform(imageUri, platform);
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
  onProgress?: (
    imageIndex: number,
    platformId: string,
    status: "optimizing" | "saving" | "done" | "failed",
  ) => void,
): Promise<{ totalImages: number; totalSaved: number; totalFailed: number }> {
  let totalSaved = 0;
  let totalFailed = 0;

  const hasPermission = await ensureMediaLibraryPermission();
  if (!hasPermission) {
    throw new Error("Permission to access gallery was denied");
  }

  for (let i = 0; i < imageUris.length; i++) {
    const imageUri = imageUris[i];

    for (const platform of platforms) {
      try {
        // Optimize
        onProgress?.(i, platform.id, "optimizing");
        const optimized = await optimizeForPlatform(imageUri, platform);

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
  };
}

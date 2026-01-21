import * as React from "react";
import { StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Canvas,
  Image,
  ColorMatrix,
  Fill,
  Skia,
  rect,
  ImageFormat,
  useImage,
  type SkImage,
} from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system/legacy";

import { Colors } from "@/constants/theme";
import { CropOverlay } from "./CropOverlay";
import type { ImageEditingState } from "@/hooks/useImageEditing";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DEFAULT_IMAGE_SIZE = SCREEN_WIDTH * 0.75;
const MAX_IMAGE_HEIGHT = SCREEN_HEIGHT * 0.5; // Max height constraint

export interface SkiaEditableImageRef {
  snapshot: () => Promise<string | null>;
  snapshotWithImage: () => Promise<{ uri: string; image: SkImage } | null>;
  setWorkingImage: (image: SkImage | null) => void;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

// Platform-specific output sizes for e-commerce
export type PlatformType = "amazon" | "shopify" | "etsy";

export const PLATFORM_OUTPUT_SIZES: Record<PlatformType, { width: number; height: number }> = {
  amazon: { width: 2000, height: 2000 },
  shopify: { width: 2048, height: 2048 },
  etsy: { width: 3000, height: 2250 },
};

interface SkiaEditableImageProps {
  originalUri: string;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
    highlights: number;
    shadows: number;
    warmth: number;
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  };
  showOriginal?: boolean;
  showCropOverlay?: boolean;
  crop: ImageEditingState["crop"];
  aspectRatio?: ImageEditingState["aspectRatio"];
  onCropChange: (crop: ImageEditingState["crop"]) => void;
  /** Callback when image dimensions are known, useful for dynamic container sizing */
  onImageDimensionsChange?: (dimensions: ImageDimensions) => void;
  /** Maximum width constraint for the image container */
  maxWidth?: number;
  /** Maximum height constraint for the image container */
  maxHeight?: number;
  /** Target platform for output sizing (amazon, shopify, etsy) */
  targetPlatform?: PlatformType;
}

function brightnessMatrix(value: number): number[] {
  const b = value;
  return [1, 0, 0, 0, b, 0, 1, 0, 0, b, 0, 0, 1, 0, b, 0, 0, 0, 1, 0];
}
function contrastMatrix(value: number): number[] {
  const c = value;
  const offset = (1 - c) / 2;
  return [
    c,
    0,
    0,
    0,
    offset,
    0,
    c,
    0,
    0,
    offset,
    0,
    0,
    c,
    0,
    offset,
    0,
    0,
    0,
    1,
    0,
  ];
}
function saturationMatrix(value: number): number[] {
  const s = value;
  const lumR = 0.2126;
  const lumG = 0.7152;
  const lumB = 0.0722;
  const sr = (1 - s) * lumR;
  const sg = (1 - s) * lumG;
  const sb = (1 - s) * lumB;
  return [
    sr + s,
    sg,
    sb,
    0,
    0,
    sr,
    sg + s,
    sb,
    0,
    0,
    sr,
    sg,
    sb + s,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
}
function exposureMatrix(value: number): number[] {
  const e = Math.pow(2, value);
  return [e, 0, 0, 0, 0, 0, e, 0, 0, 0, 0, 0, e, 0, 0, 0, 0, 0, 1, 0];
}
function warmthMatrix(value: number): number[] {
  const w = value * 0.3;
  return [1 + w, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1 - w, 0, 0, 0, 0, 0, 1, 0];
}
// Shadows: Lifts or lowers the dark tones of the image
// At max value (+1), this adds 0.8 to all RGB (very bright)
// At min value (-1), this subtracts 0.8 from all RGB (very dark)
function shadowsMatrix(value: number): number[] {
  // value range: -1 to 1
  // VERY strong effect - 0.8 offset is dramatic
  const offset = value * 0.8;
  return [
    1,
    0,
    0,
    0,
    offset,
    0,
    1,
    0,
    0,
    offset,
    0,
    0,
    1,
    0,
    offset,
    0,
    0,
    0,
    1,
    0,
  ];
}

// Highlights: Scales the brightness of the image
// At max value (+1), this scales RGB by 2x (very bright)
// At min value (-1), this scales RGB by 0.2x (very dark)
function highlightsMatrix(value: number): number[] {
  // value range: -1 to 1
  // VERY strong effect - scaling from 0.2 to 2.0
  const scale = 1 + value * 0.8;
  return [
    scale,
    0,
    0,
    0,
    0,
    0,
    scale,
    0,
    0,
    0,
    0,
    0,
    scale,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
}
function multiplyColorMatrices(a: number[], b: number[]): number[] {
  const result: number[] = new Array(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col];
      }
      if (col === 4) {
        sum += a[row * 5 + 4];
      }
      result[row * 5 + col] = sum;
    }
  }
  return result;
}
function createCombinedMatrix(
  adjustments: SkiaEditableImageProps["adjustments"],
): number[] {
  let matrix: number[] = [
    1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
  ];
  if (adjustments.exposure !== 0) {
    matrix = multiplyColorMatrices(
      exposureMatrix(adjustments.exposure),
      matrix,
    );
  }
  if (adjustments.brightness !== 0) {
    matrix = multiplyColorMatrices(
      brightnessMatrix(adjustments.brightness),
      matrix,
    );
  }
  if (adjustments.contrast !== 1) {
    matrix = multiplyColorMatrices(
      contrastMatrix(adjustments.contrast),
      matrix,
    );
  }
  if (adjustments.saturation !== 1) {
    matrix = multiplyColorMatrices(
      saturationMatrix(adjustments.saturation),
      matrix,
    );
  }
  if (adjustments.warmth !== 0) {
    matrix = multiplyColorMatrices(warmthMatrix(adjustments.warmth), matrix);
  }
  if (adjustments.shadows !== 0) {
    const shadowMat = shadowsMatrix(adjustments.shadows);
    console.log(
      "[SkiaEditableImage] Shadows value:",
      adjustments.shadows,
      "Matrix offset:",
      shadowMat[4],
    );
    matrix = multiplyColorMatrices(shadowMat, matrix);
  }
  if (adjustments.highlights !== 0) {
    const highlightMat = highlightsMatrix(adjustments.highlights);
    console.log(
      "[SkiaEditableImage] Highlights value:",
      adjustments.highlights,
      "Matrix scale:",
      highlightMat[0],
    );
    matrix = multiplyColorMatrices(highlightMat, matrix);
  }

  // Debug: Log if any adjustment is active
  const hasAdjustments =
    adjustments.brightness !== 0 ||
    adjustments.contrast !== 1 ||
    adjustments.saturation !== 1 ||
    adjustments.exposure !== 0 ||
    adjustments.warmth !== 0 ||
    adjustments.shadows !== 0 ||
    adjustments.highlights !== 0;
  if (hasAdjustments) {
    console.log(
      "[SkiaEditableImage] Final matrix first row:",
      matrix.slice(0, 5),
    );
  }

  return matrix;
}

export const SkiaEditableImage = React.forwardRef<
  SkiaEditableImageRef,
  SkiaEditableImageProps
>(
  (
    {
      originalUri,
      adjustments,
      showOriginal = false,
      showCropOverlay = false,
      crop,
      aspectRatio,
      onCropChange,
      onImageDimensionsChange,
      maxWidth = DEFAULT_IMAGE_SIZE,
      maxHeight = MAX_IMAGE_HEIGHT,
      targetPlatform = "amazon",
    },
    ref,
  ) => {
    // Animated container size for smooth transitions
    const animatedWidth = useSharedValue(maxWidth);
    const animatedHeight = useSharedValue(maxWidth);

    // Keep track of current container size for calculations
    const [containerSize, setContainerSize] = React.useState({
      width: maxWidth,
      height: maxWidth,
    });

    const [imageLayout, setImageLayout] = React.useState({
      width: maxWidth,
      height: maxWidth,
    });

    const [actualImageDimensions, setActualImageDimensions] = React.useState({
      width: maxWidth,
      height: maxWidth,
      offsetX: 0,
      offsetY: 0,
    });

    // Use Skia's useImage hook directly - handles file:// URIs on native
    const loadedImage = useImage(originalUri);

    // Working image state - stores a directly set SkImage (e.g., after crop apply)
    // This bypasses useImage's async loading to prevent race conditions
    const [workingImage, setWorkingImage] = React.useState<SkImage | null>(
      null,
    );

    // Use working image if set, otherwise use loaded image
    const image = workingImage || loadedImage;

    const canvasRef = React.useRef<any>(null);

    // Animated style for smooth container resizing
    const animatedContainerStyle = useAnimatedStyle(() => ({
      width: animatedWidth.value,
      height: animatedHeight.value,
    }));

    // Reset working image when source URI changes (new image loaded externally)
    React.useEffect(() => {
      setWorkingImage(null);
    }, [originalUri]);

    // Helper function to calculate container size for a given aspect ratio
    const calculateContainerSize = React.useCallback(
      (aspectRatio: number) => {
        let containerWidth = maxWidth;
        let containerHeight = maxWidth / aspectRatio;

        // If height exceeds max, scale down
        if (containerHeight > maxHeight) {
          containerHeight = maxHeight;
          containerWidth = maxHeight * aspectRatio;
        }

        // Ensure width doesn't exceed max
        if (containerWidth > maxWidth) {
          containerWidth = maxWidth;
          containerHeight = maxWidth / aspectRatio;
        }

        return { width: containerWidth, height: containerHeight };
      },
      [maxWidth, maxHeight],
    );

    // Calculate the effective aspect ratio based on image and crop
    const getEffectiveAspectRatio = React.useCallback(() => {
      if (!image) return 1;

      const imgWidth = image.width();
      const imgHeight = image.height();

      // While crop overlay is showing, use the full image aspect ratio
      // so user can see and manipulate the entire image
      if (showCropOverlay) {
        return imgWidth / imgHeight;
      }

      // After crop is applied (overlay hidden), use the cropped aspect ratio
      if (crop && crop.width > 0 && crop.height > 0) {
        const croppedWidth = imgWidth * crop.width;
        const croppedHeight = imgHeight * crop.height;
        return croppedWidth / croppedHeight;
      }

      // Default to original image aspect ratio
      return imgWidth / imgHeight;
    }, [image, workingImage, crop, showCropOverlay]);

    // Calculate container size and image dimensions when image loads or crop changes
    React.useEffect(() => {
      if (!image) {
        setContainerSize({ width: maxWidth, height: maxWidth });
        animatedWidth.value = withTiming(maxWidth, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
        animatedHeight.value = withTiming(maxWidth, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
        setActualImageDimensions({
          width: maxWidth,
          height: maxWidth,
          offsetX: 0,
          offsetY: 0,
        });
        return;
      }

      const imgWidth = image.width();
      const imgHeight = image.height();
      const effectiveAspect = getEffectiveAspectRatio();

      // Calculate container size based on effective aspect ratio
      const newContainerSize = calculateContainerSize(effectiveAspect);

      setContainerSize(newContainerSize);

      // Animate the container size change for smooth transitions
      animatedWidth.value = withTiming(newContainerSize.width, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      animatedHeight.value = withTiming(newContainerSize.height, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });

      // Image fills container exactly (no letterboxing needed with dynamic sizing)
      setActualImageDimensions({
        width: newContainerSize.width,
        height: newContainerSize.height,
        offsetX: 0,
        offsetY: 0,
      });

      // Notify parent of image dimensions
      if (onImageDimensionsChange) {
        onImageDimensionsChange({
          width: imgWidth,
          height: imgHeight,
          aspectRatio: effectiveAspect,
        });
      }
    }, [
      image,
      workingImage,
      crop,
      showCropOverlay,
      maxWidth,
      maxHeight,
      calculateContainerSize,
      getEffectiveAspectRatio,
      onImageDimensionsChange,
      animatedWidth,
      animatedHeight,
    ]);

    React.useImperativeHandle(
      ref,
      () => ({
        snapshot: async (): Promise<string | null> => {
          if (!image) {
            console.error(
              "[SkiaEditableImage] Snapshot failed: Image not loaded.",
            );
            return null;
          }

          try {
            const cropArea = crop || { x: 0, y: 0, width: 1, height: 1 };

            const origWidth = image.width();
            const origHeight = image.height();

            // Determine if we need to apply rotation/flip first
            const needsTransform =
              adjustments.rotation !== 0 ||
              adjustments.flipHorizontal ||
              adjustments.flipVertical;

            let workingImage = image;
            let workingWidth = origWidth;
            let workingHeight = origHeight;

            // If rotation or flip is applied, create transformed image first
            if (needsTransform) {
              console.log(
                "[SkiaEditableImage] Applying transforms before crop",
              );

              // For 90/270 degree rotations, swap width and height
              const needsSwap = Math.abs(adjustments.rotation % 180) === 90;
              const transformedWidth = needsSwap ? origHeight : origWidth;
              const transformedHeight = needsSwap ? origWidth : origHeight;

              const tempSurface = Skia.Surface.Make(
                transformedWidth,
                transformedHeight,
              );
              if (!tempSurface) {
                console.error(
                  "[SkiaEditableImage] Failed to create transform surface",
                );
                return null;
              }

              const tempCanvas = tempSurface.getCanvas();
              const rotationRad = (adjustments.rotation * Math.PI) / 180;
              const scaleX = adjustments.flipHorizontal ? -1 : 1;
              const scaleY = adjustments.flipVertical ? -1 : 1;

              // Apply transforms
              tempCanvas.save();
              tempCanvas.translate(transformedWidth / 2, transformedHeight / 2);
              tempCanvas.rotate(rotationRad, 0, 0);
              tempCanvas.scale(scaleX, scaleY);
              tempCanvas.translate(-origWidth / 2, -origHeight / 2);
              tempCanvas.drawImage(image, 0, 0);
              tempCanvas.restore();

              workingImage = tempSurface.makeImageSnapshot();
              workingWidth = transformedWidth;
              workingHeight = transformedHeight;

              if (!workingImage) {
                console.error(
                  "[SkiaEditableImage] Failed to create transformed image",
                );
                return null;
              }
            }

            // Calculate crop in working image coordinates
            const cropX = Math.round(cropArea.x * workingWidth);
            const cropY = Math.round(cropArea.y * workingHeight);
            const cropW = Math.round(cropArea.width * workingWidth);
            const cropH = Math.round(cropArea.height * workingHeight);

            console.log("[SkiaEditableImage] Taking HIGH-RES snapshot:", {
              originalDimensions: { w: origWidth, h: origHeight },
              workingDimensions: { w: workingWidth, h: workingHeight },
              cropArea,
              cropPixels: { x: cropX, y: cropY, w: cropW, h: cropH },
            });

            // Create a surface at the CROPPED size (high resolution)
            const surface = Skia.Surface.Make(cropW, cropH);
            if (!surface) {
              console.error("[SkiaEditableImage] Failed to create surface");
              return null;
            }

            const canvas = surface.getCanvas();

            // Define source rect (the crop region from working image)
            const srcRect = rect(cropX, cropY, cropW, cropH);

            // Define destination rect (full surface)
            const dstRect = rect(0, 0, cropW, cropH);

            // Create paint with color adjustments
            const paint = Skia.Paint();
            if (!showOriginal) {
              const colorMatrix = createCombinedMatrix(adjustments);
              paint.setColorFilter(Skia.ColorFilter.MakeMatrix(colorMatrix));
            }

            // Draw the cropped portion of the image with adjustments
            canvas.drawImageRect(workingImage, srcRect, dstRect, paint);

            // Get the snapshot from the surface
            const croppedSnapshot = surface.makeImageSnapshot();

            if (!croppedSnapshot) {
              console.error(
                "[SkiaEditableImage] Failed to create snapshot from surface",
              );
              return null;
            }

            console.log(
              "[SkiaEditableImage] Cropped snapshot dimensions:",
              croppedSnapshot.width(),
              "x",
              croppedSnapshot.height(),
            );

            // Upscale/resize to platform-specific dimensions
            const platformSize = PLATFORM_OUTPUT_SIZES[targetPlatform] || PLATFORM_OUTPUT_SIZES.amazon;
            const targetWidth = platformSize.width;
            const targetHeight = platformSize.height;
            const snapshotWidth = croppedSnapshot.width();
            const snapshotHeight = croppedSnapshot.height();
            const maxDimension = Math.max(snapshotWidth, snapshotHeight);
            const targetMaxDimension = Math.max(targetWidth, targetHeight);

            let finalSnapshot = croppedSnapshot;

            if (maxDimension < targetMaxDimension) {
              // Calculate upscale factor to reach platform target size
              const scaleFactor = targetMaxDimension / maxDimension;
              const upscaledWidth = Math.round(snapshotWidth * scaleFactor);
              const upscaledHeight = Math.round(snapshotHeight * scaleFactor);

              console.log(
                "[SkiaEditableImage] Upscaling from",
                snapshotWidth,
                "x",
                snapshotHeight,
                "to",
                upscaledWidth,
                "x",
                upscaledHeight,
              );

              // Create upscaled surface
              const upscaleSurface = Skia.Surface.Make(
                upscaledWidth,
                upscaledHeight,
              );

              if (upscaleSurface) {
                const upscaleCanvas = upscaleSurface.getCanvas();

                // Draw cropped image scaled up to fill the larger surface
                const upscaleSrcRect = rect(0, 0, snapshotWidth, snapshotHeight);
                const upscaleDstRect = rect(0, 0, upscaledWidth, upscaledHeight);

                // Use high-quality sampling for upscaling
                const upscalePaint = Skia.Paint();
                upscaleCanvas.drawImageRect(
                  croppedSnapshot,
                  upscaleSrcRect,
                  upscaleDstRect,
                  upscalePaint,
                );

                const upscaledSnapshot = upscaleSurface.makeImageSnapshot();
                if (upscaledSnapshot) {
                  finalSnapshot = upscaledSnapshot;
                  console.log(
                    "[SkiaEditableImage] Upscaled to:",
                    finalSnapshot.width(),
                    "x",
                    finalSnapshot.height(),
                  );
                }
              }
            }

            // Encode to base64
            const format =
              Platform.OS === "web" ? ImageFormat.PNG : ImageFormat.JPEG;
            const base64 = finalSnapshot.encodeToBase64(format, 95);

            if (!base64) {
              console.error(
                "[SkiaEditableImage] Failed to encode snapshot to base64",
              );
              return null;
            }

            const mimeType = Platform.OS === "web" ? "png" : "jpeg";
            return `data:image/${mimeType};base64,${base64}`;
          } catch (error) {
            console.error("[SkiaEditableImage] Snapshot error:", error);
            return null;
          }
        },

        snapshotWithImage: async (): Promise<{
          uri: string;
          image: SkImage;
        } | null> => {
          if (!image) {
            console.error(
              "[SkiaEditableImage] SnapshotWithImage failed: Image not loaded.",
            );
            return null;
          }

          try {
            const cropArea = crop || { x: 0, y: 0, width: 1, height: 1 };

            const origWidth = image.width();
            const origHeight = image.height();

            // Determine if we need to apply rotation/flip first
            const needsTransform =
              adjustments.rotation !== 0 ||
              adjustments.flipHorizontal ||
              adjustments.flipVertical;

            let sourceImage = image;
            let sourceWidth = origWidth;
            let sourceHeight = origHeight;

            // If rotation or flip is applied, create transformed image first
            if (needsTransform) {
              // For 90/270 degree rotations, swap width and height
              const needsSwap = Math.abs(adjustments.rotation % 180) === 90;
              const transformedWidth = needsSwap ? origHeight : origWidth;
              const transformedHeight = needsSwap ? origWidth : origHeight;

              const tempSurface = Skia.Surface.Make(
                transformedWidth,
                transformedHeight,
              );
              if (!tempSurface) {
                console.error(
                  "[SkiaEditableImage] Failed to create transform surface",
                );
                return null;
              }

              const tempCanvas = tempSurface.getCanvas();
              const rotationRad = (adjustments.rotation * Math.PI) / 180;
              const scaleX = adjustments.flipHorizontal ? -1 : 1;
              const scaleY = adjustments.flipVertical ? -1 : 1;

              // Apply transforms
              tempCanvas.save();
              tempCanvas.translate(transformedWidth / 2, transformedHeight / 2);
              tempCanvas.rotate(rotationRad, 0, 0);
              tempCanvas.scale(scaleX, scaleY);
              tempCanvas.translate(-origWidth / 2, -origHeight / 2);
              tempCanvas.drawImage(image, 0, 0);
              tempCanvas.restore();

              const transformedImage = tempSurface.makeImageSnapshot();
              if (!transformedImage) {
                console.error(
                  "[SkiaEditableImage] Failed to create transformed image",
                );
                return null;
              }
              sourceImage = transformedImage;
              sourceWidth = transformedWidth;
              sourceHeight = transformedHeight;
            }

            // Calculate crop in source image coordinates
            const cropX = Math.round(cropArea.x * sourceWidth);
            const cropY = Math.round(cropArea.y * sourceHeight);
            const cropW = Math.round(cropArea.width * sourceWidth);
            const cropH = Math.round(cropArea.height * sourceHeight);

            // Create a surface at the CROPPED size
            const surface = Skia.Surface.Make(cropW, cropH);
            if (!surface) {
              console.error("[SkiaEditableImage] Failed to create surface");
              return null;
            }

            const canvas = surface.getCanvas();

            // Define source rect (the crop region from source image)
            const srcRect = rect(cropX, cropY, cropW, cropH);

            // Define destination rect (full surface)
            const dstRect = rect(0, 0, cropW, cropH);

            // Create paint with color adjustments
            const paint = Skia.Paint();
            if (!showOriginal) {
              const colorMatrix = createCombinedMatrix(adjustments);
              paint.setColorFilter(Skia.ColorFilter.MakeMatrix(colorMatrix));
            }

            // Draw the cropped portion of the image with adjustments
            canvas.drawImageRect(sourceImage, srcRect, dstRect, paint);

            // Get the snapshot from the surface
            const croppedImage = surface.makeImageSnapshot();

            if (!croppedImage) {
              console.error(
                "[SkiaEditableImage] Failed to create snapshot from surface",
              );
              return null;
            }

            // Upscale/resize to platform-specific dimensions
            const platformSize = PLATFORM_OUTPUT_SIZES[targetPlatform] || PLATFORM_OUTPUT_SIZES.amazon;
            const targetMaxDimension = Math.max(platformSize.width, platformSize.height);
            const croppedWidth = croppedImage.width();
            const croppedHeight = croppedImage.height();
            const maxDimension = Math.max(croppedWidth, croppedHeight);

            let finalImage = croppedImage;

            if (maxDimension < targetMaxDimension) {
              const scaleFactor = targetMaxDimension / maxDimension;
              const upscaledWidth = Math.round(croppedWidth * scaleFactor);
              const upscaledHeight = Math.round(croppedHeight * scaleFactor);

              const upscaleSurface = Skia.Surface.Make(
                upscaledWidth,
                upscaledHeight,
              );

              if (upscaleSurface) {
                const upscaleCanvas = upscaleSurface.getCanvas();
                const upscaleSrcRect = rect(0, 0, croppedWidth, croppedHeight);
                const upscaleDstRect = rect(0, 0, upscaledWidth, upscaledHeight);
                const upscalePaint = Skia.Paint();

                upscaleCanvas.drawImageRect(
                  croppedImage,
                  upscaleSrcRect,
                  upscaleDstRect,
                  upscalePaint,
                );

                const upscaledImage = upscaleSurface.makeImageSnapshot();
                if (upscaledImage) {
                  finalImage = upscaledImage;
                }
              }
            }

            // Encode to base64
            const format =
              Platform.OS === "web" ? ImageFormat.PNG : ImageFormat.JPEG;
            const base64 = finalImage.encodeToBase64(format, 95);

            if (!base64) {
              console.error(
                "[SkiaEditableImage] Failed to encode snapshot to base64",
              );
              return null;
            }

            const mimeType = Platform.OS === "web" ? "png" : "jpeg";
            const uri = `data:image/${mimeType};base64,${base64}`;

            return { uri, image: finalImage };
          } catch (error) {
            console.error(
              "[SkiaEditableImage] SnapshotWithImage error:",
              error,
            );
            return null;
          }
        },

        setWorkingImage: (newImage: SkImage | null) => {
          setWorkingImage(newImage);
        },
      }),
      [image, crop, adjustments, showOriginal],
    );

    const colorMatrix = showOriginal
      ? [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] // Identity
      : createCombinedMatrix(adjustments);

    // Debug: Log when highlights or shadows are non-zero
    if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
      console.log(
        "[SkiaEditableImage] Render - highlights:",
        adjustments.highlights,
        "shadows:",
        adjustments.shadows,
      );
    }

    if (!image) {
      return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
          <Animated.View style={styles.imageContainer}>
            <Animated.View style={styles.placeholder} />
          </Animated.View>
        </Animated.View>
      );
    }

    const rotationRad = (adjustments.rotation * Math.PI) / 180;
    const scaleX = adjustments.flipHorizontal ? -1 : 1;
    const scaleY = adjustments.flipVertical ? -1 : 1;

    // Calculate how to draw the image based on crop state
    const imgWidth = image.width();
    const imgHeight = image.height();

    // Check if we have an active crop that's not the full image
    const hasActiveCrop =
      !showCropOverlay &&
      crop &&
      (crop.x !== 0 || crop.y !== 0 || crop.width !== 1 || crop.height !== 1);

    let drawX = 0;
    let drawY = 0;
    let drawWidth = containerSize.width;
    let drawHeight = containerSize.height;
    let imageTransform = [
      { translateX: containerSize.width / 2 },
      { translateY: containerSize.height / 2 },
      { rotate: rotationRad },
      { scaleX },
      { scaleY },
      { translateX: -containerSize.width / 2 },
      { translateY: -containerSize.height / 2 },
    ];

    if (hasActiveCrop && crop) {
      // When crop is active (not in overlay mode), show only the cropped portion
      // Scale the image so the cropped area fills the container
      const cropWidthPx = imgWidth * crop.width;
      const cropHeightPx = imgHeight * crop.height;

      // Calculate scale to fit cropped area into container
      const scaleToFit = Math.min(
        containerSize.width / cropWidthPx,
        containerSize.height / cropHeightPx,
      );

      // Full image dimensions when scaled
      const scaledImgWidth = imgWidth * scaleToFit;
      const scaledImgHeight = imgHeight * scaleToFit;

      // Offset to center the crop area in the container
      const cropOffsetX = crop.x * scaledImgWidth;
      const cropOffsetY = crop.y * scaledImgHeight;

      // Center the cropped portion
      const centerOffsetX =
        (containerSize.width - cropWidthPx * scaleToFit) / 2;
      const centerOffsetY =
        (containerSize.height - cropHeightPx * scaleToFit) / 2;

      drawX = -cropOffsetX + centerOffsetX;
      drawY = -cropOffsetY + centerOffsetY;
      drawWidth = scaledImgWidth;
      drawHeight = scaledImgHeight;

      // Adjust transform for cropped view
      imageTransform = [
        { translateX: containerSize.width / 2 },
        { translateY: containerSize.height / 2 },
        { rotate: rotationRad },
        { scaleX },
        { scaleY },
        { translateX: -containerSize.width / 2 },
        { translateY: -containerSize.height / 2 },
      ];
    }

    return (
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <Animated.View
          style={styles.imageContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setImageLayout({ width, height });
          }}
        >
          <Canvas
            ref={canvasRef}
            style={styles.canvas}
            pointerEvents={showCropOverlay ? "none" : "auto"}
          >
            <Fill color={Colors.light.backgroundDefault} />
            <Image
              image={image}
              x={drawX}
              y={drawY}
              width={drawWidth}
              height={drawHeight}
              fit="fill"
              transform={imageTransform}
            >
              <ColorMatrix matrix={colorMatrix} />
            </Image>
          </Canvas>
        </Animated.View>

        {showCropOverlay && imageLayout.width > 0 && (
          <CropOverlay
            imageWidth={actualImageDimensions.width}
            imageHeight={actualImageDimensions.height}
            offsetX={actualImageDimensions.offsetX}
            offsetY={actualImageDimensions.offsetY}
            containerWidth={imageLayout.width}
            containerHeight={imageLayout.height}
            crop={crop}
            aspectRatio={aspectRatio}
            onCropChange={onCropChange}
          />
        )}
      </Animated.View>
    );
  },
);

SkiaEditableImage.displayName = "SkiaEditableImage";

const styles = StyleSheet.create({
  container: {
    // Width and height are set dynamically based on image aspect ratio
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundDefault,
    overflow: "hidden",
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.light.backgroundDefault,
  },
});

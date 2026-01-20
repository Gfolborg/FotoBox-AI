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
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

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
    1, 0, 0, 0, offset,
    0, 1, 0, 0, offset,
    0, 0, 1, 0, offset,
    0, 0, 0, 1, 0,
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
    scale, 0, 0, 0, 0,
    0, scale, 0, 0, 0,
    0, 0, scale, 0, 0,
    0, 0, 0, 1, 0,
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
    console.log("[SkiaEditableImage] Shadows value:", adjustments.shadows, "Matrix offset:", shadowMat[4]);
    matrix = multiplyColorMatrices(shadowMat, matrix);
  }
  if (adjustments.highlights !== 0) {
    const highlightMat = highlightsMatrix(adjustments.highlights);
    console.log("[SkiaEditableImage] Highlights value:", adjustments.highlights, "Matrix scale:", highlightMat[0]);
    matrix = multiplyColorMatrices(highlightMat, matrix);
  }

  // Debug: Log if any adjustment is active
  const hasAdjustments = adjustments.brightness !== 0 || adjustments.contrast !== 1 ||
    adjustments.saturation !== 1 || adjustments.exposure !== 0 ||
    adjustments.warmth !== 0 || adjustments.shadows !== 0 || adjustments.highlights !== 0;
  if (hasAdjustments) {
    console.log("[SkiaEditableImage] Final matrix first row:", matrix.slice(0, 5));
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
    const image = useImage(originalUri);

    const canvasRef = React.useRef<any>(null);

    // Animated style for smooth container resizing
    const animatedContainerStyle = useAnimatedStyle(() => ({
      width: animatedWidth.value,
      height: animatedHeight.value,
    }));

    // Helper function to calculate container size for a given aspect ratio
    const calculateContainerSize = React.useCallback((aspectRatio: number) => {
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
    }, [maxWidth, maxHeight]);

    // Calculate the effective aspect ratio based on image and crop
    const getEffectiveAspectRatio = React.useCallback(() => {
      if (!image) return 1;

      const imgWidth = image.width();
      const imgHeight = image.height();

      // If we're showing crop overlay, use the full image aspect ratio
      // so user can see the entire image while cropping
      if (showCropOverlay) {
        return imgWidth / imgHeight;
      }

      // If there's an active crop (not in overlay mode), calculate cropped aspect ratio
      if (crop && crop.width > 0 && crop.height > 0) {
        const croppedWidth = imgWidth * crop.width;
        const croppedHeight = imgHeight * crop.height;
        return croppedWidth / croppedHeight;
      }

      // Default to original image aspect ratio
      return imgWidth / imgHeight;
    }, [image, crop, showCropOverlay]);

    // Calculate container size and image dimensions when image loads or crop changes
    React.useEffect(() => {
      if (!image) {
        setContainerSize({ width: maxWidth, height: maxWidth });
        animatedWidth.value = withTiming(maxWidth, { duration: 250, easing: Easing.out(Easing.cubic) });
        animatedHeight.value = withTiming(maxWidth, { duration: 250, easing: Easing.out(Easing.cubic) });
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
        easing: Easing.out(Easing.cubic)
      });
      animatedHeight.value = withTiming(newContainerSize.height, {
        duration: 250,
        easing: Easing.out(Easing.cubic)
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
    }, [image, crop, showCropOverlay, maxWidth, maxHeight, calculateContainerSize, getEffectiveAspectRatio, onImageDimensionsChange, animatedWidth, animatedHeight]);

    React.useImperativeHandle(ref, () => ({
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
            console.log("[SkiaEditableImage] Applying transforms before crop");

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
          const snapshot = surface.makeImageSnapshot();

          if (!snapshot) {
            console.error(
              "[SkiaEditableImage] Failed to create snapshot from surface",
            );
            return null;
          }

          console.log(
            "[SkiaEditableImage] HIGH-RES Snapshot dimensions:",
            snapshot.width(),
            "x",
            snapshot.height(),
          );

          // Encode to base64
          const format =
            Platform.OS === "web" ? ImageFormat.PNG : ImageFormat.JPEG;
          const base64 = snapshot.encodeToBase64(format, 95);

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
    }));

    const colorMatrix = showOriginal
      ? [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] // Identity
      : createCombinedMatrix(adjustments);

    // Debug: Log when highlights or shadows are non-zero
    if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
      console.log("[SkiaEditableImage] Render - highlights:", adjustments.highlights, "shadows:", adjustments.shadows);
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

    // With dynamic container sizing, image fills the container
    const drawWidth = containerSize.width;
    const drawHeight = containerSize.height;
    const drawX = 0;
    const drawY = 0;

    const rotationRad = (adjustments.rotation * Math.PI) / 180;
    const scaleX = adjustments.flipHorizontal ? -1 : 1;
    const scaleY = adjustments.flipVertical ? -1 : 1;

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
              fit="contain"
              transform={[
                { translateX: containerSize.width / 2 },
                { translateY: containerSize.height / 2 },
                { rotate: rotationRad },
                { scaleX },
                { scaleY },
                { translateX: -containerSize.width / 2 },
                { translateY: -containerSize.height / 2 },
              ]}
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

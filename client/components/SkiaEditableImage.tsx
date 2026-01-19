import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import {
  Canvas,
  Image,
  ColorMatrix,
  Fill,
  Skia,
  rect,
  ImageFormat,
  type SkImage,
} from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system/legacy";

import { Colors } from "@/constants/theme";
import { CropOverlay } from "./CropOverlay";
import type { ImageEditingState } from "@/hooks/useImageEditing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.75;

export interface SkiaEditableImageRef {
  snapshot: () => Promise<string | null>;
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
}

// ... (Matrix functions remain the same)
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
  return matrix;
}

export const SkiaEditableImage = forwardRef<
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
    },
    ref,
  ) => {
    const [imageLayout, setImageLayout] = useState({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
    });

    const [actualImageDimensions, setActualImageDimensions] = useState({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      offsetX: 0,
      offsetY: 0,
    });

    const [skiaImage, setSkiaImage] = useState<SkImage | null>(null);
    const canvasRef = useRef<any>(null);

    // Load image using Skia's native decoding
    useEffect(() => {
      let cancelled = false;

      const loadImage = async () => {
        try {
          console.log("[SkiaEditableImage] Loading URI:", originalUri);

          let base64String: string;

          if (originalUri.startsWith("data:")) {
            // Extract base64 from data URI
            base64String = originalUri.split(",")[1];
            console.log("[SkiaEditableImage] Extracted base64 from data URI");
          } else {
            // Load file as base64
            let fileUri = originalUri;
            if (!fileUri.startsWith("file://") && fileUri.startsWith("/")) {
              fileUri = `file://${fileUri}`;
            }

            base64String = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log(
              "[SkiaEditableImage] Loaded file as base64, length:",
              base64String.length,
            );
          }

          if (cancelled) return;

          // Decode base64 to Uint8Array
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create Skia Data and decode image
          const skData = Skia.Data.fromBytes(bytes);
          const decodedImage = Skia.Image.MakeImageFromEncoded(skData);

          if (!cancelled) {
            if (decodedImage) {
              console.log(
                "[SkiaEditableImage] Image decoded successfully:",
                decodedImage.width(),
                "x",
                decodedImage.height(),
              );
              setSkiaImage(decodedImage);
            } else {
              console.error(
                "[SkiaEditableImage] Failed to decode image from bytes",
              );
              setSkiaImage(null);
            }
          }
        } catch (error) {
          console.error("[SkiaEditableImage] Failed to load image:", error);
          if (!cancelled) {
            setSkiaImage(null);
          }
        }
      };

      loadImage();

      return () => {
        cancelled = true;
      };
    }, [originalUri]);

    const image = skiaImage;

    // Calculate image dimensions for CropOverlay (must be before conditional returns)
    useEffect(() => {
      if (!image) {
        setActualImageDimensions({
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          offsetX: 0,
          offsetY: 0,
        });
        return;
      }

      const imageAspect = image.width() / image.height();
      const containerAspect = IMAGE_SIZE / IMAGE_SIZE;

      let drawWidth = IMAGE_SIZE;
      let drawHeight = IMAGE_SIZE;
      let drawX = 0;
      let drawY = 0;

      if (imageAspect > containerAspect) {
        drawWidth = IMAGE_SIZE;
        drawHeight = IMAGE_SIZE / imageAspect;
        drawY = (IMAGE_SIZE - drawHeight) / 2;
      } else {
        drawHeight = IMAGE_SIZE;
        drawWidth = IMAGE_SIZE * imageAspect;
        drawX = (IMAGE_SIZE - drawWidth) / 2;
      }

      setActualImageDimensions({
        width: drawWidth,
        height: drawHeight,
        offsetX: drawX,
        offsetY: drawY,
      });
    }, [image]);

    useImperativeHandle(ref, () => ({
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
          const needsTransform = adjustments.rotation !== 0 ||
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

            const tempSurface = Skia.Surface.Make(transformedWidth, transformedHeight);
            if (!tempSurface) {
              console.error("[SkiaEditableImage] Failed to create transform surface");
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
              console.error("[SkiaEditableImage] Failed to create transformed image");
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
            console.error("[SkiaEditableImage] Failed to create snapshot from surface");
            return null;
          }

          console.log(
            "[SkiaEditableImage] HIGH-RES Snapshot dimensions:",
            snapshot.width(),
            "x",
            snapshot.height(),
          );

          // Encode to base64
          const format = Platform.OS === "web" ? ImageFormat.PNG : ImageFormat.JPEG;
          const base64 = snapshot.encodeToBase64(format, 95);

          if (!base64) {
            console.error("[SkiaEditableImage] Failed to encode snapshot to base64");
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

    if (!image) {
      return (
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            <View style={styles.placeholder} />
          </View>
        </View>
      );
    }

    const imageAspect = image.width() / image.height();
    const containerAspect = IMAGE_SIZE / IMAGE_SIZE;

    let drawWidth = IMAGE_SIZE;
    let drawHeight = IMAGE_SIZE;
    let drawX = 0;
    let drawY = 0;

    if (imageAspect > containerAspect) {
      drawWidth = IMAGE_SIZE;
      drawHeight = IMAGE_SIZE / imageAspect;
      drawY = (IMAGE_SIZE - drawHeight) / 2;
    } else {
      drawHeight = IMAGE_SIZE;
      drawWidth = IMAGE_SIZE * imageAspect;
      drawX = (IMAGE_SIZE - drawWidth) / 2;
    }

    const rotationRad = (adjustments.rotation * Math.PI) / 180;
    const scaleX = adjustments.flipHorizontal ? -1 : 1;
    const scaleY = adjustments.flipVertical ? -1 : 1;

    return (
      <View style={styles.container}>
        <View
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
                { translateX: IMAGE_SIZE / 2 },
                { translateY: IMAGE_SIZE / 2 },
                { rotate: rotationRad },
                { scaleX },
                { scaleY },
                { translateX: -IMAGE_SIZE / 2 },
                { translateY: -IMAGE_SIZE / 2 },
              ]}
            >
              <ColorMatrix matrix={colorMatrix} />
            </Image>
          </Canvas>
        </View>

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
      </View>
    );
  },
);

SkiaEditableImage.displayName = "SkiaEditableImage";

const styles = StyleSheet.create({
  container: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1,
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

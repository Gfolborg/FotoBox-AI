import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  Fill,
  Skia,
  isRect,
  rect,
} from "@shopify/react-native-skia";

import { Colors } from "@/constants/theme";
import { CropOverlay } from "./CropOverlay";
import type { ImageEditingState } from "@/hooks/useImageEditing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.85;

export interface SkiaEditableImageRef {
  snapshot: () => Promise<string>;
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
    c, 0, 0, 0, offset, 0, c, 0, 0, offset, 0, 0, c, 0, offset, 0, 0, 0, 1, 0,
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
    sr + s, sg, sb, 0, 0, sr, sg + s, sb, 0, 0, sr, sg, sb + s, 0, 0, 0, 0, 0, 1, 0,
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
    matrix = multiplyColorMatrices(exposureMatrix(adjustments.exposure), matrix);
  }
  if (adjustments.brightness !== 0) {
    matrix = multiplyColorMatrices(brightnessMatrix(adjustments.brightness), matrix);
  }
  if (adjustments.contrast !== 1) {
    matrix = multiplyColorMatrices(contrastMatrix(adjustments.contrast), matrix);
  }
  if (adjustments.saturation !== 1) {
    matrix = multiplyColorMatrices(saturationMatrix(adjustments.saturation), matrix);
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
      onCropChange,
    },
    ref,
  ) => {
    const [imageLayout, setImageLayout] = useState({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
    });
    const image = useImage(originalUri);
    const canvasRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      snapshot: async () => {
        if (!canvasRef.current || !image) {
          throw new Error("Canvas is not ready or image not loaded.");
        }

        const cropArea = crop || { x: 0, y: 0, width: 1, height: 1 };
        const cropRect = rect(
          cropArea.x * image.width(),
          cropArea.y * image.height(),
          cropArea.width * image.width(),
          cropArea.height * image.height(),
        );

        const skiaImage = canvasRef.current.makeImageSnapshot(cropRect);
        const base64 = skiaImage.encodeToBase64("jpeg", 95);
        return `data:image/jpeg;base64,${base64}`;
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

          {showCropOverlay && imageLayout.width > 0 && (
            <CropOverlay
              imageWidth={imageLayout.width}
              imageHeight={imageLayout.height}
              crop={crop}
              onCropChange={onCropChange}
            />
          )}
        </View>
      </View>
    );
  },
);

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

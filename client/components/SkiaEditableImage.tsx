import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  Fill,
} from "@shopify/react-native-skia";

import { Colors } from "@/constants/theme";
import { CropOverlay } from "./CropOverlay";
import type { ImageEditingState } from "@/hooks/useImageEditing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.85;

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

/**
 * Creates a color matrix for brightness adjustment
 * Brightness: adds to RGB values (-1 to 1)
 */
function brightnessMatrix(value: number): number[] {
  const b = value;
  return [
    1, 0, 0, 0, b,
    0, 1, 0, 0, b,
    0, 0, 1, 0, b,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Creates a color matrix for contrast adjustment
 * Contrast: multiplies RGB and adjusts offset (0.5 to 2)
 */
function contrastMatrix(value: number): number[] {
  const c = value;
  const offset = (1 - c) / 2;
  return [
    c, 0, 0, 0, offset,
    0, c, 0, 0, offset,
    0, 0, c, 0, offset,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Creates a color matrix for saturation adjustment
 * Saturation: blends between grayscale and original (0 to 2)
 */
function saturationMatrix(value: number): number[] {
  const s = value;
  const lumR = 0.2126;
  const lumG = 0.7152;
  const lumB = 0.0722;

  const sr = (1 - s) * lumR;
  const sg = (1 - s) * lumG;
  const sb = (1 - s) * lumB;

  return [
    sr + s, sg, sb, 0, 0,
    sr, sg + s, sb, 0, 0,
    sr, sg, sb + s, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Creates a color matrix for exposure adjustment
 * Exposure: multiplies all RGB values (like camera exposure)
 */
function exposureMatrix(value: number): number[] {
  // Convert exposure value (-2 to 2) to multiplier
  const e = Math.pow(2, value);
  return [
    e, 0, 0, 0, 0,
    0, e, 0, 0, 0,
    0, 0, e, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Creates a color matrix for warmth/temperature adjustment
 * Warmth: shifts colors toward warm (orange) or cool (blue)
 */
function warmthMatrix(value: number): number[] {
  // Positive = warmer (more red/yellow), negative = cooler (more blue)
  const w = value * 0.3; // Scale down for subtler effect
  return [
    1 + w, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1 - w, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Multiplies two 5x4 color matrices (stored as 20-element arrays)
 */
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

/**
 * Combines all adjustment matrices into one
 */
function createCombinedMatrix(adjustments: SkiaEditableImageProps["adjustments"]): number[] {
  // Identity matrix
  let matrix: number[] = [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];

  // Apply each adjustment (order matters for visual result)
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

export function SkiaEditableImage({
  originalUri,
  adjustments,
  showOriginal = false,
  showCropOverlay = false,
  crop,
  onCropChange,
}: SkiaEditableImageProps) {
  const [imageLayout, setImageLayout] = useState({ width: IMAGE_SIZE, height: IMAGE_SIZE });
  const image = useImage(originalUri);

  // Calculate color matrix for current adjustments
  const colorMatrix = showOriginal
    ? [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] // Identity
    : createCombinedMatrix(adjustments);

  // Calculate transform for rotation and flip
  const getTransformOrigin = () => {
    return { x: imageLayout.width / 2, y: imageLayout.height / 2 };
  };

  if (!image) {
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <View style={styles.placeholder} />
        </View>
      </View>
    );
  }

  // Calculate aspect ratio to fit image in container
  const imageAspect = image.width() / image.height();
  const containerAspect = IMAGE_SIZE / IMAGE_SIZE;

  let drawWidth = IMAGE_SIZE;
  let drawHeight = IMAGE_SIZE;
  let drawX = 0;
  let drawY = 0;

  if (imageAspect > containerAspect) {
    // Image is wider - fit to width
    drawWidth = IMAGE_SIZE;
    drawHeight = IMAGE_SIZE / imageAspect;
    drawY = (IMAGE_SIZE - drawHeight) / 2;
  } else {
    // Image is taller - fit to height
    drawHeight = IMAGE_SIZE;
    drawWidth = IMAGE_SIZE * imageAspect;
    drawX = (IMAGE_SIZE - drawWidth) / 2;
  }

  // Apply rotation transform
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

        {/* Crop overlay */}
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
}

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

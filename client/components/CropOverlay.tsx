import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";

const HANDLE_SIZE = 32; // Increased from 24 for easier grabbing
const MIN_CROP_SIZE = 50;

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  offsetX?: number;
  offsetY?: number;
  containerWidth?: number;
  containerHeight?: number;
  crop: {
    x: number; // 0-1 (percentage)
    y: number; // 0-1 (percentage)
    width: number; // 0-1 (percentage)
    height: number; // 0-1 (percentage)
  } | null;
  aspectRatio?: "free" | "square" | "4:3" | "16:9" | "2:3" | null;
  onCropChange: (crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

export function CropOverlay({
  imageWidth,
  imageHeight,
  offsetX = 0,
  offsetY = 0,
  containerWidth,
  containerHeight,
  crop,
  aspectRatio,
  onCropChange,
}: CropOverlayProps) {
  // Use container dimensions if provided, otherwise default to image dimensions
  const canvasWidth = containerWidth || imageWidth;
  const canvasHeight = containerHeight || imageHeight;
  // Initialize crop to full image if not set
  const initialCrop = crop || { x: 0, y: 0, width: 1, height: 1 };

  // Convert percentages to pixels for internal state, accounting for offset
  const x = useSharedValue(offsetX + initialCrop.x * imageWidth);
  const y = useSharedValue(offsetY + initialCrop.y * imageHeight);
  const width = useSharedValue(initialCrop.width * imageWidth);
  const height = useSharedValue(initialCrop.height * imageHeight);

  // Update shared values when crop prop changes (e.g., aspect ratio selection)
  useEffect(() => {
    if (crop) {
      x.value = offsetX + crop.x * imageWidth;
      y.value = offsetY + crop.y * imageHeight;
      width.value = crop.width * imageWidth;
      height.value = crop.height * imageHeight;
    }
    // Shared values are stable refs and shouldn't trigger re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop, imageWidth, imageHeight, offsetX, offsetY]);

  // Context for tracking gesture start position
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startWidth = useSharedValue(0);
  const startHeight = useSharedValue(0);

  // Get aspect ratio value
  const getAspectRatioValue = (): number | null => {
    if (aspectRatio === "square") return 1;
    if (aspectRatio === "4:3") return 4 / 3;
    if (aspectRatio === "16:9") return 16 / 9;
    if (aspectRatio === "2:3") return 2 / 3;
    return null; // free aspect ratio
  };

  const aspectRatioValue = getAspectRatioValue();

  // Apply aspect ratio constraint
  const constrainToAspectRatio = (
    w: number,
    h: number,
  ): { width: number; height: number } => {
    if (!aspectRatioValue) return { width: w, height: h };

    const currentRatio = w / h;
    const targetRatio = aspectRatioValue;

    if (currentRatio > targetRatio) {
      // Width is too wide, adjust height
      return { width: w, height: w / targetRatio };
    } else {
      // Height is too tall, adjust width
      return { width: h * targetRatio, height: h };
    }
  };

  // Helper to report crop change (must use runOnJS from worklet)
  const reportCropChange = (
    cropX: number,
    cropY: number,
    cropW: number,
    cropH: number,
  ) => {
    // Subtract offset to get position relative to image, not canvas
    const relX = cropX - offsetX;
    const relY = cropY - offsetY;

    onCropChange({
      x: relX / imageWidth,
      y: relY / imageHeight,
      width: cropW / imageWidth,
      height: cropH / imageHeight,
    });
  };

  // Pan gesture for moving the crop area
  const panGesture = Gesture.Pan()
    .minDistance(5) // Add small threshold to prevent accidental drags
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) => {
      const newX = startX.value + e.translationX;
      const newY = startY.value + e.translationY;

      // Constrain to image bounds (accounting for offset)
      x.value = Math.max(
        offsetX,
        Math.min(newX, offsetX + imageWidth - width.value),
      );
      y.value = Math.max(
        offsetY,
        Math.min(newY, offsetY + imageHeight - height.value),
      );
    })
    .onEnd(() => {
      // Report back as percentages using runOnJS
      runOnJS(reportCropChange)(x.value, y.value, width.value, height.value);
    });

  // Corner handle gestures
  const createCornerGesture = (corner: "tl" | "tr" | "bl" | "br") => {
    return Gesture.Pan()
      .minDistance(3) // Add small threshold
      .onStart(() => {
        startX.value = x.value;
        startY.value = y.value;
        startWidth.value = width.value;
        startHeight.value = height.value;
      })
      .onUpdate((e) => {
        if (corner === "tl") {
          // Top-left: adjust x, y, width, height
          const newX = Math.max(offsetX, startX.value + e.translationX);
          const newY = Math.max(offsetY, startY.value + e.translationY);
          const newWidth = startWidth.value - (newX - startX.value);
          const newHeight = startHeight.value - (newY - startY.value);

          if (newWidth >= MIN_CROP_SIZE && newHeight >= MIN_CROP_SIZE) {
            x.value = newX;
            y.value = newY;
            width.value = newWidth;
            height.value = newHeight;
          }
        } else if (corner === "tr") {
          // Top-right: adjust y, width, height
          const newY = Math.max(offsetY, startY.value + e.translationY);
          const newWidth = Math.max(
            MIN_CROP_SIZE,
            Math.min(
              startWidth.value + e.translationX,
              offsetX + imageWidth - (startX.value - offsetX),
            ),
          );
          const newHeight = startHeight.value - (newY - startY.value);

          if (newHeight >= MIN_CROP_SIZE) {
            y.value = newY;
            width.value = newWidth;
            height.value = newHeight;
          }
        } else if (corner === "bl") {
          // Bottom-left: adjust x, width, height
          const newX = Math.max(offsetX, startX.value + e.translationX);
          const newWidth = startWidth.value - (newX - startX.value);
          const newHeight = Math.max(
            MIN_CROP_SIZE,
            Math.min(
              startHeight.value + e.translationY,
              offsetY + imageHeight - (startY.value - offsetY),
            ),
          );

          if (newWidth >= MIN_CROP_SIZE) {
            x.value = newX;
            width.value = newWidth;
            height.value = newHeight;
          }
        } else if (corner === "br") {
          // Bottom-right: adjust width, height
          width.value = Math.max(
            MIN_CROP_SIZE,
            Math.min(
              startWidth.value + e.translationX,
              offsetX + imageWidth - (startX.value - offsetX),
            ),
          );
          height.value = Math.max(
            MIN_CROP_SIZE,
            Math.min(
              startHeight.value + e.translationY,
              offsetY + imageHeight - (startY.value - offsetY),
            ),
          );
        }
      })
      .onEnd(() => {
        // Report back as percentages using runOnJS
        runOnJS(reportCropChange)(x.value, y.value, width.value, height.value);
      });
  };

  // Animated styles
  const cropAreaStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
    width: width.value,
    height: height.value,
  }));

  const topOverlayStyle = useAnimatedStyle(() => ({
    height: y.value,
  }));

  const leftOverlayStyle = useAnimatedStyle(() => ({
    top: y.value,
    width: x.value,
    height: height.value,
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    top: y.value,
    left: x.value + width.value,
    width: canvasWidth - (x.value + width.value),
    height: height.value,
  }));

  const bottomOverlayStyle = useAnimatedStyle(() => ({
    top: y.value + height.value,
    height: canvasHeight - (y.value + height.value),
  }));

  return (
    <View
      style={[styles.container, { width: canvasWidth, height: canvasHeight }]}
    >
      {/* Dark overlays outside crop area */}
      <Animated.View style={[styles.overlay, topOverlayStyle]} />
      <Animated.View style={[styles.overlay, leftOverlayStyle]} />
      <Animated.View style={[styles.overlay, rightOverlayStyle]} />
      <Animated.View style={[styles.overlay, bottomOverlayStyle]} />

      {/* Crop area with border and handles */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cropArea, cropAreaStyle]}>
          {/* Grid overlay (rule of thirds) */}
          <View style={styles.grid}>
            <View
              style={[
                styles.gridLine,
                styles.gridLineVertical,
                { left: "33.33%" },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                styles.gridLineVertical,
                { left: "66.66%" },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                styles.gridLineHorizontal,
                { top: "33.33%" },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                styles.gridLineHorizontal,
                { top: "66.66%" },
              ]}
            />
          </View>

          {/* Corner handles */}
          <GestureDetector gesture={createCornerGesture("tl")}>
            <Animated.View style={[styles.handle, styles.handleTopLeft]} />
          </GestureDetector>
          <GestureDetector gesture={createCornerGesture("tr")}>
            <Animated.View style={[styles.handle, styles.handleTopRight]} />
          </GestureDetector>
          <GestureDetector gesture={createCornerGesture("bl")}>
            <Animated.View style={[styles.handle, styles.handleBottomLeft]} />
          </GestureDetector>
          <GestureDetector gesture={createCornerGesture("br")}>
            <Animated.View style={[styles.handle, styles.handleBottomRight]} />
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "100%",
  },
  cropArea: {
    position: "absolute",
    borderWidth: 2,
    borderColor: Colors.light.white,
  },
  grid: {
    flex: 1,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: Colors.light.white,
    opacity: 0.3,
  },
  gridLineVertical: {
    width: 1,
    height: "100%",
  },
  gridLineHorizontal: {
    width: "100%",
    height: 1,
  },
  handle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: Colors.light.white,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 4,
  },
  handleTopLeft: {
    top: 0,
    left: 0,
    marginTop: -HANDLE_SIZE / 2,
    marginLeft: -HANDLE_SIZE / 2,
  },
  handleTopRight: {
    top: 0,
    right: 0,
    marginTop: -HANDLE_SIZE / 2,
    marginRight: -HANDLE_SIZE / 2,
  },
  handleBottomLeft: {
    bottom: 0,
    left: 0,
    marginBottom: -HANDLE_SIZE / 2,
    marginLeft: -HANDLE_SIZE / 2,
  },
  handleBottomRight: {
    bottom: 0,
    right: 0,
    marginBottom: -HANDLE_SIZE / 2,
    marginRight: -HANDLE_SIZE / 2,
  },
});

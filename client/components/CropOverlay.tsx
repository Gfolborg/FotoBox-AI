import React, { useEffect, useRef } from "react";
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

  // Track whether we initiated the last crop change (to avoid feedback loops)
  const selfInitiatedChange = useRef(false);
  // Track the last applied aspect ratio
  const lastAppliedAspectRatio = useRef<string | null>(null);
  // Track if this is the first render
  const isFirstRender = useRef(true);

  // Helper to update shared values and report change
  const applyAndReportCrop = (
    newX: number,
    newY: number,
    newW: number,
    newH: number,
  ) => {
    x.value = newX;
    y.value = newY;
    width.value = newW;
    height.value = newH;
    reportCropChange(newX, newY, newW, newH);
  };

  // Update shared values when crop prop changes from parent
  // Skip if we initiated the change ourselves
  useEffect(() => {
    // Skip on first render - we already initialized from initialCrop
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if we initiated this change
    if (selfInitiatedChange.current) {
      selfInitiatedChange.current = false;
      return;
    }

    // External change - sync from parent
    if (crop) {
      x.value = offsetX + crop.x * imageWidth;
      y.value = offsetY + crop.y * imageHeight;
      width.value = crop.width * imageWidth;
      height.value = crop.height * imageHeight;
    } else {
      // crop is null - reset to full image
      x.value = offsetX;
      y.value = offsetY;
      width.value = imageWidth;
      height.value = imageHeight;
    }

    // Also reset the aspect ratio tracking when crop resets
    if (!crop) {
      lastAppliedAspectRatio.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop]);

  // Apply aspect ratio constraint when aspect ratio changes
  useEffect(() => {
    // Handle free/null - just track it
    if (!aspectRatio || aspectRatio === "free") {
      lastAppliedAspectRatio.current = aspectRatio || null;
      return;
    }

    // Skip if already applied this ratio
    if (lastAppliedAspectRatio.current === aspectRatio) {
      return;
    }

    const ratio =
      aspectRatio === "square"
        ? 1
        : aspectRatio === "4:3"
          ? 4 / 3
          : aspectRatio === "16:9"
            ? 16 / 9
            : aspectRatio === "2:3"
              ? 2 / 3
              : null;

    if (!ratio) return;

    // Calculate new dimensions maintaining aspect ratio
    const currentW = width.value;
    const currentH = height.value;
    const currentX = x.value;
    const currentY = y.value;
    const currentRatio = currentW / currentH;

    let newW = currentW;
    let newH = currentH;

    if (currentRatio > ratio) {
      // Too wide - reduce width to match ratio
      newW = currentH * ratio;
    } else {
      // Too tall - reduce height to match ratio
      newH = currentW / ratio;
    }

    // Center within old bounds
    const newX = currentX + (currentW - newW) / 2;
    const newY = currentY + (currentH - newH) / 2;

    // Track that we applied this ratio
    lastAppliedAspectRatio.current = aspectRatio;

    // Apply and report
    applyAndReportCrop(newX, newY, newW, newH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio]);

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

  // Helper to report crop change (must use runOnJS from worklet)
  const reportCropChange = (
    cropX: number,
    cropY: number,
    cropW: number,
    cropH: number,
  ) => {
    // Mark that we initiated this change to avoid feedback loop
    selfInitiatedChange.current = true;

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

  // Corner handle gestures with aspect ratio support
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
        // Calculate raw new dimensions based on corner being dragged
        let newX = startX.value;
        let newY = startY.value;
        let newWidth = startWidth.value;
        let newHeight = startHeight.value;

        if (corner === "tl") {
          newX = startX.value + e.translationX;
          newY = startY.value + e.translationY;
          newWidth = startWidth.value - e.translationX;
          newHeight = startHeight.value - e.translationY;
        } else if (corner === "tr") {
          newY = startY.value + e.translationY;
          newWidth = startWidth.value + e.translationX;
          newHeight = startHeight.value - e.translationY;
        } else if (corner === "bl") {
          newX = startX.value + e.translationX;
          newWidth = startWidth.value - e.translationX;
          newHeight = startHeight.value + e.translationY;
        } else if (corner === "br") {
          newWidth = startWidth.value + e.translationX;
          newHeight = startHeight.value + e.translationY;
        }

        // Apply aspect ratio constraint if set
        if (aspectRatioValue) {
          // Use the larger change as the leader dimension
          const widthChange = Math.abs(newWidth - startWidth.value);
          const heightChange = Math.abs(newHeight - startHeight.value);

          if (widthChange >= heightChange) {
            // Width is leader, adjust height
            newHeight = newWidth / aspectRatioValue;
          } else {
            // Height is leader, adjust width
            newWidth = newHeight * aspectRatioValue;
          }

          // Recalculate position for corners that move origin
          if (corner === "tl") {
            newX = startX.value + startWidth.value - newWidth;
            newY = startY.value + startHeight.value - newHeight;
          } else if (corner === "tr") {
            newY = startY.value + startHeight.value - newHeight;
          } else if (corner === "bl") {
            newX = startX.value + startWidth.value - newWidth;
          }
          // br: origin stays the same
        }

        // Apply minimum size constraint
        if (newWidth < MIN_CROP_SIZE || newHeight < MIN_CROP_SIZE) {
          return;
        }

        // Apply bounds constraints
        newX = Math.max(offsetX, Math.min(newX, offsetX + imageWidth - newWidth));
        newY = Math.max(offsetY, Math.min(newY, offsetY + imageHeight - newHeight));
        newWidth = Math.min(newWidth, offsetX + imageWidth - newX);
        newHeight = Math.min(newHeight, offsetY + imageHeight - newY);

        // Final check after bounds adjustment
        if (newWidth >= MIN_CROP_SIZE && newHeight >= MIN_CROP_SIZE) {
          x.value = newX;
          y.value = newY;
          width.value = newWidth;
          height.value = newHeight;
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

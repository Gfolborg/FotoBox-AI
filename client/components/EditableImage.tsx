import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  type ImageStyle,
} from "react-native";

import { Colors } from "@/constants/theme";
import { CropOverlay } from "./CropOverlay";
import type { ImageEditingState } from "@/hooks/useImageEditing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.85;

interface EditableImageProps {
  originalUri: string;
  adjustments: Pick<
    ImageEditingState,
    | "brightness"
    | "contrast"
    | "saturation"
    | "rotation"
    | "flipHorizontal"
    | "flipVertical"
  >;
  showOriginal?: boolean; // For before/after comparison
  showCropOverlay?: boolean; // Show crop overlay
  crop: ImageEditingState["crop"];
  onCropChange: (crop: ImageEditingState["crop"]) => void;
}

export function EditableImage({
  originalUri,
  adjustments,
  showOriginal = false,
  showCropOverlay = false,
  crop,
  onCropChange,
}: EditableImageProps) {
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

  // Build transform style for real-time preview
  // Note: React Native only supports transforms (not CSS filters) on mobile
  // Color adjustments (brightness, contrast, saturation) will be applied server-side
  const imageStyle: ImageStyle = showOriginal
    ? {}
    : {
        transform: [
          { rotate: `${adjustments.rotation}deg` },
          { scaleX: adjustments.flipHorizontal ? -1 : 1 },
          { scaleY: adjustments.flipVertical ? -1 : 1 },
        ],
      };

  return (
    <View style={styles.container}>
      <View
        style={styles.imageContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setImageLayout({ width, height });
        }}
      >
        <Image
          source={{ uri: originalUri }}
          style={[styles.image, imageStyle]}
          resizeMode="contain"
        />

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
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

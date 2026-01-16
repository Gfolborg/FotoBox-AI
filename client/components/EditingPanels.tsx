import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "./ThemedText";
import { AdjustmentSlider } from "./AdjustmentSlider";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { ImageEditingState } from "@/hooks/useImageEditing";

// Adjust Panel - for bottom sheet
interface AdjustPanelProps {
  state: ImageEditingState;
  onUpdateAdjustment: <K extends keyof ImageEditingState>(
    key: K,
    value: ImageEditingState[K],
  ) => void;
}

export function AdjustPanel({ state, onUpdateAdjustment }: AdjustPanelProps) {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText style={styles.sectionTitle}>Basic</ThemedText>

      <AdjustmentSlider
        icon="sun"
        label="Brightness"
        value={state.brightness}
        min={-1}
        max={1}
        step={0.05}
        defaultValue={0}
        onValueChange={(val) => onUpdateAdjustment("brightness", val)}
        formatValue={(val) => (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2))}
        serverOnly
      />

      <AdjustmentSlider
        icon="circle"
        label="Contrast"
        value={state.contrast}
        min={0.5}
        max={2}
        step={0.05}
        defaultValue={1}
        onValueChange={(val) => onUpdateAdjustment("contrast", val)}
        formatValue={(val) => `${val.toFixed(2)}x`}
        serverOnly
      />

      <AdjustmentSlider
        icon="droplet"
        label="Saturation"
        value={state.saturation}
        min={0}
        max={2}
        step={0.05}
        defaultValue={1}
        onValueChange={(val) => onUpdateAdjustment("saturation", val)}
        formatValue={(val) => `${val.toFixed(2)}x`}
        serverOnly
      />

      <ThemedText style={styles.sectionTitle}>Advanced</ThemedText>

      <AdjustmentSlider
        icon="aperture"
        label="Exposure"
        value={state.exposure}
        min={-2}
        max={2}
        step={0.1}
        defaultValue={0}
        onValueChange={(val) => onUpdateAdjustment("exposure", val)}
        formatValue={(val) => (val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1))}
        serverOnly
      />

      <AdjustmentSlider
        icon="trending-up"
        label="Highlights"
        value={state.highlights}
        min={-1}
        max={1}
        step={0.05}
        defaultValue={0}
        onValueChange={(val) => onUpdateAdjustment("highlights", val)}
        formatValue={(val) => (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2))}
        serverOnly
      />

      <AdjustmentSlider
        icon="trending-down"
        label="Shadows"
        value={state.shadows}
        min={-1}
        max={1}
        step={0.05}
        defaultValue={0}
        onValueChange={(val) => onUpdateAdjustment("shadows", val)}
        formatValue={(val) => (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2))}
        serverOnly
      />

      <AdjustmentSlider
        icon="thermometer"
        label="Warmth"
        value={state.warmth}
        min={-1}
        max={1}
        step={0.05}
        defaultValue={0}
        onValueChange={(val) => onUpdateAdjustment("warmth", val)}
        formatValue={(val) =>
          val > 0
            ? `Warm +${val.toFixed(2)}`
            : val < 0
              ? `Cool ${val.toFixed(2)}`
              : "Neutral"
        }
        serverOnly
      />
    </ScrollView>
  );
}

// Transform Panel - for bottom sheet
interface TransformPanelProps {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onToggleFlipHorizontal: () => void;
  onToggleFlipVertical: () => void;
}

export function TransformPanel({
  rotation,
  flipHorizontal,
  flipVertical,
  onRotateCW,
  onRotateCCW,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
}: TransformPanelProps) {
  return (
    <View style={styles.transformContainer}>
      <ThemedText style={styles.sectionTitle}>Rotate</ThemedText>

      <View style={styles.buttonRow}>
        <ActionButton icon="rotate-ccw" label="90 Left" onPress={onRotateCCW} />
        <ActionButton icon="rotate-cw" label="90 Right" onPress={onRotateCW} />
      </View>

      {rotation !== 0 && (
        <View style={styles.infoChip}>
          <Feather name="info" size={14} color={Colors.light.primary} />
          <ThemedText style={styles.infoText}>
            Current rotation: {rotation}
          </ThemedText>
        </View>
      )}

      <ThemedText style={styles.sectionTitle}>Flip</ThemedText>

      <View style={styles.buttonRow}>
        <ActionButton
          icon="more-horizontal"
          label="Horizontal"
          active={flipHorizontal}
          onPress={onToggleFlipHorizontal}
        />
        <ActionButton
          icon="more-vertical"
          label="Vertical"
          active={flipVertical}
          onPress={onToggleFlipVertical}
        />
      </View>
    </View>
  );
}

// Crop Panel - for bottom sheet
interface CropPanelProps {
  crop: ImageEditingState["crop"];
  aspectRatio: ImageEditingState["aspectRatio"];
  onUpdateCrop: (crop: ImageEditingState["crop"]) => void;
  onUpdateAspectRatio: (ratio: ImageEditingState["aspectRatio"]) => void;
  onClose?: () => void;
}

export function CropPanel({
  crop,
  aspectRatio,
  onUpdateCrop,
  onUpdateAspectRatio,
  onClose,
}: CropPanelProps) {
  const handleAspectRatio = (ratio: "free" | "square" | "4:3" | "16:9") => {
    onUpdateAspectRatio(ratio);

    // For "free", initialize crop area and close sheet so user can adjust
    if (ratio === "free") {
      if (!crop) {
        onUpdateCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
      }
      onClose?.();
      return;
    }

    const baseCrop = crop || { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    const centerX = baseCrop.x + baseCrop.width / 2;
    const centerY = baseCrop.y + baseCrop.height / 2;

    let newWidth = baseCrop.width;
    let newHeight = baseCrop.height;

    if (ratio === "square") {
      const size = Math.min(baseCrop.width, baseCrop.height);
      newWidth = size;
      newHeight = size;
    } else if (ratio === "4:3") {
      if (baseCrop.width / baseCrop.height > 4 / 3) {
        newWidth = baseCrop.height * (4 / 3);
        newHeight = baseCrop.height;
      } else {
        newWidth = baseCrop.width;
        newHeight = baseCrop.width * (3 / 4);
      }
    } else if (ratio === "16:9") {
      if (baseCrop.width / baseCrop.height > 16 / 9) {
        newWidth = baseCrop.height * (16 / 9);
        newHeight = baseCrop.height;
      } else {
        newWidth = baseCrop.width;
        newHeight = baseCrop.width * (9 / 16);
      }
    }

    const newX = Math.max(0, Math.min(centerX - newWidth / 2, 1 - newWidth));
    const newY = Math.max(0, Math.min(centerY - newHeight / 2, 1 - newHeight));

    onUpdateCrop({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleReset = () => {
    onUpdateCrop(null);
    onUpdateAspectRatio(null);
  };

  return (
    <View style={styles.cropContainer}>
      <ThemedText style={styles.sectionTitle}>Aspect Ratio</ThemedText>

      <View style={styles.aspectGrid}>
        <AspectButton
          label="Free"
          icon="maximize"
          active={aspectRatio === "free"}
          onPress={() => handleAspectRatio("free")}
        />
        <AspectButton
          label="Square"
          icon="square"
          active={aspectRatio === "square"}
          onPress={() => handleAspectRatio("square")}
        />
        <AspectButton
          label="4:3"
          icon="image"
          active={aspectRatio === "4:3"}
          onPress={() => handleAspectRatio("4:3")}
        />
        <AspectButton
          label="16:9"
          icon="monitor"
          active={aspectRatio === "16:9"}
          onPress={() => handleAspectRatio("16:9")}
        />
      </View>

      {(crop || aspectRatio) && (
        <Pressable onPress={handleReset} style={styles.resetButton}>
          <Feather name="x-circle" size={18} color={Colors.light.error} />
          <ThemedText style={styles.resetText}>Reset Crop</ThemedText>
        </Pressable>
      )}

      <View style={styles.helpText}>
        <Feather name="info" size={14} color={Colors.light.textSecondary} />
        <ThemedText style={styles.helpTextLabel}>
          Select an aspect ratio, then adjust the crop area on the image
        </ThemedText>
      </View>
    </View>
  );
}

// Helper Components
function ActionButton({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionButton, active && styles.actionButtonActive]}
    >
      <Feather
        name={icon}
        size={22}
        color={active ? Colors.light.white : Colors.light.primary}
      />
      <ThemedText
        style={[
          styles.actionButtonText,
          active && styles.actionButtonTextActive,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function AspectButton({
  label,
  icon,
  active = false,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.aspectButton, active && styles.aspectButtonActive]}
    >
      <Feather
        name={icon}
        size={20}
        color={active ? Colors.light.white : Colors.light.text}
      />
      <ThemedText
        style={[
          styles.aspectButtonText,
          active && styles.aspectButtonTextActive,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transformContainer: {
    gap: Spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: "transparent",
  },
  actionButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  actionButtonTextActive: {
    color: Colors.light.white,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  cropContainer: {
    gap: Spacing.sm,
  },
  aspectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  aspectButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundDefault,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  aspectButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  aspectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  aspectButtonTextActive: {
    color: Colors.light.white,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  resetText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.error,
  },
  helpText: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  helpTextLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
});

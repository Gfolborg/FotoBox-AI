import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "./ThemedText";
import { AdjustmentSlider } from "./AdjustmentSlider";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { ImageEditingState } from "@/hooks/useImageEditing";

// Export individual panels for use in bottom sheet
export { AdjustPanel } from "./EditingPanels";
export { TransformPanel } from "./EditingPanels";
export { CropPanel } from "./EditingPanels";

interface EditingToolbarProps {
  state: ImageEditingState;
  onUpdateAdjustment: <K extends keyof ImageEditingState>(
    key: K,
    value: ImageEditingState[K]
  ) => void;
  onSetActiveTab: (tab: ImageEditingState["activeTab"]) => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onToggleFlipHorizontal: () => void;
  onToggleFlipVertical: () => void;
}

// Legacy EditingToolbar - keeping for backwards compatibility
export function EditingToolbar({
  state,
  onUpdateAdjustment,
  onSetActiveTab,
  onRotateCW,
  onRotateCCW,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
}: EditingToolbarProps) {
  const tabs: { id: ImageEditingState["activeTab"]; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: "adjust", label: "Adjust", icon: "sliders" },
    { id: "transform", label: "Transform", icon: "rotate-cw" },
    { id: "crop", label: "Crop", icon: "crop" },
  ];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={state.activeTab === tab.id}
            onPress={() => onSetActiveTab(tab.id)}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {state.activeTab === "adjust" && (
          <AdjustTab state={state} onUpdateAdjustment={onUpdateAdjustment} />
        )}
        {state.activeTab === "transform" && (
          <TransformTab
            rotation={state.rotation}
            flipHorizontal={state.flipHorizontal}
            flipVertical={state.flipVertical}
            onRotateCW={onRotateCW}
            onRotateCCW={onRotateCCW}
            onToggleFlipHorizontal={onToggleFlipHorizontal}
            onToggleFlipVertical={onToggleFlipVertical}
          />
        )}
        {state.activeTab === "crop" && (
          <CropTab crop={state.crop} onUpdateCrop={(crop) => onUpdateAdjustment("crop", crop)} />
        )}
      </ScrollView>
    </View>
  );
}

// Tab Button Component
function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Feather
        name={icon}
        size={20}
        color={active ? Colors.light.primary : Colors.light.textSecondary}
      />
      <ThemedText
        style={[styles.tabLabel, active && styles.tabLabelActive]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

// Adjust Tab Content
function AdjustTab({
  state,
  onUpdateAdjustment,
}: {
  state: ImageEditingState;
  onUpdateAdjustment: <K extends keyof ImageEditingState>(
    key: K,
    value: ImageEditingState[K]
  ) => void;
}) {
  return (
    <View style={styles.adjustTab}>
      <ThemedText style={styles.sectionTitle}>Basic Adjustments</ThemedText>

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

      <ThemedText style={styles.sectionTitle}>Advanced Adjustments</ThemedText>

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
    </View>
  );
}

// Transform Tab Content
function TransformTab({
  rotation,
  flipHorizontal,
  flipVertical,
  onRotateCW,
  onRotateCCW,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
}: {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onToggleFlipHorizontal: () => void;
  onToggleFlipVertical: () => void;
}) {
  return (
    <View style={styles.transformTab}>
      <ThemedText style={styles.sectionTitle}>Rotation</ThemedText>

      <View style={styles.buttonRow}>
        <TransformButton
          icon="rotate-ccw"
          label="90° Left"
          onPress={onRotateCCW}
        />
        <TransformButton
          icon="rotate-cw"
          label="90° Right"
          onPress={onRotateCW}
        />
      </View>

      {rotation !== 0 && (
        <View style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Rotation: {rotation}°
          </ThemedText>
        </View>
      )}

      <ThemedText style={styles.sectionTitle}>Flip</ThemedText>

      <View style={styles.buttonRow}>
        <TransformButton
          icon="more-horizontal"
          label="Horizontal"
          active={flipHorizontal}
          onPress={onToggleFlipHorizontal}
        />
        <TransformButton
          icon="more-vertical"
          label="Vertical"
          active={flipVertical}
          onPress={onToggleFlipVertical}
        />
      </View>
    </View>
  );
}

// Transform Button Component
function TransformButton({
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
      style={[styles.transformButton, active && styles.transformButtonActive]}
    >
      <Feather
        name={icon}
        size={24}
        color={active ? Colors.light.white : Colors.light.primary}
      />
      <ThemedText
        style={[
          styles.transformButtonText,
          active && styles.transformButtonTextActive,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

// Crop Tab Content
function CropTab({
  crop,
  onUpdateCrop,
}: {
  crop: ImageEditingState["crop"];
  onUpdateCrop: (crop: ImageEditingState["crop"]) => void;
}) {
  const handleAspectRatio = (ratio: "free" | "square" | "4:3" | "16:9") => {
    const baseCrop = crop || { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };

    if (ratio === "free") {
      // Keep current crop as-is
      return;
    }

    const centerX = baseCrop.x + baseCrop.width / 2;
    const centerY = baseCrop.y + baseCrop.height / 2;

    let newWidth = baseCrop.width;
    let newHeight = baseCrop.height;

    if (ratio === "square") {
      // Make it square using the smaller dimension
      const size = Math.min(baseCrop.width, baseCrop.height);
      newWidth = size;
      newHeight = size;
    } else if (ratio === "4:3") {
      // Adjust to 4:3 aspect ratio
      if (baseCrop.width / baseCrop.height > 4 / 3) {
        newWidth = baseCrop.height * (4 / 3);
        newHeight = baseCrop.height;
      } else {
        newWidth = baseCrop.width;
        newHeight = baseCrop.width * (3 / 4);
      }
    } else if (ratio === "16:9") {
      // Adjust to 16:9 aspect ratio
      if (baseCrop.width / baseCrop.height > 16 / 9) {
        newWidth = baseCrop.height * (16 / 9);
        newHeight = baseCrop.height;
      } else {
        newWidth = baseCrop.width;
        newHeight = baseCrop.width * (9 / 16);
      }
    }

    // Calculate new position to keep centered
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
  };

  return (
    <View style={styles.cropTab}>
      <ThemedText style={styles.sectionTitle}>Aspect Ratio</ThemedText>

      <View style={styles.buttonRow}>
        <AspectRatioButton
          label="Free"
          onPress={() => handleAspectRatio("free")}
        />
        <AspectRatioButton
          label="Square"
          onPress={() => handleAspectRatio("square")}
        />
      </View>

      <View style={styles.buttonRow}>
        <AspectRatioButton
          label="4:3"
          onPress={() => handleAspectRatio("4:3")}
        />
        <AspectRatioButton
          label="16:9"
          onPress={() => handleAspectRatio("16:9")}
        />
      </View>

      {crop && (
        <>
          <ThemedText style={styles.sectionTitle}>Actions</ThemedText>
          <Pressable onPress={handleReset} style={styles.resetCropButton}>
            <Feather name="x" size={20} color={Colors.light.error} />
            <ThemedText style={styles.resetCropText}>Reset Crop</ThemedText>
          </Pressable>
        </>
      )}
    </View>
  );
}

// Aspect Ratio Button Component
function AspectRatioButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.aspectRatioButton}>
      <ThemedText style={styles.aspectRatioButtonText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundDefault,
  },
  tabActive: {
    backgroundColor: Colors.light.primary + "15",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  tabLabelActive: {
    color: Colors.light.primary,
  },
  content: {
    maxHeight: 300,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  adjustTab: {
    gap: Spacing.xs,
  },
  transformTab: {
    gap: Spacing.md,
  },
  cropTab: {
    gap: Spacing.md,
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  transformButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: "transparent",
  },
  transformButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  transformButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  transformButtonTextActive: {
    color: Colors.light.white,
  },
  infoBox: {
    backgroundColor: Colors.light.primary + "10",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  aspectRatioButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  aspectRatioButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  resetCropButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.error,
    backgroundColor: "transparent",
  },
  resetCropText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.error,
  },
});

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "./ThemedText";
import { CircularDial } from "./CircularDial";
import { BackgroundColorPicker } from "./BackgroundColorPicker";
import { Button } from "./Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { ImageEditingState } from "@/hooks/useImageEditing";

type ToolType = "adjustment" | "transform" | "crop" | "amazon";
type ToolKey =
  | "brightness"
  | "contrast"
  | "saturation"
  | "exposure"
  | "highlights"
  | "shadows"
  | "warmth"
  | "rotate"
  | "flip"
  | "crop"
  | "amazonMain";

interface ToolConfig {
  key: ToolKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  type: ToolType;
  // For adjustment tools
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  format?: (val: number) => string;
}

const TOOLS: ToolConfig[] = [
  // Generate product image tool
  {
    key: "amazonMain",
    label: "Generate",
    icon: "award",
    type: "amazon",
  },
  // Adjustment tools
  {
    key: "brightness",
    label: "Brightness",
    icon: "sun",
    type: "adjustment",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) =>
      v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "contrast",
    label: "Contrast",
    icon: "circle",
    type: "adjustment",
    min: 0.5,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    format: (v) => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "saturation",
    label: "Saturation",
    icon: "droplet",
    type: "adjustment",
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    format: (v) => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "exposure",
    label: "Exposure",
    icon: "aperture",
    type: "adjustment",
    min: -2,
    max: 2,
    step: 0.1,
    defaultValue: 0,
    format: (v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
  },
  {
    key: "highlights",
    label: "Highlights",
    icon: "trending-up",
    type: "adjustment",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) =>
      v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`,
  },
  {
    key: "shadows",
    label: "Shadows",
    icon: "trending-down",
    type: "adjustment",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) =>
      v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`,
  },
  {
    key: "warmth",
    label: "Warmth",
    icon: "thermometer",
    type: "adjustment",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) =>
      v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`,
  },
  // Transform tools
  {
    key: "rotate",
    label: "Rotate",
    icon: "rotate-cw",
    type: "transform",
  },
  {
    key: "flip",
    label: "Flip",
    icon: "repeat",
    type: "transform",
  },
  // Crop tool
  {
    key: "crop",
    label: "Crop",
    icon: "crop",
    type: "crop",
  },
];

interface DialToolbarProps {
  state: ImageEditingState;
  onUpdateAdjustment: <K extends keyof ImageEditingState>(
    key: K,
    value: ImageEditingState[K],
  ) => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onToggleFlipHorizontal: () => void;
  onToggleFlipVertical: () => void;
  onGenerate: () => void;
  isProcessing: boolean;
}

export function DialToolbar({
  state,
  onUpdateAdjustment,
  onRotateCW,
  onRotateCCW,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
  onGenerate,
  isProcessing,
}: DialToolbarProps) {
  const [selectedTool, setSelectedTool] = useState<ToolKey | null>(
    "amazonMain",
  );

  const handleToolSelect = (tool: ToolConfig) => {
    if (selectedTool === tool.key) {
      setSelectedTool(null);
      onUpdateAdjustment("activeTab", "adjust"); // fallback to default
    } else {
      setSelectedTool(tool.key);
      if (tool.type === "crop") {
        onUpdateAdjustment("activeTab", "crop");
      } else if (tool.type === "amazon") {
        onUpdateAdjustment("activeTab", "amazonMain");
      } else if (tool.type === "adjustment") {
        onUpdateAdjustment("activeTab", "adjust");
      } else if (tool.type === "transform") {
        onUpdateAdjustment("activeTab", "transform");
      }
    }
  };

  const getToolModified = (tool: ToolConfig): boolean => {
    if (tool.type === "adjustment") {
      const value = state[tool.key as keyof ImageEditingState] as number;
      return (
        Math.abs(value - (tool.defaultValue || 0)) > (tool.step || 0.01) / 2
      );
    }
    if (tool.key === "rotate") {
      return state.rotation !== 0;
    }
    if (tool.key === "flip") {
      return state.flipHorizontal || state.flipVertical;
    }
    if (tool.key === "crop") {
      return state.crop !== null || state.aspectRatio !== null;
    }
    return false;
  };

  const currentTool = TOOLS.find((t) => t.key === selectedTool);

  return (
    <View style={styles.container}>
      {/* Tool Chips - Single Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsScroll}
        style={styles.toolsScrollContainer}
      >
        {TOOLS.map((tool) => {
          const isActive = selectedTool === tool.key;
          const isModified = getToolModified(tool);

          return (
            <ToolChip
              key={tool.key}
              label={tool.label}
              icon={tool.icon}
              active={isActive}
              modified={isModified}
              onPress={() => handleToolSelect(tool)}
            />
          );
        })}
      </ScrollView>

      {/* Tool Controls */}
      {currentTool && currentTool.type === "adjustment" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <CircularDial
            value={state[currentTool.key as keyof ImageEditingState] as number}
            min={currentTool.min!}
            max={currentTool.max!}
            step={currentTool.step!}
            defaultValue={currentTool.defaultValue!}
            label={currentTool.label}
            formatValue={currentTool.format}
            onValueChange={(val) =>
              onUpdateAdjustment(currentTool.key as any, val)
            }
          />
        </Animated.View>
      )}

      {currentTool?.type === "amazon" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.amazonContent}
        >
          <BackgroundColorPicker
            selectedColor={state.selectedBackgroundColor}
            onColorSelect={(color) =>
              onUpdateAdjustment("selectedBackgroundColor", color)
            }
          />
          <View style={styles.generateButtonContainer}>
            <Button
              onPress={onGenerate}
              disabled={isProcessing}
              variant="primary"
            >
              {isProcessing ? "Processing..." : "Generate Product Image"}
            </Button>
          </View>
        </Animated.View>
      )}

      {currentTool?.key === "rotate" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.transformContent}
        >
          <View style={styles.transformButtons}>
            <TransformButton
              icon="rotate-ccw"
              label="Left"
              onPress={onRotateCCW}
            />
            {state.rotation !== 0 && (
              <View style={styles.rotationBadge}>
                <ThemedText style={styles.rotationText}>
                  {state.rotation}°
                </ThemedText>
              </View>
            )}
            <TransformButton
              icon="rotate-cw"
              label="Right"
              onPress={onRotateCW}
            />
          </View>
        </Animated.View>
      )}

      {currentTool?.key === "flip" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.transformContent}
        >
          <View style={styles.transformButtons}>
            <TransformButton
              icon="more-horizontal"
              label="Horizontal"
              active={state.flipHorizontal}
              onPress={onToggleFlipHorizontal}
            />
            <TransformButton
              icon="more-vertical"
              label="Vertical"
              active={state.flipVertical}
              onPress={onToggleFlipVertical}
            />
          </View>
        </Animated.View>
      )}

      {currentTool?.key === "crop" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.cropContent}
        >
          <View style={styles.aspectButtons}>
            <AspectButton
              label="Free"
              active={state.aspectRatio === "free"}
              onPress={() => {
                onUpdateAdjustment("aspectRatio", "free");
                if (!state.crop) {
                  onUpdateAdjustment("crop", {
                    x: 0.1,
                    y: 0.1,
                    width: 0.8,
                    height: 0.8,
                  });
                }
              }}
            />
            <AspectButton
              label="1:1"
              active={state.aspectRatio === "square"}
              onPress={() =>
                handleAspectRatio("square", state, onUpdateAdjustment)
              }
            />
            <AspectButton
              label="4:3"
              active={state.aspectRatio === "4:3"}
              onPress={() =>
                handleAspectRatio("4:3", state, onUpdateAdjustment)
              }
            />
            <AspectButton
              label="16:9"
              active={state.aspectRatio === "16:9"}
              onPress={() =>
                handleAspectRatio("16:9", state, onUpdateAdjustment)
              }
            />
          </View>

          {(state.crop || state.aspectRatio) && (
            <Pressable
              style={styles.resetCrop}
              onPress={() => {
                onUpdateAdjustment("crop", null);
                onUpdateAdjustment("aspectRatio", null);
              }}
            >
              <Feather name="x" size={14} color={Colors.light.error} />
              <ThemedText style={styles.resetCropText}>Reset Crop</ThemedText>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// Helper function for aspect ratio
function handleAspectRatio(
  ratio: "square" | "4:3" | "16:9",
  state: ImageEditingState,
  onUpdateAdjustment: <K extends keyof ImageEditingState>(
    key: K,
    value: ImageEditingState[K],
  ) => void,
) {
  onUpdateAdjustment("aspectRatio", ratio);

  const baseCrop = state.crop || { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
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
    } else {
      newHeight = baseCrop.width * (3 / 4);
    }
  } else if (ratio === "16:9") {
    if (baseCrop.width / baseCrop.height > 16 / 9) {
      newWidth = baseCrop.height * (16 / 9);
    } else {
      newHeight = baseCrop.width * (9 / 16);
    }
  }

  const newX = Math.max(0, Math.min(centerX - newWidth / 2, 1 - newWidth));
  const newY = Math.max(0, Math.min(centerY - newHeight / 2, 1 - newHeight));

  onUpdateAdjustment("crop", {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  });
}

// Sub-components
function ToolChip({
  label,
  icon,
  active,
  modified,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  modified: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <View style={styles.chipContent}>
        <Feather
          name={icon}
          size={14}
          color={active ? Colors.light.white : Colors.light.text}
        />
        <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </ThemedText>
        {modified && !active && <View style={styles.modifiedDot} />}
      </View>
    </Pressable>
  );
}

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
      style={[styles.transformBtn, active && styles.transformBtnActive]}
    >
      <Feather
        name={icon}
        size={18}
        color={active ? Colors.light.white : Colors.light.primary}
      />
      <ThemedText
        style={[
          styles.transformBtnText,
          active && styles.transformBtnTextActive,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function AspectButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.aspectBtn, active && styles.aspectBtnActive]}
    >
      <ThemedText
        style={[styles.aspectBtnText, active && styles.aspectBtnTextActive]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  toolsScrollContainer: {
    flexGrow: 0,
  },
  toolsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
  },
  chipTextActive: {
    color: Colors.light.white,
  },
  modifiedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
    marginLeft: 2,
  },
  transformContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  transformButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  transformBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  transformBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  transformBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  transformBtnTextActive: {
    color: Colors.light.white,
  },
  rotationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.light.primary + "15",
    borderRadius: BorderRadius.full,
  },
  rotationText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  cropContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  aspectButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  aspectBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: "center",
    backgroundColor: Colors.light.backgroundDefault,
  },
  aspectBtnActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  aspectBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
  },
  aspectBtnTextActive: {
    color: Colors.light.white,
  },
  resetCrop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  resetCropText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.error,
  },
  amazonContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  generateButtonContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
});

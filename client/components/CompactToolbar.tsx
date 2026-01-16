import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { BackgroundColorPicker } from "./BackgroundColorPicker";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { ImageEditingState } from "@/hooks/useImageEditing";

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
  | "crop";

export interface ToolConfig {
  key: ToolKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  format?: (val: number) => string;
  category: "adjust" | "transform";
}

export const ADJUSTMENT_TOOLS: ToolConfig[] = [
  {
    key: "brightness",
    label: "Brightness",
    icon: "sun",
    category: "adjust",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`),
  },
  {
    key: "contrast",
    label: "Contrast",
    icon: "circle",
    category: "adjust",
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
    category: "adjust",
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
    category: "adjust",
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
    category: "adjust",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => (v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`),
  },
  {
    key: "shadows",
    label: "Shadows",
    icon: "trending-down",
    category: "adjust",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => (v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`),
  },
  {
    key: "warmth",
    label: "Warmth",
    icon: "thermometer",
    category: "adjust",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => (v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`),
  },
  {
    key: "rotate",
    label: "Rotate",
    icon: "rotate-cw",
    category: "transform",
  },
  {
    key: "flip",
    label: "Flip",
    icon: "repeat",
    category: "transform",
  },
  {
    key: "crop",
    label: "Crop",
    icon: "crop",
    category: "transform",
  },
];

interface CompactToolbarProps {
  state: ImageEditingState;
  selectedTool: ToolKey | null;
  onSelectTool: (tool: ToolKey | null) => void;
  onUpdateAdjustment: <K extends keyof ImageEditingState>(
    key: K,
    value: ImageEditingState[K]
  ) => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onToggleFlipHorizontal: () => void;
  onToggleFlipVertical: () => void;
  isHidden: boolean;
}

export function CompactToolbar({
  state,
  selectedTool,
  onSelectTool,
  onUpdateAdjustment,
  onRotateCW,
  onRotateCCW,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
  isHidden,
}: CompactToolbarProps) {
  const getToolModified = (tool: ToolConfig): boolean => {
    if (tool.min !== undefined) {
      const value = state[tool.key as keyof ImageEditingState] as number;
      return Math.abs(value - (tool.defaultValue || 0)) > (tool.step || 0.01) / 2;
    }
    if (tool.key === "rotate") {
      return state.rotation !== 0;
    }
    if (tool.key === "flip") {
      return state.flipHorizontal || state.flipVertical;
    }
    if (tool.key === "crop") {
      return false;
    }
    return false;
  };

  const handleToolPress = (tool: ToolConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTool === tool.key) {
      onSelectTool(null);
    } else {
      onSelectTool(tool.key);
    }
  };

  const adjustTools = ADJUSTMENT_TOOLS.filter((t) => t.category === "adjust");
  const transformTools = ADJUSTMENT_TOOLS.filter((t) => t.category === "transform");

  const containerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isHidden ? 0 : 1, { duration: 150 }),
    transform: [{ translateY: withTiming(isHidden ? 20 : 0, { duration: 150 }) }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.sectionHeader}>
        <Feather name="sliders" size={14} color={Colors.editing.textSecondary} />
        <ThemedText style={styles.sectionLabel}>Adjustments</ThemedText>
        <ThemedText style={styles.dragHint}>Tap then drag on image</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsScroll}
      >
        {adjustTools.map((tool) => {
          const isActive = selectedTool === tool.key;
          const isModified = getToolModified(tool);

          return (
            <ToolChip
              key={tool.key}
              label={tool.label}
              icon={tool.icon}
              active={isActive}
              modified={isModified}
              onPress={() => handleToolPress(tool)}
            />
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Feather name="move" size={14} color={Colors.editing.textSecondary} />
        <ThemedText style={styles.sectionLabel}>Transform</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsScroll}
      >
        {transformTools.map((tool) => {
          const isActive = selectedTool === tool.key;
          const isModified = getToolModified(tool);

          return (
            <ToolChip
              key={tool.key}
              label={tool.label}
              icon={tool.icon}
              active={isActive}
              modified={isModified}
              onPress={() => handleToolPress(tool)}
            />
          );
        })}
      </ScrollView>

      {selectedTool === "rotate" && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.transformContent}>
          <View style={styles.transformButtons}>
            <TransformButton icon="rotate-ccw" label="Left 90°" onPress={onRotateCCW} />
            {state.rotation !== 0 && (
              <View style={styles.rotationBadge}>
                <ThemedText style={styles.rotationText}>{state.rotation}°</ThemedText>
              </View>
            )}
            <TransformButton icon="rotate-cw" label="Right 90°" onPress={onRotateCW} />
          </View>
        </Animated.View>
      )}

      {selectedTool === "flip" && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.transformContent}>
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

      {selectedTool === "crop" && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.transformContent}>
          <View style={styles.cropHint}>
            <Feather name="info" size={14} color={Colors.editing.textSecondary} />
            <ThemedText style={styles.cropHintText}>
              Crop feature coming soon
            </ThemedText>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

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
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <View style={styles.chipContent}>
        <Feather
          name={icon}
          size={14}
          color={active ? Colors.editing.buttonText : Colors.editing.textSecondary}
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
    <Pressable onPress={onPress} style={[styles.transformBtn, active && styles.transformBtnActive]}>
      <Feather
        name={icon}
        size={18}
        color={active ? Colors.editing.buttonText : Colors.editing.primary}
      />
      <ThemedText style={[styles.transformBtnText, active && styles.transformBtnTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dragHint: {
    fontSize: 10,
    color: Colors.editing.primary,
    marginLeft: "auto",
    fontWeight: "500",
  },
  toolsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  chipActive: {
    backgroundColor: Colors.editing.primary,
    borderColor: Colors.editing.primary,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
  },
  chipTextActive: {
    color: Colors.editing.buttonText,
  },
  modifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.editing.primary,
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
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.editing.primary,
    backgroundColor: "transparent",
  },
  transformBtnActive: {
    backgroundColor: Colors.editing.primary,
  },
  transformBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.editing.primary,
  },
  transformBtnTextActive: {
    color: Colors.editing.buttonText,
  },
  rotationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.editing.primarySubtle,
    borderRadius: BorderRadius.full,
  },
  rotationText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.editing.primary,
  },
  backgroundContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cropHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  cropHintText: {
    fontSize: 13,
    color: Colors.editing.textSecondary,
  },
});

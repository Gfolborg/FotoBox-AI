import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { QuickFixState } from "@/hooks/useQuickFix";

type ToolKey = "rotate" | "flip" | "crop" | "brightness" | "contrast";

interface QuickFixToolbarProps {
  state: QuickFixState;
  selectedTool: ToolKey | null;
  onSelectTool: (tool: ToolKey | null) => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onToggleFlipHorizontal: () => void;
  onToggleFlipVertical: () => void;
  onAspectRatioChange: (ratio: QuickFixState["aspectRatio"]) => void;
  isHidden?: boolean;
}

const TOOLS = [
  { key: "rotate" as ToolKey, label: "Rotate", icon: "rotate-cw" as const },
  { key: "flip" as ToolKey, label: "Flip", icon: "repeat" as const },
  { key: "crop" as ToolKey, label: "Crop", icon: "crop" as const },
  { key: "brightness" as ToolKey, label: "Brightness", icon: "sun" as const },
  { key: "contrast" as ToolKey, label: "Contrast", icon: "circle" as const },
];

export function QuickFixToolbar({
  state,
  selectedTool,
  onSelectTool,
  onRotateCW,
  onRotateCCW,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
  onAspectRatioChange,
  isHidden = false,
}: QuickFixToolbarProps) {
  const getToolModified = (toolKey: ToolKey): boolean => {
    if (toolKey === "rotate") {
      return state.rotation !== 0;
    }
    if (toolKey === "flip") {
      return state.flipHorizontal || state.flipVertical;
    }
    if (toolKey === "crop") {
      return state.crop !== null;
    }
    if (toolKey === "brightness") {
      return state.brightness !== 0;
    }
    if (toolKey === "contrast") {
      return state.contrast !== 0;
    }
    return false;
  };

  const handleToolPress = (toolKey: ToolKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTool === toolKey) {
      onSelectTool(null);
    } else {
      onSelectTool(toolKey);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isHidden ? 0 : 1, { duration: 150 }),
    transform: [{ translateY: withTiming(isHidden ? 20 : 0, { duration: 150 }) }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Tool Chips */}
      <View style={styles.toolsRow}>
        {TOOLS.map((tool) => {
          const isActive = selectedTool === tool.key;
          const isModified = getToolModified(tool.key);

          return (
            <ToolChip
              key={tool.key}
              label={tool.label}
              icon={tool.icon}
              active={isActive}
              modified={isModified}
              onPress={() => handleToolPress(tool.key)}
            />
          );
        })}
      </View>

      {/* Rotate Controls */}
      {selectedTool === "rotate" && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.transformContent}
        >
          <View style={styles.transformButtons}>
            <TransformButton
              icon="rotate-ccw"
              label="Left 90°"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRotateCCW();
              }}
            />
            {state.rotation !== 0 && (
              <View style={styles.rotationBadge}>
                <ThemedText style={styles.rotationText}>{state.rotation}°</ThemedText>
              </View>
            )}
            <TransformButton
              icon="rotate-cw"
              label="Right 90°"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRotateCW();
              }}
            />
          </View>
        </Animated.View>
      )}

      {/* Flip Controls */}
      {selectedTool === "flip" && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.transformContent}
        >
          <View style={styles.transformButtons}>
            <TransformButton
              icon="more-horizontal"
              label="Horizontal"
              active={state.flipHorizontal}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onToggleFlipHorizontal();
              }}
            />
            <TransformButton
              icon="more-vertical"
              label="Vertical"
              active={state.flipVertical}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onToggleFlipVertical();
              }}
            />
          </View>
        </Animated.View>
      )}

      {/* Crop Controls */}
      {selectedTool === "crop" && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.cropContent}
        >
          <View style={styles.aspectRatioButtons}>
            <AspectRatioButton
              label="Free"
              active={state.aspectRatio === "free" || state.aspectRatio === null}
              onPress={() => onAspectRatioChange("free")}
            />
            <AspectRatioButton
              label="1:1"
              active={state.aspectRatio === "square"}
              onPress={() => onAspectRatioChange("square")}
            />
            <AspectRatioButton
              label="4:3"
              active={state.aspectRatio === "4:3"}
              onPress={() => onAspectRatioChange("4:3")}
            />
            <AspectRatioButton
              label="16:9"
              active={state.aspectRatio === "16:9"}
              onPress={() => onAspectRatioChange("16:9")}
            />
            <AspectRatioButton
              label="2:3"
              active={state.aspectRatio === "2:3"}
              onPress={() => onAspectRatioChange("2:3")}
            />
          </View>
        </Animated.View>
      )}

      {/* Brightness/Contrast Gesture Hint */}
      {(selectedTool === "brightness" || selectedTool === "contrast") && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.gestureHintContainer}
        >
          <View style={styles.gestureHint}>
            <Feather name="arrow-up" size={14} color={Colors.editing.textTertiary} />
            <ThemedText style={styles.gestureHintText}>
              Swipe up/down on image
            </ThemedText>
            <Feather name="arrow-down" size={14} color={Colors.editing.textTertiary} />
          </View>
          {((selectedTool === "brightness" && state.brightness !== 0) ||
            (selectedTool === "contrast" && state.contrast !== 0)) && (
            <View style={styles.valueIndicator}>
              <ThemedText style={styles.valueText}>
                {selectedTool === "brightness"
                  ? `${state.brightness > 0 ? "+" : ""}${state.brightness}`
                  : `${state.contrast > 0 ? "+" : ""}${state.contrast}`}
              </ThemedText>
            </View>
          )}
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
          size={16}
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
    <Pressable
      onPress={onPress}
      style={[styles.transformBtn, active && styles.transformBtnActive]}
    >
      <Feather
        name={icon}
        size={20}
        color={active ? Colors.editing.buttonText : Colors.editing.primary}
      />
      <ThemedText
        style={[styles.transformBtnText, active && styles.transformBtnTextActive]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function AspectRatioButton({
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
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.aspectBtn, active && styles.aspectBtnActive]}
    >
      <ThemedText style={[styles.aspectBtnText, active && styles.aspectBtnTextActive]}>
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
    paddingVertical: Spacing.sm,
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  chip: {
    paddingVertical: Spacing.sm,
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
    gap: Spacing.xs,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
  },
  chipTextActive: {
    color: Colors.editing.buttonText,
  },
  modifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.editing.primary,
    marginLeft: 2,
  },
  transformContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
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
    gap: Spacing.xs,
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
    fontSize: 14,
    fontWeight: "600",
    color: Colors.editing.primary,
  },
  transformBtnTextActive: {
    color: Colors.editing.buttonText,
  },
  rotationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.editing.primarySubtle,
    borderRadius: BorderRadius.full,
  },
  rotationText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.editing.primary,
  },
  cropContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  aspectRatioButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  aspectBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  aspectBtnActive: {
    backgroundColor: Colors.editing.primary,
    borderColor: Colors.editing.primary,
  },
  aspectBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
  },
  aspectBtnTextActive: {
    color: Colors.editing.buttonText,
  },
  gestureHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  gestureHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: BorderRadius.full,
  },
  gestureHintText: {
    fontSize: 12,
    color: Colors.editing.textTertiary,
  },
  valueIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.editing.primarySubtle,
    borderRadius: BorderRadius.full,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.editing.primary,
  },
});

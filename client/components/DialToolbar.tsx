import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { 
  FadeIn, 
  FadeOut, 
  FadeInRight,
  FadeOutLeft,
  Layout,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { CircularDial } from "./CircularDial";
import { BackgroundColorPicker } from "./BackgroundColorPicker";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { ImageEditingState } from "@/hooks/useImageEditing";

type TabType = "adjust" | "fineTune" | "transform";

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
  | "background";

interface ToolConfig {
  key: ToolKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  tab: TabType;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  format?: (val: number) => string;
}

const TABS: { key: TabType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "adjust", label: "Adjust", icon: "sliders" },
  { key: "fineTune", label: "Fine Tune", icon: "settings" },
  { key: "transform", label: "Transform", icon: "move" },
];

const TOOLS: ToolConfig[] = [
  {
    key: "brightness",
    label: "Brightness",
    icon: "sun",
    tab: "adjust",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "contrast",
    label: "Contrast",
    icon: "circle",
    tab: "adjust",
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
    tab: "adjust",
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
    tab: "adjust",
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
    tab: "fineTune",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`,
  },
  {
    key: "shadows",
    label: "Shadows",
    icon: "trending-down",
    tab: "fineTune",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`,
  },
  {
    key: "warmth",
    label: "Warmth",
    icon: "thermometer",
    tab: "fineTune",
    min: -1,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    format: (v) => v > 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`,
  },
  {
    key: "rotate",
    label: "Rotate",
    icon: "rotate-cw",
    tab: "transform",
  },
  {
    key: "flip",
    label: "Flip",
    icon: "repeat",
    tab: "transform",
  },
  {
    key: "crop",
    label: "Crop",
    icon: "crop",
    tab: "transform",
  },
  {
    key: "background",
    label: "Background",
    icon: "edit-3",
    tab: "transform",
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
}

export function DialToolbar({
  state,
  onUpdateAdjustment,
  onRotateCW,
  onRotateCCW,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
}: DialToolbarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("adjust");
  const [selectedTool, setSelectedTool] = useState<ToolKey | null>("brightness");

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    const firstToolInTab = TOOLS.find((t) => t.tab === tab);
    setSelectedTool(firstToolInTab?.key || null);
    
    if (tab === "transform" && firstToolInTab?.key === "crop") {
      onUpdateAdjustment("activeTab", "crop");
    } else {
      onUpdateAdjustment("activeTab", tab === "adjust" || tab === "fineTune" ? "adjust" : "transform");
    }
  };

  const handleToolSelect = (tool: ToolConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTool === tool.key) {
      setSelectedTool(null);
    } else {
      setSelectedTool(tool.key);
      if (tool.key === "crop") {
        onUpdateAdjustment("activeTab", "crop");
      } else {
        onUpdateAdjustment("activeTab", tool.tab === "transform" ? "transform" : "adjust");
      }
    }
  };

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
      return state.crop !== null || state.aspectRatio !== null;
    }
    if (tool.key === "background") {
      return state.selectedBackgroundColor !== "#FFFFFF";
    }
    return false;
  };

  const getTabHasModifications = (tab: TabType): boolean => {
    return TOOLS.filter((t) => t.tab === tab).some(getToolModified);
  };

  const tabTools = TOOLS.filter((t) => t.tab === activeTab);
  const currentTool = TOOLS.find((t) => t.key === selectedTool);

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const hasModifications = getTabHasModifications(tab.key);
          
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Feather
                name={tab.icon}
                size={16}
                color={isActive ? Colors.editing.primary : Colors.editing.textSecondary}
              />
              <ThemedText style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </ThemedText>
              {hasModifications && !isActive && <View style={styles.tabModifiedDot} />}
            </Pressable>
          );
        })}
      </View>

      <Animated.View 
        key={activeTab}
        entering={FadeInRight.duration(200)}
        exiting={FadeOutLeft.duration(150)}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsScroll}
          style={styles.toolsScrollContainer}
        >
          {tabTools.map((tool) => {
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
      </Animated.View>

      {currentTool && currentTool.min !== undefined && (
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
              onUpdateAdjustment(currentTool.key as keyof ImageEditingState, val as never)
            }
          />
        </Animated.View>
      )}

      {selectedTool === "rotate" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.transformContent}
        >
          <View style={styles.transformButtons}>
            <TransformButton
              icon="rotate-ccw"
              label="Left 90°"
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
              label="Right 90°"
              onPress={onRotateCW}
            />
          </View>
        </Animated.View>
      )}

      {selectedTool === "flip" && (
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

      {selectedTool === "crop" && (
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
              onPress={() => handleAspectRatio("square", state, onUpdateAdjustment)}
            />
            <AspectButton
              label="4:3"
              active={state.aspectRatio === "4:3"}
              onPress={() => handleAspectRatio("4:3", state, onUpdateAdjustment)}
            />
            <AspectButton
              label="16:9"
              active={state.aspectRatio === "16:9"}
              onPress={() => handleAspectRatio("16:9", state, onUpdateAdjustment)}
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
              <Feather name="x" size={14} color={Colors.editing.error} />
              <ThemedText style={styles.resetCropText}>Reset Crop</ThemedText>
            </Pressable>
          )}
        </Animated.View>
      )}

      {selectedTool === "background" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backgroundContent}
        >
          <BackgroundColorPicker
            selectedColor={state.selectedBackgroundColor}
            onColorSelect={(color) =>
              onUpdateAdjustment("selectedBackgroundColor", color)
            }
          />
        </Animated.View>
      )}
    </View>
  );
}

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
        size={18}
        color={active ? Colors.editing.buttonText : Colors.editing.primary}
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  tabActive: {
    backgroundColor: Colors.editing.primarySubtle,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
  },
  tabTextActive: {
    color: Colors.editing.primary,
  },
  tabModifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.editing.primary,
  },
  toolsScrollContainer: {
    flexGrow: 0,
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
    borderColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  aspectBtnActive: {
    borderColor: Colors.editing.primary,
    backgroundColor: Colors.editing.primary,
  },
  aspectBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
  },
  aspectBtnTextActive: {
    color: Colors.editing.buttonText,
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
    color: Colors.editing.error,
  },
  backgroundContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});

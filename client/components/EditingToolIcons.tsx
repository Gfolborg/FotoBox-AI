import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { ImageEditingState } from "@/hooks/useImageEditing";

const SPRING_CONFIG = {
  damping: 12,
  mass: 0.3,
  stiffness: 200,
};

interface Tool {
  id: ImageEditingState["activeTab"];
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const TOOLS: Tool[] = [
  { id: "adjust", label: "Adjust", icon: "sliders" },
  { id: "transform", label: "Transform", icon: "refresh-cw" },
  { id: "crop", label: "Crop", icon: "crop" },
];

interface EditingToolIconsProps {
  activeTab: ImageEditingState["activeTab"] | null;
  onSelectTool: (tool: ImageEditingState["activeTab"]) => void;
}

export function EditingToolIcons({
  activeTab,
  onSelectTool,
}: EditingToolIconsProps) {
  return (
    <View style={styles.container}>
      {TOOLS.map((tool) => (
        <ToolIcon
          key={tool.id}
          tool={tool}
          isActive={activeTab === tool.id}
          onPress={() => onSelectTool(tool.id)}
        />
      ))}
    </View>
  );
}

function ToolIcon({
  tool,
  isActive,
  onPress,
}: {
  tool: Tool;
  isActive: boolean;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isActive ? 1.05 : 1, SPRING_CONFIG) }],
    };
  });

  const iconContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isActive ? Colors.light.primary : Colors.light.backgroundDefault,
        { duration: 200 },
      ),
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.toolButton}>
      <Animated.View style={animatedStyle}>
        <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
          <Feather
            name={tool.icon}
            size={26}
            color={isActive ? Colors.light.white : Colors.light.textSecondary}
          />
        </Animated.View>
      </Animated.View>
      <ThemedText
        style={[styles.toolLabel, isActive && styles.toolLabelActive]}
      >
        {tool.label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.light.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  toolButton: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  toolLabelActive: {
    color: Colors.light.primary,
  },
});

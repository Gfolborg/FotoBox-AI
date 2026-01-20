import { Colors } from "@/constants/theme";
import { ScreenTheme, ThemeConfig } from "./types";

export const screenThemes: Record<ScreenTheme, ThemeConfig> = {
  home: {
    topColor: "#FFF7ED",
    bottomColor: Colors.light.backgroundRoot,
    circleColors: [Colors.light.primary, Colors.light.secondary],
    circleOpacity: 0.1,
    orbColors: [Colors.light.primary, Colors.light.secondary],
    enableOrbs: true,
    enableMesh: true,
  },

  camera: {
    topColor: "#F0F9FF", // Light blue tint for focus
    bottomColor: "#FAFAFA",
    circleColors: [Colors.light.secondary, Colors.light.secondary],
    circleOpacity: 0.08,
    enableOrbs: false,
  },

  processing: {
    topColor: "#FFF7ED",
    bottomColor: Colors.light.backgroundRoot,
    circleColors: [Colors.light.primary, Colors.light.secondary],
    circleOpacity: 0.05,
    enablePulse: false, // Replaced by breathing gradient
    enableBreathing: true,
    breathingColors: [Colors.light.primary, Colors.light.secondary],
  },

  result: {
    topColor: "#F0FDF4", // Light green tint for success
    bottomColor: "#FAFAF9",
    circleColors: [Colors.light.success, Colors.light.primary],
    circleOpacity: 0.1,
    enableOrbs: true,
    orbColors: [Colors.light.success, Colors.light.primary],
  },

  selection: {
    topColor: "#FFF7ED",
    bottomColor: Colors.light.backgroundRoot,
    circleColors: [Colors.light.primary, Colors.light.primary],
    circleOpacity: 0.1,
  },

  onboarding: {
    topColor: "#FFF7ED",
    bottomColor: Colors.light.backgroundRoot,
    circleColors: [Colors.light.primary, Colors.light.secondary],
    circleOpacity: 0.12,
    enableOrbs: true,
    orbColors: [Colors.light.primary, Colors.light.secondary],
    enableMesh: true,
  },

  editing: {
    topColor: "#F8FAFC", // Cool neutral gray
    bottomColor: "#F1F5F9",
    circleColors: ["#94A3B8", "#CBD5E1"], // Slate grays
    circleOpacity: 0.04,
    enableOrbs: false,
    enableMesh: false, // Disabled mesh for cleaner editing experience
    enableNoise: false, // Disabled noise for better performance
  },
};

export function getVariantConfig(
  variant: "default" | "subtle" | "warm",
): ThemeConfig {
  switch (variant) {
    case "warm":
      return {
        topColor: "#FFF7ED",
        bottomColor: Colors.light.backgroundRoot,
        circleColors: [Colors.light.primary, Colors.light.primary],
        circleOpacity: 0.1,
      };
    case "subtle":
      return {
        topColor: "#FEFDFB",
        bottomColor: Colors.light.backgroundRoot,
        circleColors: [Colors.light.primary, Colors.light.primary],
        circleOpacity: 0.05,
      };
    default:
      return {
        topColor: "#FFF7ED",
        bottomColor: Colors.light.backgroundRoot,
        circleColors: [Colors.light.primary, Colors.light.primary],
        circleOpacity: 0.08,
      };
  }
}

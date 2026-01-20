import React from "react";
import { StyleSheet, View } from "react-native";
import { NoiseTextureConfig } from "./types";

const DEFAULT_CONFIG: Required<NoiseTextureConfig> = {
  opacity: 0.03,
  density: "light",
};

interface NoiseTextureProps {
  config?: NoiseTextureConfig;
}

/**
 * Subtle noise texture overlay using a simple pattern.
 * Creates a film-like grain effect that adds depth without distraction.
 * Uses a lightweight approach with just a few layers for performance.
 */
export function NoiseTexture({ config }: NoiseTextureProps) {
  const mergedConfig: Required<NoiseTextureConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Use a simple dithered pattern with just a few elements for a subtle texture
  return (
    <View
      style={[styles.container, { opacity: mergedConfig.opacity }]}
      pointerEvents="none"
    >
      {/* Simple gradient-like texture layers */}
      <View style={[styles.layer, styles.layer1]} />
      <View style={[styles.layer, styles.layer2]} />
      <View style={[styles.layer, styles.layer3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  layer: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "#9CA3AF",
  },
  layer1: {
    top: "10%",
    left: "5%",
    width: "30%",
    height: "20%",
    opacity: 0.3,
  },
  layer2: {
    top: "50%",
    right: "10%",
    width: "25%",
    height: "15%",
    opacity: 0.2,
  },
  layer3: {
    bottom: "20%",
    left: "40%",
    width: "20%",
    height: "25%",
    opacity: 0.25,
  },
});

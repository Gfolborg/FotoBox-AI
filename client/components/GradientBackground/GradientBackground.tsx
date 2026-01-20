import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Colors } from "@/constants/theme";
import { FloatingOrbs } from "./FloatingOrbs";
import { MeshGradient } from "./MeshGradient";
import { PulsingGlow } from "./PulsingGlow";
import { NoiseTexture } from "./NoiseTexture";
import { BreathingGradient } from "./BreathingGradient";
import { screenThemes, getVariantConfig } from "./themes";
import type {
  GradientBackgroundProps,
  FloatingOrbsConfig,
  ThemeConfig,
  NoiseTextureConfig,
  BreathingGradientConfig,
} from "./types";

const DEFAULT_ORB_CONFIG: FloatingOrbsConfig = {
  count: 3,
  opacity: 0.12,
  speed: "slow",
};

export function GradientBackground({
  children,
  style,
  variant = "default",
  theme,
  floatingOrbs,
  meshGradient,
  pulsingGlow,
  noiseTexture,
  breathingGradient,
}: GradientBackgroundProps) {
  // Resolve theme configuration
  const themeConfig: ThemeConfig = useMemo(() => {
    if (theme) {
      return screenThemes[theme];
    }
    return getVariantConfig(variant);
  }, [theme, variant]);

  // Resolve orb configuration
  const orbConfig = useMemo((): FloatingOrbsConfig | null => {
    // Explicitly disabled
    if (floatingOrbs === false) return null;

    // Explicitly enabled with custom config
    if (typeof floatingOrbs === "object") {
      return {
        ...DEFAULT_ORB_CONFIG,
        colors: themeConfig.orbColors ?? [Colors.light.primary],
        ...floatingOrbs,
      };
    }

    // Explicitly enabled with defaults
    if (floatingOrbs === true) {
      return {
        ...DEFAULT_ORB_CONFIG,
        colors: themeConfig.orbColors ?? [
          Colors.light.primary,
          Colors.light.secondary,
        ],
      };
    }

    // Check if theme enables orbs by default
    if (themeConfig.enableOrbs) {
      return {
        ...DEFAULT_ORB_CONFIG,
        colors: themeConfig.orbColors ?? [Colors.light.primary],
      };
    }

    return null;
  }, [floatingOrbs, themeConfig]);

  // Resolve mesh gradient config
  const meshConfig = useMemo(() => {
    if (meshGradient === false) return null;

    if (typeof meshGradient === "object") {
      return {
        colors: [
          themeConfig.circleColors[0],
          themeConfig.circleColors[1],
          themeConfig.topColor,
        ],
        ...meshGradient,
      };
    }

    if (meshGradient === true || themeConfig.enableMesh) {
      return {
        colors: [
          themeConfig.circleColors[0],
          themeConfig.circleColors[1],
          themeConfig.topColor,
        ],
        intensity: 0.4,
        animated: themeConfig.meshAnimated !== false, // Default to true unless explicitly disabled
      };
    }

    return null;
  }, [meshGradient, themeConfig]);

  // Resolve noise texture config
  const noiseConfig = useMemo((): NoiseTextureConfig | null => {
    if (noiseTexture === false) return null;

    if (typeof noiseTexture === "object") {
      return {
        opacity: themeConfig.noiseOpacity ?? 0.03,
        ...noiseTexture,
      };
    }

    if (noiseTexture === true || themeConfig.enableNoise) {
      return {
        opacity: themeConfig.noiseOpacity ?? 0.03,
        density: "light",
      };
    }

    return null;
  }, [noiseTexture, themeConfig]);

  // Resolve breathing gradient config
  const breathingConfig = useMemo((): BreathingGradientConfig | null => {
    if (breathingGradient === false) return null;

    if (typeof breathingGradient === "object") {
      return {
        colors: themeConfig.breathingColors ?? [
          Colors.light.primary,
          Colors.light.secondary,
        ],
        ...breathingGradient,
      };
    }

    if (breathingGradient === true || themeConfig.enableBreathing) {
      return {
        colors: themeConfig.breathingColors ?? [
          Colors.light.primary,
          Colors.light.secondary,
        ],
        speed: 3000,
        intensity: 0.2,
      };
    }

    return null;
  }, [breathingGradient, themeConfig]);

  // Resolve pulsing glow config
  const pulseConfig = useMemo(() => {
    if (pulsingGlow === false) return null;

    if (typeof pulsingGlow === "object") {
      return {
        color: themeConfig.pulseColor ?? Colors.light.primary,
        ...pulsingGlow,
      };
    }

    if (pulsingGlow === true || themeConfig.enablePulse) {
      return {
        color: themeConfig.pulseColor ?? Colors.light.primary,
      };
    }

    return null;
  }, [pulsingGlow, themeConfig]);

  return (
    <View style={[styles.container, style]}>
      {/* Background layers */}
      <View style={styles.backgroundLayer}>
        {/* Mesh gradient (if enabled) - replaces solid layers */}
        {meshConfig ? (
          <MeshGradient config={meshConfig} />
        ) : (
          <>
            {/* Top warm tint */}
            <View
              style={[
                styles.bgGradientTop,
                { backgroundColor: themeConfig.topColor },
              ]}
            />
            {/* Bottom base color */}
            <View
              style={[
                styles.bgGradientBottom,
                { backgroundColor: themeConfig.bottomColor },
              ]}
            />
          </>
        )}

        {/* Pulsing glow effect (for processing screens) */}
        {pulseConfig && <PulsingGlow config={pulseConfig} />}

        {/* Breathing gradient effect (for processing screens) */}
        {breathingConfig && <BreathingGradient config={breathingConfig} />}

        {/* Decorative accent circles */}
        <View
          style={[
            styles.accentCircle1,
            {
              backgroundColor: themeConfig.circleColors[0],
              opacity: themeConfig.circleOpacity,
            },
          ]}
        />
        <View
          style={[
            styles.accentCircle2,
            {
              backgroundColor: themeConfig.circleColors[1],
              opacity: themeConfig.circleOpacity * 0.6,
            },
          ]}
        />

        {/* Floating orbs (if enabled) */}
        {orbConfig && <FloatingOrbs config={orbConfig} />}

        {/* Noise texture (if enabled) */}
        {noiseConfig && <NoiseTexture config={noiseConfig} />}
      </View>

      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgGradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  bgGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  accentCircle1: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  accentCircle2: {
    position: "absolute",
    bottom: 100,
    left: -120,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
});

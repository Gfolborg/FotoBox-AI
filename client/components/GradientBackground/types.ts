import { StyleProp, ViewStyle } from "react-native";

export type ScreenTheme =
  | "home"
  | "camera"
  | "processing"
  | "result"
  | "selection"
  | "onboarding"
  | "editing";

export interface FloatingOrbsConfig {
  count?: number;
  colors?: string[];
  opacity?: number;
  speed?: "slow" | "normal" | "fast";
  minSize?: number;
  maxSize?: number;
}

export interface MeshGradientConfig {
  colors?: string[];
  intensity?: number;
  animated?: boolean;
}

export interface PulsingGlowConfig {
  color?: string;
  intensity?: number;
  speed?: number;
}

export interface NoiseTextureConfig {
  opacity?: number;
  density?: "light" | "medium" | "heavy";
}

export interface BreathingGradientConfig {
  colors?: [string, string];
  speed?: number;
  intensity?: number;
}

export interface ThemeConfig {
  topColor: string;
  bottomColor: string;
  circleColors: [string, string];
  circleOpacity: number;
  orbColors?: string[];
  enableOrbs?: boolean;
  enablePulse?: boolean;
  pulseColor?: string;
  enableMesh?: boolean;
  meshAnimated?: boolean;
  enableNoise?: boolean;
  noiseOpacity?: number;
  enableBreathing?: boolean;
  breathingColors?: [string, string];
}

export interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "subtle" | "warm";
  theme?: ScreenTheme;
  floatingOrbs?: boolean | FloatingOrbsConfig;
  meshGradient?: boolean | MeshGradientConfig;
  pulsingGlow?: boolean | PulsingGlowConfig;
  noiseTexture?: boolean | NoiseTextureConfig;
  breathingGradient?: boolean | BreathingGradientConfig;
}

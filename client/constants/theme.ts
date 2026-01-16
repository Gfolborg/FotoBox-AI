import { Platform } from "react-native";

// Warm & Approachable Theme - Ecommerce Seller Tool
const coral = "#F97316";
const coralDark = "#EA580C";
const coralLight = "#FB923C";

// Light theme backgrounds (warm whites/grays)
const warmWhite = "#FAFAF9";
const pureWhite = "#FFFFFF";
const warmGrayLight = "#F5F5F4";
const warmGrayMedium = "#E7E5E4";
const warmGrayDark = "#D6D3D1";

// Dark theme backgrounds (warm darks)
const warmCharcoal = "#1C1917";
const warmCharcoalLight = "#292524";
const warmCharcoalMedium = "#44403C";

// Text colors
const textDark = "#1C1917";
const textMedium = "#78716C";
const textLight = "#A8A29E";

export const Colors = {
  light: {
    // Warm light theme for ecommerce sellers
    text: textDark,
    textSecondary: textMedium,
    textTertiary: textLight,
    buttonText: "#FFFFFF",
    tabIconDefault: textMedium,
    tabIconSelected: coral,
    link: coral,
    primary: coral,
    primaryVariant: coralDark,
    secondary: warmGrayDark,
    backgroundRoot: warmWhite,
    backgroundDefault: pureWhite,
    backgroundSecondary: warmGrayLight,
    backgroundTertiary: warmGrayMedium,
    border: warmGrayMedium,
    borderLight: warmGrayLight,
    error: "#DC2626",
    success: "#16A34A",
    warning: "#F59E0B",
    overlay: "rgba(28, 25, 23, 0.85)",
    overlayLight: "rgba(28, 25, 23, 0.6)",
    white: "#FFFFFF",
    black: "#000000",
  },
  dark: {
    // Warm dark theme option
    text: "#FAFAF9",
    textSecondary: "#A8A29E",
    textTertiary: "#78716C",
    buttonText: "#FFFFFF",
    tabIconDefault: "#78716C",
    tabIconSelected: coralLight,
    link: coralLight,
    primary: coral,
    primaryVariant: coralDark,
    secondary: warmCharcoalMedium,
    backgroundRoot: warmCharcoal,
    backgroundDefault: warmCharcoalLight,
    backgroundSecondary: warmCharcoalMedium,
    backgroundTertiary: "#57534E",
    border: "#57534E",
    borderLight: warmCharcoalMedium,
    error: "#EF4444",
    success: "#22C55E",
    warning: "#FBBF24",
    overlay: "rgba(0, 0, 0, 0.85)",
    overlayLight: "rgba(0, 0, 0, 0.6)",
    white: "#FFFFFF",
    black: "#000000",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 56,
  "5xl": 64,
  inputHeight: 52,
  buttonHeight: 52,
  captureButtonSize: 80,
  captureButtonBorder: 5,
};

// Shadows for depth
export const Shadows = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  accent: {
    shadowColor: "#F97316", // Coral
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "500" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

// Glassmorphism styles for modern card effects
export const Glassmorphism = {
  light: {
    card: {
      backgroundColor: pureWhite,
      borderWidth: 1,
      borderColor: warmGrayLight,
    },
    cardSolid: {
      backgroundColor: pureWhite,
      borderWidth: 1,
      borderColor: warmGrayLight,
    },
    cardSubtle: {
      backgroundColor: pureWhite,
      borderWidth: 1,
      borderColor: warmGrayLight,
    },
    input: {
      backgroundColor: warmGrayLight,
      borderWidth: 1,
      borderColor: warmGrayMedium,
    },
    overlay: {
      backgroundColor: pureWhite,
      borderWidth: 1,
      borderColor: warmGrayLight,
    },
  },
  dark: {
    card: {
      backgroundColor: warmCharcoalLight,
      borderWidth: 1,
      borderColor: warmCharcoalMedium,
    },
    cardSolid: {
      backgroundColor: warmCharcoalLight,
      borderWidth: 1,
      borderColor: warmCharcoalMedium,
    },
    cardSubtle: {
      backgroundColor: warmCharcoalLight,
      borderWidth: 1,
      borderColor: warmCharcoalMedium,
    },
    input: {
      backgroundColor: warmCharcoalMedium,
      borderWidth: 1,
      borderColor: warmCharcoalMedium,
    },
    overlay: {
      backgroundColor: warmCharcoalLight,
      borderWidth: 1,
      borderColor: warmCharcoalMedium,
    },
  },
  // Blur intensity for BackdropFilter (if using expo-blur)
  blurIntensity: {
    light: 0,
    medium: 0,
    heavy: 0,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

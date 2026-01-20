import { Platform } from "react-native";

// Primary Brand Color - Warm Coral/Orange
const coral = "#F97316";
const coralDark = "#EA580C";
const coralLight = "#FB923C";
const coralSubtle = "rgba(249, 115, 22, 0.1)";

// Secondary Accent - Blue/Teal (complementary)
const blue = "#0EA5E9";
const blueDark = "#0284C7";
const blueLight = "#38BDF8";
const blueSubtle = "rgba(14, 165, 233, 0.1)";

// Gradient colors for premium effects
const gradientStart = "#F97316";
const gradientEnd = "#0EA5E9";

// Light theme backgrounds (warm whites/grays)
const warmWhite = "#FAFAF9";
const pureWhite = "#FFFFFF";
const warmGrayLight = "#F5F5F4";
const warmGrayMedium = "#E7E5E4";
const warmGrayDark = "#D6D3D1";

// Dark theme backgrounds (for editing/camera screens)
const darkBg = "#0A0A0A";
const darkBgElevated = "#141414";
const darkBgCard = "#1A1A1A";
const darkBgOverlay = "#242424";
const darkBorder = "#2A2A2A";

// Text colors
const textDark = "#1C1917";
const textMedium = "#78716C";
const textLight = "#A8A29E";

export const Colors = {
  light: {
    text: textDark,
    textSecondary: textMedium,
    textTertiary: textLight,
    buttonText: "#FFFFFF",
    tabIconDefault: textMedium,
    tabIconSelected: coral,
    link: coral,
    primary: coral,
    primaryVariant: coralDark,
    primarySubtle: coralSubtle,
    secondary: blue,
    secondaryVariant: blueDark,
    secondarySubtle: blueSubtle,
    backgroundRoot: warmWhite,
    backgroundDefault: pureWhite,
    backgroundSecondary: warmGrayLight,
    backgroundTertiary: warmGrayMedium,
    border: warmGrayMedium,
    borderLight: warmGrayLight,
    error: "#DC2626",
    success: "#16A34A",
    successSubtle: "rgba(22, 163, 74, 0.1)",
    warning: "#F59E0B",
    overlay: "rgba(28, 25, 23, 0.85)",
    overlayLight: "rgba(28, 25, 23, 0.6)",
    white: "#FFFFFF",
    black: "#000000",
    gradient: {
      start: gradientStart,
      end: gradientEnd,
    },
  },
  dark: {
    text: "#FAFAF9",
    textSecondary: "#A8A29E",
    textTertiary: "#78716C",
    buttonText: "#FFFFFF",
    tabIconDefault: "#78716C",
    tabIconSelected: coralLight,
    link: coralLight,
    primary: coral,
    primaryVariant: coralDark,
    primarySubtle: "rgba(249, 115, 22, 0.15)",
    secondary: blueLight,
    secondaryVariant: blue,
    secondarySubtle: "rgba(56, 189, 248, 0.15)",
    backgroundRoot: darkBg,
    backgroundDefault: darkBgElevated,
    backgroundSecondary: darkBgCard,
    backgroundTertiary: darkBgOverlay,
    border: darkBorder,
    borderLight: "#1F1F1F",
    error: "#EF4444",
    success: "#22C55E",
    successSubtle: "rgba(34, 197, 94, 0.15)",
    warning: "#FBBF24",
    overlay: "rgba(0, 0, 0, 0.85)",
    overlayLight: "rgba(0, 0, 0, 0.6)",
    white: "#FFFFFF",
    black: "#000000",
    gradient: {
      start: gradientStart,
      end: gradientEnd,
    },
  },
  // Editing theme - now uses light brand colors for consistency
  editing: {
    text: textDark,
    textSecondary: textMedium,
    textTertiary: textLight,
    buttonText: "#FFFFFF",
    primary: coral,
    primaryVariant: coralDark,
    primarySubtle: coralSubtle,
    secondary: blue,
    secondarySubtle: blueSubtle,
    backgroundRoot: warmWhite,
    backgroundDefault: pureWhite,
    backgroundSecondary: warmGrayLight,
    backgroundTertiary: warmGrayMedium,
    backgroundGlass: "rgba(255, 255, 255, 0.85)",
    border: warmGrayMedium,
    borderLight: warmGrayLight,
    success: "#16A34A",
    successSubtle: "rgba(22, 163, 74, 0.1)",
    error: "#DC2626",
    overlay: "rgba(28, 25, 23, 0.85)",
    overlayLight: "rgba(28, 25, 23, 0.6)",
    white: "#FFFFFF",
    black: "#000000",
    gradient: {
      start: gradientStart,
      end: gradientEnd,
    },
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
  buttonHeightSm: 44,
  captureButtonSize: 80,
  captureButtonBorder: 5,
  touchTarget: 44,
};

export const Shadows = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  accent: {
    shadowColor: coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  accentBlue: {
    shadowColor: blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 36,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  smallMedium: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  buttonSm: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
};

export const Glassmorphism = {
  light: {
    card: {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.5)",
    },
    cardSolid: {
      backgroundColor: pureWhite,
      borderWidth: 1,
      borderColor: warmGrayLight,
    },
    cardSubtle: {
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    input: {
      backgroundColor: "rgba(245, 245, 244, 0.9)",
      borderWidth: 1,
      borderColor: warmGrayMedium,
    },
    overlay: {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.5)",
    },
    pill: {
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.4)",
    },
  },
  dark: {
    card: {
      backgroundColor: "rgba(26, 26, 26, 0.8)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    cardSolid: {
      backgroundColor: darkBgCard,
      borderWidth: 1,
      borderColor: darkBorder,
    },
    cardSubtle: {
      backgroundColor: "rgba(26, 26, 26, 0.6)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    input: {
      backgroundColor: "rgba(36, 36, 36, 0.9)",
      borderWidth: 1,
      borderColor: darkBorder,
    },
    overlay: {
      backgroundColor: "rgba(20, 20, 20, 0.95)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    pill: {
      backgroundColor: "rgba(26, 26, 26, 0.85)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  blurIntensity: {
    light: 20,
    medium: 40,
    heavy: 60,
  },
};

export const Gradients = {
  primary: [coral, coralDark],
  secondary: [blue, blueDark],
  accent: [coral, blue],
  warm: ["#FFF7ED", warmWhite],
  dark: [darkBgElevated, darkBg],
  success: ["#22C55E", "#16A34A"],
  shimmer: [
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0.3)",
    "rgba(255,255,255,0)",
  ],
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

export const Animations = {
  spring: {
    damping: 20,
    mass: 0.8,
    stiffness: 200,
  },
  springFast: {
    damping: 25,
    mass: 0.5,
    stiffness: 300,
  },
  springSlow: {
    damping: 18,
    mass: 1,
    stiffness: 150,
  },
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};

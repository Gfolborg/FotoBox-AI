import { useState, useCallback } from "react";

export interface ImageEditingState {
  // CSS-previewable adjustments (instant feedback)
  brightness: number; // -1 to 1
  contrast: number; // 0.5 to 2
  saturation: number; // 0 to 2
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;

  // Server-only adjustments (no CSS preview)
  exposure: number; // -2 to 2
  highlights: number; // -1 to 1
  shadows: number; // -1 to 1
  warmth: number; // -1 to 1

  // Amazon Main Generation
  selectedBackgroundColor: string;

  // AI-related settings for Lifestyle Scene (for Presets/Templates)
  aiEnvironment?: string;
  aiIsCustom?: boolean;
  aiProductDescription?: string;
  aiShadowControl?: string;

  // Crop (percentages 0-1)
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  aspectRatio: "free" | "square" | "4:3" | "16:9" | "2:3" | null;

  // UI state
  activeTab: "adjust" | "crop" | "transform" | "amazonMain";
  showBeforeAfter: boolean;
}

const DEFAULT_STATE: ImageEditingState = {
  // CSS-previewable
  brightness: 0,
  contrast: 1,
  saturation: 1,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,

  // Server-only
  exposure: 0,
  highlights: 0,
  shadows: 0,
  warmth: 0,

  // Amazon Main
  selectedBackgroundColor: "#FFFFFF",

  // AI-related settings for Lifestyle Scene (for Presets/Templates)
  aiEnvironment: undefined,
  aiIsCustom: undefined,
  aiProductDescription: undefined,
  aiShadowControl: undefined,

  // Crop
  crop: null,
  aspectRatio: null,

  // UI
  activeTab: "adjust",
  showBeforeAfter: false,
};

export function useImageEditing() {
  const [state, setState] = useState<ImageEditingState>(DEFAULT_STATE);

  const updateAdjustment = useCallback(
    <K extends keyof ImageEditingState>(
      key: K,
      value: ImageEditingState[K],
    ) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const resetAdjustment = useCallback(
    <K extends keyof ImageEditingState>(key: K) => {
      setState((prev) => ({ ...prev, [key]: DEFAULT_STATE[key] }));
    },
    [],
  );

  const setActiveTab = useCallback(
    (tab: "adjust" | "crop" | "transform" | "amazonMain") => {
      updateAdjustment("activeTab", tab);
    },
    [updateAdjustment],
  );

  const toggleBeforeAfter = useCallback(() => {
    setState((prev) => ({ ...prev, showBeforeAfter: !prev.showBeforeAfter }));
  }, []);

  const rotateCW = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  const rotateCCW = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rotation: (prev.rotation - 90 + 360) % 360,
    }));
  }, []);

  const toggleFlipHorizontal = useCallback(() => {
    setState((prev) => ({ ...prev, flipHorizontal: !prev.flipHorizontal }));
  }, []);

  const toggleFlipVertical = useCallback(() => {
    setState((prev) => ({ ...prev, flipVertical: !prev.flipVertical }));
  }, []);

  // Check if any adjustments have been made
  const hasChanges = useCallback(() => {
    return (
      state.brightness !== 0 ||
      state.contrast !== 1 ||
      state.saturation !== 1 ||
      state.rotation !== 0 ||
      state.flipHorizontal !== false ||
      state.flipVertical !== false ||
      state.exposure !== 0 ||
      state.highlights !== 0 ||
      state.shadows !== 0 ||
      state.warmth !== 0 ||
      state.crop !== null ||
      state.aspectRatio !== null
    );
  }, [state]);

  return {
    state,
    updateAdjustment,
    resetAll,
    resetAdjustment,
    setActiveTab,
    toggleBeforeAfter,
    rotateCW,
    rotateCCW,
    toggleFlipHorizontal,
    toggleFlipVertical,
    hasChanges,
  };
}

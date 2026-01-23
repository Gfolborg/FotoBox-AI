import { useState, useCallback } from "react";

/**
 * Simplified editing state for QuickFix screen
 * Includes transform operations: rotate, flip
 * And basic adjustments: brightness, contrast
 */
export interface QuickFixState {
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number; // -100 to 100, default 0
  contrast: number; // -100 to 100, default 0
}

const DEFAULT_STATE: QuickFixState = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  brightness: 0,
  contrast: 0,
};

/**
 * Hook for QuickFix screen - simplified transform-only editing
 */
export function useQuickFix() {
  const [state, setState] = useState<QuickFixState>(DEFAULT_STATE);

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

  const setBrightness = useCallback((brightness: number) => {
    setState((prev) => ({
      ...prev,
      brightness: Math.max(-100, Math.min(100, brightness)),
    }));
  }, []);

  const setContrast = useCallback((contrast: number) => {
    setState((prev) => ({
      ...prev,
      contrast: Math.max(-100, Math.min(100, contrast)),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const hasChanges = useCallback(() => {
    return (
      state.rotation !== 0 ||
      state.flipHorizontal ||
      state.flipVertical ||
      state.brightness !== 0 ||
      state.contrast !== 0
    );
  }, [state]);

  /**
   * Get adjustments in the format expected by SkiaEditableImage
   * Brightness: -100 to 100 maps to -0.5 to 0.5
   * Contrast: -100 to 100 maps to 0.5 to 1.5
   */
  const getSkiaAdjustments = useCallback(() => {
    return {
      brightness: state.brightness / 200, // -100..100 -> -0.5..0.5
      contrast: 1 + state.contrast / 200, // -100..100 -> 0.5..1.5
      saturation: 1,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      warmth: 0,
      rotation: state.rotation,
      flipHorizontal: state.flipHorizontal,
      flipVertical: state.flipVertical,
    };
  }, [
    state.rotation,
    state.flipHorizontal,
    state.flipVertical,
    state.brightness,
    state.contrast,
  ]);

  return {
    state,
    rotateCW,
    rotateCCW,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setBrightness,
    setContrast,
    resetAll,
    hasChanges,
    getSkiaAdjustments,
  };
}

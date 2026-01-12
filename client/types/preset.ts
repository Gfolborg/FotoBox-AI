export interface PresetAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  warmth: number;
}

export interface EditingPreset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  adjustments: PresetAdjustments;
  backgroundColor: string;
}

export interface PresetStorage {
  presets: EditingPreset[];
  version: number;
}

export const DEFAULT_ADJUSTMENTS: PresetAdjustments = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  warmth: 0,
};

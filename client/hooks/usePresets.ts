import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loadPresets,
  savePreset,
  updatePreset,
  deletePreset,
} from "@/lib/preset-storage";
import { EditingPreset, PresetAdjustments } from "@/types/preset";
import { ImageEditingState } from "./useImageEditing";

const PRESETS_QUERY_KEY = ["presets"];

export function usePresets() {
  const queryClient = useQueryClient();

  const {
    data: presets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: PRESETS_QUERY_KEY,
    queryFn: loadPresets,
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: ({
      name,
      adjustments,
      backgroundColor,
      aiSettings, // Added aiSettings
    }: {
      name: string;
      adjustments: PresetAdjustments;
      backgroundColor: string;
      aiSettings?: EditingPreset['aiSettings']; // Added aiSettings type
    }) => savePreset(name, adjustments, backgroundColor, aiSettings), // Pass aiSettings
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESETS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<EditingPreset, "id" | "createdAt">>;
    }) => updatePreset(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESETS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESETS_QUERY_KEY });
    },
  });

  const saveCurrentAsPreset = async (
    name: string,
    state: ImageEditingState,
  ): Promise<EditingPreset> => {
    const adjustments: PresetAdjustments = {
      brightness: state.brightness,
      contrast: state.contrast,
      saturation: state.saturation,
      exposure: state.exposure,
      highlights: state.highlights,
      shadows: state.shadows,
      warmth: state.warmth,
    };

    const aiSettings: EditingPreset['aiSettings'] = {
      environment: state.aiEnvironment,
      isCustom: state.aiIsCustom,
      productDescription: state.aiProductDescription,
      shadowControl: state.aiShadowControl,
    };

    const result = await saveMutation.mutateAsync({
      name,
      adjustments,
      backgroundColor: state.selectedBackgroundColor,
      aiSettings: aiSettings, // Pass the new AI settings
    });

    return result;
  };

  const applyPresetToState = (
    preset: EditingPreset,
    updateAdjustment: <K extends keyof ImageEditingState>(
      key: K,
      value: ImageEditingState[K],
    ) => void,
  ) => {
    updateAdjustment("brightness", preset.adjustments.brightness);
    updateAdjustment("contrast", preset.adjustments.contrast);
    updateAdjustment("saturation", preset.adjustments.saturation);
    updateAdjustment("exposure", preset.adjustments.exposure);
    updateAdjustment("highlights", preset.adjustments.highlights);
    updateAdjustment("shadows", preset.adjustments.shadows);
    updateAdjustment("warmth", preset.adjustments.warmth);
    updateAdjustment("selectedBackgroundColor", preset.backgroundColor);

    // Apply AI-related settings
    if (preset.aiSettings) {
      updateAdjustment("aiEnvironment", preset.aiSettings.environment);
      updateAdjustment("aiIsCustom", preset.aiSettings.isCustom);
      updateAdjustment("aiProductDescription", preset.aiSettings.productDescription);
      updateAdjustment("aiShadowControl", preset.aiSettings.shadowControl);
    }
  };

  const renamePreset = async (id: string, newName: string) => {
    await updateMutation.mutateAsync({ id, updates: { name: newName } });
  };

  const removePreset = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    presets,
    isLoading,
    error,
    saveCurrentAsPreset,
    applyPresetToState,
    renamePreset,
    removePreset,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

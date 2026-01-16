import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  EditingPreset,
  PresetAdjustments,
  PresetStorage,
} from "@/types/preset";

const PRESETS_STORAGE_KEY = "@FotoBox:presets";
const STORAGE_VERSION = 1;

function generateId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function getStorage(): Promise<PresetStorage> {
  try {
    const data = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
    if (!data) {
      return { presets: [], version: STORAGE_VERSION };
    }
    return JSON.parse(data) as PresetStorage;
  } catch (error) {
    console.error("Failed to load presets from storage:", error);
    return { presets: [], version: STORAGE_VERSION };
  }
}

async function setStorage(storage: PresetStorage): Promise<void> {
  try {
    await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to save presets to storage:", error);
    throw error;
  }
}

export async function loadPresets(): Promise<EditingPreset[]> {
  const storage = await getStorage();
  return storage.presets;
}

export async function savePreset(
  name: string,
  adjustments: PresetAdjustments,
  backgroundColor: string,
  aiSettings?: EditingPreset['aiSettings'], // Add aiSettings parameter
): Promise<EditingPreset> {
  const storage = await getStorage();
  const now = new Date().toISOString();

  const newPreset: EditingPreset = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    adjustments,
    backgroundColor,
    aiSettings, // Add aiSettings to the newPreset object
  };

  storage.presets.unshift(newPreset);
  await setStorage(storage);

  return newPreset;
}

export async function updatePreset(
  id: string,
  updates: Partial<Omit<EditingPreset, "id" | "createdAt">>,
): Promise<EditingPreset | null> {
  const storage = await getStorage();
  const index = storage.presets.findIndex((p) => p.id === id);

  if (index === -1) {
    return null;
  }

  const updatedPreset: EditingPreset = {
    ...storage.presets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  storage.presets[index] = updatedPreset;
  await setStorage(storage);

  return updatedPreset;
}

export async function deletePreset(id: string): Promise<boolean> {
  const storage = await getStorage();
  const initialLength = storage.presets.length;

  storage.presets = storage.presets.filter((p) => p.id !== id);

  if (storage.presets.length === initialLength) {
    return false;
  }

  await setStorage(storage);
  return true;
}

export async function getPresetById(id: string): Promise<EditingPreset | null> {
  const storage = await getStorage();
  return storage.presets.find((p) => p.id === id) || null;
}

export async function clearAllPresets(): Promise<void> {
  await setStorage({ presets: [], version: STORAGE_VERSION });
}

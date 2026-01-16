import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "lifestyle_prompt_history";
const MAX_HISTORY_ITEMS = 10;

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
}

export function usePromptHistory() {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load prompt history:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const addToHistory = async (prompt: string) => {
    if (!prompt.trim()) return;

    const newItem: PromptHistoryItem = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      timestamp: Date.now(),
    };

    const existingIndex = history.findIndex(
      (item) => item.prompt.toLowerCase() === prompt.trim().toLowerCase()
    );

    let newHistory: PromptHistoryItem[];
    if (existingIndex >= 0) {
      newHistory = [
        newItem,
        ...history.filter((_, i) => i !== existingIndex),
      ].slice(0, MAX_HISTORY_ITEMS);
    } else {
      newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    }

    setHistory(newHistory);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Failed to save prompt history:", error);
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear prompt history:", error);
    }
  };

  const removeFromHistory = async (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Failed to remove prompt:", error);
    }
  };

  return {
    history,
    isLoaded,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}

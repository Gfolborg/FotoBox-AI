import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";

const FREE_USES_KEY = "@fotobox_free_uses";
const MAX_FREE_USES = 3;

interface CreditState {
  isLoading: boolean;
  canGenerate: boolean;
  creditsRemaining: number;
  isFreeTier: boolean;
  isPremium: boolean;
  requiresWatermark: boolean;
}

export function useCredits() {
  const { isAuthenticated, subscription, useCredit } = useAuth();
  const [localFreeUses, setLocalFreeUses] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocalFreeUses();
  }, []);

  const loadLocalFreeUses = async () => {
    try {
      const stored = await AsyncStorage.getItem(FREE_USES_KEY);
      if (stored) {
        setLocalFreeUses(parseInt(stored, 10));
      }
    } catch (error) {
      console.error("Failed to load free uses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementLocalUses = async () => {
    const newCount = localFreeUses + 1;
    setLocalFreeUses(newCount);
    await AsyncStorage.setItem(FREE_USES_KEY, newCount.toString());
    return newCount;
  };

  const getCreditState = useCallback((): CreditState => {
    if (isLoading) {
      return {
        isLoading: true,
        canGenerate: false,
        creditsRemaining: 0,
        isFreeTier: true,
        isPremium: false,
        requiresWatermark: true,
      };
    }

    if (isAuthenticated && subscription) {
      const isPremium = subscription.plan === "pro" || subscription.plan === "unlimited";
      const hasUnlimited = subscription.plan === "unlimited" || subscription.creditsRemaining === -1;
      const hasCredits = hasUnlimited || subscription.creditsRemaining > 0;

      return {
        isLoading: false,
        canGenerate: hasCredits,
        creditsRemaining: hasUnlimited ? -1 : subscription.creditsRemaining,
        isFreeTier: subscription.plan === "free",
        isPremium,
        requiresWatermark: subscription.plan === "free",
      };
    }

    const freeRemaining = MAX_FREE_USES - localFreeUses;
    return {
      isLoading: false,
      canGenerate: freeRemaining > 0,
      creditsRemaining: freeRemaining,
      isFreeTier: true,
      isPremium: false,
      requiresWatermark: true,
    };
  }, [isAuthenticated, subscription, localFreeUses, isLoading]);

  const consumeCredit = async (action: string = "generate"): Promise<{
    success: boolean;
    creditsRemaining: number;
    requiresUpgrade: boolean;
    error?: string;
  }> => {
    if (isAuthenticated && subscription) {
      const result = await useCredit(action);
      return {
        success: result.success,
        creditsRemaining: result.creditsRemaining,
        requiresUpgrade: result.requiresUpgrade || false,
        error: result.error,
      };
    }

    const freeRemaining = MAX_FREE_USES - localFreeUses;
    if (freeRemaining <= 0) {
      return {
        success: false,
        creditsRemaining: 0,
        requiresUpgrade: true,
        error: "No free uses remaining. Create an account for more credits.",
      };
    }

    const newCount = await incrementLocalUses();
    const remaining = MAX_FREE_USES - newCount;
    return {
      success: true,
      creditsRemaining: remaining,
      requiresUpgrade: false,
    };
  };

  return {
    ...getCreditState(),
    consumeCredit,
    refreshCredits: loadLocalFreeUses,
  };
}

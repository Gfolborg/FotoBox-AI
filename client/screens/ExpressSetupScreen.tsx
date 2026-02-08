import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { PlatformChip } from "@/components/PlatformChip";
import { CreditIndicator } from "@/components/CreditIndicator";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getPlatformsForService } from "@/lib/platform-requirements";
import {
  ExpressUseCase,
  ExpressAdStyle,
  ExpressModelOption,
  getExpressGoalLabel,
  getExpressModelLabel,
} from "@/lib/express-presets";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";
import { Feather } from "@expo/vector-icons";
import { useCredits } from "@/hooks/useCredits";
import * as ImageManipulator from "expo-image-manipulator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ExpressSetup">;
type RouteProps = RouteProp<RootStackParamList, "ExpressSetup">;

const GOALS: Array<{
  id: ExpressUseCase;
  title: string;
  description: string;
}> = [
  {
    id: "neutral",
    title: "Balanced",
    description: "Natural and versatile",
  },
  {
    id: "listing",
    title: "Listing",
    description: "Clean and retail-ready",
  },
  {
    id: "ad",
    title: "Advertise",
    description: "Marketing-focused visuals",
  },
];

const AD_STYLES: Array<{
  id: ExpressAdStyle;
  title: string;
}> = [
  { id: "simple", title: "Simple" },
  { id: "exaggerated", title: "Exaggerated" },
  { id: "trendy", title: "Trendy" },
];

const MODEL_OPTIONS: Array<{
  id: ExpressModelOption;
  title: string;
  description: string;
}> = [
  { id: "none", title: "No people", description: "Product only" },
  { id: "hands", title: "Only hands", description: "Hands interacting only" },
  { id: "female", title: "Female model", description: "One adult female model" },
  { id: "male", title: "Male model", description: "One adult male model" },
];

export default function ExpressSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUri } = route.params;
  const { token } = useAuth();
  const { creditsRemaining } = useCredits();

  const [productDescription, setProductDescription] = useState("");
  const [useCase, setUseCase] = useState<ExpressUseCase | undefined>();
  const [adStyle, setAdStyle] = useState<ExpressAdStyle | undefined>();
  const [platformId, setPlatformId] = useState("");
  const [modelOption, setModelOption] = useState<ExpressModelOption>("none");
  const [enableCustomModelDirection, setEnableCustomModelDirection] =
    useState(false);
  const [customModelDirection, setCustomModelDirection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [previewUri, setPreviewUri] = useState(imageUri);
  const [isPreparingPreview, setIsPreparingPreview] = useState(true);
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);

  const platforms = useMemo(() => getPlatformsForService("lifestyle"), []);

  const canContinue =
    productDescription.trim().length > 0 &&
    useCase !== undefined &&
    platformId.trim().length > 0 &&
    (useCase !== "ad" || adStyle !== undefined);
  const hasLocalCreditsForExpress =
    creditsRemaining === -1 || creditsRemaining >= 7;
  const normalizedCustomModelDirection = enableCustomModelDirection
    ? customModelDirection.trim()
    : "";
  const availableCreditsText =
    creditsRemaining === -1 ? "Unlimited" : `${creditsRemaining}`;
  const afterRunCreditsText =
    creditsRemaining === -1 ? "Unlimited" : `${Math.max(creditsRemaining - 7, 0)}`;

  useEffect(() => {
    let isMounted = true;

    const preparePreview = async () => {
      setIsPreparingPreview(true);
      setPreviewLoadFailed(false);
      setPreviewUri(imageUri);

      try {
        if (imageUri.startsWith("data:")) {
          return;
        }

        const normalized = await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          {
            compress: 0.92,
            format: ImageManipulator.SaveFormat.JPEG,
          },
        );

        if (!isMounted) return;
        setPreviewUri(normalized.uri);
      } catch (error) {
        console.warn("[ExpressSetup] Preview normalization failed", error);
      } finally {
        if (isMounted) {
          setIsPreparingPreview(false);
        }
      }
    };

    void preparePreview();
    return () => {
      isMounted = false;
    };
  }, [imageUri]);

  const navigateToProcessing = () => {
    navigation.navigate("ExpressProcessing", {
      imageUri,
      productDescription: productDescription.trim(),
      useCase: useCase as ExpressUseCase,
      adStyle,
      platform: platformId,
      modelOption,
      customModelDirection: normalizedCustomModelDirection || undefined,
    });
  };

  const handleAuthenticate = () => {
    setAuthRedirect({ name: "ExpressSetup", params: route.params });
    navigation.navigate("Auth");
  };

  const handleContinue = async () => {
    if (!canContinue || isSubmitting) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!token) {
      Alert.alert(
        "Sign in required",
        "Please sign in to use Express generation.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign in", onPress: handleAuthenticate },
        ],
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(new URL("/api/subscription/preflight", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requiredCredits: 7, action: "express" }),
      });

      if (response.status === 402) {
        setShowUpgradePrompt(true);
        return;
      }
      if (response.status === 401 || response.status === 403) {
        Alert.alert(
          "Session expired",
          "Please sign in again to continue.",
          [{ text: "OK", onPress: handleAuthenticate }],
        );
        return;
      }

      if (!response.ok) {
        const rawText = await response.text();
        let errorMessage = "";
        try {
          const parsed = rawText ? JSON.parse(rawText) : {};
          errorMessage = parsed?.error || "";
        } catch {
          errorMessage = rawText || "";
        }

        const preflightUnavailable = [404, 405, 500, 502, 503, 504].includes(
          response.status,
        );
        if (preflightUnavailable) {
          console.warn(
            `[ExpressSetup] preflight unavailable (${response.status}). Falling back to local credit check.`,
          );
          if (!hasLocalCreditsForExpress) {
            setShowUpgradePrompt(true);
            return;
          }
          navigateToProcessing();
          return;
        }

        throw new Error(
          errorMessage ||
            `Unable to verify credits for Express (status ${response.status})`,
        );
      }

      navigateToProcessing();
    } catch (error) {
      console.error("[ExpressSetup] preflight failed", error);
      // Network or transient errors: fallback to local credit state.
      if (!hasLocalCreditsForExpress) {
        setShowUpgradePrompt(true);
      } else {
        console.warn(
          "[ExpressSetup] Using local credit fallback after preflight error.",
        );
        navigateToProcessing();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground theme="home">
      <ThemedHeader title="Express" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 74, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.stepTitle}>Express Full Bundle</ThemedText>
        </View>

        <View style={styles.bundleDetailsCard}>
          <View style={styles.bundleHeaderRow}>
            <ThemedText style={styles.bundleDetailsTitle}>
              This bundle generates
            </ThemedText>
            <CreditIndicator />
          </View>
          <View style={styles.bundleDetailRow}>
            <View style={styles.bundleDetailIcon}>
              <Feather name="scissors" size={14} color={Colors.editing.primary} />
            </View>
            <ThemedText style={styles.bundleDetailText}>
              1 background removal
            </ThemedText>
          </View>
          <View style={styles.bundleDetailRow}>
            <View style={styles.bundleDetailIcon}>
              <Feather name="image" size={14} color={Colors.editing.primary} />
            </View>
            <ThemedText style={styles.bundleDetailText}>
              3 lifestyle scenes
            </ThemedText>
          </View>
          <View style={styles.bundleDetailRow}>
            <View style={styles.bundleDetailIcon}>
              <Feather name="box" size={14} color={Colors.editing.primary} />
            </View>
            <ThemedText style={styles.bundleDetailText}>
              3 mockup images
            </ThemedText>
          </View>
          <View style={styles.bundleCostRow}>
            <View style={styles.bundleCostBadge}>
              <Feather name="zap" size={14} color={Colors.editing.primary} />
              <ThemedText style={styles.bundleCostBadgeText}>
                Cost: 7 credits
              </ThemedText>
            </View>
            <ThemedText style={styles.bundleCostHint}>
              Now: {availableCreditsText} • After run: {afterRunCreditsText}
            </ThemedText>
          </View>
        </View>

        <View style={styles.previewCard}>
          {previewLoadFailed ? (
            <View style={styles.previewFallback}>
              <Feather name="image" size={18} color={Colors.light.textSecondary} />
              <ThemedText style={styles.previewFallbackText}>
                Preview unavailable. Your selected image will still be processed.
              </ThemedText>
            </View>
          ) : (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              onError={() => {
                if (previewUri !== imageUri) {
                  setPreviewUri(imageUri);
                  return;
                }
                setPreviewLoadFailed(true);
              }}
            />
          )}
          {isPreparingPreview && !previewLoadFailed && (
            <View style={styles.previewLoadingOverlay}>
              <ActivityIndicator size="small" color={Colors.editing.primary} />
            </View>
          )}
          <View style={styles.previewBadge}>
            <Feather name="info" size={12} color={Colors.light.text} />
            <ThemedText style={styles.previewBadgeText}>Display preview</ThemedText>
          </View>
        </View>
        <View style={styles.previewNotice}>
          <Feather name="check-circle" size={14} color={Colors.editing.primary} />
          <ThemedText style={styles.previewNoticeText}>
            If the preview looks cropped, don&apos;t worry. We process your full selected image.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>1) Describe your product</ThemedText>
          <ThemedText style={styles.sectionHelper}>
            Include product type, finish/material, and brand vibe for better scene choices.
          </ThemedText>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={productDescription}
              onChangeText={setProductDescription}
              placeholder="Example: Matte ceramic coffee mug with minimalist black logo for a modern home decor brand."
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>2) Choose output goal</ThemedText>
          <ThemedText style={styles.sectionHelper}>
            This controls styling for all 3 lifestyle and all 3 mockup outputs.
          </ThemedText>
          <View style={styles.goalRow}>
            {GOALS.map((goal) => {
              const isActive = useCase === goal.id;
              return (
                <Pressable
                  key={goal.id}
                  style={[styles.goalCard, isActive && styles.goalCardActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (useCase === goal.id) {
                      setUseCase(undefined);
                      setAdStyle(undefined);
                      return;
                    }
                    setUseCase(goal.id);
                    if (goal.id !== "ad") {
                      setAdStyle(undefined);
                    }
                  }}
                >
                  <ThemedText style={[styles.goalTitle, isActive && styles.goalTitleActive]}>
                    {goal.title}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.goalDescription,
                      isActive && styles.goalDescriptionActive,
                    ]}
                  >
                    {goal.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {useCase === "ad" && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Advertise style</ThemedText>
            <View style={styles.segmentedControl}>
              {AD_STYLES.map((style, index) => {
                const isActive = adStyle === style.id;
                return (
                  <Pressable
                    key={style.id}
                    style={[
                      styles.segment,
                      index > 0 && styles.segmentDivider,
                      isActive && styles.segmentActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAdStyle(adStyle === style.id ? undefined : style.id);
                    }}
                  >
                    <ThemedText style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                      {style.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>3) Select platform AR</ThemedText>
          <ThemedText style={styles.sectionHelper}>
            Includes 16:9 and marketplace AR options. Your selection is passed to all generations.
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformRow}>
            {platforms.map((platform) => (
              <PlatformChip
                key={platform.id}
                platform={platform}
                selected={platformId === platform.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPlatformId(platformId === platform.id ? "" : platform.id);
                }}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>4) Mockup model setup</ThemedText>
          <ThemedText style={styles.sectionHelper}>
            This applies to your 3 mockup images only.
          </ThemedText>
          <View style={styles.modelGrid}>
            {MODEL_OPTIONS.map((option) => {
              const isActive = modelOption === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.modelCard, isActive && styles.modelCardActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setModelOption(option.id);
                  }}
                >
                  <ThemedText
                    style={[styles.modelTitle, isActive && styles.modelTitleActive]}
                  >
                    {option.title}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.modelDescription,
                      isActive && styles.modelDescriptionActive,
                    ]}
                  >
                    {option.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[
              styles.customToggleCard,
              enableCustomModelDirection && styles.customToggleCardActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEnableCustomModelDirection((prev) => !prev);
            }}
          >
            <View style={styles.customToggleHeader}>
              <Feather
                name={enableCustomModelDirection ? "check-circle" : "circle"}
                size={16}
                color={
                  enableCustomModelDirection
                    ? Colors.editing.primary
                    : Colors.light.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.customToggleTitle,
                  enableCustomModelDirection && styles.customToggleTitleActive,
                ]}
              >
                Add custom model direction
              </ThemedText>
            </View>
            <ThemedText
              style={[
                styles.customToggleSubtitle,
                enableCustomModelDirection && styles.customToggleSubtitleActive,
              ]}
            >
              Use this to supplement or override preset model choices (example: dog model).
            </ThemedText>
          </Pressable>

          {enableCustomModelDirection && (
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                value={customModelDirection}
                onChangeText={setCustomModelDirection}
                placeholder="Example: Golden retriever carrying the product in a cozy home setting."
                placeholderTextColor={Colors.light.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryLabel}>Selected bundle</ThemedText>
          <ThemedText style={styles.summaryText}>
            {useCase
              ? `${getExpressGoalLabel(useCase, adStyle)} • 7 outputs • 7 credits`
              : "Select an output goal to continue"}
          </ThemedText>
          <ThemedText style={styles.summaryModelText}>
            Mockup model: {getExpressModelLabel(modelOption)}
            {normalizedCustomModelDirection ? " + custom direction" : ""}
          </ThemedText>
          <ThemedText style={styles.summarySubtext}>
            Includes: 1 background removal, 3 lifestyle scenes, 3 mockups.
          </ThemedText>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}> 
        <GradientButton
          title={isSubmitting ? "Checking credits..." : "Start Express (7 credits)"}
          icon="zap"
          onPress={handleContinue}
          fullWidth
          disabled={!canContinue || isSubmitting}
        />
      </View>

      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  planPill: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  planPillText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "700",
  },
  header: {
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  stepSubtitle: {
    marginTop: Spacing.xs,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  badgeRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  bundleDetailsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.82)",
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  bundleHeaderRow: {
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  bundleDetailsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  bundleDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  bundleDetailIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14,165,233,0.16)",
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.22)",
  },
  bundleDetailText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "600",
  },
  bundleCostRow: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  bundleCostBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.4)",
    backgroundColor: "rgba(14,165,233,0.16)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  bundleCostBadgeText: {
    fontSize: 12,
    color: Colors.editing.primary,
    fontWeight: "800",
  },
  bundleCostHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  previewCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
    ...Shadows.md,
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  previewLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  previewFallback: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  previewFallbackText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  previewBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  previewBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  previewNotice: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.75)",
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
  },
  previewNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  sectionHelper: {
    fontSize: 12,
    color: Colors.light.text,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: Colors.editing.backgroundSecondary,
    padding: Spacing.md,
  },
  input: {
    minHeight: 120,
    color: Colors.light.text,
    fontSize: 15,
    lineHeight: 22,
  },
  goalRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  goalCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  goalCardActive: {
    borderColor: Colors.editing.primary,
    backgroundColor: "#BAE6FD",
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  goalTitleActive: {
    color: "#0F172A",
  },
  goalDescription: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  goalDescriptionActive: {
    color: "#1E293B",
    fontWeight: "600",
  },
  modelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modelCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: Colors.editing.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  modelCardActive: {
    borderColor: Colors.editing.primary,
    backgroundColor: "#BAE6FD",
  },
  modelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modelTitleActive: {
    color: "#0F172A",
  },
  modelDescription: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  modelDescriptionActive: {
    color: "#1E293B",
    fontWeight: "600",
  },
  customToggleCard: {
    borderWidth: 1,
    borderColor: Colors.editing.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    backgroundColor: Colors.editing.backgroundSecondary,
    marginBottom: Spacing.sm,
  },
  customToggleCardActive: {
    borderColor: Colors.editing.primary,
    backgroundColor: "#BAE6FD",
  },
  customToggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  customToggleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  customToggleTitleActive: {
    color: "#0F172A",
  },
  customToggleSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  customToggleSubtitleActive: {
    color: "#1E293B",
    fontWeight: "600",
  },
  segmentedControl: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.editing.border,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  segmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.editing.border,
  },
  segmentActive: {
    backgroundColor: "rgba(14, 165, 233, 0.16)",
  },
  segmentText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: Colors.editing.primary,
  },
  platformRow: {
    gap: Spacing.sm,
    paddingVertical: 2,
    paddingRight: Spacing.md,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    padding: Spacing.md,
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "600",
  },
  summaryModelText: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  summarySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
});

import React, { useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { PlatformChip } from "@/components/PlatformChip";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { MockupAdStyle, MockupUseCase } from "@/lib/mockup-presets";
import { getPlatformsForService } from "@/lib/platform-requirements";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardScene"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardScene">;

type SceneStarter = {
  id: string;
  title: string;
  prompt: string;
  cardDescription?: string;
  useCase: MockupUseCase | "all";
  adStyle?: MockupAdStyle;
};

const SCENE_PROMPT_PLACEHOLDER =
  "Example: Minimal studio setup with soft daylight, neutral beige background, product centered on a wooden table, subtle shadows, clean premium look.";

const DEFAULT_SCENE_STARTERS: SceneStarter[] = [
  {
    id: "default_soft_studio",
    title: "Soft Studio",
    useCase: "all",
    prompt:
      "Minimal studio scene with soft diffused daylight, neutral seamless backdrop, and gentle shadows. Keep the product centered, clean, and realistic with accurate texture and color.",
  },
  {
    id: "default_authentic_home",
    title: "Authentic Home",
    useCase: "all",
    prompt:
      "Calm home setting with natural window light, tidy background, and subtle decor. Keep props minimal and make the product the clear hero with realistic scale.",
  },
  {
    id: "default_listing_clean",
    title: "Listing Clean",
    useCase: "all",
    prompt:
      "Retail-ready listing scene with even lighting, uncluttered background, and high clarity on product details. Keep composition centered and avoid distracting props.",
  },
  {
    id: "default_premium_tabletop",
    title: "Premium Tabletop",
    useCase: "all",
    prompt:
      "Premium tabletop composition with subtle reflections, balanced negative space, and polished styling. Keep scene elegant and photorealistic.",
  },
  {
    id: "default_outdoor_natural",
    title: "Outdoor Natural",
    useCase: "all",
    prompt:
      "Outdoor shaded setting with soft natural daylight, gentle background blur, and realistic environmental shadows. Keep the product crisp and clearly readable.",
  },
  {
    id: "default_modern_desk",
    title: "Modern Desk",
    useCase: "all",
    prompt:
      "Modern clean desk composition with controlled highlights and subtle background elements. Keep the product sharply rendered and central.",
  },
  {
    id: "default_minimal_flatlay",
    title: "Minimal Flatlay",
    useCase: "all",
    prompt:
      "Top-down minimal flatlay with clean spacing and restrained props. Keep geometry tidy and product legibility high.",
  },
  {
    id: "default_cozy_cafe",
    title: "Cozy Cafe",
    useCase: "all",
    prompt:
      "Warm cafe setting with soft ambient light and subtle depth in background. Keep product crisp as the focal point with realistic shadows.",
  },
  {
    id: "default_storefront",
    title: "Storefront",
    useCase: "all",
    prompt:
      "Retail shelf or storefront context with balanced lighting and clean merchandising style. Keep the product central and true to life.",
  },
];

const BALANCED_SCENE_STARTERS: SceneStarter[] = [
  { id: "balanced_01", title: "Clean Studio", useCase: "neutral", prompt: "Balanced studio setup with soft diffused light, neutral backdrop, and realistic shadows. Keep composition natural and uncluttered." },
  { id: "balanced_02", title: "Daylight Shelf", useCase: "neutral", prompt: "Natural daylight scene on a simple shelf near a window with gentle shadows and muted decor. Keep the product as hero." },
  { id: "balanced_03", title: "Quiet Workspace", useCase: "neutral", prompt: "Calm workspace scene with subtle props, natural tones, and realistic perspective. Keep styling restrained and believable." },
  { id: "balanced_04", title: "Home Counter", useCase: "neutral", prompt: "Everyday home countertop scene with tidy background and soft indirect lighting. Keep the product clearly visible and authentic." },
  { id: "balanced_05", title: "Soft Flatlay", useCase: "neutral", prompt: "Balanced top-down flatlay with clean spacing and minimal props. Keep the product accurate, centered, and easy to read." },
  { id: "balanced_06", title: "Garden Shade", useCase: "neutral", prompt: "Outdoor shaded setting with natural greenery and soft contrast. Keep the image calm, realistic, and product-focused." },
  { id: "balanced_07", title: "Neutral Tabletop", useCase: "neutral", prompt: "Neutral tabletop composition with subtle texture and gentle light falloff. Keep overall look clean and naturally premium." },
  { id: "balanced_08", title: "Lifestyle Corner", useCase: "neutral", prompt: "Simple lifestyle corner scene with just 1-2 understated props and natural lighting. Keep product prominence and realism high." },
  { id: "balanced_09", title: "Street Daylight", useCase: "neutral", prompt: "Casual urban daylight scene with soft background blur and believable atmosphere. Keep the product crisp and naturally integrated." },
];

const LISTING_SCENE_STARTERS: SceneStarter[] = [
  { id: "listing_01", title: "Listing Studio", useCase: "listing", prompt: "Retail-ready studio composition with even, clean lighting and plain background. Prioritize product clarity and accurate details." },
  { id: "listing_02", title: "Centered Product", useCase: "listing", prompt: "Centered listing shot with balanced margins, minimal props, and high detail visibility. Keep look clean and professional." },
  { id: "listing_03", title: "Scale Context", useCase: "listing", prompt: "Listing-style image with subtle scale cues and uncluttered environment. Maintain truthful representation and strong product readability." },
  { id: "listing_04", title: "White Surface", useCase: "listing", prompt: "Clean white surface scene with neutral light and controlled shadows. Keep product silhouette crisp and listing-friendly." },
  { id: "listing_05", title: "Neutral Backdrop", useCase: "listing", prompt: "Minimal neutral backdrop with clear, even illumination. Keep texture, materials, and design integration accurate and sharp." },
  { id: "listing_06", title: "Product Fill", useCase: "listing", prompt: "Listing composition where product occupies most of frame while staying fully visible. Keep distractions low and detail high." },
  { id: "listing_07", title: "Grid-Friendly", useCase: "listing", prompt: "Marketplace grid-friendly shot with simple styling, clean edges, and clear product focus. Avoid visual clutter." },
  { id: "listing_08", title: "Catalog Clean", useCase: "listing", prompt: "Catalog-style clean scene with consistent lighting and realistic shadows. Keep product true-to-life and easy to inspect." },
  { id: "listing_09", title: "Commerce Ready", useCase: "listing", prompt: "Ecommerce-ready composition emphasizing accurate color, texture, and product shape. Keep background tidy and secondary." },
];

const AD_SIMPLE_SCENE_STARTERS: SceneStarter[] = [
  { id: "ad_simple_01", title: "Refined Hero", useCase: "ad", adStyle: "simple", prompt: "Simple advertising hero scene with elegant composition, soft key light, and restrained props. Keep product the clear focal point." },
  { id: "ad_simple_02", title: "Soft Color Pop", useCase: "ad", adStyle: "simple", prompt: "Tasteful ad setup with muted color accents, clean background, and gentle contrast. Keep mood polished and controlled." },
  { id: "ad_simple_03", title: "Calm In-Use", useCase: "ad", adStyle: "simple", prompt: "Subtle in-use advertising scene with natural gestures and soft lighting. Keep styling minimal and premium." },
  { id: "ad_simple_04", title: "Editorial Clean", useCase: "ad", adStyle: "simple", prompt: "Editorial-style ad composition with understated props and balanced negative space. Maintain realistic product detail." },
  { id: "ad_simple_05", title: "Quiet Spotlight", useCase: "ad", adStyle: "simple", prompt: "Focused product spotlight with soft falloff shadows and restrained mood. Keep image sophisticated and uncluttered." },
  { id: "ad_simple_06", title: "Minimal Story", useCase: "ad", adStyle: "simple", prompt: "Light narrative ad scene with one supporting prop and gentle natural light. Keep scene clean and believable." },
  { id: "ad_simple_07", title: "Premium Neutral", useCase: "ad", adStyle: "simple", prompt: "Premium neutral advertising scene with subtle reflections and tidy styling. Product should remain dominant." },
  { id: "ad_simple_08", title: "Lifestyle Light", useCase: "ad", adStyle: "simple", prompt: "Simple lifestyle ad frame with warm daylight and neat environment. Keep brand feel approachable and refined." },
  { id: "ad_simple_09", title: "Soft Studio Ad", useCase: "ad", adStyle: "simple", prompt: "Clean studio advertising setup with smooth gradients and quiet highlights. Keep product accuracy strict." },
];

const AD_EXAGGERATED_SCENE_STARTERS: SceneStarter[] = [
  { id: "ad_exag_01", title: "Impact Hero", useCase: "ad", adStyle: "exaggerated", prompt: "Exaggerated advertising hero shot with dramatic shadows, strong contrast, and bold composition. Product remains sharp and accurate." },
  { id: "ad_exag_02", title: "Kinetic Angle", useCase: "ad", adStyle: "exaggerated", prompt: "High-energy ad scene with dynamic angle, directional light, and motion cues. Keep product clearly readable." },
  { id: "ad_exag_03", title: "Neon Contrast", useCase: "ad", adStyle: "exaggerated", prompt: "Bold advertising setup with vivid accent lights and punchy contrast. Maintain realistic materials and precise design placement." },
  { id: "ad_exag_04", title: "Cinematic Ad", useCase: "ad", adStyle: "exaggerated", prompt: "Cinematic marketing scene with dramatic depth, layered lighting, and heroic framing. Keep product central and accurate." },
  { id: "ad_exag_05", title: "Power Spotlight", useCase: "ad", adStyle: "exaggerated", prompt: "Intense spotlight composition with deep shadows and strong visual impact. Keep product edges crisp." },
  { id: "ad_exag_06", title: "Bold Texture", useCase: "ad", adStyle: "exaggerated", prompt: "Exaggerated ad style with textured surfaces, aggressive lighting, and confident framing. Preserve product realism." },
  { id: "ad_exag_07", title: "Action Burst", useCase: "ad", adStyle: "exaggerated", prompt: "Dynamic action-oriented advertising scene with energetic composition and motion atmosphere. Keep product visibility high." },
  { id: "ad_exag_08", title: "Epic Scale", useCase: "ad", adStyle: "exaggerated", prompt: "Large-scale visual storytelling ad with dramatic perspective and bold shadows. Product must stay proportionally correct." },
  { id: "ad_exag_09", title: "High-Drama Set", useCase: "ad", adStyle: "exaggerated", prompt: "High-drama set design with rich contrast and attention-grabbing composition. Keep realism and design integrity strict." },
];

const AD_TRENDY_SCENE_STARTERS: SceneStarter[] = [
  { id: "ad_trendy_01", title: "Social Pop", useCase: "ad", adStyle: "trendy", prompt: "Trendy social-ready ad scene with modern props, punchy accents, and clean composition. Keep product front and center." },
  { id: "ad_trendy_02", title: "Creator Desk", useCase: "ad", adStyle: "trendy", prompt: "Creator-inspired setup with contemporary desk styling, neat layers, and slightly boosted contrast. Keep product details crisp." },
  { id: "ad_trendy_03", title: "Pastel Trend", useCase: "ad", adStyle: "trendy", prompt: "Trend-forward pastel palette with stylish props and polished layout. Scene should feel current and shareable." },
  { id: "ad_trendy_04", title: "Street Modern", useCase: "ad", adStyle: "trendy", prompt: "Modern urban trend ad with clean framing, contemporary textures, and social-first vibe. Keep product highly readable." },
  { id: "ad_trendy_05", title: "Gradient Style", useCase: "ad", adStyle: "trendy", prompt: "Trendy gradient backdrop with vibrant but controlled color transitions and minimal props. Product should remain the hero." },
  { id: "ad_trendy_06", title: "Flatlay Trend", useCase: "ad", adStyle: "trendy", prompt: "Social-friendly flatlay with modern accessories, tidy spacing, and a punchy style. Keep product shape and design accurate." },
  { id: "ad_trendy_07", title: "Lifestyle Reel", useCase: "ad", adStyle: "trendy", prompt: "Short-form social aesthetic with candid lifestyle styling, clean light, and trendy composition. Maintain product fidelity." },
  { id: "ad_trendy_08", title: "Bold Minimal", useCase: "ad", adStyle: "trendy", prompt: "Minimal but trendy ad scene with sharp geometry and contemporary color accents. Keep scene clean and energetic." },
  { id: "ad_trendy_09", title: "Tech Mood", useCase: "ad", adStyle: "trendy", prompt: "Modern tech-inspired trendy scene with sleek props and controlled highlights. Keep product accurate and attention-grabbing." },
];

const getStarterCardDescription = (starter: SceneStarter): string => {
  if (starter.cardDescription?.trim()) {
    return starter.cardDescription.trim();
  }
  const firstSentence = starter.prompt.split(".")[0]?.trim() || starter.title;
  if (!firstSentence) return starter.title;
  return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
};

const INTENTS: { id: MockupUseCase; label: string; description: string }[] = [
  {
    id: "neutral",
    label: "Balanced",
    description: "Natural and authentic product presentation.",
  },
  {
    id: "listing",
    label: "Listing",
    description: "Clean, retail-ready clarity and accuracy.",
  },
  {
    id: "ad",
    label: "Advertise",
    description: "Marketing-focused creative styling.",
  },
];

const AD_STYLES: { id: MockupAdStyle; label: string; description: string }[] = [
  {
    id: "simple",
    label: "Simple",
    description: "Tasteful and restrained",
  },
  {
    id: "exaggerated",
    label: "Exaggerated",
    description: "Bold and dramatic",
  },
  {
    id: "trendy",
    label: "Trendy",
    description: "Social-ready and punchy",
  },
];

export default function MockupWizardSceneScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { wizardState } = route.params;

  const [intent, setIntent] = useState<MockupUseCase | undefined>(
    wizardState.useCase,
  );
  const [adStyle, setAdStyle] = useState<MockupAdStyle | undefined>(
    wizardState.adStyle,
  );
  const [scenePrompt, setScenePrompt] = useState(
    wizardState.customScenePrompt || "",
  );
  const [selectedPlatformId, setSelectedPlatformId] = useState(
    wizardState.platform || "",
  );
  const [selectedStarterId, setSelectedStarterId] = useState<string>();

  const previousIntentRef = useRef<MockupUseCase | undefined>(intent);
  const adStylePulse = useSharedValue(0);
  const scenePromptPulse = useSharedValue(0);
  const platformPulse = useSharedValue(0);

  const showAdStyles = intent === "ad";
  const allPlatforms = getPlatformsForService("mockup");

  const starterExamples = useMemo(() => {
    if (!intent) return DEFAULT_SCENE_STARTERS;

    if (intent !== "ad") {
      return intent === "listing"
        ? LISTING_SCENE_STARTERS
        : BALANCED_SCENE_STARTERS;
    }

    if (!adStyle) {
      return AD_SIMPLE_SCENE_STARTERS;
    }

    if (adStyle === "simple") return AD_SIMPLE_SCENE_STARTERS;
    if (adStyle === "exaggerated") return AD_EXAGGERATED_SCENE_STARTERS;
    return AD_TRENDY_SCENE_STARTERS;
  }, [intent, adStyle]);

  const canContinue =
    intent !== undefined &&
    scenePrompt.trim().length > 0 &&
    selectedPlatformId.trim().length > 0 &&
    (intent !== "ad" || adStyle !== undefined);

  const handleIntentChange = (id: MockupUseCase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (intent === id) {
      setIntent(undefined);
      setAdStyle(undefined);
      setSelectedStarterId(undefined);
      previousIntentRef.current = undefined;
      return;
    }

    setIntent(id);
    setSelectedStarterId(undefined);

    if (id !== "ad") {
      setAdStyle(undefined);
    } else if (previousIntentRef.current !== "ad" && !adStyle) {
      adStylePulse.value = withRepeat(
        withTiming(1, { duration: 700 }),
        4,
        true,
      );
    }

    previousIntentRef.current = id;
  };

  const handleSelectStarter = (starter: SceneStarter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStarterId(starter.id);
    setScenePrompt(starter.prompt);
  };

  const handleContinue = () => {
    if (!canContinue) {
      if (!scenePrompt.trim()) {
        scenePromptPulse.value = withRepeat(
          withTiming(1, { duration: 700 }),
          2,
          true,
        );
      }
      if (!selectedPlatformId.trim()) {
        platformPulse.value = withRepeat(
          withTiming(1, { duration: 700 }),
          2,
          true,
        );
      }
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    navigation.navigate("MockupWizardFinalize", {
      wizardState: {
        ...wizardState,
        useCase: intent,
        adStyle,
        customScenePrompt: scenePrompt.trim(),
        sceneType: undefined,
        sceneSetting: undefined,
        platform: selectedPlatformId || undefined,
      },
    });
  };

  const adPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + adStylePulse.value * 0.5,
  }));

  const scenePromptRequiredStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + scenePromptPulse.value * 0.5,
  }));
  const platformRequiredStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + platformPulse.value * 0.5,
  }));

  const isBatch = wizardState.images.length > 1;

  return (
    <GradientBackground theme="home">
      <ThemedHeader title="Mockup Studio" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <ThemedText style={styles.stepLabel}>Step 3</ThemedText>
          <ThemedText style={styles.stepTitle}>Design Your Scene</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Describe exactly how you want your mockup to look.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Output goal</ThemedText>
          <View style={styles.intentRow}>
            {INTENTS.map((item) => {
              const isActive = intent === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleIntentChange(item.id)}
                  style={[styles.intentCard, isActive && styles.intentCardActive]}
                >
                  <ThemedText
                    style={[styles.intentLabel, isActive && styles.intentLabelActive]}
                  >
                    {item.label}
                  </ThemedText>
                  <ThemedText style={styles.intentDesc}>{item.description}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {showAdStyles && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <ThemedText style={styles.sectionLabel}>Advertise style</ThemedText>
              {!adStyle && (
                <Animated.View style={[styles.requiredBadge, adPulseStyle]}>
                  <ThemedText style={styles.requiredText}>Required</ThemedText>
                </Animated.View>
              )}
            </View>
            <View style={styles.segmentedControl}>
              {AD_STYLES.map((style, index) => {
                const isActive = adStyle === style.id;
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAdStyle(adStyle === style.id ? undefined : style.id);
                      setSelectedStarterId(undefined);
                    }}
                    style={[
                      styles.segment,
                      index > 0 && styles.segmentDivider,
                      isActive && styles.segmentActive,
                    ]}
                  >
                    <ThemedText
                      style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}
                    >
                      {style.label}
                    </ThemedText>
                    <ThemedText style={styles.segmentDesc}>{style.description}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <ThemedText style={styles.sectionLabel}>Describe your mockup scene</ThemedText>
            {!scenePrompt.trim() && (
              <Animated.View style={[styles.requiredBadge, scenePromptRequiredStyle]}>
                <ThemedText style={styles.requiredText}>Required</ThemedText>
              </Animated.View>
            )}
          </View>
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.inputText, styles.inputMultiline]}
              placeholder={SCENE_PROMPT_PLACEHOLDER}
              placeholderTextColor={Colors.light.textTertiary}
              value={scenePrompt}
              onChangeText={(text) =>
                setScenePrompt(text.length <= 480 ? text : text.slice(0, 480))
              }
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.scenePromptFooter}>
            <ThemedText style={styles.inputHint}>
              Include lighting, background, mood, and composition for best results.
            </ThemedText>
            <ThemedText style={styles.charCount}>{scenePrompt.length}/480</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Starter ideas</ThemedText>
          <ThemedText style={styles.sectionSubtext}>
            Suggestions adapt to the selected output goal and advertise style.
          </ThemedText>

          <View style={styles.startersGrid}>
            {starterExamples.map((starter) => {
              const isActive = selectedStarterId === starter.id;
              return (
                <Pressable
                  key={starter.id}
                  onPress={() => handleSelectStarter(starter)}
                  style={[styles.starterCard, isActive && styles.starterCardActive]}
                >
                  <ThemedText
                    style={[styles.starterTitle, isActive && styles.starterTitleActive]}
                  >
                    {starter.title}
                  </ThemedText>
                  <ThemedText style={styles.starterPrompt} numberOfLines={4}>
                    {getStarterCardDescription(starter)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <ThemedText style={styles.sectionLabel}>
              Platform Aspect Ratio
            </ThemedText>
            {!selectedPlatformId.trim() && (
              <Animated.View style={[styles.requiredBadge, platformRequiredStyle]}>
                <ThemedText style={styles.requiredText}>Required</ThemedText>
              </Animated.View>
            )}
          </View>
          <ThemedText style={styles.sectionSubtext}>
            Required. AI will generate using the selected platform AR.
          </ThemedText>
          <View style={styles.platformGrid}>
            {allPlatforms.map((platform) => (
              <PlatformChip
                key={platform.id}
                platform={platform}
                selected={selectedPlatformId === platform.id}
                onPress={() =>
                  setSelectedPlatformId((prev) =>
                    prev === platform.id ? "" : platform.id,
                  )
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        {isBatch && (
          <ThemedText style={styles.batchNote}>
            Applied to all {wizardState.images.length} images
          </ThemedText>
        )}
        <GradientButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          fullWidth
        />
      </View>
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
  stepHeader: {
    marginBottom: Spacing.md,
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionSubtext: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.sm,
  },
  requiredBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  intentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  intentCard: {
    flexGrow: 1,
    flexBasis: 100,
    minWidth: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  intentCardActive: {
    borderColor: Colors.light.primary,
    borderWidth: 1.5,
    backgroundColor: "#D8F1FB",
  },
  intentLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 2,
  },
  intentLabelActive: {
    color: Colors.light.primary,
  },
  intentDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.border,
  },
  segmentActive: {
    backgroundColor: "#D8F1FB",
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
  },
  segmentLabelActive: {
    color: Colors.light.primary,
  },
  segmentDesc: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputText: {
    color: Colors.light.text,
    fontSize: 14,
    lineHeight: 20,
  },
  inputMultiline: {
    minHeight: 136,
    maxHeight: 220,
  },
  scenePromptFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  inputHint: {
    flex: 1,
    fontSize: 10,
    color: Colors.light.textTertiary,
    lineHeight: 14,
  },
  charCount: {
    fontSize: 10,
    color: Colors.light.textTertiary,
  },
  startersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  starterCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  starterCardActive: {
    borderColor: Colors.light.primary,
    borderWidth: 1.5,
    backgroundColor: "#D8F1FB",
  },
  starterTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  starterTitleActive: {
    color: Colors.light.primary,
  },
  starterPrompt: {
    fontSize: 11,
    lineHeight: 15,
    color: Colors.light.textSecondary,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  batchNote: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
});

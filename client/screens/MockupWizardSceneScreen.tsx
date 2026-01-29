import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from "react-native-reanimated";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  MockupUseCase,
  MockupAdStyle,
  SCENE_TYPES,
  SCENE_SETTINGS,
} from "@/lib/mockup-presets";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardScene"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardScene">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = Spacing.sm;
const GRID_PADDING = Spacing.lg;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const INTENTS: { id: MockupUseCase; label: string; description: string }[] = [
  {
    id: "neutral",
    label: "Balanced",
    description: "Natural product presentation",
  },
  {
    id: "listing",
    label: "Listing",
    description: "Clean, retail-ready shot",
  },
  {
    id: "ad",
    label: "Advertise",
    description: "Marketing-ready creative",
  },
];

const AD_STYLES: { id: MockupAdStyle; label: string; description: string }[] = [
  { id: "simple", label: "Simple", description: "Tasteful and restrained" },
  {
    id: "exaggerated",
    label: "Exaggerated",
    description: "Bold and dramatic",
  },
  { id: "trending", label: "Trending", description: "Social-ready, punchy" },
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
  const [selectedSceneType, setSelectedSceneType] = useState<
    string | undefined
  >(wizardState.sceneType);
  const [selectedSetting, setSelectedSetting] = useState<string | undefined>(
    wizardState.sceneSetting,
  );
  const [sceneNotes, setSceneNotes] = useState(
    wizardState.customScenePrompt || "",
  );

  const previousIntentRef = useRef<MockupUseCase | undefined>(intent);
  const adStylePulse = useSharedValue(0);

  const showAdStyles = intent === "ad";
  const showSettings =
    selectedSceneType === "lifestyle" || selectedSceneType === "action";

  const indoorSettings = SCENE_SETTINGS.filter((s) => s.group === "indoor");
  const outdoorSettings = SCENE_SETTINGS.filter((s) => s.group === "outdoor");

  const canContinue =
    intent !== undefined &&
    selectedSceneType !== undefined &&
    (intent !== "ad" || adStyle !== undefined);

  const handleIntentChange = (id: MockupUseCase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntent(id);
    if (id !== "ad") {
      setAdStyle(undefined);
    } else if (previousIntentRef.current !== "ad" && !adStyle) {
      adStylePulse.value = withRepeat(
        withTiming(1, { duration: 600 }),
        4,
        true,
      );
    }
    previousIntentRef.current = id;
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("MockupWizardFinalize", {
      wizardState: {
        ...wizardState,
        useCase: intent,
        adStyle,
        sceneType: selectedSceneType,
        sceneSetting: showSettings ? selectedSetting : undefined,
        customScenePrompt: sceneNotes.trim() || undefined,
      },
    });
  };

  const adPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + adStylePulse.value * 0.5,
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
            Choose the look and feel for your mockup.
          </ThemedText>
        </View>

        {/* Use Case / Intent */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>What is this for?</ThemedText>
          <View style={styles.intentRow}>
            {INTENTS.map((item) => {
              const isActive = intent === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleIntentChange(item.id)}
                  style={[
                    styles.intentCard,
                    isActive && styles.intentCardActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.intentLabel,
                      isActive && styles.intentLabelActive,
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                  <ThemedText style={styles.intentDesc}>
                    {item.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Ad Style (conditional) */}
        {showAdStyles && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <ThemedText style={styles.sectionLabel}>
                Advertise style
              </ThemedText>
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
                      setAdStyle(style.id);
                    }}
                    style={[
                      styles.segment,
                      index > 0 && styles.segmentDivider,
                      isActive && styles.segmentActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.segmentLabel,
                        isActive && styles.segmentLabelActive,
                      ]}
                    >
                      {style.label}
                    </ThemedText>
                    <ThemedText style={styles.segmentDesc}>
                      {style.description}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Scene Type */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Scene type</ThemedText>
          <View style={styles.sceneGrid}>
            {SCENE_TYPES.map((scene) => {
              const isActive = selectedSceneType === scene.id;
              return (
                <Pressable
                  key={scene.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSceneType(scene.id);
                    if (scene.id !== "lifestyle" && scene.id !== "action") {
                      setSelectedSetting(undefined);
                    }
                  }}
                  style={[styles.sceneCard, isActive && styles.sceneCardActive]}
                >
                  <View
                    style={[
                      styles.sceneIcon,
                      isActive && styles.sceneIconActive,
                    ]}
                  >
                    <Feather
                      name={scene.icon as keyof typeof Feather.glyphMap}
                      size={18}
                      color={
                        isActive
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.sceneLabel,
                      isActive && styles.sceneLabelActive,
                    ]}
                  >
                    {scene.label}
                  </ThemedText>
                  <ThemedText style={styles.sceneDesc}>
                    {scene.description}
                  </ThemedText>
                  {isActive && (
                    <View style={styles.sceneCheck}>
                      <Feather
                        name="check"
                        size={14}
                        color={Colors.light.primary}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Setting (conditional) */}
        {showSettings && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>
              Setting{" "}
              <ThemedText style={styles.optionalHint}>(optional)</ThemedText>
            </ThemedText>

            <ThemedText style={styles.groupLabel}>Indoor</ThemedText>
            <View style={styles.chipRow}>
              {indoorSettings.map((setting) => {
                const isActive = selectedSetting === setting.id;
                return (
                  <Pressable
                    key={setting.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSetting(isActive ? undefined : setting.id);
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {setting.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText style={[styles.groupLabel, { marginTop: Spacing.sm }]}>
              Outdoor
            </ThemedText>
            <View style={styles.chipRow}>
              {outdoorSettings.map((setting) => {
                const isActive = selectedSetting === setting.id;
                return (
                  <Pressable
                    key={setting.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSetting(isActive ? undefined : setting.id);
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {setting.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Scene Notes */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>
            Scene notes{" "}
            <ThemedText style={styles.optionalHint}>(optional)</ThemedText>
          </ThemedText>
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.inputText, styles.inputMultiline]}
              placeholder="e.g., Warm morning light on a wooden shelf next to a plant"
              placeholderTextColor={Colors.light.textTertiary}
              value={sceneNotes}
              onChangeText={(text) =>
                setSceneNotes(text.length <= 150 ? text : text.slice(0, 150))
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          <ThemedText style={styles.charCount}>
            {sceneNotes.length}/150
          </ThemedText>
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
  optionalHint: {
    fontSize: 10,
    fontWeight: "400",
    textTransform: "none",
    letterSpacing: 0,
    color: Colors.light.textTertiary,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textTertiary,
    marginBottom: 4,
    marginTop: 2,
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

  // Intent cards
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

  // Segmented control
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

  // Scene type grid
  sceneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  sceneCard: {
    width: GRID_CARD_WIDTH,
    minHeight: 96,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    gap: 4,
  },
  sceneCardActive: {
    borderColor: Colors.light.primary,
    borderWidth: 1.5,
    backgroundColor: "#D8F1FB",
  },
  sceneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    marginBottom: 2,
  },
  sceneIconActive: {
    backgroundColor: "rgba(14, 165, 233, 0.18)",
  },
  sceneLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  sceneLabelActive: {
    color: Colors.light.primary,
  },
  sceneDesc: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  sceneCheck: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  chipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: "#D8F1FB",
  },
  chipText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: Colors.light.primary,
  },

  // Input
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  inputMultiline: {
    minHeight: 60,
  },
  charCount: {
    fontSize: 10,
    color: Colors.light.textTertiary,
    textAlign: "right",
    marginTop: 4,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  batchNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
});

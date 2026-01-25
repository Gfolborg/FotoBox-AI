import React, { useMemo } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  MOCKUP_CATEGORIES,
  SCENE_VIBES,
  CAMERA_OPTIONS,
  MODEL_OPTIONS,
  MockupItem,
} from "@/lib/mockup-presets";
import { getTemplateById } from "@/lib/mockup-templates";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardReview"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardReview">;

const CUSTOM_CATEGORY_ID = "custom";

const buildCustomItem = (name: string): MockupItem => ({
  id: "custom",
  label: name,
  description: `Custom product: ${name}`,
  hasColorPicker: true,
  defaultColors: ["#FFFFFF", "#000000", "#F97316", "#0EA5E9", "#22C55E"],
  image: null,
});

export default function MockupWizardReviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { wizardState } = route.params;

  const selections = useMemo(() => {
    const template = getTemplateById(wizardState.templateId);
    const category = MOCKUP_CATEGORIES.find(
      (item) => item.id === wizardState.productCategoryId,
    );
    const productItem =
      category?.items.find((item) => item.id === wizardState.productId) ||
      category?.items[0] ||
      (wizardState.productCategoryId === CUSTOM_CATEGORY_ID &&
      wizardState.customProductName
        ? buildCustomItem(wizardState.customProductName)
        : null);

    const vibe =
      SCENE_VIBES.find((item) => item.id === wizardState.vibeId) ||
      SCENE_VIBES[0];
    const camera =
      CAMERA_OPTIONS.find((item) => item.id === wizardState.cameraId) ||
      CAMERA_OPTIONS[0];
    const model =
      MODEL_OPTIONS.find((item) => item.id === wizardState.modelId) ||
      MODEL_OPTIONS[0];

    return {
      template,
      productItem,
      vibe,
      camera,
      model,
    };
  }, [wizardState]);

  const canGenerate =
    wizardState.images.length > 0 && selections.productItem !== null;

  const handleBack = () => {
    navigation.navigate("MockupWizardCustomize", { wizardState });
  };

  const handleGenerate = () => {
    if (!selections.productItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (wizardState.images.length === 1) {
      navigation.navigate("MockupProcessing", {
        imageUri: wizardState.images[0],
        mockupItem: selections.productItem,
        sceneVibe: selections.vibe,
        cameraOption: selections.camera,
        mockupColor: wizardState.productColor,
        customDescription: wizardState.additionalNotes,
        customScenePrompt: wizardState.customScenePrompt,
        negativePrompt: wizardState.negativePrompt,
        modelOption: selections.model,
      });
    } else {
      navigation.navigate("BatchMockupProcessing", {
        imageUris: wizardState.images,
        mockupItem: selections.productItem,
        sceneVibe: selections.vibe,
        cameraOption: selections.camera,
        mockupColor: wizardState.productColor,
        customDescription: wizardState.additionalNotes,
        customScenePrompt: wizardState.customScenePrompt,
        negativePrompt: wizardState.negativePrompt,
        modelOption: selections.model,
      });
    }
  };

  return (
    <GradientBackground theme="home">
      <ThemedHeader title="Mockup Studio" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <ThemedText style={styles.stepLabel}>Step 4 of 4</ThemedText>
          <ThemedText style={styles.stepTitle}>Review</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Check your selections before generating.
          </ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Images</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageRow}
        >
          {wizardState.images.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.thumbnail} />
          ))}
        </ScrollView>

        <GlassCard style={styles.summaryCard}>
          <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Template</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selections.template?.title || "Custom"}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Product</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selections.productItem?.label || "Select a product"}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Vibe</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selections.vibe.label}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Camera</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selections.camera.label}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Model</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selections.model.label}
              </ThemedText>
            </View>
            {wizardState.productColor ? (
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Color</ThemedText>
                <View style={styles.colorRow}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: wizardState.productColor },
                    ]}
                  />
                  <ThemedText style={styles.summaryValue}>
                    {wizardState.productColor}
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </View>

          {wizardState.customScenePrompt ? (
            <View style={styles.promptBlock}>
              <ThemedText style={styles.promptLabel}>Custom Scene</ThemedText>
              <ThemedText style={styles.promptText}>
                {wizardState.customScenePrompt}
              </ThemedText>
            </View>
          ) : null}
          {wizardState.negativePrompt ? (
            <View style={styles.promptBlock}>
              <ThemedText style={styles.promptLabel}>Avoid</ThemedText>
              <ThemedText style={styles.promptText}>
                {wizardState.negativePrompt}
              </ThemedText>
            </View>
          ) : null}
          {wizardState.additionalNotes ? (
            <View style={styles.promptBlock}>
              <ThemedText style={styles.promptLabel}>Notes</ThemedText>
              <ThemedText style={styles.promptText}>
                {wizardState.additionalNotes}
              </ThemedText>
            </View>
          ) : null}
        </GlassCard>

        {!canGenerate && (
          <View style={styles.warningRow}>
            <Feather name="alert-circle" size={16} color={Colors.light.error} />
            <ThemedText style={styles.warningText}>
              Select a product before generating your mockup.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <View style={styles.bottomRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </Pressable>
          <GradientButton
            title={`Generate Mockup${wizardState.images.length > 1 ? "s" : ""}`}
            onPress={handleGenerate}
            disabled={!canGenerate}
          />
        </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  imageRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  summaryItem: {
    width: "47%",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  promptBlock: {
    marginTop: Spacing.md,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  promptText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  warningRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  warningText: {
    fontSize: 12,
    color: Colors.light.error,
  },
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
  bottomRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "600",
  },
});

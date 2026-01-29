import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
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
  MockupUseCase,
  MockupAdStyle,
  SceneVibe,
  CameraOption,
  ModelOption,
} from "@/lib/mockup-presets";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardFinalize"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardFinalize">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_CARD_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3;

const CUSTOM_CATEGORY_ID = "custom";
const CUSTOM_PRODUCT_ITEM_ID = "custom-product";
const CAMERA_IDS: CameraOption["id"][] = [
  "closeup",
  "medium",
  "wide",
  "flatlay",
  "action",
  "handheld",
];

const MODEL_IDS: ModelOption["id"][] = ["hands", "female", "male", "diverse"];

const buildCustomItem = (name: string): MockupItem => ({
  id: "custom",
  label: name,
  description: `Custom product: ${name}`,
  hasColorPicker: true,
  defaultColors: ["#FFFFFF", "#000000", "#F97316", "#0EA5E9", "#22C55E"],
  image: null,
});

const getDefaultVibe = (vibeId?: string): SceneVibe =>
  SCENE_VIBES.find((item) => item.id === vibeId) || SCENE_VIBES[0];

const getDefaultCamera = (cameraId?: string): CameraOption =>
  CAMERA_OPTIONS.find((item) => item.id === cameraId) || CAMERA_OPTIONS[0];

const getDefaultModel = (modelId?: string): ModelOption =>
  MODEL_OPTIONS.find((item) => item.id === modelId) || MODEL_OPTIONS[0];

export default function MockupWizardFinalizeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { wizardState } = route.params;
  const category = useMemo(
    () =>
      MOCKUP_CATEGORIES.find(
        (item) => item.id === wizardState.productCategoryId,
      ),
    [wizardState.productCategoryId],
  );

  const isCustomCategory = wizardState.productCategoryId === CUSTOM_CATEGORY_ID;
  const initialItemId = category?.items?.[0]?.id;
  const [selectedItemId, setSelectedItemId] = useState(
    wizardState.customProductName && !isCustomCategory
      ? CUSTOM_PRODUCT_ITEM_ID
      : wizardState.productId || initialItemId,
  );
  const [customProductName, setCustomProductName] = useState(
    wizardState.customProductName || "",
  );

  const defaultCamera = getDefaultCamera(wizardState.cameraId);
  const [selectedCameraId, setSelectedCameraId] = useState<CameraOption["id"]>(
    defaultCamera.id,
  );

  const defaultModel = getDefaultModel(wizardState.modelId);
  const [includePeople, setIncludePeople] = useState(
    defaultModel.id !== "none",
  );
  const [selectedModelId, setSelectedModelId] = useState<ModelOption["id"]>(
    defaultModel.id !== "none" ? defaultModel.id : "hands",
  );

  const cameraOptions = useMemo(
    () => CAMERA_OPTIONS.filter((option) => CAMERA_IDS.includes(option.id)),
    [],
  );
  const modelOptions = useMemo(
    () => MODEL_OPTIONS.filter((option) => MODEL_IDS.includes(option.id)),
    [],
  );

  const resolvedProductItem: MockupItem | null = useMemo(() => {
    const isCustomItem =
      isCustomCategory || selectedItemId === CUSTOM_PRODUCT_ITEM_ID;
    if (isCustomItem) {
      return customProductName.trim()
        ? buildCustomItem(customProductName.trim())
        : null;
    }
    const selected =
      category?.items?.find((item) => item.id === selectedItemId) ||
      category?.items?.[0] ||
      null;
    return selected ?? null;
  }, [category, customProductName, isCustomCategory, selectedItemId]);

  const handleTogglePeople = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIncludePeople(value);
    if (!value) {
      setSelectedModelId("none");
      return;
    }
    if (selectedModelId === "none") {
      setSelectedModelId("hands");
    }
  };

  const handleGenerate = () => {
    if (!resolvedProductItem) return;

    const sceneVibe = getDefaultVibe(wizardState.vibeId);
    const camera =
      CAMERA_OPTIONS.find((item) => item.id === selectedCameraId) ||
      CAMERA_OPTIONS[0];
    const model =
      MODEL_OPTIONS.find((item) => item.id === selectedModelId) ||
      MODEL_OPTIONS[0];

    const mockupColor = wizardState.productColor;

    const useCase = wizardState.useCase as MockupUseCase | undefined;
    const adStyle = wizardState.adStyle as MockupAdStyle | undefined;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const baseParams = {
      mockupItem: resolvedProductItem,
      sceneVibe,
      cameraOption: camera,
      mockupColor,
      customDescription: wizardState.additionalNotes,
      modelOption: includePeople ? model : MODEL_OPTIONS[0],
      customScenePrompt: wizardState.customScenePrompt,
      negativePrompt: wizardState.negativePrompt,
      useCase,
      adStyle,
      productCategoryId: wizardState.productCategoryId,
      desiredMockup: wizardState.desiredMockup,
      templatePrompt: wizardState.templatePrompt,
      productMaterial: wizardState.productMaterial,
      productSize: wizardState.productSize,
      hasDesign: wizardState.hasDesign,
      sceneType: wizardState.sceneType,
      sceneSetting: wizardState.sceneSetting,
    };

    if (wizardState.images.length === 1) {
      navigation.navigate("MockupProcessing", {
        imageUri: wizardState.images[0],
        ...baseParams,
      });
      return;
    }

    navigation.navigate("BatchMockupProcessing", {
      imageUris: wizardState.images,
      ...baseParams,
    });
  };

  const canGenerate =
    Boolean(resolvedProductItem) &&
    Boolean(selectedCameraId) &&
    (includePeople ? selectedModelId !== "none" : true);

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
          <ThemedText style={styles.stepLabel}>
            {wizardState.mode === "custom" ? "Step 4" : "Step 3"}
          </ThemedText>
          <ThemedText style={styles.stepTitle}>Finalize Scene</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Confirm product type and camera framing.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Product type</ThemedText>
          {wizardState.mode === "custom" && wizardState.customProductName ? (
            <View style={styles.readOnlyCard}>
              <ThemedText style={styles.readOnlyText}>
                {wizardState.customProductName}
              </ThemedText>
            </View>
          ) : isCustomCategory ? (
            <View style={styles.inputCard}>
              <TextInput
                style={styles.inputText}
                placeholder="e.g., Ceramic candle jar"
                placeholderTextColor={Colors.light.textTertiary}
                value={customProductName}
                onChangeText={setCustomProductName}
              />
            </View>
          ) : (
            <View>
              <View style={styles.chipRow}>
                {category?.items?.map((item) => {
                  const isActive = selectedItemId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedItemId(item.id);
                      }}
                      style={[styles.chip, isActive && styles.chipActive]}
                    >
                      <ThemedText
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedItemId(CUSTOM_PRODUCT_ITEM_ID);
                  }}
                  style={[
                    styles.chip,
                    selectedItemId === CUSTOM_PRODUCT_ITEM_ID &&
                      styles.chipActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      selectedItemId === CUSTOM_PRODUCT_ITEM_ID &&
                        styles.chipTextActive,
                    ]}
                  >
                    Custom
                  </ThemedText>
                </Pressable>
              </View>
              {selectedItemId === CUSTOM_PRODUCT_ITEM_ID && (
                <View style={styles.inputCard}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g., Ceramic candle jar"
                    placeholderTextColor={Colors.light.textTertiary}
                    value={customProductName}
                    onChangeText={setCustomProductName}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Camera angle</ThemedText>
          <View style={styles.imageGrid}>
            {cameraOptions.map((option) => {
              const isActive = selectedCameraId === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCameraId(option.id);
                  }}
                  style={[styles.imageCard, isActive && styles.imageCardActive]}
                >
                  <Image
                    source={option.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.cardLabelContainer}>
                    <ThemedText
                      style={[
                        styles.cardLabel,
                        isActive && styles.cardLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </ThemedText>
                  </View>
                  {isActive && (
                    <View style={styles.cardCheck}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Include people</ThemedText>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => handleTogglePeople(false)}
              style={[
                styles.toggleOption,
                !includePeople && styles.toggleOptionActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.toggleText,
                  !includePeople && styles.toggleTextActive,
                ]}
              >
                No people
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => handleTogglePeople(true)}
              style={[
                styles.toggleOption,
                includePeople && styles.toggleOptionActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.toggleText,
                  includePeople && styles.toggleTextActive,
                ]}
              >
                Include people
              </ThemedText>
            </Pressable>
          </View>

          {includePeople && (
            <View style={styles.imageGrid}>
              {modelOptions.map((option) => {
                const isActive = selectedModelId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedModelId(option.id);
                    }}
                    style={[styles.imageCard, isActive && styles.imageCardActive]}
                  >
                    <Image
                      source={option.image}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.cardLabelContainer}>
                      <ThemedText
                        style={[
                          styles.cardLabel,
                          isActive && styles.cardLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {option.label}
                      </ThemedText>
                    </View>
                    {isActive && (
                      <View style={styles.cardCheck}>
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <GradientButton
          title="Generate"
          onPress={handleGenerate}
          disabled={!canGenerate}
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
  readOnlyCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(14, 165, 233, 0.06)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
  },
  inputText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  imageCard: {
    width: IMAGE_CARD_SIZE,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    overflow: "hidden",
  },
  imageCardActive: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  cardImage: {
    width: "100%",
    height: IMAGE_CARD_SIZE * 0.75,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  cardLabelContainer: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.text,
  },
  cardLabelActive: {
    color: Colors.light.primary,
  },
  cardCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  chipWide: {
    flexGrow: 1,
    flexBasis: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
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
  chipIcon: {
    width: 18,
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOptionActive: {
    backgroundColor: "#D8F1FB",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: Colors.light.primary,
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
});

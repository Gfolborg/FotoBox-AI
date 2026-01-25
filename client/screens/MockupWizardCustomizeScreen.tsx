import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
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
  SceneVibe,
  CameraOption,
  ModelOption,
} from "@/lib/mockup-presets";
import { MockupWizardState } from "@/lib/mockup-templates";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardCustomize"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardCustomize">;

const CUSTOM_CATEGORY_ID = "custom";

const getInitialItem = (
  categoryId?: string,
  productId?: string,
): MockupItem | null => {
  if (!categoryId || !productId) return null;
  const category = MOCKUP_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;
  return category.items.find((item) => item.id === productId) || null;
};

const getFirstItemForCategory = (categoryId?: string) => {
  if (!categoryId) return null;
  const category = MOCKUP_CATEGORIES.find((c) => c.id === categoryId);
  return category?.items?.[0] || null;
};

const getDefaultVibe = (vibeId?: string): SceneVibe =>
  SCENE_VIBES.find((item) => item.id === vibeId) || SCENE_VIBES[0];

const getDefaultCamera = (cameraId?: string): CameraOption =>
  CAMERA_OPTIONS.find((item) => item.id === cameraId) || CAMERA_OPTIONS[0];

const getDefaultModel = (modelId?: string): ModelOption =>
  MODEL_OPTIONS.find((item) => item.id === modelId) || MODEL_OPTIONS[0];

export default function MockupWizardCustomizeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { wizardState } = route.params;
  const initialItem =
    getInitialItem(wizardState.productCategoryId, wizardState.productId) ??
    getFirstItemForCategory(wizardState.productCategoryId);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    wizardState.productCategoryId || null,
  );
  const [selectedItem, setSelectedItem] = useState<MockupItem | null>(
    initialItem,
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    wizardState.productColor ||
      initialItem?.defaultColors?.[0] ||
      "#FFFFFF",
  );
  const [customProductName, setCustomProductName] = useState(
    wizardState.customProductName || "",
  );
  const [selectedVibe, setSelectedVibe] = useState<SceneVibe>(
    getDefaultVibe(wizardState.vibeId),
  );
  const [selectedCamera, setSelectedCamera] = useState<CameraOption>(
    getDefaultCamera(wizardState.cameraId),
  );
  const [selectedModel, setSelectedModel] = useState<ModelOption>(
    getDefaultModel(wizardState.modelId),
  );
  const [customScenePrompt, setCustomScenePrompt] = useState(
    wizardState.customScenePrompt || "",
  );
  const [negativePrompt, setNegativePrompt] = useState(
    wizardState.negativePrompt || "",
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    wizardState.additionalNotes || "",
  );

  React.useEffect(() => {
    if (!selectedCategory || selectedCategory === CUSTOM_CATEGORY_ID) return;
    if (selectedItem) return;
    const firstItem = getFirstItemForCategory(selectedCategory);
    if (firstItem) {
      setSelectedItem(firstItem);
      if (firstItem.defaultColors && firstItem.defaultColors.length > 0) {
        setSelectedColor(firstItem.defaultColors[0]);
      }
    }
  }, [selectedCategory, selectedItem]);

  const selectedCategoryData = useMemo(
    () => MOCKUP_CATEGORIES.find((c) => c.id === selectedCategory),
    [selectedCategory],
  );

  const customMockupItem: MockupItem | null = customProductName.trim()
    ? {
        id: "custom",
        label: customProductName.trim(),
        description: `Custom product: ${customProductName.trim()}`,
        hasColorPicker: true,
        defaultColors: ["#FFFFFF", "#000000", "#F97316", "#0EA5E9", "#22C55E"],
        image: null,
      }
    : null;

  const effectiveItem =
    selectedCategory === CUSTOM_CATEGORY_ID ? customMockupItem : selectedItem;

  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
    if (categoryId === CUSTOM_CATEGORY_ID) {
      setSelectedItem(null);
    } else {
      const firstItem = getFirstItemForCategory(categoryId);
      setSelectedItem(firstItem);
      if (firstItem?.defaultColors && firstItem.defaultColors.length > 0) {
        setSelectedColor(firstItem.defaultColors[0]);
      }
    }
    if (categoryId !== CUSTOM_CATEGORY_ID) {
      setCustomProductName("");
    }
  };

  const handleItemSelect = (item: MockupItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    if (item.defaultColors && item.defaultColors.length > 0) {
      setSelectedColor(item.defaultColors[0]);
    }
  };

  const handleColorSelect = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedColor(color);
  };

  const resolveSelectedItem = () => {
    if (selectedCategory === CUSTOM_CATEGORY_ID) return null;
    return selectedItem || getFirstItemForCategory(selectedCategory || undefined);
  };

  const handleBack = () => {
    const resolvedItem = resolveSelectedItem();
    navigation.navigate("MockupWizardTemplates", {
      wizardState: {
        ...wizardState,
        productCategoryId:
          selectedCategory === CUSTOM_CATEGORY_ID
            ? CUSTOM_CATEGORY_ID
            : selectedCategory || undefined,
        productId:
          selectedCategory === CUSTOM_CATEGORY_ID
            ? undefined
            : resolvedItem?.id,
        customProductName:
          selectedCategory === CUSTOM_CATEGORY_ID
            ? customProductName.trim()
            : undefined,
        productColor: selectedColor,
        vibeId: selectedVibe.id,
        cameraId: selectedCamera.id,
        modelId: selectedModel.id,
        customScenePrompt: customScenePrompt.trim() || undefined,
        negativePrompt: negativePrompt.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      },
    });
  };

  const handleNext = () => {
    const resolvedItem = resolveSelectedItem();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("MockupWizardReview", {
      wizardState: {
        ...wizardState,
        productCategoryId:
          selectedCategory === CUSTOM_CATEGORY_ID
            ? CUSTOM_CATEGORY_ID
            : selectedCategory || undefined,
        productId:
          selectedCategory === CUSTOM_CATEGORY_ID
            ? undefined
            : resolvedItem?.id,
        customProductName:
          selectedCategory === CUSTOM_CATEGORY_ID
            ? customProductName.trim()
            : undefined,
        productColor: selectedColor,
        vibeId: selectedVibe.id,
        cameraId: selectedCamera.id,
        modelId: selectedModel.id,
        customScenePrompt: customScenePrompt.trim() || undefined,
        negativePrompt: negativePrompt.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      },
    });
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepHeader}>
          <ThemedText style={styles.stepLabel}>Step 3 of 4</ThemedText>
          <ThemedText style={styles.stepTitle}>Customize</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Choose your product and fine-tune the scene.
          </ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Product Category</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {MOCKUP_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => handleCategorySelect(category.id)}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.categoryCardSelected,
              ]}
            >
              <View style={styles.categoryIconContainer}>
                <Feather
                  name={category.icon as keyof typeof Feather.glyphMap}
                  size={22}
                  color={
                    selectedCategory === category.id
                      ? Colors.light.white
                      : Colors.light.primary
                  }
                />
              </View>
              <ThemedText
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id &&
                    styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </ThemedText>
            </Pressable>
          ))}
          <Pressable
            onPress={() => handleCategorySelect(CUSTOM_CATEGORY_ID)}
            style={[
              styles.categoryCard,
              selectedCategory === CUSTOM_CATEGORY_ID &&
                styles.categoryCardSelected,
            ]}
          >
            <View style={styles.categoryIconContainer}>
              <Feather
                name="edit-3"
                size={22}
                color={
                  selectedCategory === CUSTOM_CATEGORY_ID
                    ? Colors.light.white
                    : Colors.light.primary
                }
              />
            </View>
            <ThemedText
              style={[
                styles.categoryLabel,
                selectedCategory === CUSTOM_CATEGORY_ID &&
                  styles.categoryLabelSelected,
              ]}
            >
              Custom
            </ThemedText>
          </Pressable>
        </ScrollView>

        {selectedCategory === CUSTOM_CATEGORY_ID && (
          <View style={styles.customBlock}>
            <ThemedText style={styles.sectionTitle}>
              Describe Your Product
            </ThemedText>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., skateboard, yoga mat, water bottle..."
                placeholderTextColor={Colors.light.textTertiary}
                value={customProductName}
                onChangeText={setCustomProductName}
              />
            </GlassCard>
          </View>
        )}

        {selectedCategoryData && (
          <View style={styles.productsBlock}>
            <ThemedText style={styles.sectionTitle}>Select Product</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productRow}
            >
              {selectedCategoryData.items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemSelect(item)}
                  style={[
                    styles.productCard,
                    selectedItem?.id === item.id && styles.productCardSelected,
                  ]}
                >
                  {item.image && (
                    <Image
                      source={item.image}
                      style={styles.productImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                      placeholder={{ blurhash: item.blurhash }}
                    />
                  )}
                  <View style={styles.productOverlay}>
                    <ThemedText style={styles.productLabel}>
                      {item.label}
                    </ThemedText>
                  </View>
                  {selectedItem?.id === item.id && (
                    <View style={styles.selectedCheckmark}>
                      <Feather
                        name="check"
                        size={16}
                        color={Colors.light.white}
                      />
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {effectiveItem?.hasColorPicker && (
          <View style={styles.colorBlock}>
            <ThemedText style={styles.sectionTitle}>Product Color</ThemedText>
            <View style={styles.colorRow}>
              {effectiveItem.defaultColors?.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => handleColorSelect(color)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSwatchSelected,
                    color === "#FFFFFF" && styles.colorSwatchWhite,
                  ]}
                >
                  {selectedColor === color && (
                    <Feather
                      name="check"
                      size={16}
                      color={color === "#FFFFFF" ? "#000" : "#FFF"}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <ThemedText style={styles.sectionTitle}>Scene Vibe</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionRow}
        >
          {SCENE_VIBES.map((vibe) => (
            <Pressable
              key={vibe.id}
              onPress={() => setSelectedVibe(vibe)}
              style={[
                styles.optionCard,
                selectedVibe.id === vibe.id && styles.optionCardSelected,
              ]}
            >
              <Image
                source={vibe.image}
                style={styles.optionImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: vibe.blurhash }}
              />
              <View style={styles.optionOverlay}>
                <ThemedText style={styles.optionLabel}>{vibe.label}</ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <ThemedText style={styles.sectionTitle}>Camera Angle</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionRow}
        >
          {CAMERA_OPTIONS.map((camera) => (
            <Pressable
              key={camera.id}
              onPress={() => setSelectedCamera(camera)}
              style={[
                styles.optionCard,
                selectedCamera.id === camera.id && styles.optionCardSelected,
              ]}
            >
              <Image
                source={camera.image}
                style={styles.optionImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: camera.blurhash }}
              />
              <View style={styles.optionOverlay}>
                <ThemedText style={styles.optionLabel}>
                  {camera.label}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <ThemedText style={styles.sectionTitle}>Include People</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionRow}
        >
          {MODEL_OPTIONS.map((model) => (
            <Pressable
              key={model.id}
              onPress={() => setSelectedModel(model)}
              style={[
                styles.optionCard,
                selectedModel.id === model.id && styles.optionCardSelected,
              ]}
            >
              <Image
                source={model.image}
                style={styles.optionImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: model.blurhash }}
              />
              <View style={styles.optionOverlay}>
                <ThemedText style={styles.optionLabel}>
                  {model.label}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <ThemedText style={styles.sectionTitle}>Advanced Notes</ThemedText>
        <GlassCard style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Add specific details for your scene..."
            placeholderTextColor={Colors.light.textTertiary}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        <GlassCard style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Describe a custom scene (optional)"
            placeholderTextColor={Colors.light.textTertiary}
            value={customScenePrompt}
            onChangeText={setCustomScenePrompt}
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        <GlassCard style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Avoid (e.g., hands, text, clutter)"
            placeholderTextColor={Colors.light.textTertiary}
            value={negativePrompt}
            onChangeText={setNegativePrompt}
            multiline
            numberOfLines={2}
          />
        </GlassCard>
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
          <GradientButton title="Review" onPress={handleNext} />
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
  categoryRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  categoryCard: {
    width: 90,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryIconContainer: {
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
  },
  categoryLabelSelected: {
    color: Colors.light.white,
  },
  customBlock: {
    marginTop: Spacing.sm,
  },
  productsBlock: {
    marginTop: Spacing.sm,
  },
  productRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  productCard: {
    width: 100,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  productCardSelected: {
    borderColor: Colors.light.primary,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  productLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.white,
    textAlign: "center",
  },
  selectedCheckmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  colorBlock: {
    marginTop: Spacing.sm,
  },
  colorRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  colorSwatchWhite: {
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  optionRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  optionCard: {
    width: 120,
    height: 90,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: Colors.light.primary,
  },
  optionImage: {
    width: "100%",
    height: "100%",
  },
  optionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.white,
    textAlign: "center",
  },
  inputCard: {
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  textInput: {
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 50,
    textAlignVertical: "top",
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

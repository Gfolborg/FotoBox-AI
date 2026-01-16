import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeInDown, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { ScrollIndicator } from "@/components/ScrollIndicator";
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

type MockupSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupSelection"
>;

type MockupSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  "MockupSelection"
>;

type TabType = "product" | "style" | "camera" | "model";

export default function MockupSelectionScreen() {
  const navigation = useNavigation<MockupSelectionScreenNavigationProp>();
  const route = useRoute<MockupSelectionScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const initialImageUris = route.params?.imageUris || [];
  const initialImageUri = route.params?.imageUri;

  const [imageUris, setImageUris] = useState<string[]>(
    initialImageUri ? [initialImageUri] : initialImageUris
  );
  const [activeTab, setActiveTab] = useState<TabType>("product");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MockupItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#FFFFFF");
  const [selectedVibe, setSelectedVibe] = useState<SceneVibe>(SCENE_VIBES[0]);
  const [selectedCamera, setSelectedCamera] = useState<CameraOption>(CAMERA_OPTIONS[0]);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODEL_OPTIONS[0]);
  const [customDescription, setCustomDescription] = useState("");
  const [customProductName, setCustomProductName] = useState("");

  const handleSelectImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUris(result.assets.map((asset) => asset.uri));
    }
  };

  const handleRemoveImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
    setSelectedItem(null);
    if (categoryId !== "custom") {
      setCustomProductName("");
    }
  };

  const customMockupItem: MockupItem | null = customProductName.trim() ? {
    id: "custom",
    label: customProductName.trim(),
    description: `Custom product: ${customProductName.trim()}`,
    hasColorPicker: true,
    defaultColors: ["#FFFFFF", "#000000", "#F97316", "#0EA5E9", "#22C55E"],
    image: null,
  } : null;

  const handleItemSelect = (item: MockupItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    if (item.defaultColors && item.defaultColors.length > 0) {
      setSelectedColor(item.defaultColors[0]);
    }
  };

  const handleVibeSelect = (vibe: SceneVibe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVibe(vibe);
  };

  const handleCameraSelect = (camera: CameraOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCamera(camera);
  };

  const handleModelSelect = (model: ModelOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedModel(model);
  };

  const handleColorSelect = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedColor(color);
  };

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleGenerate = () => {
    if (!effectiveItem || imageUris.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (imageUris.length === 1) {
      navigation.navigate("MockupProcessing", {
        imageUri: imageUris[0],
        mockupItem: effectiveItem,
        sceneVibe: selectedVibe,
        cameraOption: selectedCamera,
        mockupColor: effectiveItem.hasColorPicker ? selectedColor : undefined,
        customDescription: customDescription || undefined,
        modelOption: selectedModel,
      });
    } else {
      navigation.navigate("BatchMockupProcessing", {
        imageUris,
        mockupItem: effectiveItem,
        sceneVibe: selectedVibe,
        cameraOption: selectedCamera,
        mockupColor: effectiveItem.hasColorPicker ? selectedColor : undefined,
        customDescription: customDescription || undefined,
        modelOption: selectedModel,
      });
    }
  };

  const selectedCategoryData = MOCKUP_CATEGORIES.find(
    (c) => c.id === selectedCategory
  );

  const effectiveItem = selectedCategory === "custom" ? customMockupItem : selectedItem;
  const canGenerate = effectiveItem && imageUris.length > 0;

  const renderProductTab = () => (
    <Animated.View
      entering={FadeInRight.duration(300)}
      exiting={FadeOutLeft.duration(200)}
    >
      <ThemedText style={styles.sectionTitle}>Select Category</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
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
                name={category.icon as any}
                size={24}
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
                selectedCategory === category.id && styles.categoryLabelSelected,
              ]}
            >
              {category.label}
            </ThemedText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => handleCategorySelect("custom")}
          style={[
            styles.categoryCard,
            selectedCategory === "custom" && styles.categoryCardSelected,
          ]}
        >
          <View style={styles.categoryIconContainer}>
            <Feather
              name="edit-3"
              size={24}
              color={
                selectedCategory === "custom"
                  ? Colors.light.white
                  : Colors.light.primary
              }
            />
          </View>
          <ThemedText
            style={[
              styles.categoryLabel,
              selectedCategory === "custom" && styles.categoryLabelSelected,
            ]}
          >
            Custom
          </ThemedText>
        </Pressable>
      </ScrollView>

      {selectedCategory === "custom" && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <ThemedText style={styles.sectionTitle}>Describe Your Product</ThemedText>
          <GlassCard style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., skateboard, yoga mat, water bottle..."
              placeholderTextColor={Colors.light.textTertiary}
              value={customProductName}
              onChangeText={setCustomProductName}
              autoFocus
            />
          </GlassCard>
          {customMockupItem && (
            <View style={styles.colorPickerSection}>
              <ThemedText style={styles.sectionTitle}>Product Color</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorScroll}
              >
                {customMockupItem.defaultColors?.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => handleColorSelect(color)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorSwatchSelected,
                    ]}
                  >
                    {selectedColor === color && (
                      <Feather name="check" size={16} color={color === "#FFFFFF" ? "#000" : "#FFF"} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {selectedCategoryData && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <ThemedText style={styles.sectionTitle}>Select Product</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemScroll}
          >
            {selectedCategoryData.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleItemSelect(item)}
                style={[
                  styles.itemCardWithImage,
                  selectedItem?.id === item.id && styles.itemCardSelected,
                ]}
              >
                {item.image && (
                  <Image
                    source={item.image}
                    style={styles.itemPreviewImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.itemCardOverlay}>
                  <ThemedText
                    style={[
                      styles.itemLabel,
                      selectedItem?.id === item.id && styles.itemLabelSelected,
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                </View>
                {selectedItem?.id === item.id && (
                  <View style={styles.selectedCheckmark}>
                    <Feather name="check" size={16} color={Colors.light.white} />
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {selectedItem?.hasColorPicker && selectedItem.defaultColors && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <ThemedText style={styles.sectionTitle}>Product Color</ThemedText>
          <View style={styles.colorRow}>
            {selectedItem.defaultColors.map((color) => (
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
                    size={18}
                    color={color === "#FFFFFF" || color === "#F5F5DC" ? "#000" : "#FFF"}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderStyleTab = () => (
    <Animated.View
      entering={FadeInRight.duration(300)}
      exiting={FadeOutLeft.duration(200)}
    >
      <ThemedText style={styles.sectionTitle}>Scene Vibe</ThemedText>
      <ThemedText style={styles.sectionSubtitle}>
        Choose a mood that matches your brand energy
      </ThemedText>

      <View style={styles.vibeGrid}>
        {SCENE_VIBES.map((vibe) => (
          <Pressable
            key={vibe.id}
            onPress={() => handleVibeSelect(vibe)}
            style={[
              styles.vibeCardWithImage,
              selectedVibe.id === vibe.id && styles.vibeCardSelected,
            ]}
          >
            {vibe.image && (
              <Image
                source={vibe.image}
                style={styles.vibePreviewImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.vibeCardOverlay}>
              <ThemedText
                style={[
                  styles.vibeLabel,
                  selectedVibe.id === vibe.id && styles.vibeLabelSelected,
                ]}
              >
                {vibe.label}
              </ThemedText>
            </View>
            {selectedVibe.id === vibe.id && (
              <View style={styles.selectedCheckmark}>
                <Feather name="check" size={16} color={Colors.light.white} />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
        Custom Description (Optional)
      </ThemedText>
      <GlassCard style={styles.inputCard}>
        <TextInput
          style={styles.textInput}
          placeholder="Add specific details for your scene..."
          placeholderTextColor={Colors.light.textTertiary}
          value={customDescription}
          onChangeText={setCustomDescription}
          multiline
          numberOfLines={3}
        />
      </GlassCard>
    </Animated.View>
  );

  const renderCameraTab = () => (
    <Animated.View
      entering={FadeInRight.duration(300)}
      exiting={FadeOutLeft.duration(200)}
    >
      <ThemedText style={styles.sectionTitle}>Camera Angle</ThemedText>
      <ThemedText style={styles.sectionSubtitle}>
        Choose how your product will be photographed
      </ThemedText>

      <View style={styles.cameraGrid}>
        {CAMERA_OPTIONS.map((camera) => (
          <Pressable
            key={camera.id}
            onPress={() => handleCameraSelect(camera)}
            style={[
              styles.cameraCardWithImage,
              selectedCamera.id === camera.id && styles.cameraCardSelected,
            ]}
          >
            {camera.image && (
              <Image
                source={camera.image}
                style={styles.cameraPreviewImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.cameraCardOverlay}>
              <ThemedText
                style={[
                  styles.cameraLabel,
                  selectedCamera.id === camera.id && styles.cameraLabelSelected,
                ]}
              >
                {camera.label}
              </ThemedText>
            </View>
            {selectedCamera.id === camera.id && (
              <View style={styles.selectedCheckmark}>
                <Feather name="check" size={16} color={Colors.light.white} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  const renderModelTab = () => (
    <Animated.View
      entering={FadeInRight.duration(300)}
      exiting={FadeOutLeft.duration(200)}
    >
      <ThemedText style={styles.sectionTitle}>Include People</ThemedText>
      <ThemedText style={styles.sectionSubtitle}>
        Add models to your mockup for an advertisement-style look
      </ThemedText>

      <View style={styles.modelGrid}>
        {MODEL_OPTIONS.map((model) => (
          <Pressable
            key={model.id}
            onPress={() => handleModelSelect(model)}
            style={[
              styles.modelCardWithImage,
              selectedModel.id === model.id && styles.modelCardSelected,
            ]}
          >
            <View style={styles.modelIconContainer}>
              <Feather
                name={model.icon as any}
                size={28}
                color={selectedModel.id === model.id ? Colors.light.white : Colors.light.primary}
              />
            </View>
            <ThemedText
              style={[
                styles.modelLabel,
                selectedModel.id === model.id && styles.modelLabelSelected,
              ]}
            >
              {model.label}
            </ThemedText>
            <ThemedText
              style={[
                styles.modelDescription,
                selectedModel.id === model.id && styles.modelDescriptionSelected,
              ]}
            >
              {model.description}
            </ThemedText>
            {selectedModel.id === model.id && (
              <View style={styles.selectedCheckmarkModel}>
                <Feather name="check" size={16} color={Colors.light.white} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <GradientBackground variant="warm">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText style={styles.sectionTitle}>Your Images</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageRow}
        >
          {imageUris.map((uri, index) => (
            <Animated.View
              key={uri}
              entering={FadeInDown.delay(index * 50).duration(300)}
              style={styles.imageContainer}
            >
              <Image source={{ uri }} style={styles.thumbnail} />
              <Pressable
                onPress={() => handleRemoveImage(index)}
                style={styles.removeButton}
              >
                <Feather name="x" size={14} color="#FFF" />
              </Pressable>
            </Animated.View>
          ))}
          <Pressable onPress={handleSelectImages} style={styles.addImageButton}>
            <Feather name="plus" size={24} color={Colors.light.primary} />
            <ThemedText style={styles.addImageText}>
              {imageUris.length === 0 ? "Select" : "Add"}
            </ThemedText>
          </Pressable>
        </ScrollView>
        {imageUris.length > 0 && (
          <ThemedText style={styles.imageCount}>
            {imageUris.length} image{imageUris.length > 1 ? "s" : ""} selected (max 10)
          </ThemedText>
        )}

        <View style={styles.tabBar}>
          {(["product", "style", "camera", "model"] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => handleTabChange(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Feather
                name={
                  tab === "product"
                    ? "box"
                    : tab === "style"
                    ? "sun"
                    : tab === "camera"
                    ? "aperture"
                    : "users"
                }
                size={16}
                color={
                  activeTab === tab
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === "product"
                  ? "Product"
                  : tab === "style"
                  ? "Style"
                  : tab === "camera"
                  ? "Camera"
                  : "Model"}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === "product" && renderProductTab()}
          {activeTab === "style" && renderStyleTab()}
          {activeTab === "camera" && renderCameraTab()}
          {activeTab === "model" && renderModelTab()}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <View style={styles.selectionSummary}>
          {effectiveItem && (
            <ThemedText style={styles.summaryText}>
              {effectiveItem.label} • {selectedVibe.label} • {selectedModel.id !== "none" ? selectedModel.label : selectedCamera.label}
            </ThemedText>
          )}
        </View>
        <GradientButton
          title={`Generate Mockup${imageUris.length > 1 ? "s" : ""}`}
          onPress={handleGenerate}
          disabled={!canGenerate}
          style={styles.generateButton}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  imageRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  imageContainer: {
    position: "relative",
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.error,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249, 115, 22, 0.05)",
  },
  addImageText: {
    fontSize: 11,
    color: Colors.light.primary,
    marginTop: 2,
  },
  imageCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    gap: 6,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.primary,
  },
  tabContent: {
    minHeight: 300,
  },
  categoryScroll: {
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
  itemScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  itemCard: {
    width: 110,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemCardWithImage: {
    width: 100,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  itemPreviewImage: {
    width: "100%",
    height: "100%",
  },
  itemCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  itemCardSelected: {
    borderColor: Colors.light.primary,
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
  itemIconContainer: {
    marginBottom: Spacing.xs,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.white,
    textAlign: "center",
  },
  itemLabelSelected: {
    color: Colors.light.white,
  },
  itemDescription: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  itemDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  colorPickerSection: {
    marginTop: Spacing.md,
  },
  colorScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
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
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  vibeCard: {
    width: "48%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  vibeCardWithImage: {
    width: "48%",
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  vibePreviewImage: {
    width: "100%",
    height: "100%",
  },
  vibeCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  vibeCardSelected: {
    borderColor: Colors.light.primary,
  },
  vibeIconContainer: {
    marginBottom: Spacing.xs,
  },
  vibeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.white,
    textAlign: "center",
  },
  vibeLabelSelected: {
    color: Colors.light.white,
  },
  vibeDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 14,
  },
  vibeDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  inputCard: {
    padding: Spacing.md,
  },
  textInput: {
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  cameraGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  cameraCard: {
    width: "31%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cameraCardWithImage: {
    width: "31%",
    height: 90,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  cameraPreviewImage: {
    width: "100%",
    height: "100%",
  },
  cameraCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cameraCardSelected: {
    borderColor: Colors.light.primary,
  },
  cameraLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.light.white,
    textAlign: "center",
  },
  cameraLabelSelected: {
    color: Colors.light.white,
  },
  cameraDescription: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  cameraDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  modelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  modelCardWithImage: {
    width: "48%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  modelCardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  modelIconContainer: {
    marginBottom: Spacing.sm,
  },
  modelLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 4,
  },
  modelLabelSelected: {
    color: Colors.light.white,
  },
  modelDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 14,
  },
  modelDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  selectedCheckmarkModel: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
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
  selectionSummary: {
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  generateButton: {
    width: "100%",
  },
});

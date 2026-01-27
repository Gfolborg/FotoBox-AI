import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  FlatList,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, StackActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { ProgressRing } from "@/components/ProgressRing";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { PlatformChip } from "@/components/PlatformChip";
import { ProcessingTips, DEFAULT_PROCESSING_TIPS } from "@/components/ProcessingTips";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { SCENES, Scene } from "@/lib/lifestyle-scenes";
import { getAllPlatforms } from "@/lib/platform-requirements";
import { usePromptHistory } from "@/hooks/usePromptHistory";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = Math.min(SCREEN_WIDTH - Spacing.lg * 2, 320);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "EnvironmentSelection">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SCENE_GRADIENTS: Record<string, [string, string]> = {
  kitchen: ["#4A5D23", "#2D3618"],
  living: ["#8B6914", "#5C4610"],
  office: ["#2D4A6B", "#1A2D42"],
  bedroom: ["#4A3D5C", "#2D2538"],
  bathroom: ["#3D5C5C", "#253838"],
  dining: ["#6B4A2D", "#422D1A"],
  cafe: ["#5C4A3D", "#382D25"],
  outdoor: ["#4A6B3D", "#2D4225"],
  park: ["#3D6B4A", "#25422D"],
  trail: ["#5C5C3D", "#383825"],
  beach: ["#3D5C6B", "#253842"],
  garden: ["#4A5C3D", "#2D3825"],
  urban: ["#4A4A5C", "#2D2D38"],
  industrial: ["#5C5C5C", "#383838"],
  studio: ["#3D3D4A", "#25252D"],
  minimal: ["#4A4A4A", "#2D2D2D"],
  lifestyle: ["#5C4A5C", "#382D38"],
  gym: ["#5C3D3D", "#382525"],
  garage: ["#4A4A3D", "#2D2D25"],
  playroom: ["#5C5C3D", "#383825"],
};

function SceneCard({
  scene,
  selected,
  onPress,
  index,
}: {
  scene: Scene;
  selected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => (scale.value = withSpring(0.95))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[styles.sceneCardWrapper, animatedStyle]}
    >
      <View style={[styles.sceneCard, selected && styles.sceneCardSelected]}>
        <Image
          source={scene.image}
          style={styles.sceneImage}
          resizeMode="cover"
        />
        {selected && (
          <View style={styles.selectedCheck}>
            <Feather name="check" size={12} color="#fff" />
          </View>
        )}
      </View>
      <ThemedText
        style={[styles.sceneLabel, selected && styles.sceneLabelSelected]}
        numberOfLines={2}
      >
        {scene.label}
      </ThemedText>
    </AnimatedPressable>
  );
}

export default function EnvironmentSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const flatListRef = React.useRef<FlatList>(null);

  const initialImages =
    route.params?.imageUris ||
    (route.params?.imageUri ? [route.params.imageUri] : []);
  const [selectedImages, setSelectedImages] = useState<string[]>(initialImages);
  const [customScene, setCustomScene] = useState("");
  const [productKeywords, setProductKeywords] = useState("");
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [selectedShadowControl, setSelectedShadowControl] =
    useState<string>("natural");
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSceneError, setShowSceneError] = useState(false);
  const { history: promptHistory, addToHistory } = usePromptHistory();

  const isBatchMode = selectedImages.length > 1;
  const imageUri = selectedImages[0] || null;
  const allPlatforms = getAllPlatforms();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (selectedImages.length === 0) {
      handlePickImages();
    }
  }, []);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImages(result.assets.map((a) => a.uri).slice(0, 10));
    } else if (selectedImages.length === 0) {
      navigation.goBack();
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      selectionLimit: 1,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImages([result.assets[0].uri]);
    }
  };

  const handleSelectSceneCard = (sceneId: string) => {
    setShowSceneError(false);
    if (selectedScene === sceneId) {
      setSelectedScene("");
      setCustomScene("");
    } else {
      const scene = SCENES.find((s) => s.id === sceneId);
      if (scene) {
        setCustomScene(scene.description);
      }
      setSelectedScene(sceneId);
    }
  };

  const handleGenerate = async () => {
    if (selectedImages.length === 0) return;
    if (!customScene.trim() && !selectedScene) {
      setShowSceneError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const environmentText = customScene.trim() || selectedScene;
    if (customScene.trim()) {
      addToHistory(customScene.trim());
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isBatchMode) {
      navigation.replace("BatchLifestyleProcessing", {
        imageUris: selectedImages,
        environment: environmentText,
        isCustom: Boolean(customScene.trim()),
        productDescription: productKeywords.trim() || undefined,
        shadowControl:
          selectedShadowControl !== "natural"
            ? selectedShadowControl
            : undefined,
        platform: selectedPlatformId || undefined,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      let endpoint = `${apiUrl}api/lifestyle-scene`;
      const params = new URLSearchParams();

      if (customScene.trim()) {
        params.append("environment", customScene.trim());
        params.append("isCustom", "true");
      } else if (selectedScene) {
        params.append("environment", selectedScene);
      }

      if (productKeywords.trim()) {
        params.append("productDescription", productKeywords.trim());
      }

      if (selectedShadowControl !== "natural") {
        params.append("shadowControl", selectedShadowControl);
      }
      if (selectedPlatformId) {
        params.append("platform", selectedPlatformId);
      }

      endpoint += `?${params.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate lifestyle scene");
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = () => {
        const base64data = reader.result as string;
        navigation.replace("LifestyleResult", {
          resultUri: base64data,
          originalUri: imageUri!,
          environment: customScene.trim() || selectedScene,
          isCustom: Boolean(customScene.trim()),
          productDescription: productKeywords.trim() || undefined,
          shadowControl:
            selectedShadowControl !== "natural"
              ? selectedShadowControl
              : undefined,
          platform: selectedPlatformId || undefined,
        });
      };

      reader.onerror = () => {
        throw new Error("Failed to read generated image");
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      let errorMessage = "An unexpected error occurred";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }

      if (Platform.OS !== "web") {
        Alert.alert("Generation Failed", errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const shadowOptions = [
    { id: "natural", label: "Natural" },
    { id: "no shadows", label: "None" },
    { id: "subtle shadows", label: "Subtle" },
    { id: "prominent shadows", label: "Strong" },
  ];

  const handleBack = () => {
    if (route.params?.returnToBatch) {
      const state = navigation.getState();
      const routes = state.routes;
      const batchIndex = [...routes]
        .map((r) => r.name)
        .lastIndexOf("BatchLifestyleResult");
      if (batchIndex >= 0) {
        const popCount = routes.length - 1 - batchIndex;
        if (popCount > 0) {
          navigation.dispatch(StackActions.pop(popCount));
          return;
        }
      }
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("Home");
  };

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />
      <ThemedHeader title="Lifestyle Scene" onBack={handleBack} />
      <View style={[styles.container, { paddingTop: insets.top + 54 }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Preview Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.imageSection}
          >
            {isBatchMode ? (
              <View style={styles.batchImageGrid}>
                {selectedImages.slice(0, 4).map((uri, idx) => (
                  <View key={uri} style={styles.batchImageItem}>
                    <Image source={{ uri }} style={styles.batchImage} />
                    {idx === 3 && selectedImages.length > 4 && (
                      <View style={styles.moreOverlay}>
                        <ThemedText style={styles.moreText}>
                          +{selectedImages.length - 4}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                ))}
                <Pressable
                  style={styles.addMoreBatchButton}
                  onPress={handlePickImage}
                >
                  <Feather
                    name="plus"
                    size={24}
                    color={Colors.editing.primary}
                  />
                  <ThemedText style={styles.addMoreBatchText}>Add</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handlePickImage} style={styles.imageWrapper}>
                {imageUri ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.previewImage}
                    />
                    <View style={styles.changeImageBadge}>
                      <Feather
                        name="camera"
                        size={15}
                        color="#FFFFFF"
                      />
                      <ThemedText style={styles.changeImageText}>
                        Change
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <GlassCard theme="light" padding="xl" borderRadius="xl">
                    <View style={styles.placeholderContainer}>
                      <Feather
                        name="image"
                        size={48}
                        color={Colors.editing.textTertiary}
                      />
                      <ThemedText style={styles.placeholderText}>
                        Select a product image
                      </ThemedText>
                    </View>
                  </GlassCard>
                )}
              </Pressable>
            )}
            {isBatchMode && (
              <ThemedText style={styles.batchCountText}>
                {selectedImages.length} images selected
              </ThemedText>
            )}
          </Animated.View>

          {/* Scene Description Input */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Feather name="edit-3" size={18} color={Colors.editing.primary} />
              <ThemedText style={styles.sectionTitle}>
                Describe Your Scene
              </ThemedText>
            </View>
            <ThemedText style={styles.sectionSubtitle}>
              Be descriptive for the best results
            </ThemedText>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., On a marble countertop next to a plant"
                placeholderTextColor={Colors.editing.textTertiary}
                value={customScene}
                onChangeText={(text) => {
                  setCustomScene(text);
                  if (text.trim()) setShowSceneError(false);
                }}
                multiline={false}
                returnKeyType="done"
              />
            </View>

            {promptHistory.length > 0 && (
              <View style={styles.historyContainer}>
                <ThemedText style={styles.historyLabel}>Recent</ThemedText>
                <View style={styles.historyScrollWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.historyScroll}
                  >
                    {promptHistory.slice(0, 5).map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.historyChip}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          setCustomScene(item.prompt);
                          setSelectedScene("");
                          setShowSceneError(false);
                        }}
                      >
                        <Feather
                          name="clock"
                          size={12}
                          color={Colors.editing.textSecondary}
                        />
                        <ThemedText
                          style={styles.historyChipText}
                          numberOfLines={1}
                        >
                          {item.prompt.length > 30
                            ? item.prompt.slice(0, 30) + "..."
                            : item.prompt}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {promptHistory.length > 2 && (
                    <ScrollIndicator direction="right" delay={1500} />
                  )}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Product Keywords Input */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Feather name="tag" size={18} color={Colors.editing.secondary} />
              <ThemedText style={styles.sectionTitle}>
                Product Keywords
              </ThemedText>
              <ThemedText style={styles.optionalBadge}>Optional</ThemedText>
            </View>
            <ThemedText style={styles.sectionSubtitle}>
              Helps the AI understand your product better
            </ThemedText>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., red glossy lipstick"
                placeholderTextColor={Colors.editing.textTertiary}
                value={productKeywords}
                onChangeText={setProductKeywords}
                multiline={false}
                returnKeyType="done"
              />
            </View>
          </Animated.View>

          {/* Shadow Control */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Feather name="sun" size={18} color={Colors.editing.primary} />
              <ThemedText style={styles.sectionTitle}>Shadow Style</ThemedText>
            </View>
            <View style={styles.shadowGrid}>
              {shadowOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.shadowChip,
                    selectedShadowControl === option.id &&
                      styles.shadowChipSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedShadowControl(option.id);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.shadowChipText,
                      selectedShadowControl === option.id &&
                        styles.shadowChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Platform Aspect Ratio */}
          <Animated.View
            entering={FadeInDown.delay(375).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Feather name="crop" size={18} color={Colors.editing.primary} />
              <ThemedText style={styles.sectionTitle}>
                Platform Aspect Ratio
              </ThemedText>
              <ThemedText style={styles.optionalBadge}>Optional</ThemedText>
            </View>
            <ThemedText style={styles.sectionSubtitle}>
              AI will generate an image matching the selected platform ratio
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
          </Animated.View>

          {/* Scene Presets */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Feather name="grid" size={18} color={Colors.editing.primary} />
              <ThemedText style={styles.sectionTitle}>
                Or Choose a Preset
              </ThemedText>
            </View>
            <ThemedText style={styles.sectionSubtitle}>
              Quick-start with popular scene styles
            </ThemedText>
            <View style={styles.scenesContainer}>
              <FlatList
                ref={flatListRef}
                data={SCENES}
                renderItem={({ item, index }) => (
                  <SceneCard
                    scene={item}
                    selected={selectedScene === item.id}
                    onPress={() => handleSelectSceneCard(item.id)}
                    index={index}
                  />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scenesGrid}
              />
              <ScrollIndicator direction="right" delay={1000} />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <View style={styles.bottomContent}>
            {showSceneError && (
              <View style={styles.errorMessage}>
                <Feather
                  name="alert-circle"
                  size={14}
                  color={Colors.editing.error}
                />
                <ThemedText style={styles.errorText}>
                  Please describe your scene or choose a preset
                </ThemedText>
              </View>
            )}
            <GradientButton
              title={
                isProcessing
                  ? "Generating..."
                  : isBatchMode
                    ? `Generate ${selectedImages.length} Scenes`
                    : "Generate Lifestyle Scene"
              }
              onPress={handleGenerate}
              disabled={selectedImages.length === 0 || isProcessing}
              loading={isProcessing}
              icon="zap"
              fullWidth
            />
          </View>
        </Animated.View>

        {/* Processing Overlay */}
        {isProcessing && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.processingOverlay}
          >
            <GlassCard
              theme="dark"
              variant="solid"
              padding="xl"
              borderRadius="2xl"
              style={styles.processingCard}
            >
              <View style={styles.processingContent}>
                <ProgressRing
                  progress={0.7}
                  size={80}
                  strokeWidth={6}
                  color={Colors.editing.primary}
                  backgroundColor="rgba(255, 255, 255, 0.1)"
                >
                  <Feather
                    name="zap"
                    size={28}
                    color={Colors.editing.primary}
                  />
                </ProgressRing>
                <ThemedText style={styles.processingTitle}>
                  Creating Your Scene
                </ThemedText>
                <ThemedText style={styles.processingHint}>
                  This may take up to 30 seconds
                </ThemedText>
                <ProcessingTips
                  tips={DEFAULT_PROCESSING_TIPS}
                  style={styles.processingTips}
                  variant="dark"
                />
              </View>
            </GlassCard>
          </Animated.View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
    ...Shadows.lg,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeImageBadge: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  changeImageText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: IMAGE_SIZE - 48,
    gap: Spacing.md,
  },
  placeholderText: {
    color: Colors.editing.textTertiary,
    fontSize: 15,
  },
  batchImageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
    maxWidth: IMAGE_SIZE + 20,
  },
  batchImageItem: {
    width: (IMAGE_SIZE - Spacing.sm * 2) / 2,
    height: (IMAGE_SIZE - Spacing.sm * 2) / 2,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  batchImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    color: Colors.editing.text,
    fontSize: 20,
    fontWeight: "700",
  },
  addMoreBatchButton: {
    width: (IMAGE_SIZE - Spacing.sm * 2) / 2,
    height: (IMAGE_SIZE - Spacing.sm * 2) / 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.editing.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  addMoreBatchText: {
    color: Colors.editing.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  batchCountText: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.editing.text,
    fontSize: 16,
    fontWeight: "600",
  },
  optionalBadge: {
    color: Colors.editing.textTertiary,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: "auto",
  },
  sectionSubtitle: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm + 18,
  },
  inputContainer: {
    backgroundColor: Colors.editing.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  textInput: {
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.editing.text,
    minHeight: 50,
  },
  historyContainer: {
    marginTop: Spacing.md,
  },
  historyScrollWrapper: {
    position: "relative",
  },
  historyLabel: {
    fontSize: 12,
    color: Colors.editing.textSecondary,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  historyScroll: {
    gap: Spacing.sm,
  },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    maxWidth: 200,
  },
  historyChipText: {
    fontSize: 12,
    color: Colors.editing.textSecondary,
    flex: 1,
  },
  shadowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  shadowChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  shadowChipSelected: {
    backgroundColor: Colors.editing.primary,
    borderColor: Colors.editing.primary,
  },
  shadowChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.editing.textSecondary,
  },
  shadowChipTextSelected: {
    color: Colors.editing.text,
  },
  scenesContainer: {
    marginHorizontal: -Spacing.lg,
  },
  scenesGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sceneCardWrapper: {
    alignItems: "center",
    width: 110,
  },
  sceneCard: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  sceneCardSelected: {
    borderColor: Colors.editing.primary,
    borderWidth: 2,
  },
  sceneImage: {
    width: "100%",
    height: "100%",
  },
  sceneGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  sceneCardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
  },
  sceneIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.primarySubtle,
    marginBottom: Spacing.xs,
  },
  sceneIconContainerSelected: {
    backgroundColor: Colors.editing.primary,
  },
  sceneLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    color: Colors.editing.textSecondary,
    lineHeight: 14,
    marginTop: Spacing.xs,
  },
  sceneLabelSelected: {
    color: Colors.editing.primary,
    fontWeight: "600",
  },
  selectedCheck: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.editing.primary,
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  bottomContent: {
    position: "relative",
    zIndex: 1,
  },
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.editing.error,
    fontSize: 13,
    fontWeight: "500",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: Spacing.xl,
  },
  processingContent: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  processingCard: {
    width: "100%",
    maxWidth: 340,
  },
  processingTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  processingHint: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  processingTips: {
    width: "100%",
    marginTop: Spacing.sm,
  },
});

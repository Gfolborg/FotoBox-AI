import React, { useState, useEffect, useMemo } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import {
  SCENES,
  PRODUCT_CATEGORIES,
  Scene,
  getRecommendedScenes,
  getOrganizedScenes,
} from "@/lib/lifestyle-scenes";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "EnvironmentSelection">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryChip({
  category,
  selected,
  onPress,
}: {
  category: { id: string; label: string; icon: keyof typeof Feather.glyphMap };
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
    >
      <Feather
        name={category.icon}
        size={16}
        color={selected ? Colors.light.buttonText : Colors.light.primary}
      />
      <ThemedText
        style={[
          styles.categoryChipText,
          selected && styles.categoryChipTextSelected,
        ]}
      >
        {category.label}
      </ThemedText>
    </Pressable>
  );
}

function SceneCard({
  scene,
  selected,
  recommended,
  onPress,
}: {
  scene: Scene;
  selected: boolean;
  recommended?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.95))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[styles.sceneCard, selected && styles.sceneCardSelected, animatedStyle]}
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Feather name="star" size={10} color={Colors.light.buttonText} />
        </View>
      )}
      <View
        style={[
          styles.sceneIconContainer,
          selected && styles.sceneIconContainerSelected,
        ]}
      >
        <Feather
          name={scene.icon}
          size={20}
          color={selected ? Colors.light.buttonText : Colors.light.primary}
        />
      </View>
      <ThemedText style={styles.sceneLabel} numberOfLines={1}>
        {scene.label}
      </ThemedText>
      {selected && (
        <View style={styles.selectedCheck}>
          <Feather name="check" size={12} color={Colors.light.buttonText} />
        </View>
      )}
    </AnimatedPressable>
  );
}

export default function EnvironmentSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const [imageUri, setImageUri] = useState<string | null>(
    route.params?.imageUri || null
  );
  const [productDescription, setProductDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string>("studio");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get recommended scenes based on description and category
  const { scenes: recommendedSceneIds, matched, matchedCategory } = useMemo(
    () => getRecommendedScenes(productDescription, selectedCategory),
    [productDescription, selectedCategory]
  );

  // Organize scenes into recommended and other
  const { recommended: recommendedScenes, other: otherScenes } = useMemo(
    () => getOrganizedScenes(recommendedSceneIds),
    [recommendedSceneIds]
  );

  // Auto-select first recommended scene when recommendations change
  useEffect(() => {
    if (recommendedScenes.length > 0 && matched) {
      setSelectedScene(recommendedScenes[0].id);
    }
  }, [recommendedSceneIds]);

  // If no image provided, prompt user to select one
  useEffect(() => {
    if (!imageUri) {
      handlePickImage();
    }
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    } else if (!imageUri) {
      navigation.goBack();
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
      setProductDescription(""); // Clear description when selecting category
    }
  };

  const handleGenerate = async () => {
    if (!imageUri) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      let endpoint = `${apiUrl}api/lifestyle-scene?environment=${selectedScene}`;

      // Add product description if provided
      if (productDescription.trim()) {
        endpoint += `&productDescription=${encodeURIComponent(productDescription.trim())}`;
      }

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
          environment: selectedScene,
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected Image Preview */}
        <Pressable style={styles.imageContainer} onPress={handlePickImage}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <View style={styles.changeImageOverlay}>
                <Feather name="camera" size={20} color={Colors.light.white} />
                <ThemedText style={styles.changeImageText}>Tap to change</ThemedText>
              </View>
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Feather name="image" size={48} color={Colors.light.textTertiary} />
              <ThemedText style={styles.placeholderText}>
                Select a product image
              </ThemedText>
            </View>
          )}
        </Pressable>

        {/* Product Description Input */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Describe Your Product
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Optional - helps us recommend the best scenes
          </ThemedText>
          <TextInput
            style={styles.descriptionInput}
            placeholder="e.g., Red mountain bike for trail riding"
            placeholderTextColor={Colors.light.textTertiary}
            value={productDescription}
            onChangeText={(text) => {
              setProductDescription(text);
              if (text.trim()) {
                setSelectedCategory(null); // Clear category when typing
              }
            }}
            multiline={false}
            returnKeyType="done"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Or select a category</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                selected={selectedCategory === category.id}
                onPress={() => handleCategoryPress(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Scene Selection */}
        <View style={styles.section}>
          {matched && recommendedScenes.length > 0 ? (
            <>
              {/* Recommended Scenes */}
              <Animated.View entering={FadeIn.duration(300)}>
                <View style={styles.recommendedHeader}>
                  <Feather name="star" size={16} color={Colors.light.primary} />
                  <ThemedText type="h4" style={styles.sectionTitle}>
                    Recommended Scenes
                  </ThemedText>
                </View>
                <ThemedText style={styles.sectionSubtitle}>
                  Best matches for your product
                </ThemedText>
                <View style={styles.scenesGrid}>
                  {recommendedScenes.map((scene) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      selected={selectedScene === scene.id}
                      recommended
                      onPress={() => setSelectedScene(scene.id)}
                    />
                  ))}
                </View>
              </Animated.View>

              {/* Other Scenes */}
              <View style={styles.otherScenesSection}>
                <ThemedText style={styles.otherScenesTitle}>
                  Other Scenes
                </ThemedText>
                <View style={styles.scenesGrid}>
                  {otherScenes.map((scene) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      selected={selectedScene === scene.id}
                      onPress={() => setSelectedScene(scene.id)}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* No Match - Show All Scenes */}
              <ThemedText type="h4" style={styles.sectionTitle}>
                Choose a Scene
              </ThemedText>
              {productDescription.trim().length > 0 && (
                <View style={styles.tipContainer}>
                  <Feather name="info" size={14} color={Colors.light.primary} />
                  <ThemedText style={styles.tipText}>
                    Your description will help AI place your product naturally
                  </ThemedText>
                </View>
              )}
              <View style={styles.scenesGrid}>
                {SCENES.map((scene) => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    selected={selectedScene === scene.id}
                    onPress={() => setSelectedScene(scene.id)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Generate Button */}
      <View
        style={[
          styles.bottomAction,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Button
          onPress={handleGenerate}
          disabled={!imageUri || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color={Colors.light.buttonText} size="small" />
              <ThemedText style={styles.buttonText}>Generating...</ThemedText>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Feather name="zap" size={20} color={Colors.light.buttonText} />
              <ThemedText style={styles.buttonText}>Generate Lifestyle Scene</ThemedText>
            </View>
          )}
        </Button>
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.processingText}>
              Creating your lifestyle scene...
            </ThemedText>
            <ThemedText style={styles.processingHint}>
              This may take up to 30 seconds
            </ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
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
  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.light.backgroundSecondary,
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  changeImageText: {
    color: Colors.light.white,
    fontSize: 14,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  placeholderText: {
    color: Colors.light.textTertiary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  descriptionInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.light.text,
  },
  categoryChipTextSelected: {
    color: Colors.light.buttonText,
  },
  recommendedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  scenesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sceneCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sceneCardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    backgroundColor: Colors.light.primary + "10",
  },
  sceneIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  sceneIconContainerSelected: {
    backgroundColor: Colors.light.primary,
  },
  sceneLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  recommendedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCheck: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  otherScenesSection: {
    marginTop: Spacing.xl,
  },
  otherScenesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary + "15",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.primary,
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.light.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: Colors.light.buttonText,
    fontWeight: "600",
    fontSize: 16,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  processingCard: {
    backgroundColor: Colors.light.backgroundRoot,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    gap: Spacing.md,
    minWidth: 250,
    ...Shadows.lg,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  processingHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});

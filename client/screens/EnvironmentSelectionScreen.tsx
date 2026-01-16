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
  FlatList,
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
  FadeInDown,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { SCENES, Scene } from "@/lib/lifestyle-scenes";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "EnvironmentSelection">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SceneCard({
  scene,
  selected,
  onPress,
}: {
  scene: Scene;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const isSelected = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    isSelected.value = withSpring(selected ? 1 : 0, {
      damping: 10,
      stiffness: 200,
    });
  }, [selected]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isSelected.value === 1 ? Colors.light.primary : Colors.light.border,
    borderWidth: isSelected.value === 1 ? 2 : 1,
  }));

  const animatedIconContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: isSelected.value === 1 ? Colors.light.primary : Colors.light.backgroundSecondary,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    color: isSelected.value === 1 ? Colors.light.white : Colors.light.primary,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.95))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[styles.sceneCard, animatedContainerStyle]}
    >
      <Animated.View style={[styles.sceneIconContainer, animatedIconContainerStyle]}>
        <Feather name={scene.icon} size={24} color={Colors.light.primary} style={animatedIconStyle} />
      </Animated.View>
      <ThemedText style={styles.sceneLabel} numberOfLines={2}>
        {scene.label}
      </ThemedText>
      {selected && (
        <View style={styles.selectedCheck}>
          <Feather name="check" size={12} color={Colors.light.white} />
        </View>
      )}
    </AnimatedPressable>
  );
}

export default function EnvironmentSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const flatListRef = React.useRef<FlatList>(null);

  const [imageUri, setImageUri] = useState<string | null>(
    route.params?.imageUri || null,
  );
  const [customScene, setCustomScene] = useState('');
  const [productKeywords, setProductKeywords] = useState('');
  const [selectedScene, setSelectedScene] = useState<string>('studio');
  const [selectedShadowControl, setSelectedShadowControl] =
    useState<string>('natural');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    setScrollOffset(offset);
    setShowLeftArrow(offset > 0);
    setShowRightArrow(offset < contentWidth - layoutWidth - 1);
  };

  const handleContentSizeChange = (width: number) => {
    setContentWidth(width);
    setShowRightArrow(width > layoutWidth);
  };

  const handleLayout = (event: any) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const scrollLeft = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: Math.max(0, scrollOffset - layoutWidth),
        animated: true,
      });
    }
  };

  const scrollRight = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: Math.min(contentWidth - layoutWidth, scrollOffset + layoutWidth),
        animated: true,
      });
    }
  };

  // When a user types a custom scene, deselect the card
  useEffect(() => {
    if (customScene.trim()) {
      setSelectedScene('');
    }
  }, [customScene]);

  // If no image provided, prompt user to select one
  useEffect(() => {
    if (!imageUri) {
      handlePickImage();
    }
    // Run once on mount to prompt for image selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSelectSceneCard = (sceneId: string) => {
    setCustomScene(""); // Clear custom scene input
    setSelectedScene(sceneId);
  };

  const handleGenerate = async () => {
    if (!imageUri || (!customScene.trim() && !selectedScene)) return;

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

      // Prioritize custom scene description
      if (customScene.trim()) {
        params.append("environment", customScene.trim());
        params.append("isCustom", "true");
      } else if (selectedScene) {
        params.append("environment", selectedScene);
      }

      // Add product keywords if provided
      if (productKeywords.trim()) {
        params.append("productDescription", productKeywords.trim());
      }

      // Add shadow control if not natural
      if (selectedShadowControl !== "natural") {
        params.append("shadowControl", selectedShadowControl);
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
    <GradientBackground variant="subtle">
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
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Pressable style={styles.imageContainer} onPress={handlePickImage}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <View style={styles.changeImageOverlay}>
                  <Feather name="camera" size={20} color={Colors.light.white} />
                  <ThemedText style={styles.changeImageText}>
                    Tap to change
                  </ThemedText>
                </View>
              </>
            ) : (
              <View style={styles.placeholderContainer}>
                <Feather
                  name="image"
                  size={48}
                  color={Colors.light.textTertiary}
                />
                <ThemedText style={styles.placeholderText}>
                  Select a product image
                </ThemedText>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Custom Scene Input */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <ThemedText type="h4" style={styles.sectionTitle}>
            Describe Your Desired Scene
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Be descriptive for the best results.
          </ThemedText>
          <TextInput
            style={styles.descriptionInput}
            placeholder="e.g., On a marble countertop next to a plant"
            placeholderTextColor={Colors.light.textTertiary}
            value={customScene}
            onChangeText={setCustomScene}
            multiline={false}
            returnKeyType="done"
          />
        </Animated.View>

        {/* Product Keywords Input */}
                    <Animated.View
                      entering={FadeInDown.delay(300).duration(400)}
                      style={styles.section}
                    >
                      <ThemedText type="h4" style={styles.sectionTitle}>
                        Product Keywords (Optional)
                      </ThemedText>
                      <ThemedText style={styles.sectionSubtitle}>
                        Helps the AI understand your product.
                      </ThemedText>
                      <TextInput
                        style={styles.keywordsInput}
                        placeholder="e.g., red glossy lipstick"
                        placeholderTextColor={Colors.light.textTertiary}
                        value={productKeywords}
                        onChangeText={setProductKeywords}
                        multiline={false}
                        returnKeyType="done"
                      />
                    </Animated.View>
        
                    {/* Shadow Control Selection */}
                    <Animated.View
                      entering={FadeInDown.delay(350).duration(400)}
                      style={styles.section}
                    >
                      <ThemedText type="h4" style={styles.sectionTitle}>
                        Shadow Control
                      </ThemedText>
                      <ThemedText style={styles.sectionSubtitle}>
                        Adjust the prominence of shadows in the scene.
                      </ThemedText>
                      <View style={styles.shadowControlGrid}>
                        {["natural", "no shadows", "subtle shadows", "prominent shadows"].map((option) => (
                          <Pressable
                            key={option}
                            style={[
                              styles.shadowOptionChip,
                              selectedShadowControl === option && styles.shadowOptionChipSelected,
                            ]}
                            onPress={() => setSelectedShadowControl(option)}
                          >
                            <ThemedText
                              style={[
                                styles.shadowOptionChipText,
                                selectedShadowControl === option && styles.shadowOptionChipTextSelected,
                              ]}
                            >
                              {option}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </Animated.View>
        {/* Scene Selection */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.section}
        >
          <ThemedText type="h4" style={styles.sectionTitle}>
            Or Get Inspired
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Select a preset scene to start with.
          </ThemedText>
          <View style={styles.flatListContainer}>
            <FlatList
              ref={flatListRef}
              data={SCENES}
              renderItem={({ item }) => (
                <SceneCard
                  scene={item}
                  selected={selectedScene === item.id}
                  onPress={() => handleSelectSceneCard(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scenesGrid}
              onScroll={handleScroll}
              onContentSizeChange={handleContentSizeChange}
              onLayout={handleLayout}
              scrollEventThrottle={16}
            />
            {showLeftArrow && (
              <Animated.View entering={FadeInLeft}>
                <Pressable style={[styles.arrow, styles.leftArrow]} onPress={scrollLeft}>
                  <Feather name="chevron-left" size={24} color={Colors.light.text} />
                </Pressable>
              </Animated.View>
            )}
            {showRightArrow && (
              <Animated.View entering={FadeInRight}>
                <Pressable style={[styles.arrow, styles.rightArrow]} onPress={scrollRight}>
                  <Feather name="chevron-right" size={24} color={Colors.light.text} />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </Animated.View>
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
          disabled={!imageUri || isProcessing || (!customScene && !selectedScene)}
        >
          {isProcessing ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color={Colors.light.buttonText} size="small" />
              <ThemedText style={styles.buttonText}>Generating...</ThemedText>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Feather name="zap" size={20} color={Colors.light.buttonText} />
              <ThemedText style={styles.buttonText}>
                Generate Lifestyle Scene
              </ThemedText>
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
  descriptionInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 50,
  },
  keywordsInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  shadowControlGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  shadowOptionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  shadowOptionChipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  shadowOptionChipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textTransform: "capitalize",
  },
  shadowOptionChipTextSelected: {
    color: Colors.light.buttonText,
    fontWeight: "600",
  },
  flatListContainer: {
    position: 'relative',
    marginHorizontal: -Spacing.lg,
  },
  scenesGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    zIndex: 1,
  },
  leftArrow: {
    left: Spacing.sm,
  },
  rightArrow: {
    right: Spacing.sm,
  },
  sceneCard: {
    width: 110,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  sceneCardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  sceneIconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  sceneLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: Colors.light.textSecondary,
  },
  selectedCheck: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
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

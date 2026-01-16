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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GlassPill } from "@/components/GlassPill";
import { GradientButton } from "@/components/GradientButton";
import { ProgressRing } from "@/components/ProgressRing";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { SCENES, Scene } from "@/lib/lifestyle-scenes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = Math.min(SCREEN_WIDTH - Spacing.lg * 2, 320);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "EnvironmentSelection">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
      style={[
        styles.sceneCard,
        selected && styles.sceneCardSelected,
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.sceneIconContainer,
          selected && styles.sceneIconContainerSelected,
        ]}
      >
        <Feather
          name={scene.icon as any}
          size={22}
          color={selected ? Colors.editing.text : Colors.editing.primary}
        />
      </View>
      <ThemedText
        style={[styles.sceneLabel, selected && styles.sceneLabelSelected]}
        numberOfLines={2}
      >
        {scene.label}
      </ThemedText>
      {selected && (
        <View style={styles.selectedCheck}>
          <Feather name="check" size={10} color={Colors.editing.text} />
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
  const [customScene, setCustomScene] = useState("");
  const [productKeywords, setProductKeywords] = useState("");
  const [selectedScene, setSelectedScene] = useState<string>("studio");
  const [selectedShadowControl, setSelectedShadowControl] =
    useState<string>("natural");
  const [isProcessing, setIsProcessing] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (customScene.trim()) {
      setSelectedScene("");
    }
  }, [customScene]);

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

  const handleSelectSceneCard = (sceneId: string) => {
    setCustomScene("");
    setSelectedScene(sceneId);
  };

  const handleGenerate = async () => {
    if (!imageUri || (!customScene.trim() && !selectedScene)) return;

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

  const shadowOptions = [
    { id: "natural", label: "Natural" },
    { id: "no shadows", label: "None" },
    { id: "subtle shadows", label: "Subtle" },
    { id: "prominent shadows", label: "Strong" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="dark" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather
              name="chevron-left"
              size={24}
              color={Colors.editing.text}
            />
          </Pressable>

          <GlassPill>
            <Feather name="layers" size={16} color={Colors.editing.primary} />
            <ThemedText style={styles.headerTitle}>Lifestyle Scene</ThemedText>
          </GlassPill>

          <View style={{ width: 44 }} />
        </View>
      </Animated.View>

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
          <Pressable onPress={handlePickImage} style={styles.imageWrapper}>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <View style={styles.changeImageBadge}>
                  <Feather
                    name="camera"
                    size={14}
                    color={Colors.editing.text}
                  />
                  <ThemedText style={styles.changeImageText}>Change</ThemedText>
                </View>
              </View>
            ) : (
              <GlassCard theme="dark" padding="xl" borderRadius="xl">
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
              onChangeText={setCustomScene}
              multiline={false}
              returnKeyType="done"
            />
          </View>
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

        {/* Scene Presets */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Feather name="grid" size={18} color={Colors.editing.primary} />
            <ThemedText style={styles.sectionTitle}>Or Choose a Preset</ThemedText>
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
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <BlurView intensity={60} tint="dark" style={styles.bottomBlur} />
        <View style={styles.bottomContent}>
          <GradientButton
            title={isProcessing ? "Generating..." : "Generate Lifestyle Scene"}
            onPress={handleGenerate}
            disabled={!imageUri || isProcessing || (!customScene && !selectedScene)}
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
          <GlassCard theme="dark" padding="xl" borderRadius="2xl">
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
            </View>
          </GlassCard>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.editing.backgroundRoot,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    marginTop: 100,
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
    color: Colors.editing.text,
    fontSize: 13,
    fontWeight: "500",
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
  shadowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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
  sceneCard: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  sceneCardSelected: {
    borderColor: Colors.editing.primary,
    borderWidth: 2,
    backgroundColor: Colors.editing.primarySubtle,
  },
  sceneIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundTertiary,
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
  },
  sceneLabelSelected: {
    color: Colors.editing.text,
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
  },
  bottomBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContent: {
    position: "relative",
    zIndex: 1,
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
  processingTitle: {
    color: Colors.editing.text,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  processingHint: {
    color: Colors.editing.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeInUp,
} from "react-native-reanimated";
import * as ImageManipulator from "expo-image-manipulator";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { GradientBackground } from "@/components/GradientBackground";
import { ProgressRing } from "@/components/ProgressRing";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useBatchEdit } from "@/context/BatchEditContext";
import { getApiUrl } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH - Spacing.lg * 2;
const MAX_IMAGE_HEIGHT = SCREEN_HEIGHT * 0.55;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type RouteProps = RouteProp<RootStackParamList, "MockupResult">;

export default function MockupResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const scrollViewRef = React.useRef<ScrollView>(null);

  const {
    resultUri: initialResultUri,
    originalUri,
    mockupItem,
    sceneVibe,
    cameraOption,
    mockupColor,
    customDescription,
    modelOption,
    customScenePrompt,
    negativePrompt,
  } = route.params;

  const [resultUri, setResultUri] = useState(initialResultUri);
  const [showComparison, setShowComparison] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { pendingEditResult, setPendingEditResult } = useBatchEdit();

  const getExtensionFromDataUri = (dataUri: string): string => {
    const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
    if (!match) return "jpg";
    const raw = match[1].toLowerCase();
    if (raw === "jpeg") return "jpg";
    if (raw === "png") return "png";
    if (raw === "webp") return "webp";
    return "jpg";
  };

  useFocusEffect(
    useCallback(() => {
      if (pendingEditResult && pendingEditResult.originalUri === originalUri) {
        setResultUri(pendingEditResult.editedUri);
        setPendingEditResult(null);
      }
    }, [pendingEditResult, originalUri, setPendingEditResult]),
  );

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const extension = getExtensionFromDataUri(resultUri);
      const filename = `platform_temp_${Date.now()}.${extension}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("PlatformSelection", {
        imageUri: fileUri,
        originalUri,
        sourceService: "mockup",
      });
    } catch (error) {
      console.error("Failed to prepare image for platform selection:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image. Please try again.");
      }
    }
  };

  const handleRetryGeneration = async () => {
    if (isRetrying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRetrying(true);

    try {
      const prompt = getMockupPrompt(
        mockupItem,
        sceneVibe,
        cameraOption,
        mockupColor,
        customDescription,
        modelOption,
        customScenePrompt,
        negativePrompt,
      );

      const manipulated = await ImageManipulator.manipulateAsync(
        originalUri,
        [],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
      );

      const formData = new FormData();
      formData.append("file", {
        uri: manipulated.uri,
        name: "product.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
      formData.append("prompt", prompt);
      if (customScenePrompt) {
        formData.append("customPrompt", customScenePrompt);
      }
      if (negativePrompt) {
        formData.append("negativePrompt", negativePrompt);
      }
      formData.append("mockupType", mockupItem.id);
      formData.append("sceneVibe", sceneVibe.id);
      formData.append("cameraOption", cameraOption.id);
      if (mockupColor) {
        formData.append("mockupColor", mockupColor);
      }

      const response = await fetch(
        new URL("/api/mockup", getApiUrl()).toString(),
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mockup");
      }

      const data = await response.json();

      setResultUri(data.resultUri);
      setShowComparison(false);
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      });
    } catch (error) {
      console.error("Retry generation failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      if (Platform.OS !== "web") {
        Alert.alert("Generation Failed", message);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGenerateAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Start a new mockup",
      "Use the same product image or choose a new one.",
      [
        {
          text: "Use same image",
          onPress: () =>
            navigation.replace("MockupWizardImages", {
              imageUri: originalUri,
            }),
        },
        {
          text: "Choose new image",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: false,
                quality: 1,
              });
              if (!result.canceled && result.assets[0]) {
                navigation.replace("MockupWizardImages", {
                  imageUri: result.assets[0].uri,
                });
              }
            } catch (error) {
              console.error("Failed to pick image:", error);
              if (Platform.OS !== "web") {
                Alert.alert("Error", "Could not access your photos.");
              }
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleEditImage = async () => {
    try {
      if (Platform.OS === "web") {
        navigation.navigate("EditImage", {
          imageUri: resultUri,
          originalUri,
        });
        return;
      }

      const extension = getExtensionFromDataUri(resultUri);
      const filename = `edit_temp_${Date.now()}.${extension}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("EditImage", {
        imageUri: fileUri,
        originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image for editing.");
      }
    }
  };

  const displayHeight = imageDimensions
    ? Math.min(
        (IMAGE_SIZE * imageDimensions.height) / imageDimensions.width,
        MAX_IMAGE_HEIGHT,
      )
    : IMAGE_SIZE;

  const actionCardGradients = {
    edit: ["rgba(14, 165, 233, 0.28)", "rgba(59, 130, 246, 0.45)"],
    retry: ["rgba(249, 115, 22, 0.28)", "rgba(234, 88, 12, 0.45)"],
    new: ["rgba(16, 185, 129, 0.28)", "rgba(34, 197, 94, 0.45)"],
  };

  useEffect(() => {
    let isMounted = true;
    Image.getSize(
      resultUri,
      (width, height) => {
        if (isMounted) {
          setImageDimensions({ width, height });
        }
      },
      () => {
        if (isMounted) {
          setImageDimensions(null);
        }
      },
    );
    return () => {
      isMounted = false;
    };
  }, [resultUri]);

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />
      <ThemedHeader title="Mockup Result" />

      <View style={[styles.container, { paddingTop: insets.top + 54 }]}> 
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 240 },
          ]}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
          bounces={scrollEnabled}
          onContentSizeChange={(_, height) => {
            if (containerHeight) {
              setScrollEnabled(height > containerHeight + 16);
            }
          }}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setContainerHeight(height);
          }}
        >
          {showComparison ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <BeforeAfterSlider
                beforeImage={originalUri}
                afterImage={resultUri}
                size={IMAGE_SIZE}
              />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              exiting={FadeOut.duration(200)}
              style={[styles.imageContainer, { height: displayHeight }]}
            >
              <Image source={{ uri: resultUri }} style={styles.resultImage} />
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.carouselContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionCarousel}
            >
              <Pressable style={styles.actionCard} onPress={handleEditImage}>
                <LinearGradient
                  colors={actionCardGradients.edit}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  <Feather name="edit-2" size={18} color={Colors.editing.text} />
                </View>
                <ThemedText style={styles.actionCardLabel}>Edit</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.actionCard, isRetrying && styles.actionCardDisabled]}
                onPress={handleRetryGeneration}
                disabled={isRetrying}
              >
                <LinearGradient
                  colors={actionCardGradients.retry}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  <Feather name="refresh-cw" size={18} color={Colors.editing.text} />
                </View>
                <ThemedText style={styles.actionCardLabel}>
                  {isRetrying ? "Retrying..." : "Retry"}
                </ThemedText>
              </Pressable>

              <Pressable style={styles.actionCard} onPress={handleGenerateAnother}>
                <LinearGradient
                  colors={actionCardGradients.new}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  <Feather name="plus" size={18} color={Colors.editing.text} />
                </View>
                <ThemedText style={styles.actionCardLabel}>New</ThemedText>
              </Pressable>
            </ScrollView>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            style={styles.toggleContainer}
          >
            <Pressable
              style={[
                styles.toggleButton,
                showComparison && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setShowComparison(!showComparison);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather
                name={showComparison ? "eye" : "sliders"}
                size={16}
                color={
                  showComparison ? Colors.editing.text : Colors.editing.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.toggleText,
                  showComparison && styles.toggleTextActive,
                ]}
              >
                {showComparison ? "View Result" : "Compare"}
              </ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          <GlassCard theme="light" padding="sm" borderRadius="lg">
            <View style={styles.actionButtons}>
              <GradientButton
                title="Continue"
                onPress={handleContinue}
                icon="arrow-right"
                fullWidth
              />
            </View>
          </GlassCard>
        </Animated.View>

        {isRetrying && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.retryOverlay}
          >
            <GlassCard
              theme="dark"
              variant="solid"
              padding="xl"
              borderRadius="2xl"
              style={styles.retryCard}
            >
              <View style={styles.retryContent}>
                <ProgressRing
                  progress={0.7}
                  size={90}
                  strokeWidth={7}
                  color={Colors.editing.primary}
                  backgroundColor="rgba(255, 255, 255, 0.1)"
                >
                  <ActivityIndicator size="small" color={Colors.editing.primary} />
                </ProgressRing>
                <ThemedText style={styles.retryTitle}>Regenerating Mockup</ThemedText>
                <ThemedText style={styles.retryHint}>
                  This may take up to 30 seconds
                </ThemedText>
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
  content: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    maxHeight: MAX_IMAGE_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
    ...Shadows.lg,
  },
  resultImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  carouselContainer: {
    marginTop: Spacing.lg,
  },
  toggleContainer: {
    marginTop: Spacing.md,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  toggleButtonActive: {
    backgroundColor: Colors.editing.primary,
    borderColor: Colors.editing.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.editing.textSecondary,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: Spacing.md,
    right: Spacing.md,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  actionCarousel: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  actionCard: {
    width: 96,
    height: 96,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.editing.text,
  },
  retryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.editing.overlayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  retryCard: {
    width: "80%",
  },
  retryContent: {
    alignItems: "center",
    gap: Spacing.md,
  },
  retryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.white,
  },
  retryHint: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
  },
});

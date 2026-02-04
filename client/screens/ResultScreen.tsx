import React, { useState, useCallback, useEffect, useRef } from "react";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { GlassCard } from "@/components/GlassCard";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { useBatchEdit } from "@/context/BatchEditContext";
import { useNotification } from "@/context/NotificationContext";
import { buildMockupWizardState } from "@/lib/mockup-templates";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRouteProp = RouteProp<RootStackParamList, "Result">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH - Spacing.xl * 2;

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const { token } = useAuth();
  const {
    resultUri: initialResultUri,
    originalUri,
    backgroundColor = "#FFFFFF",
    isEdited = false,
  } = route.params;

  const [resultUri, setResultUri] = useState(initialResultUri);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const retryErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  
  const { pendingEditResult, setPendingEditResult } = useBatchEdit();
  const { showNotification } = useNotification();
  const { requiresWatermark, consumeCredit, canGenerate, creditsRemaining } = useCredits();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

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
      if (retryErrorTimer.current) {
        clearTimeout(retryErrorTimer.current);
      }
    };
  }, [resultUri]);

  // Process pending edit result when screen regains focus
  useFocusEffect(
    useCallback(() => {
      if (pendingEditResult && pendingEditResult.originalUri === originalUri) {
        setResultUri(pendingEditResult.editedUri);
        setPendingEditResult(null);
      }
    }, [pendingEditResult, originalUri, setPendingEditResult])
  );

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Save the result to a file for platform selection
      const filename = `platform_temp_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("PlatformSelection", {
        imageUri: fileUri,
        originalUri: originalUri,
        sourceService: "background",
        backgroundColor,
      });
    } catch (error) {
      console.error("Failed to prepare image for platform selection:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image. Please try again.");
      }
    }
  };

  const handleGenerateAnother = () => {
    navigation.navigate("Camera");
  };

  const handleEdit = async () => {
    try {
      // On web, pass the data URI directly - FileSystem doesn't work reliably
      if (Platform.OS === "web") {
        navigation.navigate("EditImage", {
          imageUri: resultUri, // Pass data URI directly on web
          originalUri: originalUri,
        });
        return;
      }
      
      // On native, save to file first
      const filename = `edit_temp_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("EditImage", {
        imageUri: fileUri,
        originalUri: originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
      if (Platform.OS !== "web") {
        Alert.alert(
          "Error",
          "Could not prepare image for editing. Please try again.",
        );
      }
    }
  };

  const handleRetry = async () => {
    // Check if user has credits (unless unlimited)
    const isUnlimited = creditsRemaining === -1;
    if (!isUnlimited && !canGenerate) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setIsRetrying(true);
    setRetryError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const formData = new FormData();
      
      // Handle both file:// URIs and data URIs for the original image
      if (originalUri.startsWith("data:")) {
        // For data URIs, convert to blob
        const response = await fetch(originalUri);
        const blob = await response.blob();
        formData.append("file", blob, "product_photo.jpg");
      } else {
        // For file:// URIs on native, convert to JPEG to avoid HEIF format issues
        const manipResult = await ImageManipulator.manipulateAsync(
          originalUri,
          [],
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
        );
        formData.append("file", {
          uri: manipResult.uri,
          name: "product_photo.jpg",
          type: "image/jpeg",
        } as unknown as Blob);
      }

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(backgroundColor);
      const watermarkParam = requiresWatermark ? "&applyWatermark=true" : "";
      const endpoint = `${apiUrl}api/main-image?backgroundColor=${bgColorParam}${watermarkParam}`;

      if (!token) {
        Alert.alert(
          "Sign in required",
          "Please sign in to generate images.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign in",
              onPress: () => {
                setAuthRedirect({ name: "Result", params: route.params });
                navigation.navigate("Auth");
              },
            },
          ],
        );
        throw new Error("Authentication required");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to regenerate image");
      }

      const blob = await response.blob();
      
      // Use Promise wrapper to properly handle FileReader callbacks
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read regenerated image"));
        };
        reader.readAsDataURL(blob);
      });

      setResultUri(base64data);
      
      // Consume credit for successful regeneration (unless unlimited)
      if (creditsRemaining !== -1) {
        const creditResult = await consumeCredit("main-image");
        if (creditResult.creditsRemaining === 1) {
          showNotification("1 credit left! Grab more to keep going.", "warning");
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotification("Image regenerated successfully!", "success");
    } catch (err) {
      let errorMessage = "An unexpected error occurred";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
        } else if (
          err.message.includes("Network request failed") ||
          err.message.includes("TypeError")
        ) {
          errorMessage =
            "Unable to connect to server. Please check your connection.";
        } else {
          errorMessage = err.message;
        }
      }

      setRetryError(errorMessage);
      if (retryErrorTimer.current) {
        clearTimeout(retryErrorTimer.current);
      }
      retryErrorTimer.current = setTimeout(() => {
        setRetryError(null);
      }, 3500);
      showNotification("Retry failed. Please try again.", "error");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCreateLifestyle = async () => {
    try {
      const filename = `lifestyle_temp_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("EnvironmentSelection", {
        imageUri: fileUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for lifestyle:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image. Please try again.");
      }
    }
  };

  const handleCreateMockup = async () => {
    try {
      const filename = `mockup_temp_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("MockupWizardPath", {
        wizardState: buildMockupWizardState([fileUri]),
      });
    } catch (error) {
      console.error("Failed to prepare image for mockup:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image. Please try again.");
      }
    }
  };

  return (
    <>
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Pressable
              style={styles.headerButton}
              onPress={() => navigation.popToTop()}
            >
              <ThemedText style={styles.headerButtonText}>Done</ThemedText>
            </Pressable>

            <GlassPill>
              <Feather
                name="check-circle"
                size={16}
                color={Colors.editing.success}
              />
              <ThemedText style={styles.headerTitle}>Result</ThemedText>
            </GlassPill>

            <View style={{ width: 60 }} />
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Display */}
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.imageWrapper,
              {
                height: showComparison
                  ? IMAGE_SIZE
                  : imageDimensions
                    ? (IMAGE_SIZE * imageDimensions.height) /
                      imageDimensions.width
                    : IMAGE_SIZE,
              },
            ]}
          >
            {showComparison ? (
              <View style={styles.imageContainer}>
                <BeforeAfterSlider
                  beforeImage={originalUri}
                  afterImage={resultUri}
                  size={IMAGE_SIZE}
                />
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: resultUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            )}
            {isRetrying && (
              <View style={styles.retryOverlay}>
                <ActivityIndicator
                  size="small"
                  color={Colors.editing.text}
                />
              </View>
            )}

            <Pressable
              style={styles.retryPill}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              <GlassPill style={styles.retryPillGlass}>
                <Feather
                  name={isRetrying ? "loader" : "refresh-cw"}
                  size={14}
                  color={Colors.editing.text}
                />
                <ThemedText style={styles.retryPillText}>
                  {isRetrying ? "Retrying" : "Retry"}
                </ThemedText>
              </GlassPill>
            </Pressable>
            {retryError && (
              <View style={styles.retryErrorPill}>
                <ThemedText style={styles.retryErrorText}>
                  Retry failed
                </ThemedText>
              </View>
            )}
          </Animated.View>

          {/* Image Specs Pill */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.specContainer}
          >
            <GlassPill>
              <Feather
                name="image"
                size={14}
                color={Colors.editing.textSecondary}
              />
              <ThemedText style={styles.specText}>2000 x 2000 - JPG</ThemedText>
            </GlassPill>
          </Animated.View>

          {/* Compare Toggle */}
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
                  showComparison
                    ? Colors.editing.text
                    : Colors.editing.textSecondary
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

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            style={styles.actionsContainer}
          >
            <GlassCard theme="light" padding="sm" borderRadius="lg">
              <View style={styles.actionButtons}>
                {/* Primary Continue Button */}
                <GradientButton
                  title="Continue"
                  onPress={handleContinue}
                  icon="arrow-right"
                  fullWidth
                />

                {/* Secondary Actions */}
                <View style={styles.secondaryActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={handleEdit}
                    disabled={isRetrying}
                  >
                    <IconButton
                      icon="edit-2"
                      onPress={handleEdit}
                      size={48}
                      iconSize={22}
                      variant="glass"
                      disabled={isRetrying}
                    />
                    <ThemedText style={styles.actionLabel}>Edit</ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.actionButton}
                    onPress={handleGenerateAnother}
                    disabled={isRetrying}
                  >
                    <IconButton
                      icon="plus"
                      onPress={handleGenerateAnother}
                      size={48}
                      iconSize={22}
                      variant="glass"
                      disabled={isRetrying}
                    />
                    <ThemedText style={styles.actionLabel}>New</ThemedText>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Continue with AI Section - Only show for edited photos */}
          {isEdited && (
            <Animated.View
              entering={FadeInUp.delay(500).duration(400)}
              style={styles.aiServicesContainer}
            >
              <ThemedText style={styles.aiServicesTitle}>
                Continue with AI
              </ThemedText>

              <View style={styles.aiServiceCards}>
                <Pressable
                  style={styles.aiServiceCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleCreateLifestyle();
                  }}
                >
                  <View
                    style={[
                      styles.aiServiceIcon,
                      { backgroundColor: "#10B98120" },
                    ]}
                  >
                    <Feather name="image" size={24} color="#10B981" />
                  </View>
                  <ThemedText style={styles.aiServiceTitle}>
                    Lifestyle Scene
                  </ThemedText>
                  <ThemedText style={styles.aiServiceDescription}>
                    Place in AI environments
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={styles.aiServiceCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleCreateMockup();
                  }}
                >
                  <View
                    style={[
                      styles.aiServiceIcon,
                      { backgroundColor: "#A78BFA20" },
                    ]}
                  >
                    <Feather name="box" size={24} color="#A78BFA" />
                  </View>
                  <ThemedText style={styles.aiServiceTitle}>
                    Create Mockup
                  </ThemedText>
                  <ThemedText style={styles.aiServiceDescription}>
                    Generate product mockups
                  </ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    minWidth: 60,
  },
  headerButtonText: {
    color: Colors.editing.primary,
    fontWeight: "600",
    fontSize: 16,
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: "center",
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    position: "relative",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.editing.backgroundSecondary,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Shadows.lg,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  retryPill: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  retryPillGlass: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  retryPillText: {
    color: Colors.editing.text,
    fontSize: 12,
    fontWeight: "600",
  },
  retryOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  retryErrorPill: {
    position: "absolute",
    top: Spacing.sm + 30,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  retryErrorText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  specContainer: {
    marginTop: Spacing.lg,
  },
  specText: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
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
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    color: Colors.editing.text,
  },
  actionsContainer: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  aiServicesContainer: {
    width: "100%",
    marginTop: Spacing.xl,
  },
  aiServicesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.editing.text,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  aiServiceCards: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  aiServiceCard: {
    flex: 1,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    alignItems: "center",
    ...Shadows.md,
  },
  aiServiceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  aiServiceTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.editing.text,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  aiServiceDescription: {
    fontSize: 12,
    color: Colors.editing.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
});

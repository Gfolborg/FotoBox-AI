import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeOut, FadeInUp, FadeInDown } from "react-native-reanimated";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { GlassCard } from "@/components/GlassCard";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRouteProp = RouteProp<RootStackParamList, "Result">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH - Spacing.xl * 2;

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const {
    resultUri: initialResultUri,
    originalUri,
    backgroundColor = "#FFFFFF",
  } = route.params;

  const [resultUri, setResultUri] = useState(initialResultUri);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveToGallery = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await saveToFotoBoxAlbum(resultUri, "product_image");

    if (result.success) {
      setSaved(true);
      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") {
        Alert.alert(
          "Save Failed",
          result.error || "Could not save the image. Please try again."
        );
      }
    }

    setIsSaving(false);
  };

  const handleGenerateAnother = () => {
    navigation.popToTop();
  };

  const handleEdit = async () => {
    try {
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
          "Could not prepare image for editing. Please try again."
        );
      }
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: originalUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(backgroundColor);
      const endpoint = `${apiUrl}api/main-image?backgroundColor=${bgColorParam}`;

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
        throw new Error(errorText || "Failed to regenerate image");
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = () => {
        const base64data = reader.result as string;
        setResultUri(base64data);
        setSaved(false);
      };

      reader.onerror = () => {
        throw new Error("Failed to read regenerated image");
      };

      reader.readAsDataURL(blob);
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

      if (Platform.OS !== "web") {
        Alert.alert("Retry Failed", errorMessage);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <GradientBackground variant="warm">
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="light" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.popToTop()}
          >
            <ThemedText style={styles.headerButtonText}>Done</ThemedText>
          </Pressable>

          <GlassPill>
            <Feather name="check-circle" size={16} color={Colors.editing.success} />
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
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: resultUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {/* Image Specs Pill */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.specContainer}
        >
          <GlassPill>
            <Feather name="image" size={14} color={Colors.editing.textSecondary} />
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
              color={showComparison ? Colors.editing.text : Colors.editing.textSecondary}
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
          <GlassCard theme="light" padding="lg" borderRadius="xl">
            <View style={styles.actionButtons}>
              {/* Primary Save Button */}
              {saved ? (
                <View style={styles.savedButton}>
                  <Feather name="check-circle" size={20} color={Colors.editing.success} />
                  <ThemedText style={styles.savedText}>Saved to Gallery</ThemedText>
                </View>
              ) : (
                <GradientButton
                  title={isSaving ? "Saving..." : "Save to Gallery"}
                  onPress={handleSaveToGallery}
                  disabled={isSaving}
                  loading={isSaving}
                  icon="download"
                  fullWidth
                />
              )}

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
                  onPress={handleRetry}
                  disabled={isRetrying}
                >
                  <IconButton
                    icon={isRetrying ? "loader" : "refresh-cw"}
                    onPress={handleRetry}
                    size={48}
                    iconSize={22}
                    variant="glass"
                    disabled={isRetrying}
                  />
                  <ThemedText style={styles.actionLabel}>
                    {isRetrying ? "Retrying..." : "Retry"}
                  </ThemedText>
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
      </ScrollView>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <SuccessAnimation
            onComplete={() => setShowSuccess(false)}
            size={140}
            delay={0}
          />
        </View>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 90,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: "center",
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
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
    marginTop: Spacing.xl,
  },
  actionButtons: {
    gap: Spacing.lg,
  },
  savedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.editing.successSubtle,
    borderWidth: 1,
    borderColor: Colors.editing.success,
  },
  savedText: {
    color: Colors.editing.success,
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.sm,
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
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});

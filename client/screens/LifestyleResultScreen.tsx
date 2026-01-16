import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { GlassPill } from "@/components/GlassPill";
import { IconButton } from "@/components/IconButton";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH - Spacing.lg * 2;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "LifestyleResult">;

const ENVIRONMENT_LABELS: Record<string, string> = {
  kitchen: "Kitchen Counter",
  outdoor: "Outdoor Nature",
  studio: "Studio Setup",
  living: "Living Room",
  office: "Office Desk",
  minimal: "Minimalist",
  bedroom: "Bedroom",
  bathroom: "Bathroom Vanity",
  dining: "Dining Table",
  park: "Park Setting",
  trail: "Trail / Path",
  beach: "Beach",
  garden: "Garden / Patio",
  urban: "Urban Street",
  lifestyle: "Lifestyle Shot",
  gym: "Gym / Fitness",
  garage: "Garage",
  playroom: "Playroom",
};

export default function LifestyleResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const { resultUri, originalUri, environment } = route.params as {
    resultUri: string;
    originalUri: string;
    environment: string;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveToGallery = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await saveToFotoBoxAlbum(resultUri, "lifestyle_scene");

    if (result.success) {
      setIsSaved(true);
      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") {
        Alert.alert("Error", result.error || "Failed to save image.");
      }
    }

    setIsSaving(false);
  };

  const handleTryDifferentEnvironment = () => {
    navigation.replace("EnvironmentSelection", {
      imageUri: originalUri,
    });
  };

  const handleGenerateAnother = () => {
    navigation.navigate("Home");
  };

  const handleEditImage = async () => {
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
        Alert.alert("Error", "Could not prepare image for editing.");
      }
    }
  };

  const environmentLabel = ENVIRONMENT_LABELS[environment] || "Lifestyle Scene";

  return (
    <View style={styles.container}>
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
            onPress={() => navigation.navigate("Home")}
          >
            <ThemedText style={styles.headerButtonText}>Done</ThemedText>
          </Pressable>

          <GlassPill>
            <Feather name="image" size={16} color={Colors.editing.success} />
            <ThemedText style={styles.headerTitle}>Lifestyle Scene</ThemedText>
          </GlassPill>

          <View style={{ width: 60 }} />
        </View>
      </Animated.View>

      <View style={[styles.content, { paddingBottom: 220 }]}>
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
            entering={FadeInDown.delay(100).duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.imageContainer}
          >
            <Image source={{ uri: resultUri }} style={styles.resultImage} />
          </Animated.View>
        )}

        {/* Environment Badge */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.badgeContainer}
        >
          <GlassPill>
            <Feather name="check-circle" size={14} color={Colors.editing.success} />
            <ThemedText style={styles.environmentText}>{environmentLabel}</ThemedText>
          </GlassPill>
        </Animated.View>

        {/* Comparison Toggle */}
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
      </View>

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(400)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <BlurView intensity={40} tint="light" style={styles.bottomBlur} />
        <GlassCard theme="light" padding="lg" borderRadius="xl">
          <View style={styles.actionButtons}>
            {/* Primary Save Button */}
            {isSaved ? (
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
              <Pressable style={styles.actionButton} onPress={handleEditImage}>
                <IconButton
                  icon="edit-2"
                  onPress={handleEditImage}
                  size={48}
                  iconSize={22}
                  variant="glass"
                />
                <ThemedText style={styles.actionLabel}>Edit</ThemedText>
              </Pressable>

              <Pressable style={styles.actionButton} onPress={handleTryDifferentEnvironment}>
                <IconButton
                  icon="refresh-cw"
                  onPress={handleTryDifferentEnvironment}
                  size={48}
                  iconSize={22}
                  variant="glass"
                />
                <ThemedText style={styles.actionLabel}>Retry</ThemedText>
              </Pressable>

              <Pressable style={styles.actionButton} onPress={handleGenerateAnother}>
                <IconButton
                  icon="plus"
                  onPress={handleGenerateAnother}
                  size={48}
                  iconSize={22}
                  variant="glass"
                />
                <ThemedText style={styles.actionLabel}>New</ThemedText>
              </Pressable>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <SuccessAnimation onComplete={() => setShowSuccess(false)} size={140} />
        </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: 110,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
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
  badgeContainer: {
    marginTop: Spacing.lg,
  },
  environmentText: {
    color: Colors.editing.success,
    fontWeight: "600",
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
  bottomBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
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

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";

import { GradientBackground } from "@/components/GradientBackground";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.85;

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

  const handleSaveToGallery = async () => {
    setIsSaving(true);

    const result = await saveToFotoBoxAlbum(resultUri, "lifestyle_scene");

    if (result.success) {
      setIsSaved(true);
      if (Platform.OS !== "web") {
        Alert.alert("Saved!", "Lifestyle scene saved to FotoBox album.");
      }
    } else {
      if (Platform.OS !== "web") {
        Alert.alert(
          "Error",
          result.error || "Failed to save image. Please try again.",
        );
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
      // Save base64 image to file for editing (Skia needs file URIs)
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

  const environmentLabel = ENVIRONMENT_LABELS[environment] || "Lifestyle Scene";

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.content, { paddingTop: Spacing.md }]}>
        {/* Image display - toggles between normal and comparison view */}
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

        {/* Comparison toggle */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.toggleContainer}
        >
          <Pressable
            style={[
              styles.toggleButton,
              showComparison && styles.toggleButtonActive,
            ]}
            onPress={() => setShowComparison(!showComparison)}
          >
            <Feather
              name={showComparison ? "eye" : "sliders"}
              size={16}
              color={
                showComparison ? Colors.light.white : Colors.light.textSecondary
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

        {/* Environment Badge */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.environmentBadge}
        >
          <Feather name="check-circle" size={16} color={Colors.light.success} />
          <ThemedText style={styles.environmentText}>
            {environmentLabel}
          </ThemedText>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.actionButton, isSaved && styles.actionButtonSuccess]}
            onPress={handleSaveToGallery}
            disabled={isSaving || isSaved}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Feather
                name={isSaved ? "check" : "download"}
                size={20}
                color={isSaved ? Colors.light.success : Colors.light.primary}
              />
            )}
            <ThemedText
              style={[
                styles.actionButtonText,
                isSaved && styles.actionButtonTextSuccess,
              ]}
            >
              {isSaved ? "Saved" : "Save"}
            </ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleEditImage}>
            <Feather name="edit-2" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={handleTryDifferentEnvironment}
          >
            <Feather name="refresh-cw" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.actionButtonText}>Retry</ThemedText>
          </Pressable>
        </View>

        <Button onPress={handleGenerateAnother} variant="secondary">
          <View style={styles.buttonContent}>
            <Feather name="plus" size={20} color={Colors.light.text} />
            <ThemedText style={styles.secondaryButtonText}>
              Generate Another
            </ThemedText>
          </View>
        </Button>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.light.backgroundSecondary,
    ...Shadows.lg,
  },
  resultImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  environmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.success + "40",
  },
  environmentText: {
    color: Colors.light.success,
    fontWeight: "600",
    fontSize: 14,
  },
  toggleContainer: {
    marginTop: Spacing.md,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    ...Shadows.accent,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: Colors.light.white,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundRoot,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionButtonSuccess: {
    borderColor: Colors.light.success + "40",
    backgroundColor: Colors.light.success + "10",
  },
  actionButtonText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500",
  },
  actionButtonTextSuccess: {
    color: Colors.light.success,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontWeight: "600",
  },
});

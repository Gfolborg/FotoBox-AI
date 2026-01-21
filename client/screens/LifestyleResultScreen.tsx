/* eslint-disable react/jsx-no-undef */
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { GlassPill } from "@/components/GlassPill";
import { IconButton } from "@/components/IconButton";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useBatchEdit } from "@/context/BatchEditContext";

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

  const { resultUri: initialResultUri, originalUri, environment } = route.params as {
    resultUri: string;
    originalUri: string;
    environment: string;
  };

  const [resultUri, setResultUri] = useState(initialResultUri);
  const [showComparison, setShowComparison] = useState(false);
  
  const { pendingEditResult, setPendingEditResult } = useBatchEdit();

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
      });
    } catch (error) {
      console.error("Failed to prepare image for platform selection:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image. Please try again.");
      }
    }
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
      // On web, pass the data URI directly
      if (Platform.OS === "web") {
        navigation.navigate("EditImage", {
          imageUri: resultUri,
          originalUri: originalUri,
        });
        return;
      }
      
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
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <ThemedHeader title="Lifestyle Scene" />

      <View style={[styles.container, { paddingTop: insets.top + 54 }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 240 },
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
              <Feather
                name="check-circle"
                size={14}
                color={Colors.editing.success}
              />
              <ThemedText style={styles.environmentText}>
                {environmentLabel}
              </ThemedText>
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
        </ScrollView>

        {/* Bottom Action Bar */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
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
                  onPress={handleEditImage}
                >
                  <IconButton
                    icon="edit-2"
                    onPress={handleEditImage}
                    size={48}
                    iconSize={22}
                    variant="glass"
                  />
                  <ThemedText style={styles.actionLabel}>Edit</ThemedText>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={handleTryDifferentEnvironment}
                >
                  <IconButton
                    icon="refresh-cw"
                    onPress={handleTryDifferentEnvironment}
                    size={48}
                    iconSize={22}
                    variant="glass"
                  />
                  <ThemedText style={styles.actionLabel}>Retry</ThemedText>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={handleGenerateAnother}
                >
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
});

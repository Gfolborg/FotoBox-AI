import React, { useState } from "react";
import { StyleSheet, View, Image, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type BatchMockupResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchMockupResult"
>;

type BatchMockupResultScreenRouteProp = RouteProp<
  RootStackParamList,
  "BatchMockupResult"
>;

export default function BatchMockupResultScreen() {
  const navigation = useNavigation<BatchMockupResultScreenNavigationProp>();
  const route = useRoute<BatchMockupResultScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const { results, mockupType } = route.params;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const successResults = results.filter((r) => r.status === "completed" && r.resultUri);
  const failedResults = results.filter((r) => r.status === "failed");

  const handleSaveAll = async () => {
    if (saving || saved || successResults.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission required to save images");
      }

      for (const result of successResults) {
        if (!result.resultUri) continue;

        let fileUri = result.resultUri;

        if (result.resultUri.startsWith("data:")) {
          const base64Data = result.resultUri.split(",")[1];
          const filename = `mockup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
          fileUri = FileSystem.documentDirectory + filename;
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        await MediaLibrary.saveToLibraryAsync(fileUri);
      }

      setSaved(true);
      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Save error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleNewMockup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MockupSelection", {});
  };

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Home");
  };

  const currentResult = successResults[selectedIndex];

  return (
    <GradientBackground variant="warm">
      {showSuccess && <SuccessAnimation />}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <ThemedText style={styles.title}>Mockups Ready</ThemedText>
          <ThemedText style={styles.subtitle}>
            {successResults.length} of {results.length} created successfully
          </ThemedText>
        </Animated.View>

        {currentResult && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <GlassCard style={styles.previewCard}>
              <Image
                source={{ uri: currentResult.resultUri! }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {successResults.map((result, index) => (
              <Pressable
                key={result.originalUri}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedIndex(index);
                }}
                style={[
                  styles.thumbnailContainer,
                  selectedIndex === index && styles.thumbnailSelected,
                ]}
              >
                <Image
                  source={{ uri: result.resultUri! }}
                  style={styles.thumbnail}
                />
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {failedResults.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.failedSection}>
              <ThemedText style={styles.failedTitle}>
                {failedResults.length} failed
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.failedRow}
              >
                {failedResults.map((result) => (
                  <View key={result.originalUri} style={styles.failedItem}>
                    <Image
                      source={{ uri: result.originalUri }}
                      style={styles.failedThumbnail}
                    />
                    <View style={styles.failedOverlay}>
                      <Feather name="x" size={16} color="#FFF" />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.actions}
        >
          <GradientButton
            title={
              saved
                ? "Saved!"
                : saving
                ? "Saving..."
                : `Save All (${successResults.length})`
            }
            onPress={handleSaveAll}
            disabled={saving || saved || successResults.length === 0}
            style={styles.saveButton}
          />
          <GradientButton
            title="Create More Mockups"
            onPress={handleNewMockup}
            variant="secondary"
            style={styles.secondaryButton}
          />
          <GradientButton
            title="Back to Home"
            onPress={handleGoHome}
            variant="ghost"
            style={styles.outlineButton}
          />
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  previewCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  thumbnailRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  thumbnailContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailSelected: {
    borderColor: Colors.light.primary,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  failedSection: {
    marginTop: Spacing.lg,
  },
  failedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.error,
    marginBottom: Spacing.sm,
  },
  failedRow: {
    gap: Spacing.sm,
  },
  failedItem: {
    position: "relative",
  },
  failedThumbnail: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    opacity: 0.5,
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(239, 68, 68, 0.5)",
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  saveButton: {
    width: "100%",
  },
  secondaryButton: {
    width: "100%",
  },
  outlineButton: {
    width: "100%",
  },
});

import React, { useState } from "react";
import { StyleSheet, View, Image, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
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

  const [selectedIndex, setSelectedIndex] = useState(0);

  const successResults = results.filter(
    (r) => r.status === "completed" && r.resultUri,
  );
  const failedResults = results.filter((r) => r.status === "failed");

  const handleExportAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Prepare results for batch platform selection
    const exportableResults = successResults
      .filter((r) => r.resultUri)
      .map((r) => ({
        originalUri: r.originalUri,
        resultUri: r.resultUri!,
      }));

    navigation.navigate("BatchPlatformSelection", {
      results: exportableResults,
    });
  };

  const currentResult = successResults[selectedIndex];

  const handleEditSelected = async () => {
    if (!currentResult?.resultUri) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let imageUri = currentResult.resultUri;

    if (currentResult.resultUri.startsWith("data:")) {
      const base64Data = currentResult.resultUri.split(",")[1];
      const filename = `mockup_edit_${Date.now()}.jpg`;
      imageUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(imageUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    navigation.navigate("EditImage", {
      imageUri,
      originalUri: currentResult.originalUri,
    });
  };

  const handleNewMockup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MockupSelection", {});
  };

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Home");
  };

  return (
    <GradientBackground theme="home">
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
          <View style={styles.actionRow}>
            <Pressable style={styles.editButton} onPress={handleEditSelected}>
              <ThemedText style={styles.editButtonText}>Edit</ThemedText>
            </Pressable>
            <GradientButton
              title={`Save All (${successResults.length})`}
              onPress={handleExportAll}
              disabled={successResults.length === 0}
              icon="download"
              style={styles.saveButton}
            />
          </View>
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
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  editButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
  },
  secondaryButton: {
    width: "100%",
  },
  outlineButton: {
    width: "100%",
  },
});

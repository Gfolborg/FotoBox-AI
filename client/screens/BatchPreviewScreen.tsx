import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { GlassPill } from "@/components/GlassPill";
import { IconButton } from "@/components/IconButton";
import { BackgroundColorPicker } from "@/components/BackgroundColorPicker";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { usePresets } from "@/hooks/usePresets";
import { EditingPreset } from "@/types/preset";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchPreview"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchPreview">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.lg * 3) / 2;

export default function BatchPreviewScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { imageUris } = route.params;

  const [selectedImages, setSelectedImages] = useState<string[]>(imageUris);
  const [selectedBackgroundColor, setSelectedBackgroundColor] =
    useState("#FFFFFF");
  const [selectedPreset, setSelectedPreset] = useState<EditingPreset | null>(
    null,
  );

  const { presets } = usePresets();

  const handleRemoveImage = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImages((prev) => prev.filter((img) => img !== uri));
  };

  const handleAddMore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10 - selectedImages.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newUris].slice(0, 10));
    }
  };

  const getEstimatedTime = () => {
    const seconds = selectedImages.length * 8;
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} min`;
  };

  const handleSelectPreset = (preset: EditingPreset | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreset(preset);
    if (preset) {
      setSelectedBackgroundColor(preset.backgroundColor);
    }
  };

  const handleGenerate = () => {
    if (selectedImages.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("BatchProcessing", {
      imageUris: selectedImages,
      backgroundColor: selectedBackgroundColor,
    });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="chevron-left"
              onPress={() => navigation.goBack()}
              size={44}
              iconSize={24}
              variant="ghost"
              color={Colors.editing.text}
            />

            <GlassPill>
              <Feather name="layers" size={16} color={Colors.editing.text} />
              <ThemedText style={styles.headerTitle}>Batch Edit</ThemedText>
            </GlassPill>

            <View style={styles.countBadge}>
              <ThemedText style={styles.countText}>
                {selectedImages.length}
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Grid */}
          <View style={styles.gridContainer}>
            {selectedImages.map((item, index) => (
              <Animated.View
                key={item}
                entering={FadeInDown.delay(index * 60).duration(400)}
                style={styles.imageCard}
              >
                <Image source={{ uri: item }} style={styles.image} />
                <View style={styles.imageOverlay} />
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(item)}
                >
                  <Feather name="x" size={16} color="#FFFFFF" />
                </Pressable>
                <View style={styles.indexBadge}>
                  <ThemedText style={styles.indexText}>{index + 1}</ThemedText>
                </View>
              </Animated.View>
            ))}

            {selectedImages.length < 10 && (
              <Animated.View
                entering={FadeInDown.delay(selectedImages.length * 60).duration(
                  400,
                )}
              >
                <Pressable style={styles.addMoreCard} onPress={handleAddMore}>
                  <View style={styles.addMoreContent}>
                    <Feather
                      name="plus"
                      size={28}
                      color={Colors.editing.primary}
                    />
                    <ThemedText style={styles.addMoreText}>Add More</ThemedText>
                    <ThemedText style={styles.addMoreLimit}>
                      {10 - selectedImages.length} remaining
                    </ThemedText>
                  </View>
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* Preset Selector */}
          {presets.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              style={styles.section}
            >
              <ThemedText style={styles.sectionLabel}>Apply Preset</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetScroll}
              >
                <Pressable
                  style={[
                    styles.presetChip,
                    !selectedPreset && styles.presetChipSelected,
                  ]}
                  onPress={() => handleSelectPreset(null)}
                >
                  <ThemedText
                    style={[
                      styles.presetChipText,
                      !selectedPreset && styles.presetChipTextSelected,
                    ]}
                  >
                    None
                  </ThemedText>
                </Pressable>
                {presets.map((preset) => (
                  <Pressable
                    key={preset.id}
                    style={[
                      styles.presetChip,
                      selectedPreset?.id === preset.id &&
                        styles.presetChipSelected,
                    ]}
                    onPress={() => handleSelectPreset(preset)}
                  >
                    <View
                      style={[
                        styles.presetChipColor,
                        { backgroundColor: preset.backgroundColor },
                      ]}
                    />
                    <ThemedText
                      style={[
                        styles.presetChipText,
                        selectedPreset?.id === preset.id &&
                          styles.presetChipTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {preset.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Background Color */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            style={styles.section}
          >
            <ThemedText style={styles.sectionLabel}>
              Background Color
            </ThemedText>
            <BackgroundColorPicker
              selectedColor={selectedBackgroundColor}
              onColorSelect={(color) => {
                setSelectedBackgroundColor(color);
                setSelectedPreset(null);
              }}
            />
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
          <GlassCard theme="light" padding="md" borderRadius="xl">
            <View style={styles.bottomContent}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Feather
                    name="image"
                    size={16}
                    color={Colors.editing.textSecondary}
                  />
                  <ThemedText style={styles.summaryText}>
                    {selectedImages.length}{" "}
                    {selectedImages.length === 1 ? "image" : "images"}
                  </ThemedText>
                </View>
                <View style={styles.summaryDot} />
                <View style={styles.summaryItem}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: selectedBackgroundColor },
                    ]}
                  />
                  <ThemedText style={styles.summaryText}>
                    {selectedBackgroundColor === "#FFFFFF"
                      ? "White"
                      : selectedBackgroundColor}
                  </ThemedText>
                </View>
                <View style={styles.summaryDot} />
                <View style={styles.summaryItem}>
                  <Feather
                    name="clock"
                    size={14}
                    color={Colors.editing.textSecondary}
                  />
                  <ThemedText style={styles.summaryText}>
                    {getEstimatedTime()}
                  </ThemedText>
                </View>
              </View>

              <GradientButton
                title={`Generate ${selectedImages.length} ${selectedImages.length === 1 ? "Image" : "Images"}`}
                onPress={handleGenerate}
                disabled={selectedImages.length === 0}
                icon="zap"
                fullWidth
              />
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
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  countBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.editing.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: Colors.editing.buttonText,
    fontSize: 16,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 200,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  removeButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "rgba(0, 0, 0, 0.4)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  indexBadge: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  indexText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  addMoreCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.editing.border,
    borderStyle: "dashed",
  },
  addMoreContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  addMoreText: {
    color: Colors.editing.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  addMoreLimit: {
    color: Colors.editing.textTertiary,
    fontSize: 11,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  presetScroll: {
    gap: Spacing.sm,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  presetChipSelected: {
    borderColor: Colors.editing.primary,
    backgroundColor: Colors.editing.primarySubtle,
  },
  presetChipColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  presetChipText: {
    fontSize: 13,
    color: Colors.editing.textSecondary,
    maxWidth: 100,
  },
  presetChipTextSelected: {
    color: Colors.editing.primary,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: Spacing.md,
    right: Spacing.md,
  },
  bottomContent: {
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryText: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.editing.textTertiary,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});

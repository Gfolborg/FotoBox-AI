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
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { BackgroundColorPicker } from "@/components/BackgroundColorPicker";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { usePresets } from "@/hooks/usePresets";
import { EditingPreset } from "@/types/preset";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchPreview"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchPreview">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.xl * 3) / 2;

export default function BatchPreviewScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { imageUris } = route.params;

  const [selectedImages, setSelectedImages] = useState<string[]>(imageUris);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState("#FFFFFF");
  const [selectedPreset, setSelectedPreset] = useState<EditingPreset | null>(null);

  const { presets } = usePresets();

  const handleRemoveImage = (uri: string) => {
    setSelectedImages((prev) => prev.filter((img) => img !== uri));
  };

  const handleSelectPreset = (preset: EditingPreset | null) => {
    setSelectedPreset(preset);
    if (preset) {
      setSelectedBackgroundColor(preset.backgroundColor);
    }
  };

  const handleGenerate = () => {
    if (selectedImages.length === 0) return;
    navigation.navigate("BatchProcessing", {
      imageUris: selectedImages,
      backgroundColor: selectedBackgroundColor,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: Spacing.md }]}>
        <View style={styles.header}>
          <ThemedText type="h4">
            {selectedImages.length} {selectedImages.length === 1 ? "Image" : "Images"} Selected
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            Tap X to remove images • Max 10 images
          </ThemedText>
        </View>

        <FlatList
          data={selectedImages}
          numColumns={2}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.imageCard}>
              <Image source={{ uri: item }} style={styles.image} />
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveImage(item)}
              >
                <Feather name="x" size={16} color={Colors.light.white} />
              </Pressable>
            </View>
          )}
        />

        {/* Preset Selector */}
        {presets.length > 0 && (
          <View style={styles.presetSection}>
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
                    selectedPreset?.id === preset.id && styles.presetChipSelected,
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
                      selectedPreset?.id === preset.id && styles.presetChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {preset.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.colorPickerContainer}>
          <BackgroundColorPicker
            selectedColor={selectedBackgroundColor}
            onColorSelect={(color) => {
              setSelectedBackgroundColor(color);
              setSelectedPreset(null);
            }}
          />
        </View>
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Button onPress={handleGenerate} disabled={selectedImages.length === 0}>
          <ThemedText style={styles.buttonText}>
            Generate {selectedImages.length} Product{" "}
            {selectedImages.length === 1 ? "Image" : "Images"}
          </ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.light.textSecondary,
  },
  grid: {
    paddingHorizontal: Spacing.xl,
  },
  colorPickerContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.light.border,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  buttonText: {
    color: Colors.light.white,
    fontWeight: "600",
  },
  presetSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetChipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  presetChipColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetChipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    maxWidth: 100,
  },
  presetChipTextSelected: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});

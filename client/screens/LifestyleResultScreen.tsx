import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";

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
        Alert.alert("Error", result.error || "Failed to save image. Please try again.");
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
        Alert.alert("Error", "Could not prepare image for editing. Please try again.");
      }
    }
  };

  const environmentLabel =
    ENVIRONMENT_LABELS[environment] || "Lifestyle Scene";

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: Spacing.md }]}>
        {/* Result Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: resultUri }} style={styles.resultImage} />
        </View>

        {/* Environment Badge */}
        <View style={styles.environmentBadge}>
          <Feather name="check-circle" size={16} color={Colors.light.success} />
          <ThemedText style={styles.environmentText}>
            {environmentLabel}
          </ThemedText>
        </View>
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
    </ThemedView>
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

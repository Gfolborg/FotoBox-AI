import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchResult"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchResult">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.xl * 3) / 2;

export default function BatchResultScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { results } = route.params;

  const [savedUris, setSavedUris] = useState<Set<string>>(new Set());
  const [savingUris, setSavingUris] = useState<Set<string>>(new Set());

  const successfulResults = results.filter((r) => r.resultUri !== null);

  const handleSaveImage = async (resultUri: string, originalUri: string) => {
    setSavingUris((prev) => new Set([...prev, originalUri]));

    const result = await saveToFotoBoxAlbum(resultUri, "product_image");

    if (result.success) {
      setSavedUris((prev) => new Set([...prev, originalUri]));
      Alert.alert("Saved", "Image saved to FotoBox album");
    } else {
      Alert.alert("Error", result.error || "Failed to save image");
    }

    setSavingUris((prev) => {
      const newSet = new Set(prev);
      newSet.delete(originalUri);
      return newSet;
    });
  };

  const handleSaveAll = async () => {
    for (const result of successfulResults) {
      if (result.resultUri && !savedUris.has(result.originalUri)) {
        await handleSaveImage(result.resultUri, result.originalUri);
      }
    }
  };

  const handleGenerateMore = () => {
    navigation.popToTop();
  };

  const handleEditImage = async (resultUri: string, originalUri: string) => {
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
          "Could not prepare image for editing. Please try again.",
        );
      }
    }
  };

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.content, { paddingTop: Spacing.md }]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <ThemedText type="h3">Results</ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            {successfulResults.length} of {results.length} images processed
            successfully
          </ThemedText>
        </Animated.View>

        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item) => item.originalUri}
          contentContainerStyle={styles.grid}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 80).duration(400)}
              style={styles.resultCard}
            >
              {item.resultUri ? (
                <>
                  <Pressable
                    style={styles.imageContainer}
                    onPress={() =>
                      handleEditImage(item.resultUri!, item.originalUri)
                    }
                  >
                    <Image
                      source={{ uri: item.resultUri }}
                      style={styles.image}
                    />
                  </Pressable>
                  <View style={styles.actionButtonsRow}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        handleEditImage(item.resultUri!, item.originalUri)
                      }
                    >
                      <Feather
                        name="edit-2"
                        size={14}
                        color={Colors.light.buttonText}
                      />
                    </Pressable>
                    <Pressable
                      style={[
                        styles.saveButton,
                        (savingUris.has(item.originalUri) ||
                          savedUris.has(item.originalUri)) &&
                          styles.saveButtonDisabled,
                      ]}
                      onPress={() =>
                        handleSaveImage(item.resultUri!, item.originalUri)
                      }
                      disabled={
                        savingUris.has(item.originalUri) ||
                        savedUris.has(item.originalUri)
                      }
                    >
                      {savingUris.has(item.originalUri) ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.light.buttonText}
                        />
                      ) : savedUris.has(item.originalUri) ? (
                        <View style={styles.savedRow}>
                          <Feather
                            name="check"
                            size={14}
                            color={Colors.light.white}
                          />
                          <ThemedText style={styles.saveButtonText}>
                            Saved
                          </ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={styles.saveButtonText}>
                          Save
                        </ThemedText>
                      )}
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.failedCard}>
                  <Feather
                    name="alert-circle"
                    size={32}
                    color={Colors.light.error}
                  />
                  <ThemedText type="small" style={styles.errorText}>
                    {item.error || "Processing failed"}
                  </ThemedText>
                </View>
              )}
            </Animated.View>
          )}
        />
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        {successfulResults.length > 0 && (
          <Button
            onPress={handleSaveAll}
            disabled={savedUris.size === successfulResults.length}
            style={styles.saveAllButton}
          >
            <ThemedText style={styles.saveAllButtonText}>
              Save All to Gallery ({successfulResults.length - savedUris.size}{" "}
              remaining)
            </ThemedText>
          </Button>
        )}

        <Pressable style={styles.secondaryButton} onPress={handleGenerateMore}>
          <ThemedText style={styles.secondaryButtonText}>
            Generate More
          </ThemedText>
        </Pressable>
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
  },
  header: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.light.textSecondary,
  },
  grid: {
    paddingHorizontal: Spacing.xl,
  },
  resultCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.light.border,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  actionButtonsRow: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.xs,
    right: Spacing.xs,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  editButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.success,
  },
  saveButtonText: {
    color: Colors.light.buttonText,
    fontSize: 12,
    fontWeight: "600",
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  failedCard: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundDefault,
  },
  errorText: {
    marginTop: Spacing.xs,
    color: Colors.light.error,
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveAllButton: {
    marginBottom: Spacing.sm,
  },
  saveAllButtonText: {
    color: Colors.light.buttonText,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});

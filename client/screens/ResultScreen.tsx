import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import * as FileSystem from "expo-file-system/legacy";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";
import { Feather } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRouteProp = RouteProp<RootStackParamList, "Result">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.85;

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const { resultUri: initialResultUri, originalUri, backgroundColor = "#FFFFFF" } = route.params;

  const [resultUri, setResultUri] = useState(initialResultUri);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton
          onPress={() => navigation.popToTop()}
          pressOpacity={0.7}
        >
          <ThemedText style={styles.headerButton}>Done</ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation]);

  const handleSaveToGallery = async () => {
    setIsSaving(true);

    const result = await saveToFotoBoxAlbum(resultUri, "product_image");

    if (result.success) {
      setSaved(true);
      if (Platform.OS !== "web") {
        Alert.alert("Saved", "Your image has been saved to the FotoBox album.");
      }
    } else {
      if (Platform.OS !== "web") {
        Alert.alert("Save Failed", result.error || "Could not save the image. Please try again.");
      }
    }

    setIsSaving(false);
  };

  const handleGenerateAnother = () => {
    navigation.popToTop();
  };

  const handleEdit = async () => {
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

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: originalUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(backgroundColor);
      const endpoint = `${apiUrl}api/amazon-main?backgroundColor=${bgColorParam}`;

      console.log("[ResultScreen] Retrying generation with backgroundColor:", backgroundColor);

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
        setSaved(false); // Reset saved state for new image
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
        } else if (err.message.includes("Network request failed") || err.message.includes("TypeError")) {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setRetryError(errorMessage);

      if (Platform.OS !== "web") {
        Alert.alert("Retry Failed", errorMessage);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: resultUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.specContainer}>
        <ThemedText type="small" style={styles.specText}>
          2000 x 2000 - JPG
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSaveToGallery}
          disabled={isSaving || saved}
          variant={saved ? "secondary" : "primary"}
        >
          {isSaving ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color={Colors.light.buttonText} size="small" />
              <ThemedText style={styles.buttonText}>Saving...</ThemedText>
            </View>
          ) : saved ? (
            <View style={styles.loadingContent}>
              <Feather name="check-circle" size={18} color={Colors.light.success} />
              <ThemedText style={styles.savedButtonText}>Saved to Gallery</ThemedText>
            </View>
          ) : (
            "Save to Gallery"
          )}
        </Button>

        <Button
          onPress={handleEdit}
          variant="outline"
          disabled={isRetrying}
        >
          Edit Image
        </Button>

        <Button
          onPress={handleRetry}
          disabled={isRetrying}
          variant="outline"
        >
          {isRetrying ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color={Colors.light.primary} size="small" />
              <ThemedText style={styles.retryButtonText}>Regenerating...</ThemedText>
            </View>
          ) : (
            <View style={styles.loadingContent}>
              <Feather name="refresh-cw" size={16} color={Colors.light.primary} />
              <ThemedText style={styles.retryButtonText}>Retry Generation</ThemedText>
            </View>
          )}
        </Button>

        <Button
          onPress={handleGenerateAnother}
          variant="outline"
          disabled={isRetrying}
        >
          Generate Another
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    alignItems: "center",
  },
  headerButton: {
    color: Colors.light.primary,
    fontWeight: "500",
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.backgroundSecondary,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  specContainer: {
    marginTop: Spacing.md,
  },
  specText: {
    color: Colors.light.textSecondary,
  },
  buttonContainer: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: Colors.light.buttonText,
    fontWeight: "700",
    fontSize: 16,
  },
  savedButtonText: {
    color: Colors.light.text,
    fontWeight: "600",
    fontSize: 16,
  },
  retryButtonText: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 16,
  },
});

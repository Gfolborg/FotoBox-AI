import React from "react";
import { Alert, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { ResultScreenLayout } from "@/components/ResultScreenLayout";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "LifestyleResult">;

const getExtensionFromDataUri = (dataUri: string): string => {
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
  if (!match) return "jpg";
  const raw = match[1].toLowerCase();
  if (raw === "jpeg") return "jpg";
  if (raw === "png") return "png";
  if (raw === "webp") return "webp";
  return "jpg";
};

export default function LifestyleResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const {
    resultUri: initialResultUri,
    originalUri,
    environment,
    isCustom,
    productDescription,
    shadowControl,
    platform,
  } = route.params;

  const handleContinue = async (resultUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const extension = getExtensionFromDataUri(resultUri);
      const filename = `platform_temp_${Date.now()}.${extension}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("PlatformSelection", {
        imageUri: fileUri,
        originalUri: originalUri,
        sourceService: "lifestyle",
      });
    } catch (error) {
      console.error("Failed to prepare image for platform selection:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image. Please try again.");
      }
    }
  };

  const handleRetryGeneration = async () => {
    const formData = new FormData();
    formData.append("file", {
      uri: originalUri,
      name: "product_photo.jpg",
      type: "image/jpeg",
    } as unknown as Blob);

    const apiUrl = getApiUrl();
    let endpoint = `${apiUrl}api/lifestyle-scene`;
    const params = new URLSearchParams();

    params.append("environment", environment);
    if (isCustom) {
      params.append("isCustom", "true");
    }
    if (productDescription) {
      params.append("productDescription", productDescription);
    }
    if (shadowControl) {
      params.append("shadowControl", shadowControl);
    }
    if (platform) {
      params.append("platform", platform);
    }

    endpoint += `?${params.toString()}`;

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
      throw new Error(errorText || "Failed to generate lifestyle scene");
    }

    const blob = await response.blob();
    const reader = new FileReader();

    const base64data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read generated image"));
      reader.readAsDataURL(blob);
    });

    return base64data;
  };

  const handleIterateSubmit = async (notes: string, currentResultUri: string) => {
    const formData = new FormData();
    let imageUri = currentResultUri;

    if (Platform.OS === "web") {
      const blob = await fetch(imageUri).then((res) => res.blob());
      formData.append("file", blob, "lifestyle-iterate.png");
    } else {
      if (imageUri.startsWith("data:")) {
        const extension = getExtensionFromDataUri(imageUri);
        const filename = `iterate_source_${Date.now()}.${extension}`;
        const fileUri = FileSystem.documentDirectory + filename;
        const base64Data = imageUri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageUri = fileUri;
      }

      formData.append("file", {
        uri: imageUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
    }

    const apiUrl = getApiUrl();
    let endpoint = `${apiUrl}api/lifestyle-scene`;
    const params = new URLSearchParams();

    params.append("environment", environment);
    if (isCustom) {
      params.append("isCustom", "true");
    }
    if (productDescription) {
      params.append("productDescription", productDescription);
    }
    if (shadowControl) {
      params.append("shadowControl", shadowControl);
    }
    if (platform) {
      params.append("platform", platform);
    }
    params.append("iterationNotes", notes);

    endpoint += `?${params.toString()}`;

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
      throw new Error(errorText || "Failed to generate lifestyle scene");
    }

    const blob = await response.blob();
    const reader = new FileReader();
    const base64data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read generated image"));
      reader.readAsDataURL(blob);
    });

    return base64data;
  };

  const handleGenerateAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Start a new lifestyle scene",
      "Use the same product image or choose a new one.",
      [
        {
          text: "Use same image",
          onPress: () =>
            navigation.replace("EnvironmentSelection", {
              imageUri: originalUri,
            }),
        },
        {
          text: "Choose new image",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: false,
                quality: 1,
              });
              if (!result.canceled && result.assets[0]) {
                navigation.replace("EnvironmentSelection", {
                  imageUri: result.assets[0].uri,
                });
              }
            } catch (error) {
              console.error("Failed to pick image:", error);
              if (Platform.OS !== "web") {
                Alert.alert("Error", "Could not access your photos.");
              }
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleEditImage = async (resultUri: string) => {
    try {
      if (Platform.OS === "web") {
        navigation.navigate("EditImage", {
          imageUri: resultUri,
          originalUri: originalUri,
        });
        return;
      }

      const extension = getExtensionFromDataUri(resultUri);
      const filename = `edit_temp_${Date.now()}.${extension}`;
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

  return (
    <ResultScreenLayout
      title="Lifestyle Scene"
      initialResultUri={initialResultUri}
      originalUri={originalUri}
      onRetry={handleRetryGeneration}
      onIterate={handleIterateSubmit}
      onEdit={handleEditImage}
      onContinue={handleContinue}
      onGenerateAnother={handleGenerateAnother}
      workingLabels={{
        retryTitle: "Regenerating Scene",
        retryHint: "This may take up to 30 seconds",
        iterateTitle: "Refining Scene",
        iterateHint: "Applying your changes",
      }}
    />
  );
}

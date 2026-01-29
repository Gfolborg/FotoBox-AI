import React from "react";
import { Alert, Platform } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";
import { buildMockupWizardState } from "@/lib/mockup-templates";
import {
  BatchResultScreenLayout,
  BatchResultItem,
} from "@/components/BatchResultScreenLayout";

const getExtensionFromDataUri = (dataUri: string): string => {
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
  if (!match) return "jpg";
  const raw = match[1].toLowerCase();
  if (raw === "jpeg") return "jpg";
  if (raw === "png") return "png";
  if (raw === "webp") return "webp";
  return "jpg";
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type RouteProps = RouteProp<RootStackParamList, "BatchMockupResult">;

export default function BatchMockupResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {
    results: initialResults,
    sceneVibe,
    cameraOption,
    modelOption,
    customScenePrompt,
    negativePrompt,
    customDescription,
    mockupItem,
    mockupColor,
    useCase,
    adStyle,
    productCategoryId,
    desiredMockup,
    templatePrompt,
    productMaterial,
    productSize,
    hasDesign,
    sceneType,
    sceneSetting,
  } = route.params;

  const mockupUseCase = useCase || "neutral";
  const mockupAdStyle = adStyle || "simple";

  const buildIterationPrompt = (notes: string) =>
    `\n\nITERATION REQUEST:\n- Keep the product and applied design exactly as-is (no edits, no recoloring, no repositioning or resizing of the artwork).\n- You may change the scene/background/lighting and the camera angle, crop, and distance.\n- Apply ONLY these changes: ${notes}\n- Do not add text, borders, or padding.`;

  const handleExportAll = (
    results: { originalUri: string; resultUri: string }[],
  ) => {
    navigation.navigate("BatchPlatformSelection", {
      results,
      sourceService: "mockup",
    });
  };

  const handleDone = () => {
    navigation.popToTop();
  };

  const handleRetrySelected = async (item: BatchResultItem) => {
    const prompt = getMockupPrompt(
      mockupItem,
      sceneVibe,
      cameraOption,
      mockupColor,
      customDescription,
      modelOption,
      customScenePrompt,
      negativePrompt,
      mockupUseCase,
      mockupAdStyle,
      productCategoryId,
      desiredMockup,
      templatePrompt,
      undefined,
      productMaterial,
      productSize,
      hasDesign,
      sceneType,
      sceneSetting,
    );

    const manipulated = await ImageManipulator.manipulateAsync(
      item.originalUri,
      [],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
    );

    const formData = new FormData();
    formData.append("file", {
      uri: manipulated.uri,
      name: "product_photo.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
    formData.append("prompt", prompt);
    if (customScenePrompt) {
      formData.append("customPrompt", customScenePrompt);
    }
    if (negativePrompt) {
      formData.append("negativePrompt", negativePrompt);
    }
    formData.append("mockupType", mockupItem.id);
    formData.append("sceneVibe", sceneVibe.id);
    formData.append("cameraOption", cameraOption.id);
    if (mockupColor) {
      formData.append("mockupColor", mockupColor);
    }

    const response = await fetch(
      new URL("/api/mockup", getApiUrl()).toString(),
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create mockup");
    }

    const data = await response.json();

    return data.resultUri as string;
  };

  const handleIterateSelected = async (
    item: BatchResultItem,
    notes: string,
  ) => {
    if (!item.resultUri) {
      throw new Error("Missing result image");
    }

    const prompt = `${getMockupPrompt(
      mockupItem,
      sceneVibe,
      cameraOption,
      mockupColor,
      customDescription,
      modelOption,
      customScenePrompt,
      negativePrompt,
      mockupUseCase,
      mockupAdStyle,
      productCategoryId,
      desiredMockup,
      templatePrompt,
      undefined,
      productMaterial,
      productSize,
      hasDesign,
      sceneType,
      sceneSetting,
    )}${buildIterationPrompt(notes)}`;

    const formData = new FormData();

    if (Platform.OS === "web") {
      const blob = await fetch(item.resultUri).then((res) => res.blob());
      formData.append("file", blob, "mockup-iterate.png");
    } else {
      let sourceUri = item.resultUri;
      if (sourceUri.startsWith("data:")) {
        const extension = getExtensionFromDataUri(sourceUri);
        const filename = `iterate_source_${Date.now()}.${extension}`;
        const fileUri = FileSystem.documentDirectory + filename;
        const base64Data = sourceUri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        sourceUri = fileUri;
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        sourceUri,
        [],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
      );

      formData.append("file", {
        uri: manipulated.uri,
        name: "product.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
    }

    formData.append("prompt", prompt);
    if (customScenePrompt) {
      formData.append("customPrompt", customScenePrompt);
    }
    if (negativePrompt) {
      formData.append("negativePrompt", negativePrompt);
    }
    formData.append("mockupType", mockupItem.id);
    formData.append("sceneVibe", sceneVibe.id);
    formData.append("cameraOption", cameraOption.id);
    if (mockupColor) {
      formData.append("mockupColor", mockupColor);
    }

    const response = await fetch(
      new URL("/api/mockup", getApiUrl()).toString(),
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create mockup");
    }

    const data = await response.json();

    return data.resultUri as string;
  };

  const handleEditSelected = async (
    item: BatchResultItem,
    resultUri: string,
  ) => {
    try {
      let imageUri = resultUri;
      if (Platform.OS !== "web" && imageUri.startsWith("data:")) {
        const extension = getExtensionFromDataUri(imageUri);
        const filename = `edit_temp_${Date.now()}.${extension}`;
        const fileUri = FileSystem.documentDirectory + filename;
        const base64Data = imageUri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageUri = fileUri;
      }

      navigation.navigate("EditImage", {
        imageUri,
        originalUri: item.originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image for editing.");
      }
    }
  };

  const handleNewSelected = (item: BatchResultItem) => {
    Alert.alert(
      "Start a new mockup",
      "Use the same product image or choose a new one.",
      [
        {
          text: "Use same image",
          onPress: () =>
            navigation.navigate("MockupWizardPath", {
              wizardState: buildMockupWizardState([item.originalUri]),
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
                navigation.navigate("MockupWizardPath", {
                  wizardState: buildMockupWizardState([result.assets[0].uri]),
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

  return (
    <BatchResultScreenLayout
      title="Mockup Results"
      initialResults={initialResults}
      onExportAll={handleExportAll}
      onRetry={handleRetrySelected}
      onIterate={handleIterateSelected}
      onEdit={handleEditSelected}
      onNew={handleNewSelected}
      onDone={handleDone}
    />
  );
}

import React, { useState } from "react";
import { Alert, Platform } from "react-native";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";

import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";
import { buildMockupWizardState } from "@/lib/mockup-templates";
import { ResultScreenLayout } from "@/components/ResultScreenLayout";
import { useCredits } from "@/hooks/useCredits";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";

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

type RouteProps = RouteProp<RootStackParamList, "MockupResult">;

export default function MockupResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { requiresWatermark, consumeCredit, canGenerate, creditsRemaining } = useCredits();
  const { showNotification } = useNotification();
  const { token } = useAuth();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const showAuthPrompt = () => {
    Alert.alert(
      "Sign in required",
      "Please sign in to generate mockups.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign in",
          onPress: () => {
            setAuthRedirect({ name: "MockupResult", params: route.params });
            navigation.navigate("Auth");
          },
        },
      ],
    );
  };

  const {
    resultUri: initialResultUri,
    originalUri,
    mockupItem,
    sceneVibe,
    cameraOption,
    mockupColor,
    customDescription,
    modelOption,
    customScenePrompt,
    negativePrompt,
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
        originalUri,
        sourceService: "mockup",
      });
    } catch (error) {
      console.error("Failed to prepare image for platform selection:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image. Please try again.");
      }
    }
  };

  const handleRetryGeneration = async () => {
    // Check if user has credits (unless unlimited)
    const isUnlimited = creditsRemaining === -1;
    if (!isUnlimited && !canGenerate) {
      setShowUpgradePrompt(true);
      throw new Error("No credits remaining");
    }
    
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
      originalUri,
      [],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
    );

    const formData = new FormData();
    formData.append("file", {
      uri: manipulated.uri,
      name: "product.jpg",
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

    const watermarkParam = requiresWatermark ? "?applyWatermark=true" : "";
    if (!token) {
      showAuthPrompt();
      throw new Error("Authentication required");
    }
    const response = await fetch(
      new URL(`/api/mockup${watermarkParam}`, getApiUrl()).toString(),
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create mockup");
    }

    const data = await response.json();

    // Consume credit for successful regeneration (unless unlimited)
    if (creditsRemaining !== -1) {
      const creditResult = await consumeCredit("mockup");
      if (creditResult.creditsRemaining === 1) {
        showNotification("1 credit left! Grab more to keep going.", "warning");
      }
    }

    return data.resultUri as string;
  };

  const handleIterateSubmit = async (
    notes: string,
    currentResultUri: string,
  ) => {
    // Check if user has credits (unless unlimited)
    const isUnlimited = creditsRemaining === -1;
    if (!isUnlimited && !canGenerate) {
      setShowUpgradePrompt(true);
      throw new Error("No credits remaining");
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
      const blob = await fetch(currentResultUri).then((res) => res.blob());
      formData.append("file", blob, "mockup-iterate.png");
    } else {
      let sourceUri = currentResultUri;
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

    const watermarkParam = requiresWatermark ? "?applyWatermark=true" : "";
    if (!token) {
      showAuthPrompt();
      throw new Error("Authentication required");
    }
    const response = await fetch(
      new URL(`/api/mockup${watermarkParam}`, getApiUrl()).toString(),
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create mockup");
    }

    const data = await response.json();

    // Consume credit for successful iteration (unless unlimited)
    if (creditsRemaining !== -1) {
      const creditResult = await consumeCredit("mockup");
      if (creditResult.creditsRemaining === 1) {
        showNotification("1 credit left! Grab more to keep going.", "warning");
      }
    }

    return data.resultUri as string;
  };

  const handleGenerateAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Start a new mockup",
      "Use the same product image or choose a new one.",
      [
        {
          text: "Use same image",
          onPress: () =>
            navigation.replace("MockupWizardPath", {
              wizardState: buildMockupWizardState([originalUri]),
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
                navigation.replace("MockupWizardPath", {
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

  const handleEditImage = async (resultUri: string) => {
    try {
      if (Platform.OS === "web") {
        navigation.navigate("EditImage", {
          imageUri: resultUri,
          originalUri,
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
        originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image for editing.");
      }
    }
  };

  return (
    <>
      <ResultScreenLayout
        title="Mockup Result"
        initialResultUri={initialResultUri}
        originalUri={originalUri}
        onRetry={handleRetryGeneration}
        onIterate={handleIterateSubmit}
        onEdit={handleEditImage}
        onContinue={handleContinue}
        onGenerateAnother={handleGenerateAnother}
        workingLabels={{
          retryTitle: "Regenerating Mockup",
          retryHint: "This may take up to 30 seconds",
          iterateTitle: "Refining Mockup",
          iterateHint: "Applying your changes",
        }}
      />
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </>
  );
}

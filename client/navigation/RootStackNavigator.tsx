import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import CameraScreen from "@/screens/CameraScreen";
import PhotoActionScreen from "@/screens/PhotoActionScreen";
import EditImageScreen from "@/screens/EditImageScreen";
import ResultScreen from "@/screens/ResultScreen";
import BatchPreviewScreen from "@/screens/BatchPreviewScreen";
import BatchProcessingScreen from "@/screens/BatchProcessingScreen";
import BatchResultScreen from "@/screens/BatchResultScreen";
import HomeScreen from "@/screens/HomeScreen";
import PresetSelectionScreen from "@/screens/PresetSelectionScreen";
import EnvironmentSelectionScreen from "@/screens/EnvironmentSelectionScreen";
import LifestyleResultScreen from "@/screens/LifestyleResultScreen";
import BatchLifestyleProcessingScreen from "@/screens/BatchLifestyleProcessingScreen";
import BatchLifestyleResultScreen from "@/screens/BatchLifestyleResultScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import BackgroundColorSelectionScreen from "@/screens/BackgroundColorSelectionScreen";
import BatchActionSelectionScreen from "@/screens/BatchActionSelectionScreen";
import MockupProcessingScreen from "@/screens/MockupProcessingScreen";
import MockupResultScreen from "@/screens/MockupResultScreen";
import BatchMockupProcessingScreen from "@/screens/BatchMockupProcessingScreen";
import BatchMockupResultScreen from "@/screens/BatchMockupResultScreen";
import MockupWizardImagesScreen from "@/screens/MockupWizardImagesScreen";
import MockupWizardTemplatesScreen from "@/screens/MockupWizardTemplatesScreen";
import MockupWizardCustomizeScreen from "@/screens/MockupWizardCustomizeScreen";
import MockupWizardReviewScreen from "@/screens/MockupWizardReviewScreen";
import QuickFixScreen from "@/screens/QuickFixScreen";
import PlatformSelectionScreen from "@/screens/PlatformSelectionScreen";
import BatchPlatformSelectionScreen from "@/screens/BatchPlatformSelectionScreen";
import {
  MockupItem,
  SceneVibe,
  CameraOption,
  ModelOption,
} from "@/lib/mockup-presets";
import { MockupWizardState } from "@/lib/mockup-templates";

export type BackgroundBatchResult = {
  originalUri: string;
  resultUri: string | null;
  error?: string;
  status: "pending" | "processing" | "completed" | "failed";
  backgroundVerified?: boolean;
  backgroundColor?: string;
};

export type RootStackParamList = {
  Home: undefined;
  Camera:
    | {
        existingResults?: BackgroundBatchResult[];
        skipEnhancement?: boolean;
      }
    | undefined;
  QuickFix: {
    imageUri: string;
    existingResults?: BackgroundBatchResult[];
    skipEnhancement?: boolean;
  };
  PhotoAction: { imageUri: string; existingResults?: BackgroundBatchResult[] };
  BackgroundColorSelection: {
    imageUri: string;
    existingResults?: BackgroundBatchResult[];
  };
  EditImage: { imageUri: string; originalUri?: string; presetId?: string };
  Result: {
    resultUri: string;
    originalUri: string;
    backgroundColor?: string;
    isEdited?: boolean;
  };
  PlatformSelection: {
    imageUri: string;
    originalUri?: string;
    sourceService?: "background" | "lifestyle" | "mockup" | "edit";
  };
  BatchPlatformSelection: {
    results: { originalUri: string; resultUri: string }[];
    sourceService?: "background" | "lifestyle" | "mockup" | "edit";
  };

  // Batch flow
  BatchActionSelection: { imageUris: string[] };
  BatchPreview: { imageUris: string[] };
  BatchProcessing: {
    imageUris: string[];
    backgroundColor?: string;
    existingResults?: BackgroundBatchResult[];
  };
  BatchResult: {
    results: BackgroundBatchResult[];
    backgroundColor?: string;
  };

  // Preset and Lifestyle flows
  PresetSelection: undefined;
  EnvironmentSelection: {
    imageUri?: string;
    imageUris?: string[];
    returnToBatch?: boolean;
  };
  LifestyleResult: {
    resultUri: string;
    originalUri: string;
    environment: string;
    isCustom?: boolean;
    productDescription?: string;
    shadowControl?: string;
    platform?: string;
  };
  BatchLifestyleProcessing: {
    imageUris: string[];
    environment: string;
    isCustom?: boolean;
    productDescription?: string;
    shadowControl?: string;
    platform?: string;
  };
  BatchLifestyleResult: {
    results: {
      originalUri: string;
      resultUri: string | null;
      error?: string;
      status: "pending" | "processing" | "completed" | "failed";
    }[];
    environment: string;
    isCustom?: boolean;
    productDescription?: string;
    shadowControl?: string;
    platform?: string;
  };

  // Mockup flows
  MockupWizardImages: {
    imageUri?: string;
    imageUris?: string[];
    wizardState?: MockupWizardState;
  };
  MockupWizardTemplates: { wizardState: MockupWizardState };
  MockupWizardCustomize: { wizardState: MockupWizardState };
  MockupWizardReview: { wizardState: MockupWizardState };
  MockupProcessing: {
    imageUri: string;
    mockupItem: MockupItem;
    sceneVibe: SceneVibe;
    cameraOption: CameraOption;
    mockupColor?: string;
    customDescription?: string;
    customScenePrompt?: string;
    negativePrompt?: string;
    modelOption?: ModelOption;
  };
  MockupResult: {
    resultUri: string;
    originalUri: string;
    mockupType: string;
    mockupItem: MockupItem;
    sceneVibe: SceneVibe;
    cameraOption: CameraOption;
    mockupColor?: string;
    customDescription?: string;
    customScenePrompt?: string;
    negativePrompt?: string;
    modelOption?: ModelOption;
  };
  BatchMockupProcessing: {
    imageUris: string[];
    mockupItem: MockupItem;
    sceneVibe: SceneVibe;
    cameraOption: CameraOption;
    mockupColor?: string;
    customDescription?: string;
    customScenePrompt?: string;
    negativePrompt?: string;
    modelOption?: ModelOption;
  };
  BatchMockupResult: {
    results: {
      originalUri: string;
      resultUri: string | null;
      error?: string;
      status: "pending" | "processing" | "completed" | "failed";
    }[];
    mockupType: string;
    sceneVibe?: SceneVibe;
    cameraOption?: CameraOption;
    modelOption?: ModelOption;
    customScenePrompt?: string;
    negativePrompt?: string;
    customDescription?: string;
    mockupItem: MockupItem;
    mockupColor?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_COMPLETED_KEY = "@FotoBox:onboardingCompleted";

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem(
          ONBOARDING_COMPLETED_KEY,
        );
        if (onboardingCompleted === "true") {
          setShowOnboarding(false);
        }
      } catch (e) {
        console.error("Failed to fetch onboarding status", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
      setShowOnboarding(false);
    } catch (e) {
      console.error("Failed to save onboarding status", e);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuickFix"
        component={QuickFixScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PhotoAction"
        component={PhotoActionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BackgroundColorSelection"
        component={BackgroundColorSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditImage"
        component={EditImageScreen}
        options={{ headerTitle: "Edit Image" }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ headerTitle: "Product Ready" }}
      />
      <Stack.Screen
        name="PlatformSelection"
        component={PlatformSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BatchPlatformSelection"
        component={BatchPlatformSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BatchActionSelection"
        component={BatchActionSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BatchPreview"
        component={BatchPreviewScreen}
        options={{ headerTitle: "Batch Preview" }}
      />
      <Stack.Screen
        name="BatchProcessing"
        component={BatchProcessingScreen}
        options={{ headerTitle: "Processing", headerBackVisible: false }}
      />
      <Stack.Screen
        name="BatchResult"
        component={BatchResultScreen}
        options={{ headerTitle: "Batch Results", headerBackVisible: false }}
      />
      <Stack.Screen
        name="PresetSelection"
        component={PresetSelectionScreen}
        options={{ headerTitle: "My Presets" }}
      />
      <Stack.Screen
        name="EnvironmentSelection"
        component={EnvironmentSelectionScreen}
        options={{ headerTitle: "Lifestyle Scene" }}
      />
      <Stack.Screen
        name="LifestyleResult"
        component={LifestyleResultScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BatchLifestyleProcessing"
        component={BatchLifestyleProcessingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BatchLifestyleResult"
        component={BatchLifestyleResultScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockupWizardImages"
        component={MockupWizardImagesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockupWizardTemplates"
        component={MockupWizardTemplatesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockupWizardCustomize"
        component={MockupWizardCustomizeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockupWizardReview"
        component={MockupWizardReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockupProcessing"
        component={MockupProcessingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MockupResult"
        component={MockupResultScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BatchMockupProcessing"
        component={BatchMockupProcessingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BatchMockupResult"
        component={BatchMockupResultScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

import React, { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import OnboardingScreen from "@/screens/OnboardingScreen";



export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  PhotoAction: { imageUri: string };
  EditImage: { imageUri: string; originalUri?: string; presetId?: string };
  Result: { resultUri: string; originalUri: string; backgroundColor?: string };

  // Batch flow
  BatchPreview: { imageUris: string[] };
  BatchProcessing: { imageUris: string[]; backgroundColor?: string };
  BatchResult: {
    results: {
      originalUri: string;
      resultUri: string | null;
      error?: string;
      status: "pending" | "processing" | "completed" | "failed";
    }[];
  };

  // Preset and Lifestyle flows
  PresetSelection: undefined;
  EnvironmentSelection: { imageUri?: string };
  LifestyleResult: { resultUri: string; originalUri: string; environment: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_COMPLETED_KEY = '@FotoBox:onboardingCompleted';

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        if (onboardingCompleted === 'true') {
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
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
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
        name="PhotoAction"
        component={PhotoActionScreen}
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
                 options={{ headerTitle: "Lifestyle Scene", headerBackVisible: false }}
               />
                        
                        
                      </Stack.Navigator>  );
}

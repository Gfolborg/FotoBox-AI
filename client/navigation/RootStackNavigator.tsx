import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import CameraScreen from "@/screens/CameraScreen";
import EditImageScreen from "@/screens/EditImageScreen";
import ResultScreen from "@/screens/ResultScreen";
import BatchPreviewScreen from "@/screens/BatchPreviewScreen";
import BatchProcessingScreen from "@/screens/BatchProcessingScreen";
import BatchResultScreen from "@/screens/BatchResultScreen";
import HomeScreen from "@/screens/HomeScreen";
import PresetSelectionScreen from "@/screens/PresetSelectionScreen";
import EnvironmentSelectionScreen from "@/screens/EnvironmentSelectionScreen";
import LifestyleResultScreen from "@/screens/LifestyleResultScreen";

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  EditImage: { imageUri: string; originalUri?: string; presetId?: string };
  Result: { resultUri: string; originalUri: string; backgroundColor?: string };

  // Batch flow
  BatchPreview: { imageUris: string[] };
  BatchProcessing: { imageUris: string[]; backgroundColor?: string };
  BatchResult: {
    results: Array<{
      originalUri: string;
      resultUri: string | null;
      error?: string;
      status: "pending" | "processing" | "completed" | "failed";
    }>;
  };

  // Preset flow
  PresetSelection: undefined;

  // Lifestyle scene flow
  EnvironmentSelection: { imageUri?: string };
  LifestyleResult: {
    resultUri: string;
    originalUri: string;
    environment: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

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
    </Stack.Navigator>
  );
}

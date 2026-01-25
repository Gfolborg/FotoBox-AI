import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { MockupWizardState } from "@/lib/mockup-templates";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardImages"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardImages">;

const buildInitialState = (
  imageUri?: string,
  imageUris?: string[],
  existingState?: MockupWizardState,
): MockupWizardState => {
  if (existingState) {
    return existingState;
  }

  const images = imageUri ? [imageUri] : imageUris || [];
  return {
    mode: "custom",
    images,
    applyToAll: true,
    outputCount: 1,
  };
};

export default function MockupWizardImagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { imageUri, imageUris, wizardState } = route.params || {};
  const [state, setState] = useState<MockupWizardState>(() =>
    buildInitialState(imageUri, imageUris, wizardState),
  );

  useEffect(() => {
    if (!wizardState && (imageUri || imageUris?.length)) {
      setState(buildInitialState(imageUri, imageUris, wizardState));
    }
  }, [imageUri, imageUris, wizardState]);

  const handleSelectImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      setState((prev) => ({
        ...prev,
        images: result.assets.map((asset) => asset.uri),
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("MockupWizardTemplates", { wizardState: state });
  };

  const hasImages = state.images.length > 0;

  return (
    <GradientBackground theme="home">
      <ThemedHeader title="Mockup Studio" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <ThemedText style={styles.stepLabel}>Step 1 of 4</ThemedText>
          <ThemedText style={styles.stepTitle}>Choose Images</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Add one or more product images to mock up.
          </ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Your Images</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageRow}
        >
          {state.images.map((uri, index) => (
            <View key={uri} style={styles.imageContainer}>
              <Image
                source={{ uri }}
                style={styles.thumbnail}
                transition={150}
                cachePolicy="memory-disk"
              />
              <Pressable
                onPress={() => handleRemoveImage(index)}
                style={styles.removeButton}
              >
                <Feather name="x" size={14} color="#FFF" />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={handleSelectImages} style={styles.addImageButton}>
            <Feather name="plus" size={24} color={Colors.light.primary} />
            <ThemedText style={styles.addImageText}>
              {state.images.length === 0 ? "Select" : "Add"}
            </ThemedText>
          </Pressable>
        </ScrollView>

        {hasImages && (
          <ThemedText style={styles.imageCount}>
            {state.images.length} image{state.images.length > 1 ? "s" : ""}{" "}
            selected (max 10)
          </ThemedText>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <GradientButton
          title="Next"
          onPress={handleNext}
          disabled={!hasImages}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  stepHeader: {
    marginBottom: Spacing.md,
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  imageRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  imageContainer: {
    position: "relative",
  },
  thumbnail: {
    width: 78,
    height: 78,
    borderRadius: BorderRadius.md,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.error,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: 78,
    height: 78,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249, 115, 22, 0.05)",
  },
  addImageText: {
    fontSize: 11,
    color: Colors.light.primary,
    marginTop: 2,
  },
  imageCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});

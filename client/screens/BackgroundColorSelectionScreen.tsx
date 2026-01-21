import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Smaller preview size to ensure all content fits on screen
const IMAGE_PREVIEW_SIZE = Math.min(
  SCREEN_WIDTH - Spacing.lg * 2,
  SCREEN_HEIGHT * 0.3,
  280,
);

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BackgroundColorSelection"
>;
type RouteProps = RouteProp<RootStackParamList, "BackgroundColorSelection">;

const BACKGROUND_COLORS = [
  { id: "white", color: "#FFFFFF", name: "White", border: true },
  { id: "black", color: "#000000", name: "Black", border: false },
  { id: "gray", color: "#F5F5F5", name: "Light Gray", border: true },
  { id: "cream", color: "#FFFEF0", name: "Cream", border: true },
  { id: "coral", color: "#F97316", name: "Coral", border: false },
  { id: "sky", color: "#0EA5E9", name: "Sky Blue", border: false },
  { id: "mint", color: "#10B981", name: "Mint", border: false },
  { id: "lavender", color: "#A855F7", name: "Lavender", border: false },
];

export default function BackgroundColorSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUri } = route.params;
  const [selectedColor, setSelectedColor] = useState("white");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleGenerate = () => {
    const selected = BACKGROUND_COLORS.find((c) => c.id === selectedColor);
    navigation.replace("BatchProcessing", {
      imageUris: [imageUri],
      backgroundColor: selected?.color || "#FFFFFF",
    });
  };

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />
      <ThemedHeader title="Background Color" />
      <View style={[styles.container, { paddingTop: insets.top + 54 }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image preview with neutral background - NOT the selected color */}
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.imagePreviewContainer}
          >
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.promptContainer}
          >
            <ThemedText style={styles.promptText}>
              Choose background color
            </ThemedText>
            <ThemedText style={styles.promptSubtext}>
              AI will remove the existing background and replace it with your
              selected color
            </ThemedText>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.colorsContainer}
          >
            {BACKGROUND_COLORS.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.colorButton,
                  { backgroundColor: item.color },
                  item.border && styles.colorButtonBorder,
                  selectedColor === item.id && styles.colorButtonSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(item.id);
                }}
              >
                {selectedColor === item.id && (
                  <View
                    style={[
                      styles.checkmark,
                      item.color === "#000000" && styles.checkmarkLight,
                    ]}
                  >
                    <Feather
                      name="check"
                      size={16}
                      color={
                        item.color === "#000000"
                          ? "#FFFFFF"
                          : Colors.editing.primary
                      }
                    />
                  </View>
                )}
              </Pressable>
            ))}
          </Animated.View>

          {/* Selected color name */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            style={styles.selectedLabel}
          >
            <ThemedText style={styles.selectedLabelText}>
              {BACKGROUND_COLORS.find((c) => c.id === selectedColor)?.name}
            </ThemedText>
          </Animated.View>
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <GradientButton
            title="Generate"
            icon="zap"
            onPress={handleGenerate}
            fullWidth
          />
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    paddingBottom: Spacing.md,
  },
  imagePreviewContainer: {
    width: IMAGE_PREVIEW_SIZE,
    height: IMAGE_PREVIEW_SIZE,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: "#FFFFFF",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  promptContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  promptText: {
    color: Colors.editing.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  promptSubtext: {
    color: Colors.editing.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  colorButtonBorder: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: Colors.editing.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkLight: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  selectedLabel: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  selectedLabelText: {
    color: Colors.editing.text,
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});

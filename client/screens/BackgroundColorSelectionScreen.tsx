import React, { useState } from "react";
import { View, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { GradientButton } from "@/components/GradientButton";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_PREVIEW_SIZE = Math.min(SCREEN_WIDTH - Spacing.xl * 2, 200);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BackgroundColorSelection">;
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
    const selected = BACKGROUND_COLORS.find(c => c.id === selectedColor);
    navigation.replace("BatchProcessing", { 
      imageUris: [imageUri], 
      backgroundColor: selected?.color || "#FFFFFF" 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="light" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <IconButton
            icon="chevron-left"
            onPress={() => navigation.goBack()}
            size={44}
            iconSize={24}
            variant="ghost"
            color={Colors.editing.text}
          />

          <GlassPill>
            <Feather name="droplet" size={16} color={Colors.editing.primary} />
            <ThemedText style={styles.headerTitle}>Background Color</ThemedText>
          </GlassPill>

          <View style={{ width: 44 }} />
        </View>
      </Animated.View>

      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          style={[styles.imagePreviewContainer, { backgroundColor: BACKGROUND_COLORS.find(c => c.id === selectedColor)?.color }]}
        >
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.promptContainer}>
          <ThemedText style={styles.promptText}>Choose background color</ThemedText>
          <ThemedText style={styles.promptSubtext}>AI will remove the background and place your product on this color</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.colorsContainer}>
          {BACKGROUND_COLORS.map((item, index) => (
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
                <View style={[styles.checkmark, item.color === "#000000" && styles.checkmarkLight]}>
                  <Feather name="check" size={16} color={item.color === "#000000" ? "#FFFFFF" : Colors.editing.primary} />
                </View>
              )}
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.selectedLabel}>
          <ThemedText style={styles.selectedLabelText}>
            {BACKGROUND_COLORS.find(c => c.id === selectedColor)?.name}
          </ThemedText>
        </Animated.View>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.editing.backgroundRoot,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  imagePreviewContainer: {
    width: IMAGE_PREVIEW_SIZE,
    height: IMAGE_PREVIEW_SIZE,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  promptContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
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
    ...Shadows.md,
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

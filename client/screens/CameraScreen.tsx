import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Camera">;

// Retake tips data
const RETAKE_TIPS = [
  {
    icon: "sun" as const,
    title: "Good Lighting",
    description: "Use natural light or well-lit area. Avoid harsh shadows.",
  },
  {
    icon: "maximize" as const,
    title: "Fill the Frame",
    description: "Position product to take up 80-85% of the image.",
  },
  {
    icon: "target" as const,
    title: "Stay Centered",
    description: "Keep the product centered and straight.",
  },
  {
    icon: "image" as const,
    title: "Plain Background",
    description: "Use a simple, uncluttered background.",
  },
  {
    icon: "zap" as const,
    title: "Hold Steady",
    description: "Keep phone stable to avoid blur.",
  },
];

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectionMode, setSelectionMode] = useState<"single" | "batch">(
    "single",
  );
  const [showTips, setShowTips] = useState(false);

  const captureScale = useSharedValue(1);
  const captureOpacity = useSharedValue(0.3);

  const captureAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
    backgroundColor: `rgba(255, 255, 255, ${captureOpacity.value})`,
  }));

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    captureScale.value = withSpring(0.9);
    captureOpacity.value = withSpring(1);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      if (photo?.uri) {
        navigation.navigate("EditImage", { imageUri: photo.uri });
      }
    } catch (error) {
      console.error("Failed to capture photo:", error);
    } finally {
      setIsCapturing(false);
      captureScale.value = withSpring(1);
      captureOpacity.value = withSpring(0.3);
    }
  };

  const handlePickSingleImage = async () => {
    setSelectionMode("single");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate("EditImage", { imageUri: result.assets[0].uri });
    }
  };

  const handlePickBatchImages = async () => {
    setSelectionMode("batch");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    setSelectionMode("single");

    if (!result.canceled) {
      if (result.assets.length > 1) {
        const imageUris = result.assets.map((asset) => asset.uri);
        navigation.navigate("BatchPreview", { imageUris });
      } else if (result.assets[0]) {
        navigation.navigate("EditImage", { imageUri: result.assets[0].uri });
      }
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    if (permission.status === "denied" && !permission.canAskAgain) {
      return (
        <View
          style={[
            styles.container,
            styles.centered,
            styles.permissionContainer,
          ]}
        >
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.permissionContent}
          >
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Feather
                name="camera-off"
                size={64}
                color={Colors.light.primary}
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <ThemedText type="h4" style={styles.permissionTitle}>
                Camera Access Required
              </ThemedText>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <ThemedText style={styles.permissionText}>
                Please enable camera access in your device settings to capture
                product photos.
              </ThemedText>
            </Animated.View>
            {Platform.OS !== "web" && (
              <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                <Pressable
                  style={styles.settingsButton}
                  onPress={async () => {
                    try {
                      await Linking.openSettings();
                    } catch {
                      console.error("Could not open settings");
                    }
                  }}
                >
                  <ThemedText style={styles.settingsButtonText}>
                    Open Settings
                  </ThemedText>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      );
    }

    return (
      <View
        style={[styles.container, styles.centered, styles.permissionContainer]}
      >
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.permissionContent}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Feather name="camera" size={64} color={Colors.light.primary} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <ThemedText type="h4" style={styles.permissionTitle}>
              Enable Camera
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <ThemedText style={styles.permissionText}>
              To capture product photos, we need access to your camera.
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Pressable style={styles.enableButton} onPress={requestPermission}>
              <ThemedText style={styles.enableButtonText}>
                Enable Camera
              </ThemedText>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={[styles.overlay, { paddingTop: insets.top + Spacing.xl }]}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Feather
                  name="chevron-left"
                  size={28}
                  color={Colors.light.white}
                />
              </Pressable>
              <ThemedText type="h4" style={styles.headerTitle}>
                Product Shot
              </ThemedText>
              <Pressable
                style={styles.tipsButton}
                onPress={() => setShowTips(true)}
              >
                <Feather
                  name="help-circle"
                  size={24}
                  color={Colors.light.white}
                />
              </Pressable>
            </View>

            <View style={styles.segmentedControl}>
              <Pressable
                style={[
                  styles.segmentButton,
                  styles.segmentButtonLeft,
                  selectionMode === "single" && styles.segmentButtonActive,
                ]}
                onPress={handlePickSingleImage}
              >
                <Feather
                  name="image"
                  size={16}
                  color={
                    selectionMode === "single"
                      ? Colors.light.primary
                      : Colors.light.white
                  }
                />
                <ThemedText
                  style={[
                    styles.segmentText,
                    selectionMode === "single" && styles.segmentTextActive,
                  ]}
                >
                  Single
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.segmentButton,
                  styles.segmentButtonRight,
                  selectionMode === "batch" && styles.segmentButtonActive,
                ]}
                onPress={handlePickBatchImages}
              >
                <Feather
                  name="layers"
                  size={16}
                  color={
                    selectionMode === "batch"
                      ? Colors.light.primary
                      : Colors.light.white
                  }
                />
                <ThemedText
                  style={[
                    styles.segmentText,
                    selectionMode === "batch" && styles.segmentTextActive,
                  ]}
                >
                  Batch
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.controls,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          <Pressable onPress={handleCapture} disabled={isCapturing}>
            <Animated.View style={[styles.captureButton, captureAnimatedStyle]}>
              {isCapturing ? (
                <ActivityIndicator color={Colors.light.primary} />
              ) : (
                <View style={styles.captureInner} />
              )}
            </Animated.View>
          </Pressable>
        </View>
      </CameraView>

      {/* Retake Tips Modal */}
      <Modal
        visible={showTips}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTips(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTips(false)}
        >
          <View style={styles.tipsModal}>
            <View style={styles.tipsHeader}>
              <ThemedText type="h4" style={styles.tipsTitle}>
                Photo Tips
              </ThemedText>
              <Pressable
                onPress={() => setShowTips(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={Colors.light.text} />
              </Pressable>
            </View>

            <View style={styles.tipsList}>
              {RETAKE_TIPS.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipIconContainer}>
                    <Feather
                      name={tip.icon}
                      size={20}
                      color={Colors.light.primary}
                    />
                  </View>
                  <View style={styles.tipContent}>
                    <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
                    <ThemedText style={styles.tipDescription}>
                      {tip.description}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.gotItButton}
              onPress={() => setShowTips(false)}
            >
              <ThemedText style={styles.gotItButtonText}>Got it!</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer: {
    backgroundColor: Colors.light.backgroundRoot,
  },
  permissionContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  permissionText: {
    marginTop: Spacing.sm,
    textAlign: "center",
    color: Colors.light.textSecondary,
  },
  enableButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  enableButtonText: {
    color: Colors.light.white,
    fontWeight: "600",
  },
  settingsButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  settingsButtonText: {
    color: Colors.light.white,
    fontWeight: "600",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    color: Colors.light.white,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
    textAlign: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: BorderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  segmentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    minWidth: 100,
  },
  segmentButtonLeft: {
    borderTopLeftRadius: BorderRadius.full,
    borderBottomLeftRadius: BorderRadius.full,
  },
  segmentButtonRight: {
    borderTopRightRadius: BorderRadius.full,
    borderBottomRightRadius: BorderRadius.full,
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.white,
  },
  segmentText: {
    color: Colors.light.white,
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  segmentTextActive: {
    color: Colors.light.primary,
    textShadowColor: "transparent",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 80,
  },
  captureButton: {
    width: Spacing.captureButtonSize,
    height: Spacing.captureButtonSize,
    borderRadius: Spacing.captureButtonSize / 2,
    borderWidth: Spacing.captureButtonBorder,
    borderColor: Colors.light.white,
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: Spacing.captureButtonSize - 16,
    height: Spacing.captureButtonSize - 16,
    borderRadius: (Spacing.captureButtonSize - 16) / 2,
    backgroundColor: Colors.light.white,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tipsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  tipsModal: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  tipsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    color: Colors.light.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  tipsList: {
    gap: Spacing.md,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  gotItButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  gotItButtonText: {
    color: Colors.light.white,
    fontWeight: "600",
    fontSize: 16,
  },
});

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
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { GradientButton } from "@/components/GradientButton";
import { Colors, Spacing, BorderRadius, Animations } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Camera">;

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
  const [showGrid, setShowGrid] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const captureScale = useSharedValue(1);

  const captureAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: captureScale.value }],
    };
  });

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    captureScale.value = withSpring(0.85, Animations.springFast);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
      captureScale.value = withSpring(1, Animations.spring);
    }
  };

  const handlePickSingleImage = async () => {
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

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
        <ActivityIndicator size="large" color={Colors.editing.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, styles.permissionContainer]}>
        <StatusBar style="dark" />
        <Animated.View entering={FadeIn.duration(500)} style={styles.permissionContent}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.permissionIconContainer}>
            <Feather
              name={permission.status === "denied" ? "camera-off" : "camera"}
              size={56}
              color={Colors.light.primary}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <ThemedText type="h3" style={styles.permissionTitle}>
              {permission.status === "denied" ? "Camera Access Required" : "Enable Camera"}
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <ThemedText style={styles.permissionText}>
              {permission.status === "denied"
                ? "Please enable camera access in your device settings to capture product photos."
                : "To capture product photos, we need access to your camera."}
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.permissionButtonContainer}>
            {permission.status === "denied" && !permission.canAskAgain ? (
              Platform.OS !== "web" && (
                <GradientButton
                  title="Open Settings"
                  icon="settings"
                  onPress={async () => {
                    try {
                      await Linking.openSettings();
                    } catch {
                      console.error("Could not open settings");
                    }
                  }}
                />
              )
            ) : (
              <GradientButton title="Enable Camera" icon="camera" onPress={requestPermission} />
            )}
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Grid overlay */}
        {showGrid && (
          <View style={styles.gridOverlay}>
            <View style={styles.gridRow}>
              <View style={styles.gridCell} />
              <View style={[styles.gridCell, styles.gridCellBorder]} />
              <View style={styles.gridCell} />
            </View>
            <View style={[styles.gridRow, styles.gridRowBorder]}>
              <View style={styles.gridCell} />
              <View style={[styles.gridCell, styles.gridCellBorder]} />
              <View style={styles.gridCell} />
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell} />
              <View style={[styles.gridCell, styles.gridCellBorder]} />
              <View style={styles.gridCell} />
            </View>
          </View>
        )}

        {/* Top controls */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.topControls, { paddingTop: insets.top + Spacing.md }]}
        >
          <IconButton
            icon="chevron-left"
            onPress={() => navigation.goBack()}
            size={44}
            iconSize={26}
          />

          <GlassPill>
            <Feather name="camera" size={16} color={Colors.editing.text} />
            <ThemedText style={styles.headerTitle}>Product Shot</ThemedText>
          </GlassPill>

          <View style={styles.topRightButtons}>
            <IconButton
              icon="grid"
              onPress={() => {
                setShowGrid(!showGrid);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              size={44}
              iconSize={20}
              color={showGrid ? Colors.editing.primary : Colors.editing.text}
            />
            <IconButton
              icon="help-circle"
              onPress={() => setShowTips(true)}
              size={44}
              iconSize={20}
            />
          </View>
        </Animated.View>

        {/* Bottom controls */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={[styles.bottomControls, { paddingBottom: insets.bottom + Spacing.xl }]}
        >
          {/* Gallery buttons */}
          <View style={styles.sideButton}>
            <IconButton
              icon="image"
              onPress={handlePickSingleImage}
              size={52}
              iconSize={24}
              variant="glass"
            />
            <ThemedText style={styles.sideButtonLabel}>Gallery</ThemedText>
          </View>

          {/* Capture button */}
          <Pressable onPress={handleCapture} disabled={isCapturing}>
            <Animated.View style={[styles.captureButtonOuter, captureAnimatedStyle]}>
              <View style={styles.captureButtonInner}>
                {isCapturing ? (
                  <ActivityIndicator color={Colors.editing.backgroundRoot} size="small" />
                ) : (
                  <View style={styles.captureButtonCenter} />
                )}
              </View>
            </Animated.View>
          </Pressable>

          {/* Batch button */}
          <View style={styles.sideButton}>
            <IconButton
              icon="layers"
              onPress={handlePickBatchImages}
              size={52}
              iconSize={24}
              variant="glass"
            />
            <ThemedText style={styles.sideButtonLabel}>Batch</ThemedText>
          </View>
        </Animated.View>
      </CameraView>

      {/* Tips Modal */}
      <Modal
        visible={showTips}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTips(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTips(false)}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.tipsModal}>
            <BlurView intensity={60} tint="dark" style={styles.tipsBlur} />
            <View style={styles.tipsContent}>
              <View style={styles.tipsHeader}>
                <ThemedText type="h4" style={styles.tipsTitle}>
                  Photo Tips
                </ThemedText>
                <IconButton
                  icon="x"
                  onPress={() => setShowTips(false)}
                  size={36}
                  iconSize={20}
                  variant="ghost"
                  color={Colors.editing.text}
                />
              </View>

              <View style={styles.tipsList}>
                {RETAKE_TIPS.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={styles.tipIconContainer}>
                      <Feather name={tip.icon} size={18} color={Colors.editing.primary} />
                    </View>
                    <View style={styles.tipTextContent}>
                      <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
                      <ThemedText style={styles.tipDescription}>{tip.description}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              <GradientButton
                title="Got it!"
                onPress={() => setShowTips(false)}
                fullWidth
                style={styles.gotItButton}
              />
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.editing.backgroundRoot,
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
    maxWidth: 340,
  },
  permissionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primarySubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    textAlign: "center",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    textAlign: "center",
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  permissionButtonContainer: {
    marginTop: Spacing.xl,
    width: "100%",
  },
  camera: {
    flex: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  gridRowBorder: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  gridCell: {
    flex: 1,
  },
  gridCellBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  topRightButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing["2xl"],
  },
  sideButton: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  sideButtonLabel: {
    color: Colors.editing.text,
    fontSize: 12,
    fontWeight: "500",
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    padding: 4,
    borderWidth: 3,
    borderColor: Colors.editing.text,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: Colors.editing.text,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.editing.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  tipsModal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  tipsBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  tipsContent: {
    backgroundColor: "rgba(26, 26, 26, 0.85)",
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.xl,
  },
  tipsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    color: Colors.editing.text,
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
    borderRadius: 18,
    backgroundColor: Colors.editing.primarySubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTextContent: {
    flex: 1,
  },
  tipTitle: {
    color: Colors.editing.text,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 2,
  },
  tipDescription: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  gotItButton: {
    marginTop: Spacing.xl,
  },
});

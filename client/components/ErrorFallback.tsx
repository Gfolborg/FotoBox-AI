import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
  Modal,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Fonts, Gradients } from "@/constants/theme";

const logoImage = require("../../assets/images/fotobox-logo.png");

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { theme } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.editing.backgroundRoot, "#1A1A1A"]}
        style={styles.gradient}
      />

      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          style={styles.topButton}
        >
          <Feather name="alert-circle" size={20} color={Colors.editing.error} />
        </Pressable>
      ) : null}

      <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
        {/* Error Icon */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.iconContainer}>
          <LinearGradient
            colors={["rgba(255, 99, 71, 0.2)", "rgba(255, 99, 71, 0.05)"]}
            style={styles.iconGradient}
          >
            <Feather name="alert-triangle" size={48} color={Colors.editing.error} />
          </LinearGradient>
        </Animated.View>

        {/* Logo */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {/* Error Message Card */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.cardContainer}>
          <GlassCard theme="dark" padding="lg" borderRadius="xl">
            <View style={styles.cardContent}>
              <ThemedText type="h3" style={styles.title}>
                Oops! Something went wrong
              </ThemedText>
              <ThemedText style={styles.message}>
                FotoBox encountered an unexpected issue. Tap below to restart and try again.
              </ThemedText>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Restart Button */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.buttonContainer}>
          <GradientButton
            title="Restart FotoBox"
            onPress={handleRestart}
            icon="refresh-cw"
            size="lg"
          />
        </Animated.View>
      </Animated.View>

      {/* Debug Modal for Development */}
      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText type="h3" style={styles.modalTitle}>
                  Error Details
                </ThemedText>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={Colors.editing.text} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText} selectable>
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: Colors.editing.backgroundRoot,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 99, 71, 0.3)",
    borderRadius: 60,
  },
  logo: {
    width: 180,
    height: 50,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400,
  },
  cardContent: {
    alignItems: "center",
    gap: Spacing.md,
  },
  title: {
    color: Colors.editing.text,
    textAlign: "center",
  },
  message: {
    color: Colors.editing.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
  topButton: {
    position: "absolute",
    top: Spacing["2xl"] + Spacing.lg,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 99, 71, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 99, 71, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: "100%",
    height: "85%",
    backgroundColor: Colors.editing.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.editing.border,
  },
  modalTitle: {
    color: Colors.editing.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  errorContainer: {
    width: "100%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.editing.text,
    fontFamily: Fonts?.mono || "monospace",
  },
});

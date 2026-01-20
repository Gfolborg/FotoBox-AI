import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { GradientButton } from "./GradientButton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ApplyToAllModalProps {
  visible: boolean;
  remainingCount: number;
  onApplyToAll: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function ApplyToAllModal({
  visible,
  remainingCount,
  onApplyToAll,
  onSkip,
  onClose,
}: ApplyToAllModalProps) {
  const handleApplyToAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyToAll();
    onClose();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={FadeInUp.duration(300).springify()}
          style={styles.modalContainer}
        >
          <View style={styles.iconContainer}>
            <Feather name="copy" size={32} color={Colors.editing.primary} />
          </View>

          <ThemedText style={styles.title}>Apply to All?</ThemedText>
          <ThemedText style={styles.description}>
            Would you like to apply the same edits to the remaining{" "}
            {remainingCount} {remainingCount === 1 ? "image" : "images"}?
          </ThemedText>

          <View style={styles.buttonsContainer}>
            <GradientButton
              title={`Apply to All (${remainingCount})`}
              onPress={handleApplyToAll}
              icon="check"
              fullWidth
            />

            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <ThemedText style={styles.skipText}>
                No, I&apos;ll edit each one
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.hintContainer}>
            <Feather
              name="info"
              size={14}
              color={Colors.editing.textTertiary}
            />
            <ThemedText style={styles.hintText}>
              This prompt won&apos;t appear again this session
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.editing.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.editing.primarySubtle,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.editing.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 15,
    color: Colors.editing.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  buttonsContainer: {
    width: "100%",
    gap: Spacing.md,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  skipText: {
    fontSize: 15,
    color: Colors.editing.textSecondary,
    fontWeight: "500",
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.editing.border,
  },
  hintText: {
    fontSize: 12,
    color: Colors.editing.textTertiary,
  },
});

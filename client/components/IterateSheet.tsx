import React from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "./ThemedText";
import { GlassCard } from "./GlassCard";
import { GradientButton } from "./GradientButton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const QUICK_TWEAKS = [
  "Brighter lighting",
  "Cleaner background",
  "Softer shadows",
  "Sharper product",
  "Warmer tone",
  "More depth of field",
];

function SuggestionChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 160 });
      }}
    >
      <Animated.View style={[styles.suggestionChip, animatedStyle]}>
        <ThemedText style={styles.suggestionText}>{label}</ThemedText>
      </Animated.View>
    </Pressable>
  );
}

interface IterateSheetProps {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function IterateSheet({
  isOpen,
  value,
  onChange,
  onClose,
  onSubmit,
  isSubmitting = false,
}: IterateSheetProps) {
  const insets = useSafeAreaInsets();

  const handleSuggestion = (suggestion: string) => {
    const trimmed = value.trim();
    const nextValue = trimmed ? `${trimmed}, ${suggestion}` : suggestion;
    onChange(nextValue);
  };

  const canSubmit = value.trim().length > 0 && !isSubmitting;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.modalCenter, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <GlassCard style={styles.modalCard}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>Iterate Result</ThemedText>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={20} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.heroCallout}>
              <View style={styles.heroIcon}>
                <Feather name="repeat" size={18} color={Colors.editing.primary} />
              </View>
              <View style={styles.heroTextWrap}>
                <ThemedText style={styles.heroTitle}>
                  Keep building this scene
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  Add details or adjustments to create a new iteration.
                </ThemedText>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputHeader}>
                <ThemedText style={styles.label}>
                  Describe what you want to change
                </ThemedText>
                <ThemedText style={styles.inputHint}>
                  Example: brighter light, cleaner background, tighter crop
                </ThemedText>
              </View>
              <View style={styles.inputShell}>
                <LinearGradient
                  colors={["rgba(14, 165, 233, 0.08)", "rgba(59, 130, 246, 0.06)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.inputGradient}
                />
                <LinearGradient
                  colors={["rgba(0, 0, 0, 0.12)", "rgba(0, 0, 0, 0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.inputInsetTop}
                />
                <LinearGradient
                  colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.12)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.inputInsetBottom}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., brighter light, cleaner background, tighter crop"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <ThemedText style={styles.sectionLabel}>Quick tweaks</ThemedText>
              <View style={styles.suggestions}>
                {QUICK_TWEAKS.map((item) => (
                  <SuggestionChip
                    key={item}
                    label={item}
                    onPress={() => handleSuggestion(item)}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <GradientButton
                title={isSubmitting ? "Iterating..." : "Apply Changes"}
                onPress={onSubmit}
                disabled={!canSubmit}
                fullWidth
              />
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalCenter: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    padding: Spacing.lg,
    backgroundColor: Colors.light.backgroundRoot,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  heroCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.2)",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  scroll: {
    maxHeight: 360,
  },
  scrollContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  inputHeader: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputShell: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    overflow: "hidden",
  },
  inputGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  inputInsetTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  inputInsetBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
  },
  input: {
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 96,
    maxHeight: 160,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.md,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(14, 165, 233, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
});

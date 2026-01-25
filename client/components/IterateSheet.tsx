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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "./ThemedText";
import { GlassCard } from "./GlassCard";
import { GradientButton } from "./GradientButton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const QUICK_TWEAKS = [
  "Brighter lighting",
  "Cleaner background",
  "Softer shadows",
  "Sharper product",
  "Warmer tone",
  "More depth of field",
];

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

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={styles.label}>
                Describe what you want to change
              </ThemedText>
              <GlassCard style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., brighter light, cleaner background, tighter crop"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                />
              </GlassCard>

              <ThemedText style={styles.sectionLabel}>Quick tweaks</ThemedText>
              <View style={styles.suggestions}>
                {QUICK_TWEAKS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => handleSuggestion(item)}
                    style={styles.suggestionChip}
                  >
                    <ThemedText style={styles.suggestionText}>{item}</ThemedText>
                  </Pressable>
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputCard: {
    padding: Spacing.md,
  },
  input: {
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 96,
    maxHeight: 160,
    textAlignVertical: "top",
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
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
});

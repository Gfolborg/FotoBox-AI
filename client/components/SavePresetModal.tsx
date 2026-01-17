import React, { useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { PresetAdjustments, EditingPreset } from "@/types/preset";

interface SavePresetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, aiSettings?: EditingPreset['aiSettings']) => Promise<void>;
  adjustments: PresetAdjustments;
  backgroundColor: string;
  aiSettings?: EditingPreset['aiSettings'];
  isSaving?: boolean;
}

export function SavePresetModal({
  visible,
  onClose,
  onSave,
  adjustments,
  backgroundColor,
  aiSettings, // Added aiSettings prop
  isSaving = false,
}: SavePresetModalProps) {
  const [name, setName] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave(name.trim(), aiSettings);
    setName("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  const hasAdjustments =
    adjustments.brightness !== 0 ||
    adjustments.contrast !== 1 ||
    adjustments.saturation !== 1 ||
    adjustments.exposure !== 0 ||
    adjustments.highlights !== 0 ||
    adjustments.shadows !== 0 ||
    adjustments.warmth !== 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <ThemedText type="h4" style={styles.title}>
              Save as Preset
            </ThemedText>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Preset Name</ThemedText>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Warm Studio Look"
                placeholderTextColor={Colors.light.textTertiary}
                autoFocus
                maxLength={50}
              />
            </View>

            <View style={styles.previewSection}>
              <ThemedText style={styles.label}>Preview</ThemedText>
              <View style={styles.previewGrid}>
                <View style={styles.previewItem}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: backgroundColor },
                    ]}
                  />
                  <ThemedText style={styles.previewLabel}>
                    Background
                  </ThemedText>
                </View>

                <View style={styles.previewItem}>
                  <View style={styles.adjustmentIndicator}>
                    <Feather
                      name="sliders"
                      size={16}
                      color={
                        hasAdjustments
                          ? Colors.light.primary
                          : Colors.light.textTertiary
                      }
                    />
                  </View>
                  <ThemedText style={styles.previewLabel}>
                    {hasAdjustments ? "Custom" : "Default"}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSaving}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.saveButton,
                (!name.trim() || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.light.buttonText}
                />
              ) : (
                <>
                  <Feather
                    name="bookmark"
                    size={18}
                    color={Colors.light.buttonText}
                  />
                  <ThemedText style={styles.saveButtonText}>
                    Save Preset
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.overlay,
  },
  modal: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    width: "90%",
    maxWidth: 400,
    ...Shadows.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    color: Colors.light.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  previewSection: {
    gap: Spacing.sm,
  },
  previewGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  previewItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.backgroundTertiary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  adjustmentIndicator: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.light.buttonText,
    fontWeight: "600",
  },
});

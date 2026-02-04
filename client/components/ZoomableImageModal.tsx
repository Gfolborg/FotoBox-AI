import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";
import { ZoomableImage } from "@/components/ZoomableImage";

type ZoomableImageModalProps = {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  title?: string;
};

export function ZoomableImageModal({
  visible,
  imageUri,
  onClose,
  title = "Preview",
}: ZoomableImageModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={20} color={Colors.light.text} />
          </Pressable>
        </View>

        <View style={styles.imageWrap}>
          {imageUri && <ZoomableImage uri={imageUri} />}
        </View>

        <View style={styles.hint}>
          <Feather name="zoom-in" size={14} color={Colors.light.textSecondary} />
          <ThemedText style={styles.hintText}>Pinch to zoom</ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.white,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  imageWrap: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  hintText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

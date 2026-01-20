import React from "react";
import { Modal, View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { GradientButton } from "./GradientButton";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface SaveOrEnhanceModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveToGallery: () => void;
  onRemoveBackground: () => void;
  onCreateLifestyle: () => void;
  onCreateMockup: () => void;
  isSaving?: boolean;
}

interface ActionCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  badge?: string;
  onPress: () => void;
  delay: number;
}

function ActionCard({
  icon,
  title,
  description,
  color,
  badge,
  onPress,
  delay,
}: ActionCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <Pressable
        style={styles.actionCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View
          style={[
            styles.actionIconContainer,
            { backgroundColor: color + "20" },
          ]}
        >
          <Feather name={icon} size={24} color={color} />
        </View>
        <View style={styles.actionTextContainer}>
          <View style={styles.actionTitleRow}>
            <ThemedText style={styles.actionTitle}>{title}</ThemedText>
            {badge && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{badge}</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.actionDescription}>
            {description}
          </ThemedText>
        </View>
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SaveOrEnhanceModal({
  visible,
  onClose,
  onSaveToGallery,
  onRemoveBackground,
  onCreateLifestyle,
  onCreateMockup,
  isSaving = false,
}: SaveOrEnhanceModalProps) {
  const handleClose = () => {
    if (!isSaving) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          disabled={isSaving}
        />
        <Animated.View entering={FadeIn.duration(200)} style={styles.modal}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Save or Enhance</ThemedText>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isSaving}
            >
              <Feather name="x" size={24} color="#111827" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={styles.sectionTitle}>Save Image</ThemedText>

            <GradientButton
              title={isSaving ? "Saving..." : "Save to Gallery"}
              onPress={onSaveToGallery}
              disabled={isSaving}
              loading={isSaving}
              icon="download"
              fullWidth
              style={styles.saveButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>
                or enhance with AI
              </ThemedText>
              <View style={styles.dividerLine} />
            </View>

            <ActionCard
              icon="scissors"
              title="Remove Background"
              description="AI-powered background removal"
              color={Colors.editing.primary}
              badge="AI"
              onPress={onRemoveBackground}
              delay={100}
            />

            <ActionCard
              icon="image"
              title="Create Lifestyle Scene"
              description="Place in AI-generated environments"
              color="#10B981"
              badge="AI"
              onPress={onCreateLifestyle}
              delay={200}
            />

            <ActionCard
              icon="box"
              title="Create Mockup"
              description="Generate realistic product mockups"
              color="#A78BFA"
              badge="AI"
              onPress={onCreateMockup}
              delay={300}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "85%",
    ...Shadows.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: Spacing.md,
  },
  saveButton: {
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontSize: 13,
    color: "#6B7280",
    marginHorizontal: Spacing.md,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: Spacing.md,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  actionTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  actionDescription: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  arrowContainer: {
    marginLeft: Spacing.sm,
  },
});

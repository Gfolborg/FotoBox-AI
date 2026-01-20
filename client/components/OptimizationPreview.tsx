import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "./ThemedText";
import { GlassCard } from "./GlassCard";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { PlatformRequirement } from "@/lib/platform-requirements";

interface OptimizationPreviewProps {
  selectedPlatforms: PlatformRequirement[];
  currentWidth?: number;
  currentHeight?: number;
}

export function OptimizationPreview({
  selectedPlatforms,
  currentWidth,
  currentHeight,
}: OptimizationPreviewProps) {
  if (selectedPlatforms.length === 0) {
    return (
      <GlassCard theme="light" padding="md" borderRadius="lg">
        <View style={styles.emptyContainer}>
          <Feather name="info" size={20} color={Colors.editing.textTertiary} />
          <ThemedText style={styles.emptyText}>
            Select platforms to see optimization details
          </ThemedText>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard theme="light" padding="md" borderRadius="lg">
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Optimization Preview</ThemedText>
        <View style={styles.countBadge}>
          <ThemedText style={styles.countText}>
            {selectedPlatforms.length} platform
            {selectedPlatforms.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>
      </View>

      {/* Current Dimensions */}
      {currentWidth && currentHeight && (
        <View style={styles.currentDimensions}>
          <Feather
            name="image"
            size={14}
            color={Colors.editing.textSecondary}
          />
          <ThemedText style={styles.currentText}>
            Current: {currentWidth} x {currentHeight}
          </ThemedText>
        </View>
      )}

      {/* Platform List */}
      <View style={styles.platformList}>
        {selectedPlatforms.map((platform) => (
          <View key={platform.id} style={styles.platformItem}>
            <View style={styles.platformInfo}>
              <View
                style={[
                  styles.platformDot,
                  { backgroundColor: platform.color },
                ]}
              />
              <ThemedText style={styles.platformName}>
                {platform.name}
              </ThemedText>
            </View>
            <View style={styles.optimizationInfo}>
              <Feather
                name="arrow-right"
                size={12}
                color={Colors.editing.textTertiary}
              />
              <ThemedText style={styles.dimensionsText}>
                {platform.optimalWidth} x {platform.optimalHeight}
              </ThemedText>
              <View style={styles.ratioBadge}>
                <ThemedText style={styles.ratioText}>
                  {platform.aspectRatioLabel}
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Note about cropping */}
      {selectedPlatforms.some((p) => p.aspectRatio !== 1) && (
        <View style={styles.noteContainer}>
          <Feather name="scissors" size={12} color="#F59E0B" />
          <ThemedText style={styles.noteText}>
            Images will be center-cropped to fit each platform&apos;s aspect
            ratio
          </ThemedText>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  emptyText: {
    color: Colors.editing.textTertiary,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.editing.text,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.editing.primarySubtle,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.editing.primary,
  },
  currentDimensions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  currentText: {
    fontSize: 12,
    color: Colors.editing.textSecondary,
  },
  platformList: {
    gap: Spacing.xs,
  },
  platformItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.editing.text,
  },
  optimizationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dimensionsText: {
    fontSize: 12,
    color: Colors.editing.textSecondary,
  },
  ratioBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  ratioText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.editing.textTertiary,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    color: "#F59E0B",
    lineHeight: 16,
  },
});

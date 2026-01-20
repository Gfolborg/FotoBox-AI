import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassPill } from "@/components/GlassPill";
import { Colors, Spacing } from "@/constants/theme";

interface ThemedHeaderProps {
  title: string;
  transparent?: boolean;
}

export function ThemedHeader({ title, transparent = false }: ThemedHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.header,
        { paddingTop: insets.top },
        transparent && styles.headerTransparent,
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.leftHeaderItem}>
          {navigation.canGoBack() && (
            <Pressable
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
            >
              <Feather
                name="chevron-left"
                size={24}
                color={Colors.editing.text}
              />
              <ThemedText style={styles.headerButtonText}>Back</ThemedText>
            </Pressable>
          )}
        </View>

        <GlassPill>
          <Feather name="zap" size={16} color={Colors.editing.primary} />
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        </GlassPill>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerTransparent: {
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: 54,
  },
  leftHeaderItem: {
    position: "absolute",
    left: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerButtonText: {
    color: Colors.editing.text,
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
});

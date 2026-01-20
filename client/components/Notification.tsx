import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

export type NotificationType = "success" | "error";

interface NotificationProps {
  message: string;
  type: NotificationType;
}

export function Notification({ message, type }: NotificationProps) {
  const isSuccess = type === "success";
  const iconName = isSuccess ? "check-circle" : "x-circle";
  const backgroundColor = isSuccess ? Colors.light.success : Colors.light.error;
  const iconColor = Colors.light.white;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Feather
        name={iconName}
        size={24}
        color={iconColor}
        style={styles.icon}
      />
      <ThemedText style={styles.message}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    ...Shadows.lg,
    marginHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.md,
  },
  message: {
    flex: 1,
    color: Colors.light.white,
    fontSize: 15,
    fontWeight: "600",
  },
});

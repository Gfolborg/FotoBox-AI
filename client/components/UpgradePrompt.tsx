import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GradientButton } from "@/components/GradientButton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useAuth } from "@/context/AuthContext";

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function UpgradePrompt({
  visible,
  onClose,
  title = "Keep Creating",
  message = "You're doing great! Unlock more credits to keep creating stunning product photos.",
}: UpgradePromptProps) {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuth();

  const handleUpgrade = () => {
    onClose();
    if (isAuthenticated) {
      navigation.navigate("Paywall");
    } else {
      navigation.navigate("Auth");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Feather name="camera" size={28} color={Colors.light.secondary} />
            <View style={styles.sparkleAccent}>
              <Feather name="star" size={12} color={Colors.light.primary} />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.features}>
            <FeatureItem icon="zap" text="Instant AI background removal" />
            <FeatureItem icon="image" text="Lifestyle scenes & mockups" />
            <FeatureItem icon="download-cloud" text="HD exports, no watermarks" />
          </View>

          <View style={styles.buttons}>
            <GradientButton
              title="Get 10 Credits - $2.99"
              onPress={handleUpgrade}
              icon="plus-circle"
              fullWidth
            />

            <GradientButton
              title={isAuthenticated ? "See All Plans" : "Sign Up for More"}
              onPress={handleUpgrade}
              variant="ghost"
              icon="arrow-right"
              iconPosition="right"
              fullWidth
            />
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>I'll finish later</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Feather name={icon as any} size={16} color={Colors.light.success} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  container: {
    backgroundColor: Colors.light.backgroundDefault,
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
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  sparkleAccent: {
    position: "absolute",
    top: -2,
    right: -2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  features: {
    width: "100%",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  buttons: {
    width: "100%",
    gap: Spacing.sm,
  },
  closeButton: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  closeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

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
  title = "Out of Credits",
  message = "You've used all your free credits. Upgrade to continue creating amazing product photos.",
}: UpgradePromptProps) {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuth();

  const handleUpgrade = () => {
    onClose();
    if (isAuthenticated) {
      navigation.navigate("Paywall");
    } else {
      navigation.navigate("Login");
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
            <Feather name="zap" size={32} color={Colors.light.primary} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.features}>
            <FeatureItem icon="check-circle" text="No watermarks on images" />
            <FeatureItem icon="check-circle" text="100+ monthly credits" />
            <FeatureItem icon="check-circle" text="Priority AI processing" />
          </View>
          
          <GradientButton
            title={isAuthenticated ? "View Plans" : "Sign Up to Continue"}
            onPress={handleUpgrade}
          />
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Maybe Later</Text>
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
    backgroundColor: "rgba(249,115,22,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
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
  closeButton: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  closeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

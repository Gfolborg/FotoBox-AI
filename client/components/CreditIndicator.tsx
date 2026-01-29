import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useCredits } from "@/hooks/useCredits";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors, Spacing } from "@/constants/theme";

type RootStackParamList = {
  Paywall: undefined;
};

export function CreditIndicator() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isLoading, creditsRemaining, isFreeTier, isPremium, canGenerate } = useCredits();

  if (isLoading) {
    return null;
  }

  const getCreditsText = () => {
    if (creditsRemaining === -1) {
      return "Unlimited";
    }
    return `${creditsRemaining} credit${creditsRemaining !== 1 ? "s" : ""}`;
  };

  const getPlanBadge = () => {
    if (isPremium) {
      return (
        <View style={[styles.badge, styles.premiumBadge]}>
          <Feather name="star" size={10} color="#fff" />
          <Text style={styles.badgeText}>PRO</Text>
        </View>
      );
    }
    return null;
  };

  const handlePress = () => {
    if (!isPremium) {
      navigation.navigate("Paywall");
    }
  };

  const content = (
    <>
      <View style={styles.iconContainer}>
        <Feather
          name={isPremium ? "zap" : "image"}
          size={16}
          color={isPremium ? Colors.light.primary : Colors.light.textSecondary}
        />
      </View>
      <Text style={[styles.creditsText, !canGenerate && styles.noCreditsText]}>
        {getCreditsText()}
      </Text>
      {getPlanBadge()}
      {!isPremium && (
        <Feather name="chevron-right" size={14} color={Colors.light.textSecondary} />
      )}
    </>
  );

  const Container = Platform.OS === "ios" ? BlurView : View;
  const containerProps = Platform.OS === "ios" ? { intensity: 50, tint: "light" as const } : {};

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={isPremium ? 1 : 0.7}
      disabled={isPremium}
    >
      <Container {...containerProps} style={styles.container}>
        {content}
      </Container>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.95)",
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(249,115,22,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  creditsText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  noCreditsText: {
    color: Colors.light.error,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumBadge: {
    backgroundColor: Colors.light.primary,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
});

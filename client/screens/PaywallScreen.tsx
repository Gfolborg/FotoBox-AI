import React from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

type PaywallScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Paywall">;
type PaywallScreenRouteProp = RouteProp<RootStackParamList, "Paywall">;

const PLANS = [
  {
    id: "monthly_pro",
    name: "Pro",
    price: "$6.99",
    period: "/month",
    credits: 100,
    description: "100 AI generations per month",
    features: [
      "100 AI generations",
      "HD quality exports",
      "All lifestyle scenes",
      "All mockup templates",
      "Priority processing",
    ],
    popular: true,
  },
  {
    id: "monthly_unlimited",
    name: "Unlimited",
    price: "$14.99",
    period: "/month",
    credits: -1,
    description: "Unlimited AI generations",
    features: [
      "Unlimited generations",
      "HD quality exports",
      "All lifestyle scenes",
      "All mockup templates",
      "Priority processing",
      "No watermarks",
    ],
    popular: false,
  },
];

const CREDIT_PACKS = [
  { id: "credits_10", credits: 10, price: "$2.99", perCredit: "$0.30" },
  { id: "credits_50", credits: 50, price: "$9.99", perCredit: "$0.20" },
];

export default function PaywallScreen() {
  const navigation = useNavigation<PaywallScreenNavigationProp>();
  const route = useRoute<PaywallScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { subscription, isAuthenticated } = useAuth();

  const handleSelectPlan = (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }

    // TODO: Integrate with Google Play Billing
    // For now, show a message that purchase will be available soon
    console.log("Selected plan:", planId);
  };

  const handleBuyCredits = (packId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }

    // TODO: Integrate with Google Play Billing
    console.log("Buy credits:", packId);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <GradientBackground theme="home">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={Colors.light.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(600)} style={styles.titleSection}>
            <ThemedText style={styles.title}>Upgrade Your Plan</ThemedText>
            <ThemedText style={styles.subtitle}>
              Unlock unlimited AI-powered photo editing
            </ThemedText>

            {subscription && (
              <View style={styles.currentPlan}>
                <Feather name="info" size={16} color={Colors.light.primary} />
                <ThemedText style={styles.currentPlanText}>
                  Current: {subscription.plan === "free" ? "Free" : subscription.plan} ({subscription.creditsRemaining === -1 ? "Unlimited" : subscription.creditsRemaining} credits)
                </ThemedText>
              </View>
            )}
          </Animated.View>

          <View style={styles.plansSection}>
            <ThemedText style={styles.sectionTitle}>Monthly Plans</ThemedText>
            {PLANS.map((plan, index) => (
              <Animated.View
                key={plan.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
              >
                <Pressable
                  onPress={() => handleSelectPlan(plan.id)}
                  style={[styles.planCard, plan.popular && styles.popularCard]}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <ThemedText style={styles.popularBadgeText}>Most Popular</ThemedText>
                    </View>
                  )}
                  <View style={styles.planHeader}>
                    <View>
                      <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                      <ThemedText style={styles.planDescription}>{plan.description}</ThemedText>
                    </View>
                    <View style={styles.priceContainer}>
                      <ThemedText style={styles.planPrice}>{plan.price}</ThemedText>
                      <ThemedText style={styles.planPeriod}>{plan.period}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Feather name="check" size={16} color={Colors.light.primary} />
                        <ThemedText style={styles.featureText}>{feature}</ThemedText>
                      </View>
                    ))}
                  </View>
                  <LinearGradient
                    colors={plan.popular ? [Colors.light.primary, Colors.light.secondary] : ["#E5E7EB", "#D1D5DB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectButton}
                  >
                    <ThemedText style={[styles.selectButtonText, !plan.popular && styles.selectButtonTextDark]}>
                      Select Plan
                    </ThemedText>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View style={styles.creditsSection}>
            <ThemedText style={styles.sectionTitle}>Or Buy Credits</ThemedText>
            <View style={styles.creditPacks}>
              {CREDIT_PACKS.map((pack, index) => (
                <Animated.View
                  key={pack.id}
                  entering={FadeInDown.delay(200 + index * 100).duration(400)}
                  style={styles.creditPackWrapper}
                >
                  <Pressable onPress={() => handleBuyCredits(pack.id)} style={styles.creditPack}>
                    <View style={styles.creditPackInfo}>
                      <ThemedText style={styles.creditPackCredits}>{pack.credits}</ThemedText>
                      <ThemedText style={styles.creditPackLabel}>credits</ThemedText>
                    </View>
                    <View style={styles.creditPackPricing}>
                      <ThemedText style={styles.creditPackPrice}>{pack.price}</ThemedText>
                      <ThemedText style={styles.creditPackPer}>{pack.perCredit}/credit</ThemedText>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Purchases are managed through Google Play. Subscriptions auto-renew monthly until canceled.
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  currentPlan: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  currentPlanText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  plansSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  popularCard: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: Spacing.lg,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  planPeriod: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  featuresContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  selectButton: {
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  selectButtonTextDark: {
    color: Colors.light.text,
  },
  creditsSection: {
    marginBottom: Spacing.xl,
  },
  creditPacks: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  creditPackWrapper: {
    flex: 1,
  },
  creditPack: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
  },
  creditPackInfo: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  creditPackCredits: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  creditPackLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  creditPackPricing: {
    alignItems: "center",
  },
  creditPackPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  creditPackPer: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});

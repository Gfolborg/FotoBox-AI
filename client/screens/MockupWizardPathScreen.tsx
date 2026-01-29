import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardPath"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardPath">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = Spacing.md;
const CARD_MAX_WIDTH = 260;
const CARD_MIN_WIDTH = 180;
const CARD_WIDTH = Math.min(
  (SCREEN_WIDTH - Spacing.lg * 2 - CARD_GAP) / 2,
  CARD_MAX_WIDTH,
);

function PathCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 160 });
      }}
    >
      <Animated.View style={[styles.choiceCard, animatedStyle]}>
        <View style={styles.cardIcon}>
          <Feather name={icon} size={20} color={Colors.light.primary} />
        </View>
        <View style={styles.cardCopy}>
          <ThemedText style={styles.cardTitle}>{title}</ThemedText>
          <ThemedText style={styles.cardSubtitle}>{subtitle}</ThemedText>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function MockupWizardPathScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { wizardState } = route.params;

  const handleTemplate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MockupWizardTemplates", {
      wizardState: {
        ...wizardState,
        mode: "quick",
      },
    });
  };

  const handleCustomize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MockupWizardProduct", {
      wizardState: {
        ...wizardState,
        mode: "custom",
        templateId: undefined,
        templatePrompt: undefined,
      },
    });
  };

  return (
    <GradientBackground theme="home">
      <ThemedHeader title="Mockup Studio" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <ThemedText style={styles.stepLabel}>Step 1</ThemedText>
          <ThemedText style={styles.stepTitle}>Choose your path</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Start with a template or describe your product.
          </ThemedText>
        </View>

        <View style={styles.centerStage}>
          <View style={styles.cardRow}>
            <PathCard
              title="Use a Template"
              subtitle="Pick a ready-made style and go."
              icon="layers"
              onPress={handleTemplate}
            />

            <PathCard
              title="Custom Product"
              subtitle="Describe your product type to begin."
              icon="edit-3"
              onPress={handleCustomize}
            />
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  stepHeader: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  centerStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "center",
  },
  choiceCard: {
    width: CARD_WIDTH,
    minWidth: CARD_MIN_WIDTH,
    maxWidth: CARD_MAX_WIDTH,
    minHeight: 160,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.12)",
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { CreditIndicator } from "@/components/CreditIndicator";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { buildMockupWizardState } from "@/lib/mockup-templates";
import { useCredits } from "@/hooks/useCredits";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PhotoAction"
>;
type RouteProps = RouteProp<RootStackParamList, "PhotoAction">;

interface ActionCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  delay: number;
  minHeight: number;
}

function ActionCard({
  icon,
  title,
  description,
  color,
  onPress,
  delay,
  minHeight,
}: ActionCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.cardWrapper}
    >
      <Pressable
        style={[styles.actionCard, { minHeight }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View
          style={[
            styles.actionIconContainer,
            { backgroundColor: color + "15" },
          ]}
        >
          <Feather name={icon} size={24} color={color} />
        </View>
        <View style={styles.actionTextContainer}>
          <ThemedText style={styles.actionTitle} numberOfLines={2}>
            {title}
          </ThemedText>
          <ThemedText style={styles.actionDescription} numberOfLines={2}>
            {description}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PhotoActionScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUri, existingResults } = route.params;
  const { canGenerate, creditsRemaining, requiresWatermark } = useCredits();
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);
  const isCompactHeight = screenHeight < 760;
  const imagePreviewSize = Math.min(
    screenWidth - Spacing.lg * 2,
    isCompactHeight ? 230 : 350,
  );
  const cardMinHeight = isCompactHeight ? 118 : 132;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const checkCreditsAndProceed = (action: () => void) => {
    if (!canGenerate) {
      setShowUpgradePrompt(true);
      return;
    }
    action();
  };

  const handleRemoveBackground = () => {
    checkCreditsAndProceed(() => {
      navigation.navigate("BackgroundColorSelection", {
        imageUri,
        existingResults,
      });
    });
  };

  const handleCreateLifestyle = () => {
    checkCreditsAndProceed(() => {
      navigation.navigate("EnvironmentSelection", { imageUri });
    });
  };

  const handleCreateMockup = () => {
    checkCreditsAndProceed(() => {
      navigation.navigate("MockupWizardPath", {
        wizardState: buildMockupWizardState([imageUri]),
      });
    });
  };

  const handleExpress = () => {
    checkCreditsAndProceed(() => {
      navigation.navigate("ExpressSetup", { imageUri });
    });
  };

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />
      <ThemedHeader title="Choose Enhancement" />
      <View style={[styles.container, { paddingTop: insets.top + 54 }]}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.creditRow}
          >
            <CreditIndicator />
            {requiresWatermark && (
              <ThemedText style={styles.watermarkNote}>
                Images will have watermark
              </ThemedText>
            )}
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={[
              styles.imagePreviewContainer,
              { width: imagePreviewSize, height: imagePreviewSize },
            ]}
          >
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={styles.imageOverlay} />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.promptContainer}
          >
            <ThemedText style={styles.promptText}>Enhance with AI</ThemedText>
          </Animated.View>

          <View style={styles.actionsContainer}>
            <ActionCard
              icon="zap"
              title="Express"
              description="One upload, seven ready-to-use assets"
              color="#F59E0B"
              onPress={handleExpress}
              delay={260}
              minHeight={cardMinHeight}
            />
            <ActionCard
              icon="scissors"
              title="Remove Background"
              description="Clean cutout with transparent bg"
              color={Colors.editing.primary}
              onPress={handleRemoveBackground}
              delay={300}
              minHeight={cardMinHeight}
            />
            <ActionCard
              icon="image"
              title="Lifestyle Scene"
              description="Place in AI environments"
              color="#10B981"
              onPress={handleCreateLifestyle}
              delay={400}
              minHeight={cardMinHeight}
            />
            <ActionCard
              icon="box"
              title="Product Mockup"
              description="Realistic product displays"
              color="#A78BFA"
              onPress={handleCreateMockup}
              delay={500}
              minHeight={cardMinHeight}
            />
          </View>

          <View style={styles.retakeContainer} />
        </ScrollView>
      </View>
      
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  creditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  watermarkNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: "italic",
  },
  imagePreviewContainer: {
    alignSelf: "center",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
    ...Shadows.lg,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  promptContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  promptText: {
    color: Colors.editing.text,
    fontSize: 18,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  cardWrapper: {
    width: "48%",
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    gap: Spacing.sm,
    minHeight: 132,
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextContainer: {
    alignItems: "center",
    paddingHorizontal: 4,
  },
  actionTitle: {
    color: Colors.editing.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 3,
  },
  actionDescription: {
    color: Colors.editing.textSecondary,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  retakeContainer: {
    height: 60,
  },
});

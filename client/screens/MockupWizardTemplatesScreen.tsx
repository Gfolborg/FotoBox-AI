import React, { useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  MOCKUP_TEMPLATES,
  getTemplateById,
  resolveTemplateSelections,
} from "@/lib/mockup-templates";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardTemplates"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardTemplates">;

export default function MockupWizardTemplatesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { wizardState } = route.params;
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >(wizardState.templateId);

  const selectedTemplate = useMemo(
    () => getTemplateById(selectedTemplateId),
    [selectedTemplateId],
  );

  const handleSelect = (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplateId(templateId);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const template = getTemplateById(selectedTemplateId);
    const defaults = resolveTemplateSelections(template);

    navigation.navigate("MockupWizardCustomize", {
      wizardState: {
        ...wizardState,
        templateId: selectedTemplateId,
        vibeId: template?.vibeId ?? wizardState.vibeId ?? defaults.vibe.id,
        cameraId:
          template?.cameraId ?? wizardState.cameraId ?? defaults.camera.id,
        modelId: template?.modelId ?? wizardState.modelId ?? defaults.model.id,
        productCategoryId:
          template?.productCategoryId ?? wizardState.productCategoryId,
        productId: template?.productId ?? wizardState.productId,
        productColor: template?.defaultColor ?? wizardState.productColor,
      },
    });
  };

  const handleBack = () => {
    navigation.navigate("MockupWizardImages", { wizardState });
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
          <ThemedText style={styles.stepLabel}>Step 2 of 4</ThemedText>
          <ThemedText style={styles.stepTitle}>Choose a Template</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Quick starting points for style, camera, and mood.
          </ThemedText>
        </View>

        <View style={styles.templateGrid}>
          {MOCKUP_TEMPLATES.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            return (
              <Pressable
                key={template.id}
                onPress={() => handleSelect(template.id)}
                style={[
                  styles.templateCard,
                  isSelected && styles.templateCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.templateIcon,
                    isSelected && styles.templateIconSelected,
                  ]}
                >
                  <Feather
                    name={template.icon as keyof typeof Feather.glyphMap}
                    size={18}
                    color={isSelected ? Colors.light.white : Colors.light.primary}
                  />
                </View>
                <ThemedText
                  style={[
                    styles.templateTitle,
                    isSelected && styles.templateTitleSelected,
                  ]}
                >
                  {template.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.templateSubtitle,
                    isSelected && styles.templateSubtitleSelected,
                  ]}
                >
                  {template.subtitle}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {selectedTemplate?.isCustomScene && (
          <View style={styles.customHint}>
            <ThemedText style={styles.customHintText}>
              You’ll describe your scene in the next step.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <View style={styles.bottomRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </Pressable>
          <GradientButton title="Next" onPress={handleNext} />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  stepHeader: {
    marginBottom: Spacing.md,
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
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  templateCard: {
    width: "48%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "flex-start",
    gap: 6,
  },
  templateCardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  templateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249, 115, 22, 0.12)",
  },
  templateIconSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  templateTitleSelected: {
    color: Colors.light.white,
  },
  templateSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  templateSubtitleSelected: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  customHint: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(249, 115, 22, 0.08)",
  },
  customHintText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  bottomRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "600",
  },
});

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
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
import { PRODUCT_MATERIALS, PRODUCT_SIZES } from "@/lib/mockup-presets";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupWizardProduct"
>;

type RouteProps = RouteProp<RootStackParamList, "MockupWizardProduct">;

const DEFAULT_COLORS = [
  "#FFFFFF",
  "#000000",
  "#F97316",
  "#0EA5E9",
  "#22C55E",
  "#EF4444",
  "#8B5CF6",
  "#F59E0B",
];

export default function MockupWizardProductScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { wizardState } = route.params;

  const [productName, setProductName] = useState(
    wizardState.customProductName || "",
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>(
    wizardState.productMaterial,
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    wizardState.productSize,
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    wizardState.productColor,
  );
  const [hasDesign, setHasDesign] = useState(wizardState.hasDesign !== false);

  const canContinue =
    productName.trim().length > 0;

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("MockupWizardScene", {
      wizardState: {
        ...wizardState,
        productCategoryId: "custom",
        productId: undefined,
        customProductName: productName.trim(),
        productMaterial: selectedMaterial || "other",
        productSize: selectedSize || "tabletop",
        productColor: selectedColor,
        hasDesign,
      },
    });
  };

  const isBatch = wizardState.images.length > 1;

  return (
    <GradientBackground theme="home">
      <ThemedHeader title="Mockup Studio" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <ThemedText style={styles.stepLabel}>Step 2</ThemedText>
          <ThemedText style={styles.stepTitle}>
            Describe Your Product
          </ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Help us understand your product for a better mockup.
          </ThemedText>
        </View>

        {/* Product Name */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Product name</ThemedText>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.inputText}
              placeholder="e.g., Handmade ceramic vase"
              placeholderTextColor={Colors.light.textTertiary}
              value={productName}
              onChangeText={setProductName}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Material */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Material</ThemedText>
          <View style={styles.chipRow}>
            {PRODUCT_MATERIALS.map((material) => {
              const isActive = selectedMaterial === material.id;
              return (
                <Pressable
                  key={material.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMaterial(material.id);
                  }}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <View style={styles.chipIconWrap}>
                    <Feather
                      name={material.icon as keyof typeof Feather.glyphMap}
                      size={13}
                      color={
                        isActive
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                  </View>
                  <ThemedText
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {material.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Product Size */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Product size</ThemedText>
          <View style={styles.sizeRow}>
            {PRODUCT_SIZES.map((size) => {
              const isActive = selectedSize === size.id;
              return (
                <Pressable
                  key={size.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSize(size.id);
                  }}
                  style={[styles.sizeCard, isActive && styles.sizeCardActive]}
                >
                  <View
                    style={[styles.sizeIcon, isActive && styles.sizeIconActive]}
                  >
                    <Feather
                      name={size.icon as keyof typeof Feather.glyphMap}
                      size={18}
                      color={
                        isActive
                          ? Colors.light.primary
                          : Colors.light.textSecondary
                      }
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.sizeLabel,
                      isActive && styles.sizeLabelActive,
                    ]}
                  >
                    {size.label}
                  </ThemedText>
                  <ThemedText style={styles.sizeDesc}>
                    {size.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Product Color */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>
            Product color{" "}
            <ThemedText style={styles.optionalHint}>(optional)</ThemedText>
          </ThemedText>
          <View style={styles.colorRow}>
            {DEFAULT_COLORS.map((color) => {
              const isActive = selectedColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedColor(isActive ? undefined : color);
                  }}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    color === "#FFFFFF" && styles.colorSwatchWhite,
                    isActive && styles.colorSwatchActive,
                  ]}
                >
                  {isActive && (
                    <Feather
                      name="check"
                      size={14}
                      color={color === "#FFFFFF" ? Colors.light.text : "#fff"}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Has Design */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>
            Has printed design or logo?
          </ThemedText>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHasDesign(true);
              }}
              style={[
                styles.toggleOption,
                hasDesign && styles.toggleOptionActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.toggleText,
                  hasDesign && styles.toggleTextActive,
                ]}
              >
                Yes
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHasDesign(false);
              }}
              style={[
                styles.toggleOption,
                !hasDesign && styles.toggleOptionActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.toggleText,
                  !hasDesign && styles.toggleTextActive,
                ]}
              >
                No
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        {isBatch && (
          <ThemedText style={styles.batchNote}>
            Applied to all {wizardState.images.length} images
          </ThemedText>
        )}
        <GradientButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          fullWidth
        />
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
  section: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  optionalHint: {
    fontSize: 10,
    fontWeight: "400",
    textTransform: "none",
    letterSpacing: 0,
    color: Colors.light.textTertiary,
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  inputText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  chipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: "#D8F1FB",
  },
  chipText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: Colors.light.primary,
  },
  chipIconWrap: {
    width: 16,
    alignItems: "center",
  },
  sizeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    gap: 4,
  },
  sizeCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: "#D8F1FB",
  },
  sizeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    marginBottom: 2,
  },
  sizeIconActive: {
    backgroundColor: "rgba(14, 165, 233, 0.18)",
  },
  sizeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  sizeLabelActive: {
    color: Colors.light.primary,
  },
  sizeDesc: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchWhite: {
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    overflow: "hidden",
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOptionActive: {
    backgroundColor: "#D8F1FB",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: Colors.light.primary,
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
  batchNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
});

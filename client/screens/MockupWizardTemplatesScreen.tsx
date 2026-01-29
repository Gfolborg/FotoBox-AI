import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  TextInput,
  StyleProp,
  ViewStyle,
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
  withRepeat,
} from "react-native-reanimated";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { MockupUseCase, MockupAdStyle, MOCKUP_CATEGORIES } from "@/lib/mockup-presets";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = Spacing.sm;
const GRID_PADDING = Spacing.lg;
const GRID_CARD_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const INTENTS: { id: MockupUseCase; label: string; description: string }[] = [
  {
    id: "neutral",
    label: "Balanced",
    description: "Natural, authentic look with minimal styling.",
  },
  {
    id: "listing",
    label: "Listing",
    description: "Clean, retail-ready focus on clarity and accuracy.",
  },
  {
    id: "ad",
    label: "Advertise",
    description: "Marketing-forward styling for impact.",
  },
];

const AD_STYLES: { id: MockupAdStyle; label: string; description: string }[] = [
  {
    id: "simple",
    label: "Simple",
    description: "Tasteful and restrained",
  },
  {
    id: "exaggerated",
    label: "Exaggerated",
    description: "Bold and dramatic",
  },
  {
    id: "trending",
    label: "Trending",
    description: "Social-ready, punchy",
  },
];

const CUSTOM_CATEGORY_ID = "custom";
const SUGGESTED_MOCKUPS = [
  "Clean studio shot on a marble counter",
  "Flatlay on a light wood surface",
  "Lifestyle scene with soft window light",
  "Handheld close-up with natural shadows",
  "Minimal shelf display with neutral props",
];

const TEMPLATE_COLORS: Record<string, string[]> = {
  hero: ["#0EA5E9", "#38BDF8"],
  etsy_flatlay: ["#F97316", "#FDBA74"],
  studio_clean: ["#22C55E", "#86EFAC"],
  social_ad: ["#8B5CF6", "#C4B5FD"],
  lifestyle_kitchen: ["#F59E0B", "#FCD34D"],
  outdoor: ["#14B8A6", "#5EEAD4"],
  minimal: ["#334155", "#94A3B8"],
  packaging: ["#EF4444", "#FCA5A5"],
};

const getTemplateColors = (id: string) =>
  TEMPLATE_COLORS[id] || ["#0EA5E9", "#94D3FF"];

function TemplateCard({
  title,
  subtitle,
  icon,
  colors,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  colors: string[];
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 160 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.gridCard,
          selected && styles.cardSelected,
          animatedStyle,
        ]}
      >
        <View style={styles.templateContent}>
          <View
            style={[
              styles.templateIcon,
              { backgroundColor: `${colors[0]}22` },
            ]}
          >
            <Feather name={icon} size={18} color={colors[0]} />
          </View>
          <View style={styles.templateCopy}>
            <ThemedText style={styles.templateTitle}>{title}</ThemedText>
            <ThemedText style={styles.templateSubtitle}>{subtitle}</ThemedText>
          </View>
          {selected && (
            <View style={styles.templateCheck}>
              <Feather name="check" size={12} color={Colors.light.white} />
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function ScalePressable({
  onPress,
  style,
  pressableStyle,
  children,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  pressableStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 160 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={pressableStyle}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function MockupWizardTemplatesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { wizardState } = route.params;
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(wizardState.productCategoryId);
  const [customProductName, setCustomProductName] = useState(
    wizardState.customProductName || "",
  );
  const [desiredMockup, setDesiredMockup] = useState(
    wizardState.desiredMockup || "",
  );
  const [categoryLayoutWidth, setCategoryLayoutWidth] = useState(0);
  const [categoryContentWidth, setCategoryContentWidth] = useState(0);
  const [showCategoryScrollHintLeft, setShowCategoryScrollHintLeft] =
    useState(false);
  const [showCategoryScrollHintRight, setShowCategoryScrollHintRight] =
    useState(false);
  const categoryScrollXRef = useRef(0);
  const [intent, setIntent] = useState<MockupUseCase | undefined>(
    wizardState.useCase,
  );
  const [adStyle, setAdStyle] = useState<MockupAdStyle | undefined>(
    wizardState.adStyle,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >(wizardState.templateId);
  const previousIntentRef = useRef<MockupUseCase | undefined>(intent);
  const previousCategoryRef = useRef<string | undefined>(selectedCategoryId);
  const previousAdStyleRef = useRef<MockupAdStyle | undefined>(adStyle);
  const adStylePulse = useSharedValue(0);
  const scrollHint = useSharedValue(0);

  const templates = useMemo(() => MOCKUP_TEMPLATES, []);

  const isCustomCategory = selectedCategoryId === CUSTOM_CATEGORY_ID;
  const updateCategoryScrollHints = (
    scrollX: number,
    contentWidth: number,
    layoutWidth: number,
  ) => {
    const hasOverflow = contentWidth - layoutWidth > 8;
    const shouldShowRight =
      hasOverflow && scrollX < contentWidth - layoutWidth - 8;
    const shouldShowLeft = scrollX > 8;

    setShowCategoryScrollHintLeft((prev) =>
      prev === shouldShowLeft ? prev : shouldShowLeft,
    );
    setShowCategoryScrollHintRight((prev) =>
      prev === shouldShowRight ? prev : shouldShowRight,
    );
  };

  const filteredTemplates = useMemo(() => {
    if (!intent || !selectedCategoryId || isCustomCategory) return [];
    if (intent === "ad") {
      if (!adStyle) return [];
      return templates.filter(
        (template) =>
          template.productCategoryId === selectedCategoryId &&
          template.useCase === "ad" &&
          template.adStyle === adStyle,
      );
    }
    return templates.filter(
      (template) =>
        template.productCategoryId === selectedCategoryId &&
        template.useCase === intent,
    );
  }, [intent, templates, selectedCategoryId, isCustomCategory, adStyle]);

  useEffect(() => {
    if (previousIntentRef.current !== intent) {
      setSelectedTemplateId(undefined);
      previousIntentRef.current = intent;
    }
  }, [intent]);

  useEffect(() => {
    if (previousCategoryRef.current !== selectedCategoryId) {
      setSelectedTemplateId(undefined);
      if (selectedCategoryId !== CUSTOM_CATEGORY_ID) {
        setCustomProductName("");
        setDesiredMockup("");
      }
      previousCategoryRef.current = selectedCategoryId;
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (previousAdStyleRef.current !== adStyle) {
      setSelectedTemplateId(undefined);
      previousAdStyleRef.current = adStyle;
    }
  }, [adStyle]);

  useEffect(() => {
    if (intent === "ad" && !adStyle) {
      adStylePulse.value = withRepeat(
        withTiming(1, { duration: 900 }),
        -1,
        true,
      );
    } else {
      adStylePulse.value = withTiming(0, { duration: 200 });
    }
  }, [intent, adStyle, adStylePulse]);

  useEffect(() => {
    scrollHint.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, [scrollHint]);

  useEffect(() => {
    updateCategoryScrollHints(
      categoryScrollXRef.current,
      categoryContentWidth,
      categoryLayoutWidth,
    );
  }, [categoryContentWidth, categoryLayoutWidth]);

  const adStylePulseStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + adStylePulse.value * 0.35,
    transform: [{ scale: 1 + adStylePulse.value * 0.02 }],
  }));

  const scrollHintRightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 6 * scrollHint.value },
      { scale: 1 + 0.1 * scrollHint.value },
    ],
    opacity: 0.5 + 0.5 * scrollHint.value,
  }));

  const scrollHintLeftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -6 * scrollHint.value },
      { scale: 1 + 0.1 * scrollHint.value },
    ],
    opacity: 0.5 + 0.5 * scrollHint.value,
  }));

  const handleSelectTemplate = (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplateId(templateId);
  };

  const handleSelectCategory = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategoryId(categoryId);
  };

  const handleSelectIntent = (value: MockupUseCase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntent(value);
  };

  const handleSelectAdStyle = (value: MockupAdStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAdStyle(value);
  };

  const handleContinue = () => {
    if (!selectedCategoryId || !intent) return;
    if (intent === "ad" && !adStyle) return;
    if (isCustomCategory && !customProductName.trim()) return;
    if (!isCustomCategory && !selectedTemplateId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isCustomCategory) {
    navigation.navigate("MockupWizardFinalize", {
      wizardState: {
        ...wizardState,
        mode: "custom",
        templateId: undefined,
        templatePrompt: undefined,
          productCategoryId: CUSTOM_CATEGORY_ID,
          productId: undefined,
          customProductName: customProductName.trim(),
          desiredMockup: desiredMockup.trim() || undefined,
          useCase: intent,
          adStyle,
        },
      });
      return;
    }

    if (selectedTemplateId === "custom") {
    navigation.navigate("MockupWizardFinalize", {
      wizardState: {
        ...wizardState,
        mode: "custom",
        templateId: undefined,
        templatePrompt: undefined,
          productCategoryId: selectedCategoryId,
          useCase: intent,
          adStyle,
          desiredMockup: desiredMockup.trim() || undefined,
        },
      });
      return;
    }

    const template = getTemplateById(selectedTemplateId);
    const defaults = resolveTemplateSelections(template);

    navigation.navigate("MockupWizardFinalize", {
      wizardState: {
        ...wizardState,
        mode: "quick",
        templateId: selectedTemplateId,
        templatePrompt: template?.prompt,
        useCase: intent,
        adStyle,
        productCategoryId: selectedCategoryId,
        customProductName: undefined,
        desiredMockup: undefined,
        vibeId: template?.vibeId ?? wizardState.vibeId ?? defaults.vibe.id,
        cameraId:
          template?.cameraId ?? wizardState.cameraId ?? defaults.camera.id,
        modelId: template?.modelId ?? wizardState.modelId ?? defaults.model.id,
        productId: template?.productId ?? wizardState.productId,
        productColor: wizardState.productColor,
      },
    });
  };

  const canContinue =
    Boolean(selectedCategoryId) &&
    Boolean(intent) &&
    (intent !== "ad" || Boolean(adStyle)) &&
    (isCustomCategory
      ? customProductName.trim().length > 0
      : Boolean(selectedTemplateId));

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
          <ThemedText style={styles.stepTitle}>Choose a Template</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Applies to all selected images.
          </ThemedText>
        </View>

        <View style={styles.productSection}>
          <ThemedText style={styles.sectionLabel}>Product category</ThemedText>
          <View
            style={styles.categoryScroller}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setCategoryLayoutWidth(width);
              updateCategoryScrollHints(
                categoryScrollXRef.current,
                categoryContentWidth,
                width,
              );
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              onContentSizeChange={(width) => {
                setCategoryContentWidth(width);
                updateCategoryScrollHints(
                  categoryScrollXRef.current,
                  width,
                  categoryLayoutWidth,
                );
              }}
              onScroll={(event) => {
                const scrollX = event.nativeEvent.contentOffset.x;
                categoryScrollXRef.current = scrollX;
                updateCategoryScrollHints(
                  scrollX,
                  categoryContentWidth,
                  categoryLayoutWidth,
                );
              }}
              scrollEventThrottle={64}
            >
              {MOCKUP_CATEGORIES.map((category) => {
                const isActive = selectedCategoryId === category.id;
                return (
                <ScalePressable
                  key={category.id}
                  onPress={() => handleSelectCategory(category.id)}
                  style={[
                    styles.categoryCard,
                    isActive && styles.categoryCardSelected,
                  ]}
                >
                  <View style={styles.categoryIcon}>
                    <Feather
                      name={category.icon as keyof typeof Feather.glyphMap}
                        size={18}
                        color={
                          isActive ? Colors.light.white : Colors.light.primary
                        }
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.categoryLabel,
                        isActive && styles.categoryLabelSelected,
                      ]}
                  >
                    {category.label}
                  </ThemedText>
                </ScalePressable>
              );
            })}
              <ScalePressable
                onPress={() => handleSelectCategory(CUSTOM_CATEGORY_ID)}
                style={[
                  styles.categoryCard,
                  selectedCategoryId === CUSTOM_CATEGORY_ID &&
                    styles.categoryCardSelected,
                ]}
              >
                <View style={styles.categoryIcon}>
                  <Feather
                    name="edit-3"
                    size={18}
                    color={
                      selectedCategoryId === CUSTOM_CATEGORY_ID
                        ? Colors.light.white
                        : Colors.light.primary
                    }
                  />
                </View>
                <ThemedText
                  style={[
                    styles.categoryLabel,
                    selectedCategoryId === CUSTOM_CATEGORY_ID &&
                      styles.categoryLabelSelected,
                  ]}
                >
                  Not listed?
                </ThemedText>
              </ScalePressable>
            </ScrollView>
            {showCategoryScrollHintLeft && (
              <View pointerEvents="none" style={styles.scrollHintWrapLeft}>
                <Animated.View
                  style={[
                    styles.scrollHint,
                    styles.scrollHintLeft,
                    scrollHintLeftStyle,
                  ]}
                >
                  <Feather
                    name="chevron-left"
                    size={22}
                    color={Colors.light.primary}
                  />
                </Animated.View>
              </View>
            )}
            {showCategoryScrollHintRight && (
              <View pointerEvents="none" style={styles.scrollHintWrapRight}>
                <Animated.View style={[styles.scrollHint, scrollHintRightStyle]}>
                  <Feather
                    name="chevron-right"
                    size={22}
                    color={Colors.light.primary}
                  />
                </Animated.View>
              </View>
            )}
          </View>

          {isCustomCategory && (
            <View style={styles.customInputs}>
              <ThemedText style={styles.inputLabel}>
                Describe your product
              </ThemedText>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g., skincare bottle, candle, notebook..."
                  placeholderTextColor={Colors.light.textTertiary}
                  value={customProductName}
                  onChangeText={setCustomProductName}
                />
              </View>

              <ThemedText style={styles.inputLabel}>
                Desired mockup (optional)
              </ThemedText>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g., clean studio shot on a marble counter"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={desiredMockup}
                  onChangeText={setDesiredMockup}
                />
              </View>

              <View style={styles.suggestionRow}>
                {SUGGESTED_MOCKUPS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => setDesiredMockup(suggestion)}
                  >
                    <ThemedText style={styles.suggestionText}>
                      {suggestion}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {selectedCategoryId && (
          <View style={styles.intentSection}>
            <ThemedText style={styles.sectionLabel}>
              What is this for?
            </ThemedText>
            <View style={styles.intentRow}>
              {INTENTS.map((option) => {
                const isActive = intent === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleSelectIntent(option.id)}
                    style={[
                      styles.intentCard,
                      isActive && styles.intentCardActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.intentCardTitle,
                        isActive && styles.intentCardTitleActive,
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.intentCardSubtitle,
                        isActive && styles.intentCardSubtitleActive,
                      ]}
                    >
                      {option.description}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {!intent && (
              <ThemedText style={styles.intentHint}>
                Pick one to see templates
              </ThemedText>
            )}
          </View>
        )}

        {selectedCategoryId && intent === "ad" && (
          <View style={styles.intentSection}>
            <View style={styles.adStyleHeader}>
              <ThemedText style={styles.sectionLabel}>Advertise style</ThemedText>
              {!adStyle && (
                <View style={styles.requiredBadge}>
                  <ThemedText style={styles.requiredBadgeText}>
                    Required
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.segmentWrap}>
              {!adStyle && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.segmentPulse, adStylePulseStyle]}
                />
              )}
              <View style={styles.segmentedControl}>
                {AD_STYLES.map((option, index) => {
                  const isActive = adStyle === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleSelectAdStyle(option.id)}
                      style={[
                        styles.segment,
                        index > 0 && styles.segmentDivider,
                        isActive && styles.segmentActive,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.segmentText,
                          isActive && styles.segmentTextActive,
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <ThemedText style={[styles.intentHint, styles.adStyleHint]}>
              {adStyle
                ? AD_STYLES.find((item) => item.id === adStyle)?.description
                : "Select a style to continue"}
            </ThemedText>
          </View>
        )}

        {selectedCategoryId &&
          intent &&
          !isCustomCategory &&
          (intent !== "ad" || adStyle) && (
          <View style={styles.gridSection}>
            <ThemedText style={styles.sectionLabel}>Browse</ThemedText>
            <ThemedText style={styles.sectionHelper}>
              Pick a template to start — you can edit later.
            </ThemedText>
            <View style={styles.gridRow}>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  title={template.title}
                  subtitle={template.subtitle}
                  icon={template.icon as keyof typeof Feather.glyphMap}
                  colors={getTemplateColors(template.id)}
                  selected={selectedTemplateId === template.id}
                  onPress={() => handleSelectTemplate(template.id)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        {wizardState.images.length > 1 && (
          <ThemedText style={styles.batchNote}>
            Applied to all images.
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
  productSection: {
    marginTop: Spacing.md,
  },
  categoryRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.xl,
  },
  categoryScroller: {
    position: "relative",
  },
  categoryCard: {
    width: 120,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  categoryCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#D8F1FB",
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.12)",
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
  },
  categoryLabelSelected: {
    color: Colors.light.primary,
  },
  scrollHintWrapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingRight: Spacing.xs,
  },
  scrollHintWrapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingLeft: Spacing.xs,
  },
  scrollHint: {
    width: 38,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8F1FB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  scrollHintLeft: {
    shadowOffset: { width: 0, height: 6 },
  },
  customInputs: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  suggestionText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  intentSection: {
    marginTop: Spacing.md,
  },
  intentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  intentCard: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 160,
    maxWidth: 220,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  intentCardActive: {
    backgroundColor: "#D8F1FB",
    borderColor: Colors.light.primary,
    borderWidth: 1.5,
  },
  intentCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  intentCardTitleActive: {
    color: Colors.light.primary,
  },
  intentCardSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  intentCardSubtitleActive: {
    color: Colors.light.text,
  },
  adStyleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  requiredBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  requiredBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.error,
  },
  segmentWrap: {
    position: "relative",
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(0, 0, 0, 0.08)",
  },
  segmentActive: {
    backgroundColor: "rgba(14, 165, 233, 0.16)",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  segmentTextActive: {
    color: Colors.light.primary,
  },
  segmentPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: "rgba(14, 165, 233, 0.12)",
  },
  intentHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  adStyleHint: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "600",
  },
  gridSection: {
    marginTop: Spacing.lg,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    minHeight: 96,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
  },
  cardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#D8F1FB",
  },
  templateContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  templateIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  templateCopy: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  templateSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  templateCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  sectionHelper: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
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
    gap: Spacing.xs,
  },
  batchNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});

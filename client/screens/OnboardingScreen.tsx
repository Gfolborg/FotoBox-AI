import React, { useRef, useState } from "react";
import { View, StyleSheet, FlatList, Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Gradients } from "@/constants/theme";

const logoImage = require("../../assets/images/fotobox-logo.png");
const scenesExample = require("../../assets/images/onboarding/scenes-example.webp");
const mockupExample = require("../../assets/images/onboarding/mockup-example.webp");
const batchExample = require("../../assets/images/onboarding/batch-example.webp");

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const onboardingSlides = [
  {
    id: "1",
    type: "logo" as const,
    title: "",
    description:
      "Create professional product images with one tap. Our AI removes backgrounds and creates perfect listings.",
    gradient: ["#FFF7ED", "#FAFAF9"] as [string, string],
  },
  {
    id: "2",
    type: "image" as const,
    image: scenesExample,
    title: "AI-Powered Scenes",
    description:
      "Place your products in beautiful, AI-generated lifestyle environments to attract more customers.",
    gradient: ["#F0F9FF", "#F5F5F4"] as [string, string],
  },
  {
    id: "3",
    type: "image" as const,
    image: mockupExample,
    title: "Create Realistic Mockups",
    description:
      "Instantly generate professional mockups for your products. Showcase your designs on t-shirts, mugs, and more.",
    gradient: ["#FEF2F2", "#F5F5F4"] as [string, string],
  },
  {
    id: "4",
    type: "image" as const,
    image: batchExample,
    title: "Batch Edit Like a Pro",
    description:
      "Save time by processing multiple images at once. Edit and enhance your entire product line in minutes.",
    gradient: ["#ECFDF5", "#F5F5F4"] as [string, string],
  },
];

interface OnboardingSlideProps {
  item: (typeof onboardingSlides)[0];
  index: number;
}

const OnboardingSlide = ({ item, index }: OnboardingSlideProps) => (
  <View style={styles.slide}>
    <LinearGradient
      colors={item.gradient}
      style={styles.slideGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />

    <Animated.View
      entering={FadeIn.delay(index * 100).duration(600)}
      style={styles.slideContent}
    >
      {item.type === "logo" ? (
        <Image
          source={logoImage}
          style={styles.fullLogo}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.exampleImageContainer}>
          <Image
            source={item.image}
            style={styles.exampleImage}
            resizeMode="cover"
          />
        </View>
      )}

      {item.title ? (
        <ThemedText type="h2" style={styles.slideTitle}>
          {item.title}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.slideDescription}>
        {item.description}
      </ThemedText>
    </Animated.View>
  </View>
);

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  return (
    <GradientBackground theme="home">
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={({ item, index }) => (
          <OnboardingSlide item={item} index={index} />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setActiveIndex(index);
        }}
        scrollEventThrottle={16}
      />

      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <GlassCard
          theme="light"
          variant="subtle"
          padding="lg"
          borderRadius="2xl"
        >
          <View style={styles.footerContent}>
            {/* Pagination */}
            <View style={styles.pagination}>
              {onboardingSlides.map((_, index) => (
                <PaginationDot key={index} active={index === activeIndex} />
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.buttonsRow}>
              {activeIndex < onboardingSlides.length - 1 && (
                <GradientButton
                  title="Skip"
                  onPress={handleSkip}
                  variant="ghost"
                  size="sm"
                  style={styles.skipButton}
                />
              )}

              <GradientButton
                title={
                  activeIndex === onboardingSlides.length - 1
                    ? "Get Started"
                    : "Next"
                }
                onPress={handleNext}
                icon={
                  activeIndex === onboardingSlides.length - 1
                    ? "arrow-right"
                    : undefined
                }
                iconPosition="right"
                style={styles.nextButton}
              />
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    </GradientBackground>
  );
}

const PaginationDot = ({ active }: { active: boolean }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 200 }),
    opacity: withTiming(active ? 1 : 0.4, { duration: 200 }),
  }));

  return (
    <Animated.View style={[styles.dot, animatedStyle]}>
      {active && (
        <LinearGradient
          colors={Gradients.primary as [string, string]}
          style={styles.dotGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullLogo: {
    width: 360,
    height: 130,
    marginBottom: Spacing.xl,
  },
  exampleImageContainer: {
    width: 240,
    height: 240,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  exampleImage: {
    width: "100%",
    height: "100%",
  },
  slideTitle: {
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  slideDescription: {
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: "85%",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  footerContent: {
    gap: Spacing.lg,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    overflow: "hidden",
  },
  dotGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

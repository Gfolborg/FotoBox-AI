import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const logoImage = require("../../assets/images/fotobox-logo.png");

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const onboardingSlides = [
  {
    id: '1',
    icon: 'logo',
    title: 'Welcome to FotoBox AI',
    description: 'Create professional product images with one tap. Our AI removes backgrounds and creates perfect listings.',
  },
  {
    id: '2',
    icon: 'image',
    title: 'AI-Powered Scenes',
    description: 'Place your products in beautiful, AI-generated lifestyle environments to attract more customers.',
  },
  {
    id: '3',
    icon: 'layers',
    title: 'Batch Edit Like a Pro',
    description: 'Save time by processing multiple images at once. Edit and enhance your entire product line in minutes.',
  },
];

interface OnboardingSlideProps {
  item: typeof onboardingSlides[0];
}

const OnboardingSlide = ({ item }: OnboardingSlideProps) => (
  <View style={styles.slide}>
    <View style={styles.iconContainer}>
      {item.icon === 'logo' ? (
        <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
      ) : (
        <Feather name={item.icon as any} size={64} color={Colors.light.primary} />
      )}
    </View>
    <Text style={styles.slideTitle}>{item.title}</Text>
    <Text style={styles.slideDescription}>{item.description}</Text>
  </View>
);

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={({ item }) => <OnboardingSlide item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        scrollEventThrottle={16}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.pagination}>
          {onboardingSlides.map((_, index) => (
            <PaginationDot key={index} active={index === activeIndex} />
          ))}
        </View>

        <Pressable onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {activeIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const PaginationDot = ({ active }: { active: boolean }) => {
  const width = useSharedValue(active ? 20 : 8);
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 20 : 8),
  }));

  return <Animated.View style={[styles.dot, style]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  slideTitle: {
    ...Typography.h3,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDescription: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginHorizontal: Spacing.xs,
  },
  nextButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.buttonText,
  },
});

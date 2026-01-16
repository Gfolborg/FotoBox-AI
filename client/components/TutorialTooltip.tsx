import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface TutorialTooltipProps {
  message: string;
  onDismiss: () => void;
  isVisible: boolean;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
}

export function TutorialTooltip({
  message,
  onDismiss,
  isVisible,
  position,
}: TutorialTooltipProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.tooltipContainer, position]}
      pointerEvents="box-none" // Allows interaction with elements behind it
    >
      <View style={styles.tooltipContent}>
        <Text style={styles.tooltipText}>{message}</Text>
        <Pressable onPress={onDismiss} style={styles.dismissButton}>
          <Feather name="x" size={16} color={Colors.light.white} />
        </Pressable>
      </View>
      <View style={styles.triangle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltipContainer: {
    position: 'absolute',
    padding: Spacing.xs,
    zIndex: 1000,
    maxWidth: 250, // Add maxWidth to constrain width
  },
  tooltipContent: {
    position: 'relative', // Add position relative for the dismiss button
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingRight: Spacing.xl, // Make space for the dismiss button
    ...Shadows.md,
  },
  tooltipText: {
    color: Colors.light.buttonText,
    fontSize: 14,
  },
  dismissButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: Spacing.md, // Make it easier to tap
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.light.primary,
    position: 'absolute',
    bottom: -Spacing.xs, // Position below the tooltip content
    alignSelf: 'center',
    transform: [{ rotate: '180deg' }], // Point the triangle down
  },
});

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GlassPill } from "@/components/GlassPill";
import { GradientButton } from "@/components/GradientButton";
import { ProgressRing } from "@/components/ProgressRing";
import { PresetCard } from "@/components/PresetCard";
import { GradientBackground } from "@/components/GradientBackground";
import { usePresets } from "@/hooks/usePresets";
import { EditingPreset } from "@/types/preset";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius, Gradients } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PresetSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { presets, isLoading, removePreset, isDeleting } = usePresets();
  const [selectedPreset, setSelectedPreset] = useState<EditingPreset | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handlePresetPress = (preset: EditingPreset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreset(preset.id === selectedPreset?.id ? null : preset);
  };

  const handlePresetLongPress = (preset: EditingPreset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(preset.name, "What would you like to do?", [
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Preset",
            `Are you sure you want to delete "${preset.name}"?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => removePreset(preset.id),
              },
            ]
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleApplyPreset = async () => {
    if (!selectedPreset) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      navigation.navigate("EditImage", {
        imageUri: result.assets[0].uri,
        presetId: selectedPreset.id,
      });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.emptyIconContainer}
        >
          <LinearGradient
            colors={[Colors.editing.primarySubtle, Colors.editing.backgroundSecondary]}
            style={styles.emptyIconGradient}
          >
            <Feather name="bookmark" size={48} color={Colors.editing.textTertiary} />
          </LinearGradient>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ThemedText type="h3" style={styles.emptyTitle}>
            No Saved Presets
          </ThemedText>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <ThemedText style={styles.emptyDescription}>
            Create presets by editing an image and tapping the bookmark icon to save your adjustments.
          </ThemedText>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <GradientButton
            title="Take a Photo"
            onPress={() => navigation.navigate("Camera")}
            icon="camera"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );

  if (isLoading) {
    return (
      <GradientBackground theme="editing" style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ProgressRing
          progress={0.7}
          size={72}
          strokeWidth={5}
          color={Colors.editing.primary}
          backgroundColor={Colors.editing.border}
        >
          <Feather name="loader" size={24} color={Colors.editing.primary} />
        </ProgressRing>
        <ThemedText style={styles.loadingText}>Loading presets...</ThemedText>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground theme="editing">
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="light" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={24} color={Colors.editing.text} />
          </Pressable>

          <GlassPill>
            <Feather name="bookmark" size={16} color={Colors.editing.primary} />
            <ThemedText style={styles.headerTitle}>Presets</ThemedText>
          </GlassPill>

          <View style={styles.countBadge}>
            <ThemedText style={styles.countText}>{presets.length}</ThemedText>
          </View>
        </View>
      </Animated.View>

      {presets.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={presets}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
                <PresetCard
                  preset={item}
                  onPress={() => handlePresetPress(item)}
                  onLongPress={() => handlePresetLongPress(item)}
                  selected={selectedPreset?.id === item.id}
                />
              </Animated.View>
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 120 },
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />

          {selectedPreset && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={[styles.bottomAction, { paddingBottom: insets.bottom + Spacing.md }]}
            >
              <BlurView intensity={40} tint="light" style={styles.bottomBlur} />
              <GlassCard theme="light" padding="md" borderRadius="xl">
                <View style={styles.bottomContent}>
                  <View style={styles.selectedInfo}>
                    <Feather name="check-circle" size={18} color={Colors.editing.primary} />
                    <ThemedText style={styles.selectedName} numberOfLines={1}>
                      {selectedPreset.name}
                    </ThemedText>
                  </View>
                  <GradientButton
                    title="Apply to Photo"
                    onPress={handleApplyPreset}
                    disabled={isDeleting}
                    icon="check"
                    fullWidth
                  />
                </View>
              </GlassCard>
            </Animated.View>
          )}
        </>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  loadingText: {
    color: Colors.editing.textSecondary,
    fontSize: 14,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  countBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.editing.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: Colors.editing.buttonText,
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    flex: 1,
    marginTop: 100,
  },
  listContent: {
    padding: Spacing.lg,
  },
  separator: {
    height: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  emptyIconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 60,
  },
  emptyTitle: {
    color: Colors.editing.text,
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.editing.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: Spacing.md,
    right: Spacing.md,
  },
  bottomBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
  },
  bottomContent: {
    gap: Spacing.md,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  selectedName: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
});

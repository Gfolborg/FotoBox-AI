import React, { useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { PresetCard } from "@/components/PresetCard";
import { usePresets } from "@/hooks/usePresets";
import { EditingPreset } from "@/types/preset";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PresetSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { presets, isLoading, removePreset, isDeleting } = usePresets();
  const [selectedPreset, setSelectedPreset] = useState<EditingPreset | null>(
    null,
  );

  const handlePresetPress = (preset: EditingPreset) => {
    setSelectedPreset(preset.id === selectedPreset?.id ? null : preset);
  };

  const handlePresetLongPress = (preset: EditingPreset) => {
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
            ],
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleApplyPreset = async () => {
    if (!selectedPreset) return;

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
    <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.emptyIconContainer}
      >
        <Feather name="bookmark" size={48} color={Colors.light.textTertiary} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <ThemedText type="h4" style={styles.emptyTitle}>
          No Saved Presets
        </ThemedText>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <ThemedText style={styles.emptyDescription}>
          Create presets by editing an image and tapping the bookmark icon to
          save your adjustments.
        </ThemedText>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Pressable
          style={styles.emptyButton}
          onPress={() => navigation.navigate("Camera")}
        >
          <Feather name="camera" size={18} color={Colors.light.buttonText} />
          <ThemedText style={styles.emptyButtonText}>Take a Photo</ThemedText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <GradientBackground variant="subtle" style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      {presets.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={presets}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 100).duration(400)}
              >
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
              { paddingBottom: insets.bottom + 100 },
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />

          {selectedPreset && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[
                styles.bottomAction,
                { paddingBottom: insets.bottom + Spacing.md },
              ]}
            >
              <Pressable
                style={styles.applyButton}
                onPress={handleApplyPreset}
                disabled={isDeleting}
              >
                <Feather
                  name="check-circle"
                  size={20}
                  color={Colors.light.buttonText}
                />
                <ThemedText style={styles.applyButtonText}>
                  Apply &quot;{selectedPreset.name}&quot; to Photo
                </ThemedText>
              </Pressable>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.lg,
  },
  separator: {
    height: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: Colors.light.buttonText,
    fontWeight: "600",
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.light.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  applyButtonText: {
    color: Colors.light.buttonText,
    fontWeight: "600",
    fontSize: 16,
  },
});

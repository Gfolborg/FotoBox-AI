import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { GlassPill } from "@/components/GlassPill";
import { IconButton } from "@/components/IconButton";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { ApplyToAllModal } from "@/components/ApplyToAllModal";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";
import { useBatchEdit } from "@/context/BatchEditContext";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchResult"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchResult">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.lg * 3) / 2;

export default function BatchResultScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { results } = route.params;

  const [savedUris, setSavedUris] = useState<Set<string>>(new Set());
  const [savingUris, setSavingUris] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showApplyAllModal, setShowApplyAllModal] = useState(false);
  const [editedImages, setEditedImages] = useState<Set<string>>(new Set());
  const [lastEditedUri, setLastEditedUri] = useState<string | null>(null);

  const {
    hasShownApplyAllPopup,
    setHasShownApplyAllPopup,
    savedEditSettings,
    setSavedEditSettings,
  } = useBatchEdit();

  const successfulResults = results.filter((r) => r.resultUri !== null);
  const failedCount = results.filter((r) => r.resultUri === null).length;
  const uneditedCount = successfulResults.length - editedImages.size;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (lastEditedUri && !hasShownApplyAllPopup && successfulResults.length > 1 && uneditedCount > 0) {
        setEditedImages(prev => new Set([...prev, lastEditedUri]));
        setShowApplyAllModal(true);
        setHasShownApplyAllPopup(true);
      }
    }, [lastEditedUri, hasShownApplyAllPopup, uneditedCount])
  );

  const handleSaveImage = async (resultUri: string, originalUri: string) => {
    setSavingUris((prev) => new Set([...prev, originalUri]));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await saveToFotoBoxAlbum(resultUri, "product_image");

    if (result.success) {
      setSavedUris((prev) => new Set([...prev, originalUri]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") {
        Alert.alert("Error", result.error || "Failed to save image");
      }
    }

    setSavingUris((prev) => {
      const newSet = new Set(prev);
      newSet.delete(originalUri);
      return newSet;
    });
  };

  const handleSaveAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    for (const result of successfulResults) {
      if (result.resultUri && !savedUris.has(result.originalUri)) {
        await handleSaveImage(result.resultUri, result.originalUri);
      }
    }
    setShowSuccess(true);
  };

  const handleGenerateMore = () => {
    navigation.popToTop();
  };

  const handleEditImage = async (resultUri: string, originalUri: string) => {
    try {
      const filename = `edit_temp_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setLastEditedUri(originalUri);
      navigation.navigate("EditImage", {
        imageUri: fileUri,
        originalUri: originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image for editing.");
      }
    }
  };

  const handleApplyToAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    successfulResults.forEach((item) => {
      if (!editedImages.has(item.originalUri)) {
        setEditedImages(prev => new Set([...prev, item.originalUri]));
      }
    });
  };

  const handleSkipApplyAll = () => {
  };

  const allSaved = savedUris.size === successfulResults.length;

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="light" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <IconButton
            icon="chevron-left"
            onPress={() => navigation.popToTop()}
            size={44}
            iconSize={24}
            variant="ghost"
            color={Colors.editing.text}
          />

          <GlassPill>
            <Feather name="check-circle" size={16} color={Colors.editing.success} />
            <ThemedText style={styles.headerTitle}>Results</ThemedText>
          </GlassPill>

          <View style={{ width: 44 }} />
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{successfulResults.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Successful</ThemedText>
        </View>
        {failedCount > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, styles.errorNumber]}>{failedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Failed</ThemedText>
            </View>
          </>
        )}
      </Animated.View>

      {/* Image Grid */}
      <FlatList
        data={results}
        numColumns={2}
        keyExtractor={(item) => item.originalUri}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(200 + index * 60).duration(400)}
            style={styles.resultCard}
          >
            {item.resultUri ? (
              <>
                <Pressable
                  style={styles.imageContainer}
                  onPress={() => handleEditImage(item.resultUri!, item.originalUri)}
                >
                  <Image source={{ uri: item.resultUri }} style={styles.image} />
                </Pressable>

                {/* Status Badge */}
                {savedUris.has(item.originalUri) && (
                  <View style={styles.savedBadge}>
                    <Feather name="check" size={12} color={Colors.editing.buttonText} />
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => handleEditImage(item.resultUri!, item.originalUri)}
                  >
                    <Feather name="edit-2" size={14} color={Colors.editing.text} />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.saveButton,
                      savedUris.has(item.originalUri) && styles.saveButtonSaved,
                    ]}
                    onPress={() => handleSaveImage(item.resultUri!, item.originalUri)}
                    disabled={savingUris.has(item.originalUri) || savedUris.has(item.originalUri)}
                  >
                    {savingUris.has(item.originalUri) ? (
                      <Feather name="loader" size={14} color={Colors.editing.text} />
                    ) : savedUris.has(item.originalUri) ? (
                      <Feather name="check" size={14} color={Colors.editing.success} />
                    ) : (
                      <Feather name="download" size={14} color={Colors.editing.text} />
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.failedCard}>
                <Feather name="alert-circle" size={28} color={Colors.editing.error} />
                <ThemedText style={styles.errorText} numberOfLines={2}>
                  {item.error || "Failed"}
                </ThemedText>
              </View>
            )}
          </Animated.View>
        )}
      />

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(400)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <BlurView intensity={40} tint="light" style={styles.bottomBlur} />
        <GlassCard theme="light" padding="md" borderRadius="xl">
          <View style={styles.bottomContent}>
            {successfulResults.length > 0 && (
              <GradientButton
                title={
                  allSaved
                    ? "All Saved"
                    : `Save All (${successfulResults.length - savedUris.size} remaining)`
                }
                onPress={handleSaveAll}
                disabled={allSaved}
                icon={allSaved ? "check" : "download"}
                fullWidth
              />
            )}

            <GradientButton
              title="Generate More"
              onPress={handleGenerateMore}
              variant="glass"
              icon="plus"
              fullWidth
            />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <SuccessAnimation onComplete={() => setShowSuccess(false)} size={140} />
        </View>
      )}

      {/* Apply to All Modal */}
      <ApplyToAllModal
        visible={showApplyAllModal}
        remainingCount={uneditedCount}
        onApplyToAll={handleApplyToAll}
        onSkip={handleSkipApplyAll}
        onClose={() => setShowApplyAllModal(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
    marginTop: 100,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: Colors.editing.success,
    fontSize: 32,
    fontWeight: "700",
  },
  errorNumber: {
    color: Colors.editing.error,
  },
  statLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.editing.border,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 200,
  },
  gridRow: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  savedBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.editing.success,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtons: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.xs,
    right: Spacing.xs,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  saveButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  saveButtonSaved: {
    backgroundColor: Colors.editing.successSubtle,
    borderColor: Colors.editing.success,
  },
  failedCard: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.editing.error,
    fontSize: 12,
    textAlign: "center",
  },
  bottomBar: {
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
    gap: Spacing.sm,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});

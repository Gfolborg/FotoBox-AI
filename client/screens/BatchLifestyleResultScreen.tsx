import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = Spacing.lg;
const GRID_GAP = Spacing.sm;
const NUM_COLUMNS = 2;
const IMAGE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / NUM_COLUMNS;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "BatchLifestyleResult">;

export default function BatchLifestyleResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { results, environment } = route.params;

  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const successfulResults = results.filter((r) => r.status === "completed" && r.resultUri);
  const failedResults = results.filter((r) => r.status === "failed");

  const handleSaveAll = async () => {
    if (isSaving) return;

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      if (Platform.OS !== "web") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save images to your gallery."
        );
      }
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let saved = 0;

    for (const result of successfulResults) {
      if (!result.resultUri) continue;

      try {
        const base64Data = result.resultUri.split(",")[1];
        const filename = `${FileSystem.cacheDirectory}lifestyle_${Date.now()}_${saved}.jpg`;
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await MediaLibrary.saveToLibraryAsync(filename);
        saved++;
        setSavedCount(saved);
      } catch (error) {
        console.error("Failed to save image:", error);
      }
    }

    setIsSaving(false);
    setShowSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.popToTop();
  };

  const renderResultItem = ({ item, index }: { item: typeof results[0]; index: number }) => {
    const isSuccess = item.status === "completed" && item.resultUri;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 80).duration(400)}
        style={styles.resultCard}
      >
        <Image
          source={{ uri: isSuccess ? item.resultUri! : item.originalUri }}
          style={styles.resultImage}
        />
        <View
          style={[
            styles.statusBadge,
            isSuccess ? styles.successBadge : styles.failedBadge,
          ]}
        >
          <Feather
            name={isSuccess ? "check" : "x"}
            size={12}
            color={Colors.editing.text}
          />
        </View>
        {!isSuccess && (
          <View style={styles.failedOverlay}>
            <ThemedText style={styles.failedText}>Failed</ThemedText>
          </View>
        )}
      </Animated.View>
    );
  };

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
          <View style={{ width: 44 }} />
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Lifestyle Results</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {successfulResults.length} of {results.length} successful
            </ThemedText>
          </View>
          <Pressable style={styles.closeButton} onPress={handleDone}>
            <Feather name="x" size={24} color={Colors.editing.text} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Results Grid */}
      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        style={styles.grid}
      />

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(400)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <BlurView intensity={60} tint="light" style={styles.bottomBlur} />
        <GlassCard theme="light" padding="md" borderRadius="xl">
          <View style={styles.bottomContent}>
            {failedResults.length > 0 && (
              <View style={styles.warningRow}>
                <Feather
                  name="alert-circle"
                  size={16}
                  color={Colors.editing.error}
                />
                <ThemedText style={styles.warningText}>
                  {failedResults.length} image{failedResults.length > 1 ? "s" : ""} failed
                </ThemedText>
              </View>
            )}
            <View style={styles.buttonRow}>
              <GradientButton
                title={
                  isSaving
                    ? `Saving ${savedCount}/${successfulResults.length}...`
                    : `Save ${successfulResults.length} Images`
                }
                onPress={handleSaveAll}
                disabled={isSaving || successfulResults.length === 0}
                loading={isSaving}
                icon="download"
                fullWidth
              />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Success Overlay */}
      {showSuccess && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.successOverlay}
        >
          <GlassCard theme="light" padding="xl" borderRadius="2xl">
            <SuccessAnimation />
            <ThemedText style={styles.successTitle}>
              {savedCount} Images Saved!
            </ThemedText>
            <ThemedText style={styles.successSubtitle}>
              Find them in your photo gallery
            </ThemedText>
          </GlassCard>
        </Animated.View>
      )}
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: Colors.editing.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flex: 1,
    marginTop: 100,
  },
  gridContent: {
    padding: GRID_PADDING,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  resultCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  resultImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  successBadge: {
    backgroundColor: Colors.editing.success,
  },
  failedBadge: {
    backgroundColor: Colors.editing.error,
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  failedText: {
    color: Colors.editing.error,
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  bottomBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContent: {
    gap: Spacing.md,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  warningText: {
    color: Colors.editing.error,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: Spacing.xl,
  },
  successTitle: {
    color: Colors.editing.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  successSubtitle: {
    color: Colors.editing.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});

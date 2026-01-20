import * as React from "react";
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
import {
  useRoute,
  useNavigation,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { GlassPill } from "@/components/GlassPill";
import { IconButton } from "@/components/IconButton";
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

  const [savedUris, setSavedUris] = React.useState<Set<string>>(new Set());
  const [savingUris, setSavingUris] = React.useState<Set<string>>(new Set());
  const [showApplyAllModal, setShowApplyAllModal] = React.useState(false);
  const [editedImages, setEditedImages] = React.useState<Set<string>>(new Set());
  const [lastEditedUri, setLastEditedUri] = React.useState<string | null>(null);

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
    React.useCallback(() => {
      if (
        lastEditedUri &&
        !hasShownApplyAllPopup &&
        successfulResults.length > 1 &&
        uneditedCount > 0
      ) {
        setEditedImages((prev) => new Set([...prev, lastEditedUri]));
        setShowApplyAllModal(true);
        setHasShownApplyAllPopup(true);
      }
    }, [lastEditedUri, hasShownApplyAllPopup, uneditedCount]),
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

  const handleGenerateMore = () => {
    navigation.popToTop();
  };

  const handleEditImage = async (resultUri: string, originalUri: string) => {
    try {
      // On web, pass the data URI directly
      if (Platform.OS === "web") {
        setLastEditedUri(originalUri);
        navigation.navigate("EditImage", {
          imageUri: resultUri,
          originalUri: originalUri,
        });
        return;
      }
      
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
        setEditedImages((prev) => new Set([...prev, item.originalUri]));
      }
    });
  };

  const handleSkipApplyAll = () => {};

  const handleExportAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Prepare results for batch platform selection
    const exportableResults = successfulResults
      .filter((r) => r.resultUri)
      .map((r) => ({
        originalUri: r.originalUri,
        resultUri: r.resultUri!,
      }));

    navigation.navigate("BatchPlatformSelection", {
      results: exportableResults,
    });
  };

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
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
              <Feather
                name="check-circle"
                size={16}
                color={Colors.editing.success}
              />
              <ThemedText style={styles.headerTitle}>Results</ThemedText>
            </GlassPill>

            <View style={{ width: 44 }} />
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.statsRow}
        >
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {successfulResults.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Successful</ThemedText>
          </View>
          {failedCount > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, styles.errorNumber]}>
                  {failedCount}
                </ThemedText>
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
                    onPress={() =>
                      handleEditImage(item.resultUri!, item.originalUri)
                    }
                  >
                    <Image
                      source={{ uri: item.resultUri }}
                      style={styles.image}
                    />
                  </Pressable>

                  {/* Status Badge */}
                  {savedUris.has(item.originalUri) && (
                    <View style={styles.savedBadge}>
                      <Feather
                        name="check"
                        size={12}
                        color={Colors.editing.buttonText}
                      />
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        handleEditImage(item.resultUri!, item.originalUri)
                      }
                    >
                      <ThemedText style={styles.buttonText}>Edit</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.saveButton,
                        savedUris.has(item.originalUri) &&
                          styles.saveButtonSaved,
                      ]}
                      onPress={() =>
                        handleSaveImage(item.resultUri!, item.originalUri)
                      }
                      disabled={
                        savingUris.has(item.originalUri) ||
                        savedUris.has(item.originalUri)
                      }
                    >
                      <ThemedText
                        style={[
                          styles.buttonText,
                          savedUris.has(item.originalUri) &&
                            styles.buttonTextSaved,
                        ]}
                      >
                        {savingUris.has(item.originalUri)
                          ? "Saving..."
                          : savedUris.has(item.originalUri)
                            ? "Saved"
                            : "Save"}
                      </ThemedText>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.failedCard}>
                  <Feather
                    name="alert-circle"
                    size={28}
                    color={Colors.editing.error}
                  />
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
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <GlassCard theme="light" padding="xs" borderRadius="lg">
            <View style={styles.bottomContent}>
              {successfulResults.length > 0 && (
                <GradientButton
                  title={`Save All (${successfulResults.length})`}
                  onPress={handleExportAll}
                  icon="download"
                />
              )}

              <GradientButton
                title="New"
                onPress={handleGenerateMore}
                variant="glass"
                icon="plus"
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Apply to All Modal */}
        <ApplyToAllModal
          visible={showApplyAllModal}
          remainingCount={uneditedCount}
          onApplyToAll={handleApplyToAll}
          onSkip={handleSkipApplyAll}
          onClose={() => setShowApplyAllModal(false)}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
    marginTop: Spacing.md,
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
    paddingHorizontal: Spacing.md,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonSaved: {
    backgroundColor: Colors.editing.success,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  buttonTextSaved: {
    color: "#FFFFFF",
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
  bottomContent: {
    alignItems: "center",
    gap: Spacing.xs,
  },
});

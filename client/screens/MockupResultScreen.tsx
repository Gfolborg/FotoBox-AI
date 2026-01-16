import React, { useState } from "react";
import { StyleSheet, View, Image, ScrollView, Share, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { IconButton } from "@/components/IconButton";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type MockupResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupResult"
>;

type MockupResultScreenRouteProp = RouteProp<
  RootStackParamList,
  "MockupResult"
>;

export default function MockupResultScreen() {
  const navigation = useNavigation<MockupResultScreenNavigationProp>();
  const route = useRoute<MockupResultScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { resultUri, originalUri, mockupType } = route.params;

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    if (saving || saved) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission required to save images");
      }

      let fileUri = resultUri;
      
      if (resultUri.startsWith("data:")) {
        const base64Data = resultUri.split(",")[1];
        const filename = `mockup_${Date.now()}.jpg`;
        fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      await MediaLibrary.saveToLibraryAsync(fileUri);
      
      setSaved(true);
      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Save error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      let fileUri = resultUri;
      
      if (resultUri.startsWith("data:")) {
        const base64Data = resultUri.split(",")[1];
        const filename = `mockup_${Date.now()}.jpg`;
        fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      await Share.share({
        url: fileUri,
        message: Platform.OS === "android" ? `Check out my ${mockupType} mockup!` : undefined,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleEditImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let imageUri = resultUri;
    
    if (resultUri.startsWith("data:")) {
      const base64Data = resultUri.split(",")[1];
      const filename = `mockup_edit_${Date.now()}.jpg`;
      imageUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(imageUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    
    navigation.navigate("EditImage", {
      imageUri,
      originalUri,
    });
  };

  const handleNewMockup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MockupSelection", {});
  };

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Home");
  };

  return (
    <GradientBackground variant="warm">
      {showSuccess && <SuccessAnimation />}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <GlassCard style={styles.imageCard}>
            <Image
              source={{ uri: resultUri }}
              style={styles.resultImage}
              resizeMode="contain"
            />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Mockup Type</ThemedText>
              <ThemedText style={styles.infoValue}>{mockupType}</ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.actionRow}
        >
          <IconButton
            icon="share-2"
            onPress={handleShare}
            style={styles.iconButton}
          />
          <IconButton
            icon="edit-2"
            onPress={handleEditImage}
            style={styles.iconButton}
          />
          <GradientButton
            title={saved ? "Saved!" : saving ? "Saving..." : "Save to Gallery"}
            onPress={handleSave}
            disabled={saving || saved}
            style={styles.saveButton}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={styles.bottomActions}
        >
          <GradientButton
            title="Create Another Mockup"
            onPress={handleNewMockup}
            variant="secondary"
            style={styles.secondaryButton}
          />
          <GradientButton
            title="Back to Home"
            onPress={handleGoHome}
            variant="ghost"
            style={styles.outlineButton}
          />
        </Animated.View>
      </ScrollView>
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
  imageCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  resultImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconButton: {
    flex: 0,
  },
  saveButton: {
    flex: 1,
  },
  bottomActions: {
    gap: Spacing.md,
  },
  secondaryButton: {
    width: "100%",
  },
  outlineButton: {
    width: "100%",
  },
});

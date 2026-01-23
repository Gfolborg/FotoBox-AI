import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeInUp,
} from "react-native-reanimated";
import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useBatchEdit } from "@/context/BatchEditContext";

type MockupResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupResult"
>;

type MockupResultScreenRouteProp = RouteProp<
  RootStackParamList,
  "MockupResult"
>;

export default function MockupResultScreen() {
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const IMAGE_SIZE = SCREEN_WIDTH - Spacing.lg * 2;
  const navigation = useNavigation<MockupResultScreenNavigationProp>();
  const route = useRoute<MockupResultScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const { resultUri: initialResultUri, originalUri, mockupType } = route.params;
  const [resultUri, setResultUri] = useState(initialResultUri);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  
  const { pendingEditResult, setPendingEditResult } = useBatchEdit();

  useEffect(() => {
    let isMounted = true;
    Image.getSize(
      resultUri,
      (width, height) => {
        if (isMounted) {
          setImageDimensions({ width, height });
        }
      },
      () => {
        if (isMounted) {
          setImageDimensions(null);
        }
      },
    );
    return () => {
      isMounted = false;
    };
  }, [resultUri]);

  // Process pending edit result when screen regains focus
  useFocusEffect(
    useCallback(() => {
      if (pendingEditResult && pendingEditResult.originalUri === originalUri) {
        setResultUri(pendingEditResult.editedUri);
        setPendingEditResult(null);
      }
    }, [pendingEditResult, originalUri, setPendingEditResult])
  );

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let imageUri = resultUri;

      if (resultUri.startsWith("data:")) {
        const base64Data = resultUri.split(",")[1];
        const filename = `platform_temp_${Date.now()}.jpg`;
        imageUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(imageUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      navigation.navigate("PlatformSelection", {
        imageUri,
        originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for platform selection:", error);
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
        message:
          Platform.OS === "android"
            ? `Check out my ${mockupType} mockup!`
            : undefined,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleEditImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // On web, pass the data URI directly
    if (Platform.OS === "web") {
      navigation.navigate("EditImage", {
        imageUri: resultUri,
        originalUri,
      });
      return;
    }

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
    <GradientBackground theme="home">
      <ThemedHeader title="Mockup Result" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 54,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <GlassCard
            style={[
              styles.imageCard,
              {
                width: IMAGE_SIZE,
                height: imageDimensions
                  ? (IMAGE_SIZE * imageDimensions.height) /
                    imageDimensions.width
                  : IMAGE_SIZE,
              },
            ]}
          >
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
          <Pressable style={styles.textButton} onPress={handleShare}>
            <ThemedText style={styles.textButtonLabel}>Share</ThemedText>
          </Pressable>
          <Pressable style={styles.textButton} onPress={handleEditImage}>
            <ThemedText style={styles.textButtonLabel}>Edit</ThemedText>
          </Pressable>
          <GradientButton
            title="Continue"
            onPress={handleContinue}
            icon="arrow-right"
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
    alignSelf: "center",
  },
  resultImage: {
    width: "100%",
    height: "100%",
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
  textButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  textButtonLabel: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600",
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

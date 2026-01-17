import React from "react";
import { View, StyleSheet, Pressable, Image, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";

import { ThemedText } from "@/components/ThemedText";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_PREVIEW_SIZE = Math.min(SCREEN_WIDTH - Spacing.xl * 2, 220);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PhotoAction">;
type RouteProps = RouteProp<RootStackParamList, "PhotoAction">;

interface ActionCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  delay: number;
}

function ActionCard({ icon, title, description, color, onPress, delay }: ActionCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()} style={styles.cardWrapper}>
      <Pressable
        style={styles.actionCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={[styles.actionIconContainer, { backgroundColor: color + "20" }]}>
          <Feather name={icon} size={24} color={color} />
        </View>
        <View style={styles.actionTextContainer}>
          <ThemedText style={styles.actionTitle}>{title}</ThemedText>
          <ThemedText style={styles.actionDescription} numberOfLines={2}>{description}</ThemedText>
        </View>
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={20} color={Colors.editing.textTertiary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PhotoActionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUri } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleEditPhoto = async () => {
    try {
      let fileUri = imageUri;
      if (imageUri.startsWith("data:")) {
        const filename = `edit_temp_${Date.now()}.jpg`;
        fileUri = FileSystem.documentDirectory + filename;
        const base64Data = imageUri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      navigation.navigate("EditImage", { imageUri: fileUri, originalUri: fileUri });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
    }
  };

  const handleRemoveBackground = () => {
    navigation.navigate("BackgroundColorSelection", { imageUri });
  };

  const handleCreateLifestyle = () => {
    navigation.navigate("EnvironmentSelection", { imageUri });
  };

  const handleCreateMockup = () => {
    navigation.navigate("MockupSelection", { imageUri });
  };

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="light" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <IconButton
            icon="chevron-left"
            onPress={() => navigation.goBack()}
            size={44}
            iconSize={24}
            variant="ghost"
            color={Colors.editing.text}
          />

          <GlassPill>
            <Feather name="check-circle" size={16} color={Colors.editing.primary} />
            <ThemedText style={styles.headerTitle}>Photo Ready</ThemedText>
          </GlassPill>

          <View style={{ width: 44 }} />
        </View>
      </Animated.View>

      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          style={styles.imagePreviewContainer}
        >
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <View style={styles.imageOverlay} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.promptContainer}>
          <ThemedText style={styles.promptText}>What would you like to do?</ThemedText>
        </Animated.View>

        <View style={styles.actionsContainer}>
          <View style={styles.cardRow}>
            <ActionCard
              icon="sliders"
              title="Edit Photo"
              description="Adjust brightness, contrast, and colors"
              color={Colors.editing.secondary}
              onPress={handleEditPhoto}
              delay={300}
            />
            <ActionCard
              icon="scissors"
              title="Remove Background"
              description="AI-powered background removal"
              color={Colors.editing.primary}
              onPress={handleRemoveBackground}
              delay={400}
            />
          </View>
          <View style={styles.cardRow}>
            <ActionCard
              icon="image"
              title="Create Lifestyle Scene"
              description="Place in AI-generated environments"
              color="#10B981"
              onPress={handleCreateLifestyle}
              delay={500}
            />
            <ActionCard
              icon="figma"
              title="Create Mockup"
              description="Generate realistic product mockups"
              color="#A78BFA"
              onPress={handleCreateMockup}
              delay={600}
            />
          </View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(700).duration(400)}
          style={styles.retakeContainer}
        >
          <Pressable
            style={styles.retakeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Feather name="camera" size={18} color={Colors.editing.textSecondary} />
            <ThemedText style={styles.retakeText}>Retake Photo</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
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
  content: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: Spacing.lg,
  },
  imagePreviewContainer: {
    alignSelf: "center",
    width: IMAGE_PREVIEW_SIZE,
    height: IMAGE_PREVIEW_SIZE,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
    ...Shadows.lg,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  promptContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  promptText: {
    color: Colors.editing.text,
    fontSize: 18,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: Spacing.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardWrapper: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: Colors.editing.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    minHeight: 140,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: Colors.editing.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionDescription: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
  },
  retakeContainer: {
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  retakeText: {
    color: Colors.editing.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
});

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

import { ThemedText } from "@/components/ThemedText";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_SIZE = 60;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BatchActionSelection">;
type RouteProps = RouteProp<RootStackParamList, "BatchActionSelection">;

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
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <Pressable
        style={styles.actionCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={[styles.actionIconContainer, { backgroundColor: color + "20" }]}>
          <Feather name={icon} size={28} color={color} />
        </View>
        <View style={styles.actionTextContainer}>
          <ThemedText style={styles.actionTitle}>{title}</ThemedText>
          <ThemedText style={styles.actionDescription}>{description}</ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color={Colors.editing.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

export default function BatchActionSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUris } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleRemoveBackground = () => {
    navigation.replace("BatchPreview", { imageUris });
  };

  const handleCreateLifestyle = () => {
    navigation.replace("EnvironmentSelection", { imageUris });
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
            <Feather name="layers" size={16} color={Colors.editing.primary} />
            <ThemedText style={styles.headerTitle}>{imageUris.length} Photos Selected</ThemedText>
          </GlassPill>

          <View style={{ width: 44 }} />
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          style={styles.previewContainer}
        >
          <View style={styles.previewGrid}>
            {imageUris.slice(0, 4).map((uri, index) => (
              <View key={uri} style={styles.previewImageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                {index === 3 && imageUris.length > 4 && (
                  <View style={styles.moreOverlay}>
                    <ThemedText style={styles.moreText}>+{imageUris.length - 4}</ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.promptContainer}>
          <ThemedText style={styles.promptText}>What would you like to do?</ThemedText>
          <ThemedText style={styles.promptSubtext}>Choose an action for your batch</ThemedText>
        </Animated.View>

        <View style={styles.actionsContainer}>
          <ActionCard
            icon="crop"
            title="Remove Backgrounds"
            description="Create clean product photos with solid color backgrounds"
            color={Colors.editing.primary}
            onPress={handleRemoveBackground}
            delay={300}
          />

          <ActionCard
            icon="image"
            title="Create Lifestyle Scenes"
            description="Place products in realistic environments and settings"
            color={Colors.editing.secondary}
            onPress={handleCreateLifestyle}
            delay={400}
          />
        </View>
      </ScrollView>
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
    fontSize: 14,
    fontWeight: "600",
    color: Colors.editing.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 100,
    paddingHorizontal: Spacing.lg,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    justifyContent: "center",
  },
  previewImageWrapper: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  promptContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  promptText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.editing.text,
    marginBottom: Spacing.xs,
  },
  promptSubtext: {
    fontSize: 15,
    color: Colors.editing.textSecondary,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.editing.backgroundDefault,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    ...Shadows.md,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.editing.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: Colors.editing.textSecondary,
    lineHeight: 18,
  },
});

import React from "react";
import { StyleSheet, View, ScrollView, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { WorkflowCard } from "@/components/WorkflowCard";

import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const logoImage = require("../../assets/images/fotobox-logo.png");

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleImportPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUris = result.assets.map((asset) => asset.uri).slice(0, 10);
      if (imageUris.length === 1) {
        navigation.navigate("QuickFix", { imageUri: imageUris[0] });
        return;
      }
      navigation.navigate("BatchActionSelection", { imageUris });
    }
  };

  return (
    <GradientBackground theme="home">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Header with Logo */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          <ThemedText style={styles.subtitle}>
            What do you want to accomplish today?
          </ThemedText>
        </Animated.View>

        {/* Card Grid */}
        <View style={styles.cardGrid}>
          <View style={styles.cardRow}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(500).springify()}
              style={styles.cardWrapper}
            >
              <WorkflowCard
                icon="camera"
                title="Capture Product Photo"
                description="Take a photo and enhance it"
                onPress={() => navigation.navigate("Camera")}
                variant="primary"
              />
            </Animated.View>
            <Animated.View
              entering={FadeInDown.delay(200).duration(500).springify()}
              style={styles.cardWrapper}
            >
              <WorkflowCard
                icon="image"
                title="Import Photos"
                description="Select from your library"
                onPress={handleImportPhoto}
              />
            </Animated.View>
          </View>
        </View>

        {/* Animated Footer */}
        <Animated.View
          entering={FadeIn.delay(600).duration(400)}
          style={styles.footer}
        >
          <ThemedText style={styles.footerText}>
            Powered by AI for e-commerce sellers
          </ThemedText>
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
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  header: {
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 200,
    height: 60,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 16,
  },
  cardGrid: {
    gap: Spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cardWrapper: {
    flex: 1,
  },
  footer: {
    marginTop: Spacing["2xl"],
    alignItems: "center",
  },
  footerText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
});

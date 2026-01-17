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
import { Colors, Spacing } from "@/constants/theme";

const logoImage = require("../../assets/images/fotobox-logo.png");

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleBatchEdit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUris = result.assets.map((asset) => asset.uri);
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

        {/* Staggered Card Grid */}
        <View style={styles.cardGrid}>
          <View style={styles.cardRow}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(500).springify()}
              style={styles.cardWrapper}
              
            >
              <WorkflowCard
                icon="camera"
                title="Generate Product Shot"
                description="Remove backgrounds and create listing-ready images"
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
                title="Create Lifestyle Scene"
                description="Place products in AI-generated environments"
                onPress={() => navigation.navigate("EnvironmentSelection", {})}
                badge="AI"
              />
            </Animated.View>
          </View>

          <View style={styles.cardRow}>
            <Animated.View
              entering={FadeInDown.delay(300).duration(500).springify()}
              style={styles.cardWrapper}
            >
              <WorkflowCard
                icon="box"
                title="Create Mockup"
                description="Place products on apparel, mugs, posters & more"
                onPress={() => navigation.navigate("MockupSelection", {})}
                badge="AI"
              />
            </Animated.View>
            <Animated.View
              entering={FadeInDown.delay(400).duration(500).springify()}
              style={styles.cardWrapper}
            >
              <WorkflowCard
                icon="layers"
                title="Batch Edit Photos"
                description="Process multiple images at once"
                onPress={handleBatchEdit}
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
    paddingHorizontal: Spacing.lg,
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
    color: Colors.light.textTertiary,
    fontSize: 12,
  },
});

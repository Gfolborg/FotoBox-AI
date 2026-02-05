import React from "react";
import { StyleSheet, View, ScrollView, Image, Modal, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { WorkflowCard } from "@/components/WorkflowCard";
import { CreditIndicator } from "@/components/CreditIndicator";
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
  const [showContactModal, setShowContactModal] = React.useState(false);

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
        </Animated.View>

        {/* Credit Indicator */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.creditRow}>
          <CreditIndicator />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(500)} style={styles.subtitleRow}>
          <ThemedText style={styles.subtitleCaption}>Your workspace</ThemedText>
          <ThemedText style={styles.subtitle}>
            Make your product photos look pro.
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
          <Pressable
            onPress={() => setShowContactModal(true)}
            style={({ pressed }) => [
              styles.contactButton,
              pressed && styles.contactButtonPressed,
            ]}
          >
            <ThemedText style={styles.contactButtonText}>
              Help & feedback
            </ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={showContactModal}
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalScrim}
            onPress={() => setShowContactModal(false)}
          />
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Contact</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Issues, Questions or Ideas? Reach out anytime.
            </ThemedText>

            <Pressable
              style={styles.contactRow}
              accessibilityRole="link"
              onPress={() =>
                Linking.openURL("mailto:gyasi.folborg@outlook.com")
              }
            >
              <View style={styles.contactIcon}>
                <Feather name="mail" size={16} color={Colors.light.primary} />
              </View>
              <View style={styles.contactText}>
                <ThemedText style={styles.contactTitle}>Email me</ThemedText>
                <ThemedText style={styles.contactValue}>
                  gyasi.folborg@outlook.com
                </ThemedText>
              </View>
              <Feather
                name="external-link"
                size={14}
                color={Colors.light.textSecondary}
              />
            </Pressable>

            <Pressable
              style={styles.contactRow}
              accessibilityRole="link"
              onPress={() => Linking.openURL("https://x.com/Its_Me_Gyasi")}
            >
              <View style={styles.contactIcon}>
                <Feather name="twitter" size={16} color={Colors.light.primary} />
              </View>
              <View style={styles.contactText}>
                <ThemedText style={styles.contactTitle}>Message on X</ThemedText>
                <ThemedText style={styles.contactValue}>@Its_Me_Gyasi</ThemedText>
              </View>
              <Feather
                name="external-link"
                size={14}
                color={Colors.light.textSecondary}
              />
            </Pressable>

            <Pressable
              style={styles.contactRow}
              accessibilityRole="link"
              onPress={() =>
                Linking.openURL("https://www.linkedin.com/in/gyasi-folborg")
              }
            >
              <View style={styles.contactIcon}>
                <Feather
                  name="linkedin"
                  size={16}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.contactText}>
                <ThemedText style={styles.contactTitle}>
                  Connect on LinkedIn
                </ThemedText>
                <ThemedText style={styles.contactValue}>
                  linkedin.com/in/gyasi-folborg
                </ThemedText>
              </View>
              <Feather
                name="external-link"
                size={14}
                color={Colors.light.textSecondary}
              />
            </Pressable>

            <Pressable
              style={styles.closeButton}
              onPress={() => setShowContactModal(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  creditRow: {
    alignItems: "flex-end",
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  subtitleRow: {
    marginBottom: Spacing.lg,
    alignItems: "center",
    gap: 6,
  },
  subtitleCaption: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.light.textSecondary,
  },
  logo: {
    width: 460,
    height: 170,
    maxWidth: "100%",
    marginBottom: 0,
    transform: [{ translateY: -100 }],
  },
  subtitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
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
    gap: Spacing.sm,
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
  contactButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  contactButtonPressed: {
    opacity: 0.75,
  },
  contactButtonText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 18, 33, 0.5)",
  },
  modalCard: {
    width: "88%",
    borderRadius: BorderRadius.xl,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    paddingHorizontal: Spacing.md,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
    textDecorationLine: "underline",
  },
  closeButton: {
    marginTop: Spacing.sm,
    alignSelf: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
});

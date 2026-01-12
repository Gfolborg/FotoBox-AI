import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { WorkflowCard } from "@/components/WorkflowCard";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing } from "@/constants/theme";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
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
        <View style={styles.header}>
          <ThemedText type="h1" style={styles.title}>
            FotoBox AI
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            What do you want to accomplish today?
          </ThemedText>
        </View>

        <View style={styles.cardGrid}>
          <View style={styles.cardRow}>
            <WorkflowCard
              icon="camera"
              title="Generate Product Shot"
              description="Remove backgrounds and create listing-ready images"
              onPress={() => navigation.navigate("Camera")}
              variant="primary"
            />
            <WorkflowCard
              icon="image"
              title="Create Lifestyle Scene"
              description="Place products in AI-generated environments"
              onPress={() => navigation.navigate("EnvironmentSelection", {})}
              badge="AI"
            />
          </View>

          <View style={styles.cardRow}>
            <WorkflowCard
              icon="bookmark"
              title="Apply Saved Style"
              description="Apply your saved presets to new photos"
              onPress={() => navigation.navigate("PresetSelection")}
            />
            <WorkflowCard
              icon="layers"
              title="Batch Edit Photos"
              description="Process multiple images at once"
              onPress={() => navigation.navigate("Camera")}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Powered by AI for e-commerce sellers
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
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
  footer: {
    marginTop: Spacing["2xl"],
    alignItems: "center",
  },
  footerText: {
    color: Colors.light.textTertiary,
    fontSize: 12,
  },
});

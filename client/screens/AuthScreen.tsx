import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useAuth } from "@/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Auth">;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { oauthLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    // Note: Removed redirectUri to allow AuthSession to handle it automatically with the proxy
    // when running in Expo Go.
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleResponse(response.authentication?.accessToken);
    } else if (response?.type === "error") {
      setIsLoading(false);
      setLoadingProvider(null);
      Alert.alert("Sign in failed", "Please try again");
    } else if (response?.type === "dismiss") {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }, [response]);

  // Log the redirect URI for OAuth configuration debugging
  useEffect(() => {
    if (request?.redirectUri) {
      console.log('=== GOOGLE OAUTH REDIRECT URI ===', request.redirectUri);
    }
  }, [request]);

  const handleGoogleResponse = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setIsLoading(false);
      setLoadingProvider(null);
      Alert.alert("Sign in failed", "Could not get authentication token");
      return;
    }

    try {
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userInfo = await userInfoResponse.json();

      const result = await oauthLogin({
        provider: "google",
        idToken: accessToken,
        email: userInfo.email,
        displayName: userInfo.name,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace("Home");
      } else {
        Alert.alert("Sign in failed", result.error || "Please try again");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      Alert.alert("Sign in failed", "Please try again");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setLoadingProvider("google");

    try {
      await promptAsync();
    } catch (error) {
      console.error("Google Sign-In error:", error);
      setIsLoading(false);
      setLoadingProvider(null);
      Alert.alert("Sign in failed", "Please try again");
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setLoadingProvider("apple");

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const displayName = credential.fullName
        ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim()
        : undefined;

      const result = await oauthLogin({
        provider: "apple",
        idToken: credential.user,
        email: credential.email || undefined,
        displayName: displayName || undefined,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace("Home");
      } else {
        Alert.alert("Sign in failed", result.error || "Please try again");
      }
    } catch (error: any) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Sign in failed", "Please try again");
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.replace("Home");
  };

  return (
    <GradientBackground>
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
          />
          <ThemedText style={styles.title}>Welcome to FotoBox</ThemedText>
          <ThemedText style={styles.subtitle}>
            Sign in to save your progress and sync across devices
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.content}
        >
          <GlassCard style={styles.card}>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={isLoading || !request}
              >
                {loadingProvider === "google" ? (
                  <ActivityIndicator color={Colors.light.text} size="small" />
                ) : (
                  <View style={styles.googleIcon}>
                    <Feather name="mail" size={20} color="#EA4335" />
                  </View>
                )}
                <ThemedText style={styles.googleButtonText}>
                  {loadingProvider === "google" ? "Signing in..." : "Continue with Google"}
                </ThemedText>
              </Pressable>

              {Platform.OS === "ios" && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={BorderRadius.lg}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              )}

              {Platform.OS === "android" && (
                <ThemedText style={styles.androidNote}>
                  Apple Sign-In is available on iOS devices
                </ThemedText>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>or</ThemedText>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.guestButton} onPress={handleSkip}>
              <Feather name="user" size={20} color={Colors.light.text} />
              <ThemedText style={styles.guestButtonText}>Continue as Guest</ThemedText>
            </Pressable>

            <ThemedText style={styles.guestNote}>
              Guest users get 3 free edits with watermark
            </ThemedText>
          </GlassCard>

          <ThemedText style={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    padding: Spacing.xl,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundDefault,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  googleIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  appleButton: {
    height: 52,
    width: "100%",
  },
  androidNote: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    paddingHorizontal: Spacing.md,
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  guestNote: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  terms: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xl,
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
});

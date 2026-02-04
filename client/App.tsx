import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotificationProvider } from "@/context/NotificationProvider";
import { BatchEditProvider } from "@/context/BatchEditContext";
import { MockupVariantsProvider } from "@/context/MockupVariantsContext";
import { AuthProvider } from "@/context/AuthContext";

export default function App() {
  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <AuthProvider>
                <NotificationProvider>
                  <BatchEditProvider>
                    <MockupVariantsProvider>
                      <NavigationContainer>
                        <RootStackNavigator />
                      </NavigationContainer>
                      <StatusBar style="auto" />
                    </MockupVariantsProvider>
                  </BatchEditProvider>
                </NotificationProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

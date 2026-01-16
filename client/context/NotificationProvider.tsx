import React, { useState, useCallback, ReactNode } from "react";
import NotificationContext from "./NotificationContext";
import { Notification, NotificationType } from "@/components/Notification";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const NOTIFICATION_TIMEOUT = 4000; // 4 seconds

interface NotificationState {
  message: string;
  type: NotificationType;
  key: number;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const topPosition = useSharedValue(-100);
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: topPosition.value }],
    };
  });

  const hideNotification = useCallback(() => {
    topPosition.value = withTiming(-100, { duration: 300 }, () => {
      runOnJS(setNotification)(null);
    });
  }, [topPosition]);

  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      // Use a key to ensure re-triggering animation even if message/type are the same
      setNotification({ message, type, key: Date.now() });

      topPosition.value = withSpring(insets.top + 10, {
        damping: 20,
        stiffness: 150,
      });

      setTimeout(() => {
        hideNotification();
      }, NOTIFICATION_TIMEOUT);
    },
    [hideNotification, insets.top, topPosition],
  );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
            },
            animatedStyle,
          ]}
        >
          <Notification
            key={notification.key}
            message={notification.message}
            type={notification.type}
          />
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

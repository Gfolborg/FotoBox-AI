import React from "react";
import { NotificationType } from "@/components/Notification";

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = React.createContext<
  NotificationContextType | undefined
>(undefined);

export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}

export default NotificationContext;

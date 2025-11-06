"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { auth } from "@/lib/firebase";
import {
  Notification,
  CreateNotificationInput,
  NotificationType,
} from "@/types/notification";
import { toast } from "sonner";
import { setNotificationService } from "@/lib/notificationHelpers";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  createNotification: (
    input: Omit<CreateNotificationInput, "userId">
  ) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  showToast: (type: NotificationType, message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    if (userId) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      const notifs = data.notifications || [];

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Don't show toast error on initial load to avoid spam
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createNotification = useCallback(
    async (input: Omit<CreateNotificationInput, "userId">) => {
      if (!userId) {
        console.warn("Cannot create notification: No user logged in");
        return;
      }

      try {
        const response = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, userId }),
        });

        if (!response.ok) {
          throw new Error("Failed to create notification");
        }

        // Refresh notifications after creating
        await refreshNotifications();
      } catch (error) {
        console.error("Error creating notification:", error);
      }
    },
    [userId, refreshNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/notifications`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId, userId, action: "mark-read" }),
        });

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to update notification");
      }
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "mark-all-read" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  }, [userId]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const response = await fetch(
          `/api/notifications?notificationId=${notificationId}&userId=${userId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete notification");
        }

        // Update local state
        setNotifications((prev) => {
          const filtered = prev.filter((n) => n.id !== notificationId);
          const wasUnread =
            prev.find((n) => n.id === notificationId)?.read === false;
          if (wasUnread) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return filtered;
        });

        toast.success("Notification deleted");
      } catch (error) {
        console.error("Error deleting notification:", error);
        toast.error("Failed to delete notification");
      }
    },
    [userId]
  );

  const clearAllNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `/api/notifications?userId=${userId}&action=clear-all`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }

      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  }, [userId]);

  // Centralized toast function
  const showToast = useCallback(
    (type: NotificationType, message: string, title?: string) => {
      const fullMessage = title ? `${title}: ${message}` : message;

      switch (type) {
        case "success":
        case "login":
          toast.success(fullMessage);
          break;
        case "error":
        case "logout":
          toast.error(fullMessage);
          break;
        case "warning":
          toast.warning(fullMessage);
          break;
        case "info":
        case "system":
        case "timesheet":
        case "version":
        default:
          toast.info(fullMessage);
          break;
      }
    },
    []
  );

  // Register notification service for use in other modules
  useEffect(() => {
    setNotificationService({
      createNotification,
      showToast,
    });
  }, [createNotification, showToast]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    showToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

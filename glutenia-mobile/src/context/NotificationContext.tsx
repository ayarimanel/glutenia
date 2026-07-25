import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../api/client";
import type { Notification } from "../types/models";

const POLL_INTERVAL_MS = 30000;

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.notifications(token);
      setNotifications(data || []);
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    setNotifications([]);
    if (!token) return;

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((current) =>
        current.map((item) => (item._id === id ? { ...item, read: true } : item))
      );
      try {
        await api.markNotificationRead(token as string, id);
      } catch (_) {}
    },
    [token]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await api.markAllNotificationsRead(token as string);
    } catch (_) {}
  }, [token]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo(
    () => ({ notifications, unreadCount, refresh, markRead, markAllRead }),
    [notifications, unreadCount, refresh, markRead, markAllRead]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};

// Always rendered under <NotificationProvider> in this app's tree (App.js) -
// see the matching note on useAuth in AuthContext.tsx.
export const useNotifications = () => useContext(NotificationContext) as NotificationContextValue;

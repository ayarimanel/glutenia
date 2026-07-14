import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../api/client";

const POLL_INTERVAL_MS = 30000;
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);

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
    async (id) => {
      setNotifications((current) =>
        current.map((item) => (item._id === id ? { ...item, read: true } : item))
      );
      try {
        await api.markNotificationRead(token, id);
      } catch (_) {}
    },
    [token]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await api.markAllNotificationsRead(token);
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

export const useNotifications = () => useContext(NotificationContext);

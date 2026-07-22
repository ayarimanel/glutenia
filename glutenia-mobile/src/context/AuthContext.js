import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { registerForPushNotificationsAsync } from "../services/pushNotifications";

const STORAGE_KEY = "glutenia.session";
const ONBOARDING_PROFILE_KEY = "onboarding_complete";
const ONBOARDING_SEEN_KEY = "glutenia.hasSeenOnboarding";
// Must match LANG_KEY in src/i18n/index.js — that file owns the device-local
// language cache; this one only reads it once, at login, to seed the account.
const LANGUAGE_STORAGE_KEY = "glutenia.language";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [profileOnboardingDone, setProfileOnboardingDone] = useState(false);
  const [pushToken, setPushToken] = useState(null);

  useEffect(() => {
    const restore = async () => {
      try {
        const [saved, flag, seenOnboarding] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_PROFILE_KEY),
          AsyncStorage.getItem(ONBOARDING_SEEN_KEY),
        ]);
        if (seenOnboarding === "true") setHasSeenOnboarding(true);
        if (saved) {
          const session = JSON.parse(saved);
          if (session.token) {
            const freshUser = await api.me(session.token, { timeoutMs: 8000 });
            const nextSession = { ...session, user: freshUser };
            setToken(nextSession.token);
            setUser(freshUser);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
            setProfileOnboardingDone(flag === "true" || freshUser.role_type != null);
          }
        }
      } catch (error) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    let cancelled = false;

    registerForPushNotificationsAsync().then((expoPushToken) => {
      if (cancelled || !expoPushToken) return;
      setPushToken(expoPushToken);
      api.registerPushToken(token, expoPushToken).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [token, user?._id]);

  const completeOnboarding = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  };

  const markProfileOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_PROFILE_KEY, "true");
    setProfileOnboardingDone(true);
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...session, user: updatedUser })
        );
      }
    } catch (_) {}
  };

  const persistSession = async (session) => {
    const flag = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
    setProfileOnboardingDone(flag === "true" || session.user?.role_type != null);
    setToken(session.token);
    setUser(session.user);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    // A language picked before login (the intro carousel) only ever lands in
    // the device-local i18n cache. If this account has no language of its
    // own yet, carry that local choice up to the account now so it survives
    // a reinstall/new device instead of silently reverting to the default.
    if (!session.user?.language) {
      try {
        const localLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (localLanguage) {
          const updated = await api.updateProfile(session.token, { language: localLanguage });
          setUser(updated);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...session, user: updated })
          );
        }
      } catch (_) {
        // Non-critical — the device-local language still works either way.
      }
    }
  };

  const login = async ({ email, password }) => {
    const session = await api.login({ email, password });
    await persistSession(session);
    return session.user;
  };

  const register = async ({ name, email, password, role, phone }) => {
    await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
    const data = await api.register({ name, email, password, role, phone });
    if (data.pending) {
      return data;
    }
    await persistSession(data);
    return data.user;
  };

  const logout = async () => {
    if (token && pushToken) {
      api.unregisterPushToken(token, pushToken).catch(() => {});
    }
    setUser(null);
    setToken(null);
    setPushToken(null);
    setProfileOnboardingDone(false);
    await AsyncStorage.multiRemove([STORAGE_KEY, ONBOARDING_PROFILE_KEY]);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      hasSeenOnboarding,
      profileOnboardingDone,
      login,
      register,
      logout,
      completeOnboarding,
      markProfileOnboardingComplete,
      updateUser,
    }),
    [user, token, loading, hasSeenOnboarding, profileOnboardingDone, pushToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

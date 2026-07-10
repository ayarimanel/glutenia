import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "glutenia.session";
const ONBOARDING_PROFILE_KEY = "onboarding_complete";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [profileOnboardingDone, setProfileOnboardingDone] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const [saved, flag] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_PROFILE_KEY),
        ]);
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

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
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
  };

  const login = async ({ email, password }) => {
    const session = await api.login({ email, password });
    await persistSession(session);
    return session.user;
  };

  const register = async ({ name, email, password, role }) => {
    await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
    const data = await api.register({ name, email, password, role });
    if (data.pending) {
      return data;
    }
    await persistSession(data);
    return data.user;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
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
    [user, token, loading, hasSeenOnboarding, profileOnboardingDone]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

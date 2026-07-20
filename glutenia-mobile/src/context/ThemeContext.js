import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "glutenia.theme";

export const lightColors = {
  primary: "#8BC34A",
  primaryLight: "#A5D66A",
  primaryPale: "#F1F8E9",
  secondary: "#7B4626",
  secondaryMid: "#9A5C38",
  secondaryPale: "#F5EDE8",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  textDark: "#2E2E2E",
  textMuted: "#6C757D",
  border: "#DEE2E6",
  divider: "#E9ECEF",
  danger: "#C8102E",
  warning: "#F59E0B",
};

export const darkColors = {
  primary: "#8BC34A",
  primaryLight: "#A5D66A",
  primaryPale: "#1B2D0F",
  secondary: "#C4895A",
  secondaryMid: "#D4A07A",
  secondaryPale: "#281E14",
  background: "#0F0F0F",
  surface: "#1C1C1E",
  textDark: "#F2F2F7",
  textMuted: "#8E8E93",
  border: "#38383A",
  divider: "#2C2C2E",
  danger: "#FF453A",
  warning: "#FFD60A",
};

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === "dark") setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const setTheme = async (nextIsDark) => {
    setIsDark(nextIsDark);
    await AsyncStorage.setItem(THEME_KEY, nextIsDark ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

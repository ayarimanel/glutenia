import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Zap } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

const AUTO_DISMISS_MS = 2200;

export default function GamificationToast({ xpGained, onDismiss }) {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(onDismiss);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surface,
            transform: [{ translateY }],
            opacity,
            shadowOpacity: isDark ? 0.4 : 0.15,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}22` }]}>
          <Zap size={16} color={colors.primary} fill={colors.primary} />
        </View>
        <Text style={[styles.text, { color: colors.textDark }]}>+{xpGained} XP</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  pill: {
    marginTop: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "800",
  },
});

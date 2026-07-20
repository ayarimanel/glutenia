import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Award, TrendingUp } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

// Shows one queued gamification "moment" (a badge unlock or a level-up) at a
// time. `event` is either { type: "badge", badge } or { type: "levelup", newLevel }.
export default function GamificationUnlockModal({ event, onDismiss }) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [active, setActive] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!event) return;
    setActive(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, [event]);

  if (!active || !event) return null;

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setActive(false);
      onDismiss();
    });
  };

  const isBadge = event.type === "badge";
  const accentColor = isBadge ? colors.primary : colors.secondary;
  const Icon = isBadge ? Award : TrendingUp;

  return (
    <Modal transparent visible={active} animationType="none" statusBarTranslucent>
      <Pressable
        style={[styles.backdrop, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" }]}
        onPress={dismiss}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
            <Icon size={36} color={accentColor} strokeWidth={2} />
          </View>

          <Text style={[styles.eyebrow, { color: accentColor }]}>
            {isBadge ? t("gamification.badgeUnlocked") : t("gamification.levelUp")}
          </Text>

          <Text style={[styles.title, { color: colors.textDark }]}>
            {isBadge ? event.badge.name : t("gamification.newLevel", { level: event.newLevel })}
          </Text>

          {isBadge && event.badge.description ? (
            <Text style={[styles.desc, { color: colors.textMuted }]}>{event.badge.description}</Text>
          ) : null}

          {isBadge && event.badge.xpReward > 0 ? (
            <View style={[styles.xpChip, { backgroundColor: `${accentColor}18` }]}>
              <Text style={[styles.xpChipText, { color: accentColor }]}>
                +{event.badge.xpReward} {t("account.xp")}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={dismiss}
          >
            <Text style={styles.buttonText}>{t("gamification.awesome")}</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  xpChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  xpChipText: {
    fontSize: 13,
    fontWeight: "800",
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});

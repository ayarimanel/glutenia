import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { getBadgeVisualTokens, getBadgeTier } from "../theme/badgeTheme";
import BadgeIcon from "./BadgeIcon";

const PARTICLE_COUNT = 8;

// A short, once-off burst of small dots flying outward from the badge on
// unlock — the "big moment" celebration. Level-ups reuse the same burst so
// both payoffs feel equally satisfying; routine XP stays a small toast.
function ParticleBurst({ color, active }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() * 0.4 - 0.2);
        const distance = 46 + Math.random() * 22;
        return {
          key: i,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: 5 + Math.random() * 4,
          anim: new Animated.Value(0),
        };
      }),
    []
  );

  useEffect(() => {
    if (!active) return;
    Animated.stagger(
      18,
      particles.map((p) =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [active]);

  return (
    <View pointerEvents="none" style={styles.particleLayer}>
      {particles.map((p) => (
        <Animated.View
          key={p.key}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: color,
              opacity: p.anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
              transform: [
                { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
                { scale: p.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1, 0.4] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// A soft diagonal light sweep across the badge medallion, once, on mount.
function ShineSweep({ active }) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.delay(220),
      Animated.timing(sweep, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [active]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shine,
        {
          opacity: sweep.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.5, 0.5, 0] }),
          transform: [
            { translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-90, 90] }) },
            { rotate: "20deg" },
          ],
        },
      ]}
    />
  );
}

// Shows one queued gamification "moment" (a badge unlock or a level-up) at a
// time. `event` is either { type: "badge", badge } or { type: "levelup", newLevel }.
export default function GamificationUnlockModal({ event, onDismiss }) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [active, setActive] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const badgeScale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!event) return;
    setActive(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    badgeScale.setValue(0.4);
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
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        delay: 80,
        useNativeDriver: true,
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
  const tier = isBadge ? getBadgeTier(event.badge.slug) : null;
  const tokens = isBadge ? getBadgeVisualTokens(event.badge.category, tier) : null;
  const accentColor = isBadge ? tokens.base : colors.secondary;

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
          {isBadge ? (
            <Animated.View style={[styles.badgeCelebrationWrap, { transform: [{ scale: badgeScale }] }]}>
              <ParticleBurst color={accentColor} active={active} />
              <ShineSweep active={active} />
              <BadgeIcon badge={event.badge} size={92} locked={false} />
            </Animated.View>
          ) : (
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
              <TrendingUp size={36} color={accentColor} strokeWidth={2} />
            </View>
          )}

          <Text style={[styles.eyebrow, { color: accentColor }]}>
            {isBadge ? t("gamification.badgeUnlocked") : t("gamification.levelUp")}
          </Text>

          <Text style={[styles.title, { color: colors.textDark }]}>
            {isBadge
              ? t(`badges.catalog.${event.badge.slug}.name`, { defaultValue: event.badge.name })
              : t("gamification.newLevel", { level: event.newLevel })}
          </Text>

          {isBadge && event.badge.description ? (
            <Text style={[styles.desc, { color: colors.textMuted }]}>
              {t(`badges.catalog.${event.badge.slug}.description`, { defaultValue: event.badge.description })}
            </Text>
          ) : null}

          {isBadge && event.badge.xpReward > 0 ? (
            <View style={[styles.xpChip, { backgroundColor: `${accentColor}18` }]}>
              <Text style={[styles.xpChipText, { color: accentColor }]}>
                +{event.badge.xpReward} {t("account.xp")}
              </Text>
            </View>
          ) : null}

          <Pressable style={[styles.button, { backgroundColor: accentColor }]} onPress={dismiss}>
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
  badgeCelebrationWrap: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  particleLayer: {
    position: "absolute",
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },
  shine: {
    position: "absolute",
    width: 18,
    height: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
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

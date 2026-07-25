import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Stop } from "react-native-svg";
import AppIcon, { type IconName } from "./AppIcon";
import ShineSweep from "./ShineSweep";
import { getTierTokensForColor } from "../theme/badgeTheme";
import { useTheme } from "../context/ThemeContext";

interface RoleMedallionProps {
  iconName: IconName;
  color: string;
  size?: number;
  locked?: boolean;
}

// The "My Role" medallion: same layered-gradient-ring + glossy-highlight
// language as the badge catalog (BadgeIcon), always rendered at the catalog's
// most prestigious tier — a role is a chosen identity, not a grind, so it
// always gets the full "earned" treatment. The one exception is `locked`
// (no role chosen yet), which borrows BadgeIcon's own locked/greyed-out
// styling instead of inventing a second "unearned" look.
export default function RoleMedallion({ iconName, color, size = 80, locked = false }: RoleMedallionProps) {
  const { colors, isDark } = useTheme();
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const tokens = getTierTokensForColor(color, "platinum");
  const r = size / 2;
  const ringWidth = tokens.ringWidth;
  const innerR = r - ringWidth;
  const outerR = r - 1.5;
  const notches = 18;
  const dash = (2 * Math.PI * outerR) / notches / 2;

  const lockedFill = isDark ? "#3A3A3C" : "#D9DCE1";
  const lockedRing = isDark ? "#4A4A4D" : "#C3C7CE";
  const iconColor = locked ? (isDark ? "#8E8E93" : "#9AA0A8") : "#FFFFFF";

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size, transform: [{ scale }] }]}>
      <View
        style={[
          !locked && styles.glow,
          !locked && {
            shadowColor: tokens.glowColor,
            shadowRadius: tokens.glowRadius,
            shadowOpacity: isDark ? 0.55 : 0.4,
          },
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="roleMedallionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={tokens.gradient[0]} />
              <Stop offset="55%" stopColor={tokens.gradient[1]} />
              <Stop offset="100%" stopColor={tokens.gradient[2]} />
            </LinearGradient>
          </Defs>

          {!locked && (
            <Circle
              cx={r}
              cy={r}
              r={outerR}
              stroke={tokens.ringColor}
              strokeWidth={2.5}
              strokeDasharray={`${dash} ${dash}`}
              fill="none"
              opacity={0.5}
            />
          )}

          <Circle
            cx={r}
            cy={r}
            r={innerR}
            fill={locked ? lockedFill : "url(#roleMedallionGrad)"}
            stroke={locked ? lockedRing : tokens.ringColor}
            strokeWidth={ringWidth}
          />

          {!locked && (
            <Ellipse
              cx={r - innerR * 0.28}
              cy={r - innerR * 0.42}
              rx={innerR * 0.42}
              ry={innerR * 0.22}
              fill="#FFFFFF"
              opacity={0.2}
              transform={`rotate(-25 ${r} ${r})`}
            />
          )}
        </Svg>
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.centerIcon}>
          <AppIcon name={iconName} size={Math.max(16, size * 0.42)} color={iconColor} strokeWidth={2.2} />
        </View>
      </View>

      {!locked && (
        <View
          style={[
            styles.sparkle,
            { backgroundColor: colors.surface, borderColor: colors.background },
          ]}
        >
          <AppIcon name="star" size={12} color={tokens.glowColor} strokeWidth={2.4} fill={tokens.glowColor} />
        </View>
      )}

      {!locked && <ShineSweep active size={size} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerIcon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  sparkle: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});

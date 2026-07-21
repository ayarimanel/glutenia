import { View, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Circle, Ellipse } from "react-native-svg";
import {
  ScanLine,
  ScanBarcode,
  PackageSearch,
  Crown,
  FileSearch,
  PartyPopper,
  CalendarHeart,
  ShoppingBag,
  ShoppingCart,
  Gem,
  Flame,
  Sprout,
  Award,
  Lock,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { getBadgeVisualTokens, getBadgeTier } from "../theme/badgeTheme";

// Single source of visual truth for every badge/achievement: the grid, the
// detail modal, the unlock celebration, and any inline mention all render
// through this component so locked/unlocked/tier treatment never drifts.

const BADGE_ICONS = {
  first_scan: ScanLine,
  ten_scans: ScanBarcode,
  fifty_scans: PackageSearch,
  hundred_scans: Crown,
  label_master: FileSearch,
  event_attendee: PartyPopper,
  event_regular: CalendarHeart,
  first_order: ShoppingBag,
  five_orders: ShoppingCart,
  twenty_orders: Gem,
  streak_7: Flame,
  streak_30: Flame,
  streak_100: Flame,
  first_month: Sprout,
  one_year: Award,
};

export default function BadgeIcon({ badge, size = 64, locked = false, progressRatio = null }) {
  const { colors, isDark } = useTheme();
  if (!badge) return null;

  const tier = getBadgeTier(badge.slug);
  const tokens = getBadgeVisualTokens(badge.category, tier);
  const Icon = BADGE_ICONS[badge.slug] || Award;

  const r = size / 2;
  const ringWidth = tokens.ringWidth;
  const innerR = r - ringWidth;
  const showProgress = locked && progressRatio != null && progressRatio > 0 && progressRatio < 1;

  const lockedFill = isDark ? "#3A3A3C" : "#D9DCE1";
  const lockedRing = isDark ? "#4A4A4D" : "#C3C7CE";
  const iconColor = locked ? (isDark ? "#8E8E93" : "#9AA0A8") : "#FFFFFF";
  const iconSize = Math.max(14, size * 0.42);
  const lockBadgeSize = Math.max(16, Math.round(size * 0.32));

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          !locked && tokens.glow && styles.glowShadow,
          !locked && tokens.glow && {
            shadowColor: tokens.glowColor,
            shadowRadius: tokens.glowRadius,
            shadowOpacity: isDark ? 0.55 : 0.4,
          },
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={`grad-${badge.slug}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={tokens.gradient[0]} />
              <Stop offset="55%" stopColor={tokens.gradient[1]} />
              <Stop offset="100%" stopColor={tokens.gradient[2]} />
            </LinearGradient>
          </Defs>

          {showProgress && (
            <Circle
              cx={r}
              cy={r}
              r={r - 1}
              stroke={colors.divider}
              strokeWidth={2}
              fill="none"
            />
          )}
          {showProgress && (
            <Circle
              cx={r}
              cy={r}
              r={r - 1}
              stroke={tokens.base}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${2 * Math.PI * (r - 1) * progressRatio} ${2 * Math.PI * (r - 1)}`}
              transform={`rotate(-90 ${r} ${r})`}
              opacity={0.85}
            />
          )}

          <Circle
            cx={r}
            cy={r}
            r={innerR - (showProgress ? 3 : 0)}
            fill={locked ? lockedFill : `url(#grad-${badge.slug})`}
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
              opacity={0.16}
              transform={`rotate(-25 ${r} ${r})`}
            />
          )}
        </Svg>
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.centerIcon}>
          <Icon size={iconSize} color={iconColor} strokeWidth={2.2} />
        </View>
      </View>

      {locked && (
        <View
          style={[
            styles.lockBadge,
            {
              width: lockBadgeSize,
              height: lockBadgeSize,
              borderRadius: lockBadgeSize / 2,
              backgroundColor: colors.surface,
              borderColor: colors.background,
            },
          ]}
        >
          <Lock size={lockBadgeSize * 0.56} color={colors.textMuted} strokeWidth={2.4} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerIcon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  glowShadow: {
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});

import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import AppIcon from "./AppIcon";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { Shadow, Spacing } from "../theme/colors";
import type { ThemeColors } from "../context/ThemeContext";
import type { RootParamList } from "../navigation/types";

interface AppHeaderProps {
  userName?: string;
  avatarUri?: string;
  onCartPress?: () => void;
  safeTop?: boolean;
  back?: boolean;
}

export default function AppHeader({ userName, avatarUri, onCartPress, safeTop = false, back }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootParamList>>();
  const { count } = useCart();
  const { unreadCount } = useNotifications() ?? {};
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={[styles.container, safeTop && { paddingTop: insets.top + 12 }]}>
      <View style={styles.left}>
        {back && navigation.canGoBack() ? (
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <AppIcon name="arrow-back" size={22} color={colors.textDark} />
          </Pressable>
        ) : null}
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <AppIcon name="person" size={22} color={colors.primary} />
            </View>
          )}
          <View style={styles.shieldBadge}>
            <AppIcon name="shield" size={11} color="#fff" strokeWidth={2.5} />
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>{userName}</Text>
      </View>

      <View style={styles.rightRow}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Notifications")}
        >
          <AppIcon name="bell" size={24} color={colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onCartPress}>
          <AppIcon name="basket" size={26} color={colors.primary} />
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    ...Shadow,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    padding: 4,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    position: "relative",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldBadge: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    flex: 1,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: "900",
  },
});

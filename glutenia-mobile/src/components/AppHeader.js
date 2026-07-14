import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AppIcon from "./AppIcon";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { Colors, Shadow, Spacing } from "../theme/colors";

/**
 * AppHeader — global identity bar for main tab screens (not Profile).
 *
 * Props:
 *   userName   string   — display name from auth context
 *   avatarUri  string   — optional remote image URI; falls back to person icon
 *   onCartPress fn      — called when basket icon is tapped
 *   safeTop    bool     — set true when NOT rendered inside a SafeAreaView (e.g. ScanScreen)
 */
export default function AppHeader({ userName, avatarUri, onCartPress, safeTop = false }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { count } = useCart();
  const { unreadCount } = useNotifications() ?? {};

  return (
    <View style={[styles.container, safeTop && { paddingTop: insets.top + 12 }]}>
      {/* Left: avatar + shield badge + user name */}
      <View style={styles.left}>
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <AppIcon name="person" size={22} color={Colors.primary} />
            </View>
          )}
          <View style={styles.shieldBadge}>
            <AppIcon name="shield" size={11} color="#fff" strokeWidth={2.5} />
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>{userName}</Text>
      </View>

      {/* Right: notification bell + cart icon, each with a badge */}
      <View style={styles.rightRow}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Notifications")}
        >
          <AppIcon name="bell" size={24} color={Colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onCartPress}>
          <AppIcon name="basket" size={26} color={Colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.primaryPale,
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
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textDark,
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
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: "900",
  },
});

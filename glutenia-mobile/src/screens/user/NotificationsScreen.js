import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import AppIcon from "../../components/AppIcon";
import { IconButton } from "../../components/Buttons";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const EVENT_TYPES = new Set(["event_join", "event_leave", "event_new"]);

const TYPE_ICONS = {
  event_join: "checkmark-circle",
  event_leave: "close-circle",
  event_new: "calendar",
  order_status: "receipt",
  professional_approved: "checkmark-circle",
  professional_rejected: "close-circle",
};

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { notifications, refresh, markRead, markAllRead, unreadCount } =
    useNotifications() ?? {};
  const { token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh?.();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh?.();
    setRefreshing(false);
  };

  // Takes the user to whatever the notification is actually about, instead
  // of just marking it read and leaving them to go find it themselves.
  const handlePress = async (item) => {
    if (!item.read) markRead(item._id);

    if (EVENT_TYPES.has(item.type) && item.referenceId) {
      try {
        const event = await api.event(item.referenceId, token);
        navigation.navigate("EventDetail", { event });
      } catch (_) {
        // Event may no longer exist — nothing to open.
      }
    } else if (item.type === "order_status") {
      navigation.navigate("Orders");
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader
          eyebrow={t("notifications.eyebrow")}
          title={t("notifications.title")}
          right={<IconButton icon="close" onPress={() => navigation.goBack()} />}
        />
        {unreadCount > 0 ? (
          <Pressable style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>{t("notifications.markAllRead")}</Text>
          </Pressable>
        ) : null}
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title={t("notifications.empty")}
              body={t("notifications.emptyBody")}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.iconWrap}>
                <AppIcon
                  name={TYPE_ICONS[item.type] || "bell"}
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
                <Text style={styles.cardTime}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              {!item.read ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  markAllBtn: {
    alignSelf: "flex-end",
  },
  markAllText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "800",
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: Spacing.md,
    ...Shadow,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "800",
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  cardTime: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    marginTop: 4,
  },
});

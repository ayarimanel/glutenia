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
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const TYPE_ICONS = {
  event_join: "checkmark-circle",
  event_leave: "close-circle",
  order_status: "receipt",
};

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const { notifications, refresh, markRead, markAllRead, unreadCount } =
    useNotifications() ?? {};
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
              onPress={() => !item.read && markRead(item._id)}
            >
              <View style={styles.iconWrap}>
                <AppIcon
                  name={TYPE_ICONS[item.type] || "bell"}
                  size={18}
                  color={Colors.primary}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  markAllBtn: {
    alignSelf: "flex-end",
  },
  markAllText: {
    color: Colors.secondary,
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
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    ...Shadow,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: "800",
  },
  cardBody: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  cardTime: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
    marginTop: 4,
  },
});

import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppIcon from "../../components/AppIcon";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { AppNavigation } from "../../navigation/types";
import type { Event } from "../../types/models";

export default function AdminEventsScreen({ navigation }: { navigation: AppNavigation }) {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setEvents(await api.events(token));
    } catch (err) {
      const error = err as ApiError;
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.events.errorTitle"), error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [token])
  );

  const deleteEvent = (event: Event) => {
    Alert.alert(
      t("admin.events.deleteTitle"),
      t("admin.events.deleteMsg", { title: event.title }),
      [
        { text: t("admin.events.cancel"), style: "cancel" },
        {
          text: t("admin.events.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
                return;
              }
              await api.deleteEvent(token, event._id);
              await loadEvents();
            } catch (err) {
              Alert.alert(t("admin.events.deleteFailed"), (err as ApiError).message);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader
          eyebrow={t("admin.events.eyebrow")}
          title={t("admin.events.title")}
          right={
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate("CreateEvent")}
            >
              <AppIcon name="add" size={24} color={colors.surface} />
            </Pressable>
          }
        />
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEvents} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title={t("admin.events.empty")}
              body={t("admin.events.emptyBody")}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.eventRow}>
              <View style={[styles.visual, { backgroundColor: item.color }]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.visualPhoto} />
                ) : (
                  <Text style={styles.emoji}>{item.emoji}</Text>
                )}
              </View>
              <View style={styles.eventBody}>
                <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta}>{item.category} · {item.date}</Text>
                <Text style={styles.meta} numberOfLines={1}>{item.location}</Text>
                <Text style={styles.going}>
                  {t("events.going", { count: item.attendeeCount })}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("CreateEvent", { eventId: item._id })}
                >
                  <AppIcon name="pencil" size={18} color={colors.primary} />
                  <Text style={styles.actionText}>{t("admin.events.edit")}</Text>
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => deleteEvent(item)}
                >
                  <AppIcon name="trash" size={18} color={colors.danger} />
                  <Text style={[styles.actionText, styles.deleteText]}>
                    {t("admin.events.delete")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 12,
    ...Shadow,
  },
  visual: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  visualPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  emoji: {
    fontSize: 32,
  },
  eventBody: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "900",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  going: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    minWidth: 74,
    minHeight: 38,
    borderRadius: Radius.pill,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  deleteText: {
    color: colors.danger,
  },
});

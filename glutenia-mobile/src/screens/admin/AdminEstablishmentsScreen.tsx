import {
  Alert,
  FlatList,
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
import { useAuthenticated } from "../../context/AuthContext";
import { api, isApiError, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { Establishment, EstablishmentOwnerSummary } from "../../types/models";
import type { AppNavigation } from "../../navigation/types";

// Admin oversight of Professional-submitted establishments. There is no
// separate "request verification" step - upsertMyEstablishment never sets
// `verified`, so any establishment sits here (verified: false) from the
// moment it's created/updated until an admin acts on it, same as how a
// professional signup is itself the approval request.
export default function AdminEstablishmentsScreen({ navigation }: { navigation: AppNavigation }) {
  const { token, logout } = useAuthenticated();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      setEstablishments(await api.pendingEstablishments(token));
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.establishments.errorTitle"), err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEstablishments();
    }, [token])
  );

  const verify = async (establishment: Establishment) => {
    try {
      setActioningId(establishment._id);
      await api.verifyEstablishment(token, establishment._id);
      await loadEstablishments();
    } catch (err) {
      Alert.alert(t("admin.establishments.verifyFailed"), (err as ApiError).message);
    } finally {
      setActioningId(null);
    }
  };

  const remove = (establishment: Establishment) => {
    Alert.alert(
      t("admin.establishments.deleteTitle"),
      t("admin.establishments.deleteMsg", { name: establishment.name }),
      [
        { text: t("admin.establishments.cancel"), style: "cancel" },
        {
          text: t("admin.establishments.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setActioningId(establishment._id);
              await api.deleteEstablishment(token, establishment._id);
              await loadEstablishments();
            } catch (err) {
              Alert.alert(t("admin.establishments.deleteFailed"), (err as ApiError).message);
            } finally {
              setActioningId(null);
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
          back
          eyebrow={t("admin.establishments.eyebrow")}
          title={t("admin.establishments.title")}
        />
        <FlatList
          data={establishments}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEstablishments} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="shield-check"
              title={t("admin.establishments.empty")}
              body={t("admin.establishments.emptyBody")}
            />
          }
          renderItem={({ item }) => {
            const owner = item.owner as EstablishmentOwnerSummary;
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("AdminEstablishmentDetail", { establishment: item })}
              >
                <View style={styles.top}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>
                <Text style={styles.owner} numberOfLines={1}>
                  {owner?.name || owner?.email || t("admin.establishments.unknownOwner")}
                </Text>
                <View style={styles.detailsHint}>
                  <Text style={styles.detailsHintText}>{t("admin.establishments.viewDetails")}</Text>
                  <AppIcon name="chevron-right" size={14} color={colors.secondary} />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionButton, styles.verifyButton]}
                    disabled={actioningId === item._id}
                    onPress={() => verify(item)}
                  >
                    <AppIcon name="checkmark-circle" size={16} color={colors.surface} />
                    <Text style={styles.verifyText}>{t("admin.establishments.verify")}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    disabled={actioningId === item._id}
                    onPress={() => remove(item)}
                  >
                    <AppIcon name="trash" size={16} color={colors.danger} />
                    <Text style={styles.deleteText}>{t("admin.establishments.delete")}</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
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
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: Spacing.md,
    gap: 6,
    ...Shadow,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: {
    flex: 1,
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "900",
  },
  categoryPill: {
    backgroundColor: colors.secondaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "900",
  },
  owner: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  detailsHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailsHintText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  verifyButton: {
    backgroundColor: colors.primary,
  },
  verifyText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "900",
  },
  deleteButton: {
    backgroundColor: "#FCEAEA",
  },
  deleteText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "900",
  },
});

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
import { api, isApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { AppNavigation } from "../../navigation/types";
import type { User } from "../../types/models";

// Admin "Manage Users": lists every account; tapping one opens
// AdminUserDetailScreen, where the admin can view, update, or delete it.
export default function AdminUsersScreen({ navigation }: { navigation: AppNavigation }) {
  const { token, logout, user: me } = useAuthenticated();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setUsers(await api.users(token));
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.users.errorTitle"), err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [token])
  );

  const roleLabel = (role: User["role"]) =>
    role === "admin"
      ? t("admin.users.roleAdmin")
      : role === "professional"
        ? t("admin.users.roleProfessional")
        : t("admin.users.roleCustomer");

  const query = search.trim().toLowerCase();
  const visibleUsers = query
    ? users.filter(
        (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      )
    : users;

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader back eyebrow={t("admin.users.eyebrow")} title={t("admin.users.title")} />
        <View style={styles.searchBox}>
          <AppIcon name="search" size={19} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("admin.users.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={styles.searchInput}
          />
        </View>
        {!initialLoadDone ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <FlatList
            data={visibleUsers}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} />}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon="person"
                title={t("admin.users.empty")}
                body={t("admin.users.emptyBody")}
              />
            }
            renderItem={({ item }) => {
              const isStaff = item.role !== "customer";
              return (
                <Pressable
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  onPress={() => navigation.navigate("AdminUserDetail", { userId: item._id })}
                >
                  <View style={styles.cardBody}>
                    <View style={styles.top}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.name}
                        {item._id === me._id ? ` (${t("admin.users.you")})` : ""}
                      </Text>
                      <View style={[styles.rolePill, isStaff && styles.rolePillStaff]}>
                        <Text style={[styles.roleText, isStaff && styles.roleTextStaff]}>
                          {roleLabel(item.role)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                    <Text style={styles.date}>
                      {t("admin.users.joinedOn", {
                        date: new Date(item.createdAt).toLocaleDateString(),
                      })}
                    </Text>
                  </View>
                  <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
                </Pressable>
              );
            }}
          />
        )}
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
  searchBox: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textDark,
    fontSize: 15,
  },
  loading: {
    marginVertical: Spacing.xl,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: Spacing.md,
    gap: 10,
    ...Shadow,
  },
  pressed: {
    opacity: 0.85,
  },
  cardBody: {
    flex: 1,
    gap: 6,
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
  rolePill: {
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rolePillStaff: {
    backgroundColor: colors.secondaryPale,
  },
  roleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  roleTextStaff: {
    color: colors.secondary,
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  date: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
});

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
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

// Mirrors PatientResourcesScreen.js's getCategories() icon/color mapping so
// admin rows read consistently with what patients actually see.
const CATEGORY_META = (colors) => ({
  celiac: { icon: "activity", color: colors.secondary },
  diet: { icon: "utensils", color: colors.primary },
  safe: { icon: "shield-check", color: colors.primary },
  lifestyle: { icon: "star", color: colors.warning },
});

export default function AdminPatientResourcesScreen({ navigation }) {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const categoryMeta = CATEGORY_META(colors);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadResources = async () => {
    try {
      setLoading(true);
      setResources(await api.patientResources());
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.patientResources.errorTitle"), error.message, undefined, { type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [token])
  );

  const deleteResource = (resource) => {
    Alert.alert(
      t("admin.patientResources.deleteTitle"),
      t("admin.patientResources.deleteMsg", { title: resource.title }),
      [
        { text: t("admin.patientResources.cancel"), style: "cancel" },
        {
          text: t("admin.patientResources.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
                return;
              }
              await api.deletePatientResource(token, resource._id);
              await loadResources();
            } catch (error) {
              Alert.alert(t("admin.patientResources.deleteFailed"), error.message);
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
          eyebrow={t("admin.patientResources.eyebrow")}
          title={t("admin.patientResources.title")}
          right={
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate("AdminPatientResourceForm")}
            >
              <AppIcon name="add" size={24} color={colors.surface} />
            </Pressable>
          }
        />
        <FlatList
          data={resources}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadResources} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="heart"
              title={t("admin.patientResources.empty")}
              body={t("admin.patientResources.emptyBody")}
            />
          }
          renderItem={({ item }) => {
            const meta = categoryMeta[item.category] || categoryMeta.celiac;
            return (
              <View style={styles.resourceRow}>
                <View style={[styles.visual, { backgroundColor: colors.primaryPale }]}>
                  <AppIcon name={meta.icon} size={24} color={meta.color} />
                </View>
                <View style={styles.resourceBody}>
                  <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.meta}>{item.category}</Text>
                  {item.featured ? (
                    <Text style={styles.featured}>{t("admin.patientResourceForm.featured")}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate("AdminPatientResourceForm", { resourceId: item._id })
                    }
                  >
                    <AppIcon name="pencil" size={18} color={colors.primary} />
                    <Text style={styles.actionText}>{t("admin.patientResources.edit")}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => deleteResource(item)}
                  >
                    <AppIcon name="trash" size={18} color={colors.danger} />
                    <Text style={[styles.actionText, styles.deleteText]}>
                      {t("admin.patientResources.delete")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
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
  resourceRow: {
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
  },
  resourceBody: {
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
    textTransform: "capitalize",
  },
  featured: {
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

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
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function AdminProfessionalRequestsScreen() {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  const loadRequests = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setRequests(await api.professionalRequests(token, "pending"));
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.requests.errorTitle"), error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [token])
  );

  const respond = (request, action) => {
    const isApprove = action === "approve";
    Alert.alert(
      isApprove ? t("admin.requests.approveTitle") : t("admin.requests.rejectTitle"),
      isApprove
        ? t("admin.requests.approveMsg", { name: request.name })
        : t("admin.requests.rejectMsg", { name: request.name }),
      [
        { text: t("admin.requests.cancel"), style: "cancel" },
        {
          text: isApprove ? t("admin.requests.approve") : t("admin.requests.reject"),
          style: isApprove ? "default" : "destructive",
          onPress: async () => {
            try {
              setActioningId(request._id);
              if (isApprove) {
                await api.approveProfessional(token, request._id);
              } else {
                await api.rejectProfessional(token, request._id);
              }
              await loadRequests();
            } catch (error) {
              Alert.alert(
                isApprove ? t("admin.requests.approveFailed") : t("admin.requests.rejectFailed"),
                error.message
              );
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
          eyebrow={t("admin.requests.eyebrow")}
          title={t("admin.requests.title")}
        />
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="shield-check"
              title={t("admin.requests.empty")}
              body={t("admin.requests.emptyBody")}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={styles.codePill}>
                  <Text style={styles.codeText}>{item.approvalCode}</Text>
                </View>
              </View>
              <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
              <Text style={styles.date}>
                {t("admin.requests.requestedOn", {
                  date: new Date(item.createdAt).toLocaleDateString(),
                })}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, styles.approveButton]}
                  disabled={actioningId === item._id}
                  onPress={() => respond(item, "approve")}
                >
                  <AppIcon name="checkmark-circle" size={16} color={Colors.surface} />
                  <Text style={styles.approveText}>{t("admin.requests.approve")}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.rejectButton]}
                  disabled={actioningId === item._id}
                  onPress={() => respond(item, "reject")}
                >
                  <AppIcon name="close-circle" size={16} color={Colors.danger} />
                  <Text style={styles.rejectText}>{t("admin.requests.reject")}</Text>
                </Pressable>
              </View>
            </View>
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
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
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
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: "900",
  },
  codePill: {
    backgroundColor: Colors.secondaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codeText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  email: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  date: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
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
  approveButton: {
    backgroundColor: Colors.primary,
  },
  approveText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: "900",
  },
  rejectButton: {
    backgroundColor: "#FCEAEA",
  },
  rejectText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: "900",
  },
});

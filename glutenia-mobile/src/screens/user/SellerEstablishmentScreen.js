import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import EmptyState from "../../components/EmptyState";
import { PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function SellerEstablishmentScreen({ navigation }) {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(false);

  const categoryLabels = {
    Supermarket: t("map.supermarket"),
    Restaurant: t("map.restaurant"),
    "Health Store": t("map.healthStore"),
    Bakery: t("map.bakery"),
    Pharmacy: t("map.pharmacy"),
    Other: t("admin.form.other"),
  };

  const load = async () => {
    if (!token) {
      return;
    }
    try {
      setLoading(true);
      setEstablishment(await api.myEstablishment(token));
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("seller.business.errorTitle"), error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [token])
  );

  const hasLocation =
    establishment?.coordinates?.latitude != null && establishment?.coordinates?.longitude != null;

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("seller.business.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        showsVerticalScrollIndicator={false}
      >
        {!establishment ? (
          <>
            <EmptyState
              icon="basket"
              title={t("seller.business.empty")}
              body={t("seller.business.emptyBody")}
            />
            <PrimaryButton
              title={t("seller.business.setup")}
              icon="add-circle"
              onPress={() => navigation.navigate("SellerEstablishmentForm")}
              style={styles.setupBtn}
            />
          </>
        ) : (
          <>
            {establishment.coverImageUrl ? (
              <Image source={{ uri: establishment.coverImageUrl }} style={styles.cover} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <AppIcon name="basket" size={48} color={Colors.secondary} />
              </View>
            )}

            <Text style={styles.name}>{establishment.name}</Text>
            <View style={styles.categoryRow}>
              <AppIcon name="cube" size={14} color={Colors.textMuted} />
              <Text style={styles.categoryText}>
                {categoryLabels[establishment.category] || establishment.category}
              </Text>
            </View>

            {establishment.verified ? (
              <View style={styles.verifiedBadge}>
                <AppIcon name="shield-check" size={16} color={Colors.primary} />
                <View>
                  <Text style={styles.verifiedTitle}>{t("seller.business.recommended")}</Text>
                  <Text style={styles.verifiedSub}>{t("seller.business.recommendedSub")}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <AppIcon name="clock" size={16} color={Colors.secondary} />
                <Text style={styles.pendingText}>{t("seller.business.pendingVerification")}</Text>
              </View>
            )}

            {establishment.description ? (
              <Text style={styles.description}>{establishment.description}</Text>
            ) : null}

            <View style={styles.infoCard}>
              {establishment.address ? (
                <View style={styles.infoRow}>
                  <AppIcon name="location" size={16} color={Colors.secondary} />
                  <Text style={styles.infoText}>{establishment.address}</Text>
                </View>
              ) : null}
              {establishment.hours ? (
                <View style={styles.infoRow}>
                  <AppIcon name="clock" size={16} color={Colors.secondary} />
                  <Text style={styles.infoText}>{establishment.hours}</Text>
                </View>
              ) : null}
              {establishment.phone ? (
                <View style={styles.infoRow}>
                  <AppIcon name="phone" size={16} color={Colors.secondary} />
                  <Text style={styles.infoText}>{establishment.phone}</Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <AppIcon
                  name="map-pin"
                  size={16}
                  color={hasLocation ? Colors.primary : Colors.warning}
                />
                <Text
                  style={[styles.infoText, !hasLocation && { color: Colors.warning }]}
                >
                  {hasLocation ? t("seller.business.onMap") : t("seller.business.noMapLocation")}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionCard}
                onPress={() => navigation.navigate("SellerEstablishmentForm")}
              >
                <AppIcon name="pencil" size={20} color={Colors.textDark} />
                <Text style={styles.actionLabel}>{t("seller.business.editInfo")}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionCard, styles.actionCardPrimary]}
                onPress={() => navigation.navigate("SellerProductForm")}
              >
                <AppIcon name="add-circle" size={20} color={Colors.surface} />
                <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>
                  {t("seller.business.addProduct")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionCard}
                onPress={() => navigation.navigate("SellerVisibility")}
              >
                <AppIcon name="grid" size={20} color={Colors.textDark} />
                <Text style={styles.actionLabel}>{t("seller.business.dashboard")}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark,
  },
  headerSpacer: { width: 30 },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 48,
  },
  setupBtn: {
    marginTop: Spacing.sm,
  },
  cover: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: Radius.lg,
    backgroundColor: Colors.secondaryPale,
  },
  coverPlaceholder: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: Radius.lg,
    backgroundColor: Colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.textDark,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  verifiedTitle: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: "800",
  },
  verifiedSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.secondaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  pendingText: {
    flex: 1,
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: "600",
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 12,
    ...Shadow,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...Shadow,
  },
  actionCardPrimary: {
    backgroundColor: Colors.primary,
  },
  actionLabel: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  actionLabelPrimary: {
    color: Colors.surface,
  },
});

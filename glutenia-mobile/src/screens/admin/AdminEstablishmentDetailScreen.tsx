import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { RouteProp } from "@react-navigation/native";
import Screen from "../../components/Screen";
import AppIcon, { type IconName } from "../../components/AppIcon";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuthenticated } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { AppNavigation, RootParamList } from "../../navigation/types";
import type { EstablishmentOwnerSummary } from "../../types/models";

interface AdminEstablishmentDetailScreenProps {
  navigation: AppNavigation;
  route: RouteProp<RootParamList, "AdminEstablishmentDetail">;
}

export default function AdminEstablishmentDetailScreen({
  navigation,
  route,
}: AdminEstablishmentDetailScreenProps) {
  const { establishment } = route.params;
  const { token } = useAuthenticated();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const owner = establishment.owner as EstablishmentOwnerSummary;
  const notSet = t("admin.establishments.notSet");
  const { latitude, longitude } = establishment.coordinates || { latitude: null, longitude: null };
  const hasLocation = latitude != null && longitude != null;

  const handleVerify = async () => {
    try {
      setVerifying(true);
      await api.verifyEstablishment(token, establishment._id);
      navigation.goBack();
    } catch (err) {
      Alert.alert(t("admin.establishments.verifyFailed"), (err as ApiError).message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = () => {
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
              setDeleting(true);
              await api.deleteEstablishment(token, establishment._id);
              navigation.goBack();
            } catch (err) {
              Alert.alert(t("admin.establishments.deleteFailed"), (err as ApiError).message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const openInMaps = () => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
  };

  const InfoRow = ({ icon, label, value }: { icon: IconName; label: string; value?: string | null }) => (
    <View style={styles.infoRow}>
      <AppIcon name={icon} size={16} color={colors.secondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || notSet}</Text>
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("admin.establishments.detailTitle")}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {establishment.coverImageUrl ? (
          <Image source={{ uri: establishment.coverImageUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <AppIcon name="image" size={36} color={colors.primary} />
          </View>
        )}

        <View style={styles.titleSection}>
          <Text style={styles.name}>{establishment.name}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{t("admin.establishments.pending")}</Text>
          </View>
          <Text style={styles.submitted}>
            {t("admin.establishments.submittedOn", {
              date: new Date(establishment.createdAt).toLocaleDateString(),
            })}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>{t("admin.establishments.business")}</Text>
        <View style={styles.card}>
          <InfoRow icon="grid" label={t("admin.establishments.category")} value={establishment.category} />
          <InfoRow icon="location" label={t("admin.establishments.address")} value={establishment.address} />
          <InfoRow icon="phone" label={t("admin.establishments.phone")} value={establishment.phone} />
          <InfoRow icon="clock" label={t("admin.establishments.hours")} value={establishment.hours} />
          <InfoRow
            icon="map-pin"
            label={t("admin.establishments.location")}
            value={hasLocation ? `${latitude!.toFixed(5)}, ${longitude!.toFixed(5)}` : null}
          />
          {hasLocation ? (
            <TouchableOpacity style={styles.mapsLink} onPress={openInMaps} activeOpacity={0.7}>
              <AppIcon name="navigation" size={14} color={colors.primary} />
              <Text style={styles.mapsLinkText}>{t("admin.establishments.openInMaps")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>{t("admin.establishments.description")}</Text>
        <View style={styles.card}>
          <Text style={establishment.description ? styles.description : styles.muted}>
            {establishment.description || notSet}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>{t("admin.establishments.owner")}</Text>
        <View style={styles.card}>
          <InfoRow icon="person" label={t("admin.establishments.ownerName")} value={owner?.name} />
          <InfoRow icon="info" label={t("admin.establishments.ownerEmail")} value={owner?.email} />
          <InfoRow icon="phone" label={t("admin.establishments.ownerPhone")} value={owner?.phone} />
        </View>

        <PrimaryButton
          title={t("admin.establishments.verify")}
          icon="checkmark-circle"
          loading={verifying}
          disabled={deleting}
          onPress={handleVerify}
        />
        <SecondaryButton
          title={t("admin.establishments.delete")}
          icon="trash"
          disabled={verifying || deleting}
          onPress={handleDelete}
        />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 30, padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
  },
  headerSpacer: { width: 30 },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 48,
  },
  cover: {
    width: "100%",
    height: 180,
    borderRadius: Radius.lg,
  },
  coverPlaceholder: {
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: { alignItems: "center", gap: 6 },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
  },
  statusPill: {
    backgroundColor: colors.secondaryPale,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { color: colors.secondary, fontSize: 12, fontWeight: "700" },
  submitted: { fontSize: 13, color: colors.textMuted },
  sectionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
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
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "600",
  },
  mapsLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
  },
  mapsLinkText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  description: { color: colors.textDark, fontSize: 14, lineHeight: 20 },
  muted: { color: colors.textMuted, fontSize: 14 },
});

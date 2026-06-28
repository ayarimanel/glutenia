import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import LanguageSelector from "../../components/LanguageSelector";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function SettingRow({ icon, label, onPress, right, isFirst, isLast }) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>
          <AppIcon name={icon} size={18} color={Colors.secondary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {right}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { t } = useTranslation();

  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [langVisible, setLangVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("settings.logout"), t("settings.logoutMsg"), [
      { text: t("settings.cancel"), style: "cancel" },
      { text: t("settings.logout"), style: "destructive", onPress: logout },
    ]);
  };

  const comingSoon = (feature) => {
    Alert.alert(t("settings.comingSoon"), t("settings.comingSoonMsg", { feature }));
  };

  return (
    <Screen>
      <LanguageSelector visible={langVisible} onClose={() => setLangVisible(false)} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── ACCOUNT ── */}
        <SectionLabel text={t("settings.account")} />
        <View style={styles.card}>
          <SettingRow
            icon="person"
            label={t("settings.editProfile")}
            isFirst
            onPress={() => comingSoon(t("settings.editProfile"))}
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
          <Divider />
          <SettingRow
            icon="shield"
            label={t("settings.changePassword")}
            isLast
            onPress={() => comingSoon(t("settings.changePassword"))}
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
        </View>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel text={t("settings.notifications")} />
        <View style={styles.card}>
          <SettingRow
            icon="bell"
            label={t("settings.pushNotifs")}
            isFirst
            right={
              <Switch
                value={pushNotifs}
                onValueChange={setPushNotifs}
                trackColor={{ false: Colors.divider, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="info"
            label={t("settings.emailUpdates")}
            isLast
            right={
              <Switch
                value={emailUpdates}
                onValueChange={setEmailUpdates}
                trackColor={{ false: Colors.divider, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            }
          />
        </View>

        {/* ── APPEARANCE ── */}
        <SectionLabel text={t("settings.appearance")} />
        <View style={styles.card}>
          <SettingRow
            icon="settings"
            label={t("settings.darkMode")}
            isFirst
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.divider, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="info"
            label={t("settings.textSize")}
            isLast
            onPress={() => comingSoon(t("settings.textSize"))}
            right={
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>{t("settings.textSizeMedium")}</Text>
                <AppIcon name="chevron-right" size={18} color={Colors.textMuted} />
              </View>
            }
          />
        </View>

        {/* ── SUPPORT ── */}
        <SectionLabel text={t("settings.support")} />
        <View style={styles.card}>
          <SettingRow
            icon="compass"
            label={t("settings.language")}
            isFirst
            onPress={() => setLangVisible(true)}
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
          <Divider />
          <SettingRow
            icon="activity"
            label={t("settings.reportBug")}
            isLast
            onPress={() =>
              Alert.alert(t("settings.reportBug"), t("settings.reportBugMsg"), [
                { text: t("settings.ok") },
              ])
            }
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
        </View>

        {/* ── Log out ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <View style={styles.logoutIconWrap}>
            <AppIcon name="log-out" size={20} color="#fff" />
          </View>
          <Text style={styles.logoutText}>{t("settings.logout")}</Text>
          <AppIcon name="chevron-right" size={18} color="#fff" style={styles.logoutChevron} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
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
    backgroundColor: Colors.background,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark,
  },
  headerSpacer: {
    width: 30,
  },

  scroll: {
    paddingHorizontal: Spacing.md,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textDark,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
  },
  rowFirst: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  rowLast: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textDark,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 66,
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  valueText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    gap: 14,
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  logoutChevron: {
    marginLeft: "auto",
  },
});

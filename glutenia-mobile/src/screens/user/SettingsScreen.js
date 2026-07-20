import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from "react-native";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import LanguageSelector from "../../components/LanguageSelector";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../api/client";
import { Radius, Spacing } from "../../theme/colors";

function SectionLabel({ text, colors }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "800",
        color: colors.textDark,
        letterSpacing: 0.8,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
      }}
    >
      {text}
    </Text>
  );
}

function SettingRow({ icon, label, onPress, right, isFirst, isLast, colors }) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.md,
        paddingVertical: 16,
        backgroundColor: colors.surface,
        ...(isFirst && { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg }),
        ...(isLast && { borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg }),
      }}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.secondaryPale,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name={icon} size={18} color={colors.secondary} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.textDark }}>
          {label}
        </Text>
      </View>
      {right}
    </TouchableOpacity>
  );
}

function Divider({ colors }) {
  return (
    <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 66 }} />
  );
}

export default function SettingsScreen({ navigation }) {
  const { logout, user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  const { isDark, toggleTheme, colors } = useTheme();

  const [pushNotifs, setPushNotifs] = useState(user?.pushNotificationsEnabled ?? true);
  const [savingPushNotifs, setSavingPushNotifs] = useState(false);
  const [notifyOrders, setNotifyOrders] = useState(user?.notifyOrders ?? true);
  const [savingNotifyOrders, setSavingNotifyOrders] = useState(false);
  const [notifyEvents, setNotifyEvents] = useState(user?.notifyEvents ?? true);
  const [savingNotifyEvents, setSavingNotifyEvents] = useState(false);
  const [langVisible, setLangVisible] = useState(false);

  const togglePushNotifs = async (value) => {
    setPushNotifs(value);
    setSavingPushNotifs(true);
    try {
      const updated = await api.updateProfile(token, { pushNotificationsEnabled: value });
      await updateUser(updated);
    } catch (error) {
      setPushNotifs(!value);
    } finally {
      setSavingPushNotifs(false);
    }
  };

  const toggleNotifyOrders = async (value) => {
    setNotifyOrders(value);
    setSavingNotifyOrders(true);
    try {
      const updated = await api.updateProfile(token, { notifyOrders: value });
      await updateUser(updated);
    } catch (error) {
      setNotifyOrders(!value);
    } finally {
      setSavingNotifyOrders(false);
    }
  };

  const toggleNotifyEvents = async (value) => {
    setNotifyEvents(value);
    setSavingNotifyEvents(true);
    try {
      const updated = await api.updateProfile(token, { notifyEvents: value });
      await updateUser(updated);
    } catch (error) {
      setNotifyEvents(!value);
    } finally {
      setSavingNotifyEvents(false);
    }
  };

  const handleToggleTheme = async () => {
    const nextIsDark = !isDark;
    await toggleTheme();
    if (token) {
      api
        .updateProfile(token, { theme_preference: nextIsDark ? "dark" : "light" })
        .then(updateUser)
        .catch(() => {});
    }
  };

  const handleLanguageSelect = (code) => {
    if (token) {
      api.updateProfile(token, { language: code }).then(updateUser).catch(() => {});
    }
  };

  const handleLogout = () => {
    Alert.alert(t("settings.logout"), t("settings.logoutMsg"), [
      { text: t("settings.cancel"), style: "cancel" },
      { text: t("settings.logout"), style: "destructive", onPress: logout },
    ]);
  };

  const comingSoon = (feature) => {
    Alert.alert(t("settings.comingSoon"), t("settings.comingSoonMsg", { feature }));
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const reportBug = () => {
    const subject = encodeURIComponent(`Glutenia bug report (v${appVersion})`);
    Linking.openURL(`mailto:support@glutenia.tn?subject=${subject}`).catch(() => {
      Alert.alert(t("settings.reportBug"), t("settings.reportBugMsg"), [
        { text: t("settings.ok") },
      ]);
    });
  };

  return (
    <Screen>
      <LanguageSelector
        visible={langVisible}
        onClose={() => setLangVisible(false)}
        onSelect={handleLanguageSelect}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: Spacing.md,
          paddingVertical: 14,
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 4 }}
          activeOpacity={0.7}
        >
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
            color: colors.textDark,
          }}
        >
          {t("settings.title")}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}
      >
        {/* ACCOUNT */}
        <SectionLabel text={t("settings.account")} colors={colors} />
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, overflow: "hidden" }}>
          <SettingRow
            icon="person"
            label={t("settings.editProfile")}
            isFirst
            colors={colors}
            onPress={() => navigation.navigate("EditProfile")}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
          <Divider colors={colors} />
          <SettingRow
            icon="shield"
            label={t("settings.changePassword")}
            isLast={user?.role === "professional"}
            colors={colors}
            onPress={() => navigation.navigate("ChangePassword")}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
          {user?.role !== "professional" && (
            <>
              <Divider colors={colors} />
              <SettingRow
                icon="compass"
                label={t("settings.editJourney")}
                isLast
                colors={colors}
                onPress={() => navigation.navigate("EditJourney")}
                right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
              />
            </>
          )}
        </View>

        {/* NOTIFICATIONS */}
        <SectionLabel text={t("settings.notifications")} colors={colors} />
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, overflow: "hidden" }}>
          <SettingRow
            icon="bell"
            label={t("settings.pushNotifs")}
            isFirst
            colors={colors}
            right={
              <Switch
                value={pushNotifs}
                onValueChange={togglePushNotifs}
                disabled={savingPushNotifs}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor={colors.surface}
              />
            }
          />
          <Divider colors={colors} />
          <SettingRow
            icon="receipt"
            label={t("settings.notifyOrders")}
            colors={colors}
            right={
              <Switch
                value={notifyOrders}
                onValueChange={toggleNotifyOrders}
                disabled={!pushNotifs || savingNotifyOrders}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor={colors.surface}
              />
            }
          />
          <Divider colors={colors} />
          <SettingRow
            icon="calendar"
            label={t("settings.notifyEvents")}
            isLast
            colors={colors}
            right={
              <Switch
                value={notifyEvents}
                onValueChange={toggleNotifyEvents}
                disabled={!pushNotifs || savingNotifyEvents}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor={colors.surface}
              />
            }
          />
        </View>

        {/* APPEARANCE */}
        <SectionLabel text={t("settings.appearance")} colors={colors} />
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, overflow: "hidden" }}>
          <SettingRow
            icon="settings"
            label={t("settings.darkMode")}
            isFirst
            colors={colors}
            right={
              <Switch
                value={isDark}
                onValueChange={handleToggleTheme}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor={colors.surface}
              />
            }
          />
          <Divider colors={colors} />
          <SettingRow
            icon="info"
            label={t("settings.textSize")}
            isLast
            colors={colors}
            onPress={() => comingSoon(t("settings.textSize"))}
            right={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: "500" }}>
                  {t("settings.textSizeMedium")}
                </Text>
                <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
              </View>
            }
          />
        </View>

        {/* SUPPORT */}
        <SectionLabel text={t("settings.support")} colors={colors} />
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, overflow: "hidden" }}>
          <SettingRow
            icon="compass"
            label={t("settings.language")}
            isFirst
            colors={colors}
            onPress={() => setLangVisible(true)}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
          <Divider colors={colors} />
          <SettingRow
            icon="activity"
            label={t("settings.reportBug")}
            isLast
            colors={colors}
            onPress={reportBug}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
        </View>

        {/* ABOUT */}
        <SectionLabel text={t("settings.about")} colors={colors} />
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, overflow: "hidden" }}>
          <SettingRow
            icon="info"
            label={t("settings.version")}
            isFirst
            colors={colors}
            right={
              <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: "500" }}>
                {appVersion}
              </Text>
            }
          />
          <Divider colors={colors} />
          <SettingRow
            icon="list"
            label={t("settings.terms")}
            colors={colors}
            onPress={() => navigation.navigate("Legal", { section: "terms" })}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
          <Divider colors={colors} />
          <SettingRow
            icon="shield-check"
            label={t("settings.privacyPolicy")}
            isLast
            colors={colors}
            onPress={() => navigation.navigate("Legal", { section: "privacy" })}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
        </View>

        {/* DELETE ACCOUNT */}
        <TouchableOpacity
          style={{
            alignItems: "center",
            paddingVertical: Spacing.md,
            marginTop: Spacing.lg,
          }}
          onPress={() => navigation.navigate("DeleteAccount")}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.danger }}>
            {t("settings.deleteAccount")}
          </Text>
        </TouchableOpacity>

        {/* LOG OUT */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.primary,
            borderRadius: Radius.lg,
            paddingVertical: 18,
            paddingHorizontal: Spacing.md,
            marginTop: Spacing.xl,
            gap: 14,
          }}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="log-out" size={20} color="#fff" />
          </View>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: "#fff" }}>
            {t("settings.logout")}
          </Text>
          <AppIcon name="chevron-right" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

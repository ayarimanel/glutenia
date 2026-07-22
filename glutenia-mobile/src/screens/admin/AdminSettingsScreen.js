import { useState } from "react";
import {
  View,
  Text,
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
import { useTheme } from "../../context/ThemeContext";
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
  return <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 66 }} />;
}

export default function AdminSettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const { isDark, toggleTheme, colors } = useTheme();
  const [langVisible, setLangVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("settings.logout"), t("settings.logoutMsg"), [
      { text: t("settings.cancel"), style: "cancel" },
      { text: t("settings.logout"), style: "destructive", onPress: logout },
    ]);
  };

  return (
    <Screen>
      <LanguageSelector visible={langVisible} onClose={() => setLangVisible(false)} />

      {/* Header */}
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
        {/* MANAGEMENT */}
        <SectionLabel text={t("settings.management")} colors={colors} />
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, overflow: "hidden" }}>
          <SettingRow
            icon="utensils"
            label={t("settings.manageRecipes")}
            isFirst
            colors={colors}
            onPress={() => navigation.navigate("AdminRecipes")}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
          <Divider colors={colors} />
          <SettingRow
            icon="heart"
            label={t("settings.managePatientResources")}
            isLast
            colors={colors}
            onPress={() => navigation.navigate("AdminPatientResources")}
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
        </View>

        {/* APPEARANCE */}
        <SectionLabel text={t("settings.appearance")} colors={colors} />
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, overflow: "hidden" }}>
          <SettingRow
            icon="settings"
            label={t("settings.darkMode")}
            isFirst
            isLast
            colors={colors}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor={colors.surface}
              />
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
            onPress={() =>
              Alert.alert(t("settings.reportBug"), t("settings.reportBugMsg"), [
                { text: t("settings.ok") },
              ])
            }
            right={<AppIcon name="chevron-right" size={18} color={colors.textMuted} />}
          />
        </View>

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

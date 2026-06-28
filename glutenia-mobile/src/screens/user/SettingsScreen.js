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
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
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

  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  const comingSoon = (feature) => {
    Alert.alert("Coming Soon", `${feature} will be available in a future update.`);
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── ACCOUNT ── */}
        <SectionLabel text="ACCOUNT" />
        <View style={styles.card}>
          <SettingRow
            icon="person"
            label="Edit Profile"
            isFirst
            onPress={() => comingSoon("Edit Profile")}
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
          <Divider />
          <SettingRow
            icon="shield"
            label="Change Password"
            isLast
            onPress={() => comingSoon("Change Password")}
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
        </View>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel text="NOTIFICATIONS" />
        <View style={styles.card}>
          <SettingRow
            icon="bell"
            label="Push Notifications"
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
            label="Email Updates"
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
        <SectionLabel text="APPEARANCE" />
        <View style={styles.card}>
          <SettingRow
            icon="settings"
            label="Dark Mode"
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
            label="Text Size"
            isLast
            onPress={() => comingSoon("Text Size")}
            right={
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>Medium</Text>
                <AppIcon name="chevron-right" size={18} color={Colors.textMuted} />
              </View>
            }
          />
        </View>

        {/* ── SUPPORT ── */}
        <SectionLabel text="SUPPORT" />
        <View style={styles.card}>
          <SettingRow
            icon="compass"
            label="Language"
            isFirst
            onPress={() => comingSoon("Language")}
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
          <Divider />
          <SettingRow
            icon="activity"
            label="Report a Bug"
            isLast
            onPress={() =>
              Alert.alert(
                "Report a Bug",
                "Please email us at support@glutenia.tn with a description of the issue.",
                [{ text: "OK" }]
              )
            }
            right={<AppIcon name="chevron-right" size={18} color={Colors.textMuted} />}
          />
        </View>

        {/* ── Log out ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <View style={styles.logoutIconWrap}>
            <AppIcon name="log-out" size={20} color="#fff" />
          </View>
          <Text style={styles.logoutText}>Log out</Text>
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

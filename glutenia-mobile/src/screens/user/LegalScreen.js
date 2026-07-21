import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function LegalScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [section, setSection] = useState(route.params?.section === "terms" ? "terms" : "privacy");

  const sections = t(`legal.${section}.sections`, { returnObjects: true });

  return (
    <Screen>
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={styles.navTitle}>{t("legal.title")}</Text>
        <View style={styles.navSpacer} />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, section === "privacy" && styles.tabActive]}
          onPress={() => setSection("privacy")}
        >
          <Text style={[styles.tabText, section === "privacy" && styles.tabTextActive]}>
            {t("legal.privacyTab")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, section === "terms" && styles.tabActive]}
          onPress={() => setSection("terms")}
        >
          <Text style={[styles.tabText, section === "terms" && styles.tabTextActive]}>
            {t("legal.termsTab")}
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>{t(`legal.${section}.updated`)}</Text>

        {Array.isArray(sections) &&
          sections.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.heading}>{item.heading}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
  },
  navSpacer: { width: 40 },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.md,
    ...Shadow,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: "#fff",
  },

  scroll: {
    paddingHorizontal: Spacing.md,
  },

  updated: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },

  card: {
    marginBottom: Spacing.md,
  },
  heading: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
});

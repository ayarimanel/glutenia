import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AppHeader from "../../components/AppHeader";
import AppIcon from "../../components/AppIcon";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { notifyGamification } from "../../context/GamificationContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const TAB_BAR_HEIGHT = 66;
const IDLE = "idle";
const LOADING = "loading";
const RESULT = "result";

export default function LabelScanScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [screenState, setScreenState] = useState(IDLE);
  const [result, setResult] = useState(null);

  const bottomPad = insets.bottom + TAB_BAR_HEIGHT + Spacing.lg;

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("labelScan.permissionTitle"), t("labelScan.permissionBody"));
        return;
      }

      const picked = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });
      if (picked.canceled) return;

      setScreenState(LOADING);

      const compressed = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const { gamification, ...data } = await api.scanLabel(compressed.base64, token);
      setResult(data);
      setScreenState(RESULT);
      notifyGamification(gamification);
    } catch (err) {
      setScreenState(IDLE);
      Alert.alert(t("labelScan.error"), err.message ?? String(err));
    }
  };

  const reset = () => {
    setResult(null);
    setScreenState(IDLE);
  };

  const VERDICT_COLOR = {
    safe: colors.primary,
    caution: colors.warning,
    unsafe: colors.danger,
    error: colors.textMuted,
  };

  const VERDICT_ICON = {
    safe: "checkmark-circle",
    caution: "info",
    unsafe: "close-circle",
    error: "close-circle",
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (screenState === LOADING) {
    return (
      <View style={styles.root}>
        <AppHeader userName={user?.name ?? ""} safeTop />
        <View style={[styles.center, { paddingBottom: bottomPad }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.headingText}>{t("labelScan.analyzing")}</Text>
          <Text style={styles.bodyText}>{t("labelScan.analyzingHint")}</Text>
        </View>
      </View>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────
  if (screenState === RESULT && result) {
    const color = VERDICT_COLOR[result.verdict] ?? colors.textMuted;
    const icon = VERDICT_ICON[result.verdict] ?? "info";

    const titleKey = {
      safe: "labelScan.safe",
      caution: "labelScan.caution",
      unsafe: "labelScan.unsafe",
      error: "labelScan.error",
    }[result.verdict] ?? "labelScan.error";

    const bodyKey = {
      safe: "labelScan.safeBody",
      caution: "labelScan.cautionBody",
      unsafe: "labelScan.unsafeBody",
      error: null,
    }[result.verdict];

    return (
      <View style={styles.root}>
        <AppHeader userName={user?.name ?? ""} safeTop />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Verdict card */}
          <View style={[styles.verdictCard, { borderColor: color }]}>
            <AppIcon name={icon} size={52} color={color} />
            <Text style={[styles.verdictTitle, { color }]}>{t(titleKey)}</Text>
            <Text style={styles.bodyText}>
              {bodyKey ? t(bodyKey) : result.error}
            </Text>
            {result.confidence === "low" && (
              <View style={styles.lowConfidenceBanner}>
                <AppIcon name="info" size={14} color={colors.warning} />
                <Text style={styles.lowConfidenceText}>
                  {t("labelScan.lowConfidence")}
                </Text>
              </View>
            )}
          </View>

          {/* Flagged ingredients */}
          {result.flagged?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("labelScan.flaggedTitle")}</Text>
              {result.flagged.map((item, i) => (
                <View key={i} style={styles.flaggedItem}>
                  <AppIcon name="close-circle" size={16} color={colors.danger} />
                  <View style={styles.flaggedBody}>
                    <Text style={styles.flaggedIngredient}>{item.ingredient}</Text>
                    <Text style={styles.flaggedReason}>{item.reason}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Safe highlights */}
          {result.verdict === "safe" && result.safe_highlights?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("labelScan.safeHighlightsTitle")}</Text>
              <View style={styles.safeRow}>
                {result.safe_highlights.map((item, i) => (
                  <View key={i} style={styles.safeChip}>
                    <AppIcon name="checkmark" size={12} color={colors.primary} />
                    <Text style={styles.safeChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Extracted text */}
          {!!result.raw_text && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("labelScan.rawTextTitle")}</Text>
              <View style={styles.rawTextBox}>
                <Text style={styles.rawText}>{result.raw_text}</Text>
              </View>
            </View>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>{t("labelScan.disclaimer")}</Text>

          <Pressable style={styles.primaryBtn} onPress={handleTakePhoto}>
            <AppIcon name="scan" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{t("labelScan.scanAnother")}</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.secondaryBtnText}>{t("labelScan.retake")}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── IDLE ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AppHeader userName={user?.name ?? ""} safeTop />
      <View style={[styles.center, { paddingBottom: bottomPad }]}>
        <View style={styles.iconCircle}>
          <AppIcon name="scan" size={48} color={colors.primary} />
        </View>
        <Text style={styles.headingText}>{t("labelScan.title")}</Text>
        <Text style={styles.subtitle}>{t("labelScan.subtitle")}</Text>
        <Text style={styles.bodyText}>{t("labelScan.instructions")}</Text>
        <View style={styles.tipBox}>
          <AppIcon name="info" size={15} color={colors.warning} />
          <Text style={styles.tipText}>{t("labelScan.tip")}</Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={handleTakePhoto}>
          <AppIcon name="image" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>{t("labelScan.takePhoto")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  headingText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textDark,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondary,
    textAlign: "center",
  },
  bodyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FEF3C7",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: "stretch",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignSelf: "stretch",
    marginTop: Spacing.sm,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    alignSelf: "stretch",
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  verdictCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 2,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow,
  },
  verdictTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  lowConfidenceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: Spacing.sm,
  },
  lowConfidenceText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textDark,
  },
  flaggedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  flaggedBody: {
    flex: 1,
    gap: 2,
  },
  flaggedIngredient: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.danger,
  },
  flaggedReason: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  safeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  safeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  safeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  rawTextBox: {
    backgroundColor: colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rawText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    fontStyle: "italic",
    paddingHorizontal: Spacing.md,
  },
});

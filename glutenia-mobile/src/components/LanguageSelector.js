import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Globe, Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Colors, Radius, Spacing, Shadow } from "../theme/colors";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇹🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function LanguageSelector({ visible: externalVisible, onClose, onSelect }) {
  const { t, i18n } = useTranslation();
  const [internalVisible, setInternalVisible] = useState(false);

  const controlled = externalVisible !== undefined;
  const visible = controlled ? externalVisible : internalVisible;
  const close = controlled ? onClose : () => setInternalVisible(false);

  return (
    <>
      {!controlled && (
        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setInternalVisible(true)}
          activeOpacity={0.8}
        >
          <Globe color={Colors.textDark} size={20} strokeWidth={2} />
        </TouchableOpacity>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={close}>
          {/* Inner Pressable stops tap-through so tapping the sheet doesn't close it */}
          <Pressable style={styles.sheet}>
            <Text style={styles.title}>{t("language.select")}</Text>

            {LANGUAGES.map((lang) => {
              const active = i18n.language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    i18n.changeLanguage(lang.code);
                    onSelect?.(lang.code);
                    close();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.label, active && styles.labelActive]}>
                    {lang.label}
                  </Text>
                  {active && (
                    <Check color={Colors.primary} size={18} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  sheet: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadow,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textDark,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  rowActive: {
    backgroundColor: Colors.primaryPale,
  },
  flag: {
    fontSize: 22,
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDark,
    fontWeight: "500",
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
});

import { View, Image, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "../theme/colors";

export default function SplashScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.logoCard}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.appName}>Glutenia</Text>
      <Text style={styles.tagline}>{t("splash.tagline")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCard: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 28,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
});

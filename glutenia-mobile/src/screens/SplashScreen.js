import { View, Image, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "../theme/colors";

export default function SplashScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
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
  logo: {
    width: 300,
    height: 120,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
});

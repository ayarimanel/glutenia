import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const LOGO_ASPECT_RATIO = 958 / 378;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LOGO_WIDTH = Math.min(SCREEN_WIDTH * 0.96, 640);

export default function SplashScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
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

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH / LOGO_ASPECT_RATIO,
    marginBottom: 24,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
});

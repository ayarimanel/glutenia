import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "../theme/colors";

const LOGO_ASPECT_RATIO = 1043 / 459;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LOGO_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 460);

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
    width: LOGO_WIDTH,
    height: LOGO_WIDTH / LOGO_ASPECT_RATIO,
    marginBottom: 24,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
});

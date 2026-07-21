import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import AppIcon from "../../components/AppIcon";
import Screen from "../../components/Screen";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function OrderSuccessScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const order = route.params?.order;
  const shortId = order?._id?.slice(-6)?.toUpperCase() || "DONE";

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AppIcon name="checkmark" size={54} color={colors.surface} />
          </View>
          <Text style={styles.title}>{t("orderSuccess.title")}</Text>
          <Text style={styles.body}>{t("orderSuccess.body")}</Text>
          <View style={styles.idPill}>
            <Text style={styles.idText}>{`${t("orderSuccess.orderPrefix")}${shortId}`}</Text>
          </View>
          <PrimaryButton
            title={t("orderSuccess.continueShopping")}
            icon="basket"
            onPress={() => navigation.popToTop()}
          />
          <SecondaryButton
            title={t("orderSuccess.viewOrders")}
            icon="receipt"
            onPress={() => navigation.navigate("UserTabs", { screen: "Orders" })}
          />
        </View>
      </View>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.md,
  },
  card: {
    alignItems: "center",
    borderRadius: Radius.xl,
    backgroundColor: colors.surface,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.textDark,
    fontSize: 30,
    fontWeight: "900",
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
  },
  idPill: {
    borderRadius: Radius.pill,
    backgroundColor: colors.secondaryPale,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  idText: {
    color: colors.secondary,
    fontWeight: "900",
  },
});

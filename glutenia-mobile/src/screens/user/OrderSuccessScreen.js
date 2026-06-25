import { StyleSheet, Text, View } from "react-native";
import AppIcon from "../../components/AppIcon";
import Screen from "../../components/Screen";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function OrderSuccessScreen({ navigation, route }) {
  const order = route.params?.order;
  const shortId = order?._id?.slice(-6)?.toUpperCase() || "DONE";

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AppIcon name="checkmark" size={54} color={Colors.surface} />
          </View>
          <Text style={styles.title}>Order placed</Text>
          <Text style={styles.body}>Your Glutenia order is confirmed.</Text>
          <View style={styles.idPill}>
            <Text style={styles.idText}>Order #{shortId}</Text>
          </View>
          <PrimaryButton
            title="Continue shopping"
            icon="basket"
            onPress={() => navigation.popToTop()}
          />
          <SecondaryButton
            title="View orders"
            icon="receipt"
            onPress={() => navigation.navigate("UserTabs", { screen: "Orders" })}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.md,
  },
  card: {
    alignItems: "center",
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.textDark,
    fontSize: 30,
    fontWeight: "900",
  },
  body: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  idPill: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.secondaryPale,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  idText: {
    color: Colors.secondary,
    fontWeight: "900",
  },
});

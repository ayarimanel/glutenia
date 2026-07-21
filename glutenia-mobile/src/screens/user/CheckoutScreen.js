import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import Field from "../../components/Field";
import { IconButton, PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../api/client";
import { notifyGamification } from "../../context/GamificationContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const DELIVERY_FEE = 7;

export default function CheckoutScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token, user, updateUser } = useAuth();
  const { items, total, clearCart } = useCart();
  const [fullName, setFullName] = useState(user?.name || "");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  const grandTotal = total + DELIVERY_FEE;

  const placeOrder = async () => {
    if (!items.length) {
      Alert.alert(t("checkout.title"), t("checkout.emptyCart"));
      return;
    }
    if (!fullName || !addressLine || !city || !phone) {
      Alert.alert(t("checkout.title"), t("checkout.completeDelivery"));
      return;
    }

    try {
      setLoading(true);
      const trimmedPhone = phone.trim();
      const order = await api.createOrder(token, {
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        address: { fullName, addressLine, city, phone: trimmedPhone },
      });

      if (trimmedPhone !== (user?.phone || "")) {
        try {
          const updated = await api.updateProfile(token, { phone: trimmedPhone });
          await updateUser(updated);
        } catch (_) {}
      }

      clearCart();
      notifyGamification(order.gamification);
      navigation.replace("OrderSuccess", { order });
    } catch (error) {
      Alert.alert(t("checkout.failed"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <SectionHeader
            eyebrow={t("checkout.confirm")}
            title={t("checkout.title")}
            right={<IconButton icon="close" onPress={() => navigation.goBack()} />}
          />
          <View style={styles.summary}>
            {items.map((item) => (
              <View key={item.productId} style={styles.line}>
                <Text style={styles.lineName} numberOfLines={1}>
                  {item.qty} x {item.name}
                </Text>
                <Text style={styles.linePrice}>
                  {(item.qty * item.price).toFixed(2)} TND
                </Text>
              </View>
            ))}
            <View style={styles.line}>
              <Text style={styles.lineName}>{t("checkout.subtotal")}</Text>
              <Text style={styles.linePrice}>{total.toFixed(2)} TND</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineName}>{t("checkout.deliveryFee")}</Text>
              <Text style={styles.linePrice}>{DELIVERY_FEE.toFixed(2)} TND</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t("checkout.total")}</Text>
              <Text style={styles.total}>{grandTotal.toFixed(2)} TND</Text>
            </View>
          </View>
          <Field label={t("checkout.fullName")} value={fullName} onChangeText={setFullName} />
          <Field label={t("checkout.address")} value={addressLine} onChangeText={setAddressLine} />
          <Field label={t("checkout.city")} value={city} onChangeText={setCity} />
          <Field label={t("checkout.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <PrimaryButton
            title={t("checkout.placeOrder")}
            icon="checkmark-circle"
            loading={loading}
            onPress={placeOrder}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  summary: {
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: Spacing.md,
    gap: 12,
    ...Shadow,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lineName: {
    flex: 1,
    color: colors.textMuted,
    fontWeight: "700",
  },
  linePrice: {
    color: colors.textDark,
    fontWeight: "900",
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.textDark,
    fontWeight: "900",
  },
  total: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
});

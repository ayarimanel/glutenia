import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import Field from "../../components/Field";
import { IconButton, PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function CheckoutScreen({ navigation }) {
  const { token, user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [fullName, setFullName] = useState(user?.name || "");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    if (!items.length) {
      Alert.alert("Cart", "Your cart is empty.");
      return;
    }
    if (!fullName || !addressLine || !city || !phone) {
      Alert.alert("Delivery", "Complete the delivery details.");
      return;
    }

    try {
      setLoading(true);
      const order = await api.createOrder(token, {
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        address: { fullName, addressLine, city, phone },
      });
      clearCart();
      navigation.replace("OrderSuccess", { order });
    } catch (error) {
      Alert.alert("Checkout failed", error.message);
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
            eyebrow="Confirm"
            title="Checkout"
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
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{total.toFixed(2)} TND</Text>
            </View>
          </View>
          <Field label="Full name" value={fullName} onChangeText={setFullName} />
          <Field label="Address line" value={addressLine} onChangeText={setAddressLine} />
          <Field label="City" value={city} onChangeText={setCity} />
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <PrimaryButton
            title="Place order"
            icon="checkmark-circle"
            loading={loading}
            onPress={placeOrder}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  summary: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
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
    color: Colors.textMuted,
    fontWeight: "700",
  },
  linePrice: {
    color: Colors.textDark,
    fontWeight: "900",
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: Colors.textDark,
    fontWeight: "900",
  },
  total: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
});

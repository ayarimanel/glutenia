import { Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function QuantityStepper({ value, onChange, min = 1, max }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const atMax = typeof max === "number" && value >= max;
  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.button}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <AppIcon name="remove" size={18} color={colors.textDark} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        style={[styles.button, atMax && styles.buttonDisabled]}
        disabled={atMax}
        onPress={() => onChange(typeof max === "number" ? Math.min(max, value + 1) : value + 1)}
      >
        <AppIcon name="add" size={18} color={atMax ? colors.textMuted : colors.textDark} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  stepper: {
    width: 116,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radius.pill,
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 6,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  value: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "900",
  },
});

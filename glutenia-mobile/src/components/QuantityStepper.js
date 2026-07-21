import { Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function QuantityStepper({ value, onChange, min = 1 }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.button}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <AppIcon name="remove" size={18} color={colors.textDark} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable style={styles.button} onPress={() => onChange(value + 1)}>
        <AppIcon name="add" size={18} color={colors.textDark} />
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
  value: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "900",
  },
});

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export function PrimaryButton({ title, icon, loading, disabled, onPress, style }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <AppIcon name={icon} size={18} color={colors.surface} /> : null}
          <Text style={styles.primaryText}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ title, icon, disabled, onPress, style }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon ? <AppIcon name={icon} size={18} color={colors.secondary} /> : null}
        <Text style={styles.secondaryText}>{title}</Text>
      </View>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color, style }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.icon, pressed && styles.pressed, style]}
    >
      <AppIcon name={icon} size={20} color={color ?? colors.textDark} />
    </Pressable>
  );
}

const getStyles = (colors) => StyleSheet.create({
  primary: {
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondary: {
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.58,
  },
});

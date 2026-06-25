import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Colors, Radius } from "../theme/colors";

export function PrimaryButton({ title, icon, loading, disabled, onPress, style }) {
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
        <ActivityIndicator color={Colors.surface} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <AppIcon name={icon} size={18} color={Colors.surface} /> : null}
          <Text style={styles.primaryText}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ title, icon, disabled, onPress, style }) {
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
        {icon ? <AppIcon name={icon} size={18} color={Colors.secondary} /> : null}
        <Text style={styles.secondaryText}>{title}</Text>
      </View>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color = Colors.textDark, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.icon, pressed && styles.pressed, style]}
    >
      <AppIcon name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondary: {
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
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
    color: Colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryText: {
    color: Colors.secondary,
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

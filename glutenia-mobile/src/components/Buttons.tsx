import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import AppIcon, { type IconName } from "./AppIcon";
import { Radius } from "../theme/colors";
import { useTheme, type ThemeColors } from "../context/ThemeContext";

interface PrimaryButtonProps {
  title: string;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ title, icon, loading, disabled, onPress, style }: PrimaryButtonProps) {
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

interface SecondaryButtonProps {
  title: string;
  icon?: IconName;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SecondaryButton({ title, icon, disabled, onPress, style }: SecondaryButtonProps) {
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

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon, onPress, color, style }: IconButtonProps) {
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

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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

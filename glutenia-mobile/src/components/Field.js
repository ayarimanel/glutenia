import { StyleSheet, Text, TextInput, View } from "react-native";
import { Radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function Field({ label, error, hint, multiline, style, inputStyle, ...props }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          inputStyle,
        ]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    color: colors.textDark,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multiline: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: "#FFF7F6",
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

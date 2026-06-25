import { StyleSheet, Text, TextInput, View } from "react-native";
import { Colors, Radius } from "../theme/colors";

export default function Field({ label, error, multiline, style, inputStyle, ...props }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          inputStyle,
        ]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    color: Colors.textDark,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multiline: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: "#FFF7F6",
  },
  error: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});

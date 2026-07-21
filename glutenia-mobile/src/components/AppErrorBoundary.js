import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Radius, Spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { PrimaryButton } from "./Buttons";
import i18n from "../i18n";

// AppErrorBoundary must be a class component (getDerivedStateFromError has
// no hook equivalent), so it can't call useTheme() directly. Instead, a thin
// functional wrapper reads the theme via the hook and passes colors down as
// a prop to the class component that does the actual rendering.
class AppErrorBoundaryClass extends React.Component {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const styles = getStyles(this.props.colors);

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>{i18n.t("errorBoundary.title")}</Text>
          <Text style={styles.body}>
            {i18n.t("errorBoundary.body")}
          </Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>
              {this.state.error?.message || String(this.state.error)}
            </Text>
          </ScrollView>
          <PrimaryButton
            title={i18n.t("errorBoundary.tryAgain")}
            icon="refresh"
            onPress={() => this.setState({ error: null })}
          />
        </View>
      </View>
    );
  }
}

export default function AppErrorBoundary(props) {
  const { colors } = useTheme();
  return <AppErrorBoundaryClass {...props} colors={colors} />;
}

const getStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: Spacing.md,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    color: colors.textDark,
    fontSize: 24,
    fontWeight: "900",
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  errorBox: {
    maxHeight: 140,
    borderRadius: Radius.md,
    backgroundColor: colors.primaryPale,
    padding: 12,
  },
  errorText: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
});

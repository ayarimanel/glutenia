import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors, Radius, Spacing } from "../theme/colors";
import { PrimaryButton } from "./Buttons";

export default class AppErrorBoundary extends React.Component {
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

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Glutenia hit a startup error</Text>
          <Text style={styles.body}>
            Close and reopen the app. If this appears again, send this message with the APK.
          </Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>
              {this.state.error?.message || String(this.state.error)}
            </Text>
          </ScrollView>
          <PrimaryButton
            title="Try again"
            icon="refresh"
            onPress={() => this.setState({ error: null })}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    color: Colors.textDark,
    fontSize: 24,
    fontWeight: "900",
  },
  body: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  errorBox: {
    maxHeight: 140,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryPale,
    padding: 12,
  },
  errorText: {
    color: Colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
});

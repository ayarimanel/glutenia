import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Colors, Spacing } from "../../theme/colors";

export default function VideoPlayerScreen({ route, navigation }) {
  const { youtubeId, title } = route.params;

  return (
    <Screen>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.navSpacer} />
      </View>

      {/* YouTube embed */}
      <WebView
        style={styles.player}
        source={{ uri: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0` }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textDark,
  },
  navSpacer: { width: 40 },
  player: {
    flex: 1,
    backgroundColor: "#000",
  },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { RouteProp } from "@react-navigation/native";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { AppNavigation, RootParamList } from "../../navigation/types";

type Props = {
  route: RouteProp<RootParamList, "VideoPlayer">;
  navigation: AppNavigation;
};

export default function VideoPlayerScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { youtubeId, title } = route.params;

  return (
    <Screen>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
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

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
    color: colors.textDark,
  },
  navSpacer: { width: 40 },
  player: {
    flex: 1,
    backgroundColor: "#000",
  },
});

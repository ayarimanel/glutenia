import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Heart, MapPin } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { useTheme } from "../../context/ThemeContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";

export default function FavoritePlacesScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getFavoriteSpots(token);
      setFavorites(list || []);
    } catch (_) {
      // Non-critical — leave whatever was already loaded.
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const handleRemove = async (spot) => {
    const next = favorites.filter((f) => f.id !== spot.id);
    setFavorites(next);
    setRemovingId(spot.id);
    try {
      await api.updateFavoriteSpots(token, next);
    } catch (_) {
      setFavorites(favorites);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.textDark} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("favorites.title")}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <MapPin size={28} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>{t("favorites.empty")}</Text>
          <Text style={styles.emptyBody}>{t("favorites.emptyBody")}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("MapDetail", { spot: item })}
            >
              <View style={[styles.emojiWrap, { backgroundColor: item.color || colors.secondaryPale }]}>
                <Text style={styles.emojiText}>{item.emoji || "📍"}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{item.type}{item.address ? ` · ${item.address}` : ""}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(item)}
                disabled={removingId === item.id}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {removingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Heart size={18} color="#C8102E" fill="#C8102E" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.xl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
  },

  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.divider,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textDark, marginBottom: 6 },
  emptyBody: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },

  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 3 },
  cardSub: { fontSize: 12, color: colors.textMuted },
  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});

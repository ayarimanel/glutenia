import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const { width } = Dimensions.get("window");

// ─── Hardcoded gluten-free spots (Tunis) ──────────────────────────────────────
// Replace coordinates/names with real ones when ready
const SPOTS = [
  {
    id: "1",
    name: "Bio Marché Tunis",
    type: "Supermarket",
    address: "Avenue Habib Bourguiba, Tunis",
    emoji: "🛒",
    lat: 36.8189,
    lng: 10.1658,
    tags: ["Gluten-Free Bread", "Pasta", "Snacks"],
  },
  {
    id: "2",
    name: "Green Bowl Café",
    type: "Restaurant",
    address: "Rue de Marseille, Tunis",
    emoji: "🍽️",
    lat: 36.8165,
    lng: 10.1723,
    tags: ["GF Menu", "Salads", "Smoothies"],
  },
  {
    id: "3",
    name: "Nature & Saveur",
    type: "Health Store",
    address: "Les Berges du Lac, Tunis",
    emoji: "🌿",
    lat: 36.8378,
    lng: 10.2301,
    tags: ["Organic", "GF Cereals", "Supplements"],
  },
  {
    id: "4",
    name: "La Boulangerie Sans Gluten",
    type: "Bakery",
    address: "Rue Ibn Khaldoun, Tunis",
    emoji: "🥐",
    lat: 36.8142,
    lng: 10.1689,
    tags: ["GF Bread", "Pastries", "Cakes"],
  },
  {
    id: "5",
    name: "Carrefour Bio",
    type: "Supermarket",
    address: "La Marsa, Tunis",
    emoji: "🛒",
    lat: 36.8779,
    lng: 10.3247,
    tags: ["GF Section", "Imported Products"],
  },
  {
    id: "6",
    name: "Sana Café",
    type: "Restaurant",
    address: "Gammarth, Tunis",
    emoji: "☕",
    lat: 36.9012,
    lng: 10.2891,
    tags: ["GF Options", "Vegan Friendly"],
  },
];

const TYPE_COLORS = {
  Supermarket: "#8BC34A",
  Restaurant: "#FF7043",
  "Health Store": "#26A69A",
  Bakery: "#FFA726",
};

const INITIAL_REGION = {
  latitude: 36.8489,
  longitude: 10.2206,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

export default function ScanScreen({ navigation }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Supermarket", "Restaurant", "Health Store", "Bakery"];

  const filtered =
    activeFilter === "All"
      ? SPOTS
      : SPOTS.filter((s) => s.type === activeFilter);

  return (
    <View style={styles.root}>
      {/* ── AppHeader (safeTop manages status bar inset) ─────────────────── */}
      <AppHeader
        userName={user?.name ?? ""}
        onCartPress={() => navigation.navigate("CartPage")}
        safeTop
      />

      {/* ── Map container ───────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filtered.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            onPress={() => setSelected(spot)}
          >
            {/* Custom emoji pin */}
            <View
              style={[
                styles.pin,
                {
                  backgroundColor: TYPE_COLORS[spot.type] || Colors.primary,
                  borderColor:
                    selected?.id === spot.id ? Colors.textDark : "#fff",
                  borderWidth: selected?.id === spot.id ? 3 : 2,
                  transform: [{ scale: selected?.id === spot.id ? 1.2 : 1 }],
                },
              ]}
            >
              <Text style={styles.pinEmoji}>{spot.emoji}</Text>
            </View>
            {/* Callout bubble on tap */}
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{spot.name}</Text>
                <Text style={styles.calloutType}>{spot.type}</Text>
                <Text style={styles.calloutAddress}>{spot.address}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* ── Filter pill overlay ─────────────────────────────────────────────── */}
      <View style={styles.headerOverlay}>
        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => {
                setActiveFilter(f);
                setSelected(null);
              }}
              style={[
                styles.filterPill,
                activeFilter === f && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Bottom detail card (shows on marker tap) ────────────────────────── */}
      {selected && (
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View
              style={[
                styles.detailEmojiBg,
                { backgroundColor: TYPE_COLORS[selected.type] + "22" },
              ]}
            >
              <Text style={styles.detailEmoji}>{selected.emoji}</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{selected.name}</Text>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: TYPE_COLORS[selected.type] + "22" },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: TYPE_COLORS[selected.type] },
                  ]}
                >
                  {selected.type}
                </Text>
              </View>
              <Text style={styles.detailAddress}>{selected.address}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
            {selected.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>✓ {tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // ── Pin ────────────────────────────────────────────────────────────────────
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinEmoji: {
    fontSize: 20,
  },

  // ── Callout ────────────────────────────────────────────────────────────────
  callout: {
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    padding: Spacing.sm,
    minWidth: 160,
    ...Shadow,
  },
  calloutTitle: {
    fontWeight: "800",
    fontSize: 13,
    color: Colors.textDark,
  },
  calloutType: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  calloutAddress: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // ── Filter overlay (sits over map) ─────────────────────────────────────────
  headerOverlay: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
  },
  filterRow: {
    gap: Spacing.xs,
    paddingRight: Spacing.md,
  },
  filterPill: {
    borderRadius: Radius.pill,
    backgroundColor: "#ffffffee",
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...Shadow,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: "#fff",
  },

  // ── Detail card ────────────────────────────────────────────────────────────
  detailCard: {
    position: "absolute",
    bottom: 90,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow,
  },
  detailTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  detailEmojiBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  detailEmoji: {
    fontSize: 26,
  },
  detailInfo: {
    flex: 1,
    gap: 4,
  },
  detailName: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.textDark,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  detailAddress: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "700",
  },
});

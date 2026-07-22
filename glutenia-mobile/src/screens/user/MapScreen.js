import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Radius, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import AppIcon from "../../components/AppIcon";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { useTranslation } from "react-i18next";

// ─── Color helper ─────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const getSpots = (colors) => [
  {
    id: "1",
    name: "Ben Yaghlene Shops",
    type: "Supermarket",
    address: "Av. Habib Bourguiba, Tunis",
    emoji: "🛒",
    rating: 4.8,
    reviews: "2.6k",
    distance: "1.2 km",
    avgPrice: "15 TND",
    coordinate: { latitude: 36.8008, longitude: 10.181 },
    description:
      "A premier grocery store with a dedicated gluten-free section. Over 200 certified GF products from local and international brands.",
    tags: ["GF Bread", "Pasta", "Imported"],
    color: colors.primary,
    accentEmoji: "🌿",
  },
  {
    id: "2",
    name: "Green Bowl Café",
    type: "Restaurant",
    address: "Rue de Marseille, Tunis",
    emoji: "🍽️",
    rating: 4.6,
    reviews: "1.3k",
    distance: "2.2 km",
    avgPrice: "20 TND",
    coordinate: { latitude: 36.8135, longitude: 10.1748 },
    description:
      "Fully gluten-free menu with organic salads, fresh smoothies, and a warm cozy atmosphere. A safe haven for celiacs.",
    tags: ["GF Menu", "Salads", "Smoothies"],
    color: colors.secondary,
    accentEmoji: "🥗",
  },
  {
    id: "3",
    name: "Nature & Saveur",
    type: "Health Store",
    address: "Les Berges du Lac, Tunis",
    emoji: "🌿",
    rating: 4.5,
    reviews: "890",
    distance: "3.5 km",
    avgPrice: "25 TND",
    coordinate: { latitude: 36.838, longitude: 10.229 },
    description:
      "Organic health store specializing in gluten-free cereals, natural supplements, and herbal remedies.",
    tags: ["Organic", "GF Cereals", "Supplements"],
    color: colors.primary,
    accentEmoji: "🌱",
  },
  {
    id: "4",
    name: "La Boulangerie Sans Gluten",
    type: "Bakery",
    address: "Rue Ibn Khaldoun, Tunis",
    emoji: "🥐",
    rating: 4.9,
    reviews: "3.1k",
    distance: "0.8 km",
    avgPrice: "12 TND",
    coordinate: { latitude: 36.7985, longitude: 10.172 },
    description:
      "100% gluten-free bakery baking fresh bread, croissants, and cakes daily. Locals' top pick in Tunis.",
    tags: ["Fresh Bread", "Pastries", "Cakes"],
    color: colors.secondary,
    accentEmoji: "🍞",
  },
  {
    id: "5",
    name: "Carrefour Bio La Marsa",
    type: "Supermarket",
    address: "La Marsa, Tunis",
    emoji: "🛒",
    rating: 4.3,
    reviews: "756",
    distance: "5.2 km",
    avgPrice: "18 TND",
    coordinate: { latitude: 36.878, longitude: 10.324 },
    description:
      "Large bio supermarket with an extensive imported gluten-free section and great variety of international GF brands.",
    tags: ["GF Section", "Imported", "Bio"],
    color: colors.primary,
    accentEmoji: "🥦",
  },
  {
    id: "6",
    name: "Sana Café Gammarth",
    type: "Restaurant",
    address: "Gammarth, Tunis",
    emoji: "🍽️",
    rating: 4.7,
    reviews: "1.8k",
    distance: "6.1 km",
    avgPrice: "22 TND",
    coordinate: { latitude: 36.9097, longitude: 10.315 },
    description:
      "Beachfront café with gluten-free and vegan options. Famous for GF pancakes and tropical smoothie bowls.",
    tags: ["GF Options", "Vegan", "Beachfront"],
    color: colors.secondary,
    accentEmoji: "☀️",
  },
  {
    id: "7",
    name: "Vita Bio Market",
    type: "Health Store",
    address: "Ariana Soghra, Ariana",
    emoji: "🌿",
    rating: 4.4,
    reviews: "612",
    distance: "4.0 km",
    avgPrice: "22 TND",
    coordinate: { latitude: 36.8618, longitude: 10.1942 },
    description:
      "Friendly health shop stocked with a wide range of gluten-free flours, snacks, and plant-based alternatives. Staff are celiac-aware.",
    tags: ["GF Flour", "Snacks", "Vegan"],
    color: colors.primary,
    accentEmoji: "🥬",
  },
  {
    id: "8",
    name: "Patisserie Douce Nature",
    type: "Bakery",
    address: "Ennasr 2, Ariana",
    emoji: "🥐",
    rating: 4.6,
    reviews: "1.1k",
    distance: "4.7 km",
    avgPrice: "14 TND",
    coordinate: { latitude: 36.8692, longitude: 10.2105 },
    description:
      "Artisan bakery offering exclusively gluten-free pastries, tarts, and celebration cakes. Pre-order available for custom creations.",
    tags: ["GF Cakes", "Tarts", "Custom Orders"],
    color: colors.secondary,
    accentEmoji: "🎂",
  },
  {
    id: "9",
    name: "Le Comptoir Sans Gluten",
    type: "Restaurant",
    address: "Rue de Hollande, Tunis",
    emoji: "🍽️",
    rating: 4.5,
    reviews: "980",
    distance: "1.9 km",
    avgPrice: "24 TND",
    coordinate: { latitude: 36.8072, longitude: 10.1769 },
    description:
      "Dedicated gluten-free bistro serving traditional Tunisian dishes reinvented with rice and corn-based recipes. Cosy terrace dining.",
    tags: ["Tunisian Cuisine", "GF Menu", "Terrace"],
    color: colors.secondary,
    accentEmoji: "🫕",
  },
  {
    id: "10",
    name: "Monoprix Centre Ville",
    type: "Supermarket",
    address: "Av. de France, Tunis",
    emoji: "🛒",
    rating: 4.1,
    reviews: "1.4k",
    distance: "0.5 km",
    avgPrice: "16 TND",
    coordinate: { latitude: 36.7995, longitude: 10.1838 },
    description:
      "Central supermarket with a dedicated bio & sans-gluten aisle. Good selection of imported French GF brands and local alternatives.",
    tags: ["GF Aisle", "Bio", "French Brands"],
    color: colors.primary,
    accentEmoji: "🏷️",
  },
];

const FILTERS = ["All", "Supermarket", "Restaurant", "Health Store", "Bakery", "Pharmacy"];


// ─── Star rating helper ───────────────────────────────────────────────────────

function StarRating({ rating, styles }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <Text style={styles.stars}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(5 - full - (half ? 1 : 0))}
    </Text>
  );
}

// ─── Leaflet HTML builder ─────────────────────────────────────────────────────

// ─── Visual Mapping Helpers ──────────────────────────────────────────────────

const SPOT_IMAGES = {
  "1": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500", // Supermarket
  "2": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500", // Restaurant
  "3": "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500", // Health Store
  "4": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500", // Bakery
  "5": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500", // Bio Supermarket
  "6": "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500", // Restaurant Gammarth
  "7": "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=500", // Health Store
  "8": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500", // Bakery/Patisserie
  "9": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500", // Bistro Restaurant
  "10": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500", // Supermarket Centre Ville
};

const FILTER_ICONS = {
  All: "grid",
  Supermarket: "basket",
  Restaurant: "utensils",
  "Health Store": "leaf",
  Bakery: "croissant",
  Pharmacy: "activity"
};

// ─── Real (professional-submitted) establishments → map spot shape ──────────

const getCategoryVisual = (colors) => ({
  Supermarket: { emoji: "🛒", color: colors.primary, accentEmoji: "🛒" },
  Restaurant: { emoji: "🍽️", color: colors.secondary, accentEmoji: "🍽️" },
  "Health Store": { emoji: "🌿", color: colors.primary, accentEmoji: "🌿" },
  Bakery: { emoji: "🥐", color: colors.secondary, accentEmoji: "🥐" },
  Pharmacy: { emoji: "💊", color: colors.primary, accentEmoji: "💊" },
  Other: { emoji: "🏪", color: colors.secondary, accentEmoji: "🏪" },
});

const MAP_CENTER = { latitude: 36.82, longitude: 10.2 };

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeEstablishment(est, categoryVisual) {
  const visual = categoryVisual[est.category] || categoryVisual.Other;
  const lat = est.coordinates?.latitude;
  const lng = est.coordinates?.longitude;
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const distanceKm = hasCoords
    ? haversineKm(MAP_CENTER.latitude, MAP_CENTER.longitude, lat, lng)
    : null;

  return {
    id: est._id,
    name: est.name,
    type: est.category || "Other",
    address: est.address || "",
    emoji: visual.emoji,
    rating: 5,
    reviews: 0,
    distance: distanceKm != null ? `${distanceKm.toFixed(1)} km` : "-",
    avgPrice: "-",
    coordinate: hasCoords ? { latitude: lat, longitude: lng } : null,
    description: est.description || "",
    tags: [est.category || "Other"],
    color: visual.color,
    accentEmoji: visual.accentEmoji,
    coverImageUrl: est.coverImageUrl || null,
    isReal: true,
    verified: Boolean(est.verified),
    phone: est.phone,
    hours: est.hours,
  };
}

// ─── Leaflet HTML builder ─────────────────────────────────────────────────────

function buildLeafletHTML(spots) {
  const data = spots.map((s) => ({
    id: s.id,
    lat: s.coordinate.latitude,
    lng: s.coordinate.longitude,
    emoji: s.emoji,
    color: s.color,
    type: s.type,
  }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #e8efe9; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var SPOTS = ${JSON.stringify(data)};
  var markers = {};
  var selectedId = SPOTS.length > 0 ? SPOTS[0].id : null;

  var map = L.map('map', { zoomControl: false, attributionControl: false })
    .setView([36.82, 10.2], 12);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  function getSvgIcon(type) {
    var forkKnife = '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    var bread = '<path d="M7 19c-2.2 0-4-1.8-4-4v-1a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1c0 2.2-1.8 4-4 4H7Z M7 10h10 M12 10v9 M16 10l-2 9 M8 10l2 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    var basket = '<path d="m15 9-6-6M9 9l6-6M2 12h20M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    var cross = '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    var leaf = '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2Z M9 22v-4h-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    var shield = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 11l2 2 4-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';

    switch(type) {
      case "Restaurant": return forkKnife;
      case "Bakery": return bread;
      case "Supermarket": return basket;
      case "Pharmacy": return cross;
      case "Health Store": return leaf;
      default: return shield;
    }
  }

  function makeHtml(spot, isActive) {
    var color = spot.color || "#8BC34A";
    var iconPaths = getSvgIcon(spot.type);
    var sz = isActive ? 52 : 38;
    
    var shadowFilter = isActive 
      ? "filter: drop-shadow(0 0 6px rgba(139, 195, 74, 0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.35));"
      : "filter: drop-shadow(0 2px 5px rgba(0,0,0,0.2));";
    
    var scale = isActive ? "transform: scale(1.15);" : "transform: scale(1.0);";
    
    return '<div style="width:' + sz + 'px;height:' + sz + 'px;display:flex;align-items:center;justify-content:center;' + scale + 'transition:all 0.2s ease;' + shadowFilter + '">' +
      '<svg viewBox="0 0 24 30" style="width:100%;height:100%;color:#ffffff;">' +
      '<path d="M12 0 C5.37 0 0 5.37 0 12 C0 21 12 30 12 30 C12 30 24 21 24 12 C24 5.37 18.63 0 12 0 Z" fill="' + color + '" stroke="#ffffff" stroke-width="1.5" />' +
      '<svg viewBox="0 0 24 24" x="4.5" y="4.5" width="15" height="15" style="color:#ffffff;">' +
      iconPaths +
      '</svg>' +
      '</svg>' +
      '</div>';
  }

  function makeIcon(spot, isActive) {
    var sz = isActive ? 60 : 44;
    return L.divIcon({
      className: '',
      html: makeHtml(spot, isActive),
      iconSize: [sz, sz],
      iconAnchor: [sz / 2, sz]
    });
  }

  function findSpot(id) {
    for (var i = 0; i < SPOTS.length; i++) {
      if (SPOTS[i].id === id) return SPOTS[i];
    }
    return null;
  }

  function selectMarker(id) {
    if (selectedId && markers[selectedId]) {
      var old = findSpot(selectedId);
      if (old) markers[selectedId].setIcon(makeIcon(old, false));
    }
    selectedId = id;
    var cur = findSpot(id);
    if (cur && markers[id]) markers[id].setIcon(makeIcon(cur, true));
  }

  function addMarkers(spots) {
    for (var i = 0; i < spots.length; i++) {
      (function(s) {
        var m = L.marker([s.lat, s.lng], {
          icon: makeIcon(s, s.id === selectedId)
        }).addTo(map);
        m.on('click', function() {
          selectMarker(s.id);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'markerPress', spotId: s.id })
            );
          }
        });
        markers[s.id] = m;
      })(spots[i]);
    }
  }

  addMarkers(SPOTS);

  window.handleFromRN = function(msg) {
    if (msg.type === 'flyTo') {
      selectMarker(msg.spotId);
      map.flyTo([msg.lat, msg.lng], 14, { animate: true, duration: 0.4 });
    } else if (msg.type === 'updateSpots') {
      var keys = Object.keys(markers);
      for (var k = 0; k < keys.length; k++) map.removeLayer(markers[keys[k]]);
      markers = {};
      SPOTS = msg.spots;
      selectedId = SPOTS.length > 0 ? SPOTS[0].id : null;
      addMarkers(SPOTS);
      if (SPOTS.length > 0) {
        map.flyTo([SPOTS[0].lat, SPOTS[0].lng], 13, { animate: true, duration: 0.4 });
      }
    }
  };
</script>
</body>
</html>`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const categoryVisual = useMemo(() => getCategoryVisual(colors), [colors]);
  const SPOTS = useMemo(() => getSpots(colors), [colors]);
  const filterLabels = {
    All: t("map.all"),
    Supermarket: t("map.supermarket"),
    Restaurant: t("map.restaurant"),
    "Health Store": t("map.healthStore"),
    Bakery: t("map.bakery"),
    Pharmacy: t("map.pharmacy"),
  };

  const hours = [
    { day: t("map.monFri"),   time: "08:00 – 20:00" },
    { day: t("map.saturday"), time: "09:00 – 18:00" },
    { day: t("map.sunday"),   time: "10:00 – 16:00" },
  ];

  const getFacilities = (type) => {
    switch (type) {
      case "Restaurant":
        return [t("map.facR1"), t("map.facR2"), t("map.facR3"), t("map.facR4")];
      case "Bakery":
        return [t("map.facB1"), t("map.facB2"), t("map.facB3"), t("map.facB4")];
      case "Supermarket":
        return [t("map.facS1"), t("map.facS2"), t("map.facS3"), t("map.facS4")];
      case "Health Store":
        return [t("map.facH1"), t("map.facH2"), t("map.facH3"), t("map.facH4")];
      default:
        return [t("map.facD1"), t("map.facD2"), t("map.facD3")];
    }
  };
  const webViewRef = useRef(null);
  const bottomSheetRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(SPOTS[0].id);
  const [headerHeight, setHeaderHeight] = useState(88);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [realSpots, setRealSpots] = useState([]);
  const [mapWebViewReady, setMapWebViewReady] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const snapPoints = useMemo(() => ["55%", "90%"], []);
  const leafletHTML = useMemo(() => buildLeafletHTML(SPOTS), [SPOTS]);

  useEffect(() => {
    setMapWebViewReady(false);
  }, [leafletHTML]);

  useEffect(() => {
    if (!token) return;
    api
      .getFavoriteSpots(token)
      .then((list) => setFavorites(list || []))
      .catch(() => {});
  }, [token]);

  const toggleFavorite = useCallback(
    (spot) => {
      setFavorites((current) => {
        const isFavorited = current.some((f) => f.id === spot.id);
        const next = isFavorited
          ? current.filter((f) => f.id !== spot.id)
          : [...current, spot];
        if (token) {
          api.updateFavoriteSpots(token, next).catch(() => {});
        }
        return next;
      });
    },
    [token]
  );

  const allSpots = useMemo(() => [...SPOTS, ...realSpots], [SPOTS, realSpots]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      api
        .establishments()
        .then((list) => {
          if (cancelled) return;
          const normalized = (list || [])
            .filter((e) => e.coordinates?.latitude != null && e.coordinates?.longitude != null)
            .map((e) => normalizeEstablishment(e, categoryVisual));
          setRealSpots(normalized);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [categoryVisual])
  );

  const filtered =
    activeFilter === "All" ? allSpots : allSpots.filter((s) => s.type === activeFilter);

  const selectedSpot =
    filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const sendToMap = useCallback((data) => {
    webViewRef.current?.injectJavaScript(
      `if (window.handleFromRN) { window.handleFromRN(${JSON.stringify(data)}); } true;`
    );
  }, []);

  useEffect(() => {
    if (!mapWebViewReady || realSpots.length === 0) return;
    const next =
      activeFilter === "All" ? allSpots : allSpots.filter((s) => s.type === activeFilter);
    sendToMap({
      type: "updateSpots",
      spots: next
        .filter((s) => s.coordinate)
        .map((s) => ({
          id: s.id,
          lat: s.coordinate.latitude,
          lng: s.coordinate.longitude,
          emoji: s.emoji,
          color: s.color,
          type: s.type,
        })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realSpots, mapWebViewReady]);

  const animateToSpot = useCallback(
    (spot) => {
      sendToMap({
        type: "flyTo",
        spotId: spot.id,
        lat: spot.coordinate.latitude - 0.008,
        lng: spot.coordinate.longitude,
      });
    },
    [sendToMap]
  );

  const openSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
    setSheetIndex(0);
  }, []);

  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "markerPress") {
          const spot = allSpots.find((s) => s.id === msg.spotId);
          if (spot) {
            setSelectedId(spot.id);
            setTimeout(() => bottomSheetRef.current?.snapToIndex(0), 120);
          }
        }
      } catch (_) {}
    },
    [allSpots]
  );

  const handleFilterChange = useCallback(
    (f) => {
      bottomSheetRef.current?.close();
      setActiveFilter(f);
      const next = f === "All" ? allSpots : allSpots.filter((s) => s.type === f);
      const nextData = next
        .filter((s) => s.coordinate)
        .map((s) => ({
          id: s.id,
          lat: s.coordinate.latitude,
          lng: s.coordinate.longitude,
          emoji: s.emoji,
          color: s.color,
          type: s.type,
        }));
      sendToMap({ type: "updateSpots", spots: nextData });
      if (next[0]) setSelectedId(next[0].id);
    },
    [sendToMap, allSpots]
  );

  const handleContact = useCallback(() => {
    if (!selectedSpot) return;
    Alert.alert(
      t("map.contactTitle", { name: selectedSpot.name }),
      t("map.contactMsg"),
      [
        {
          text: t("map.call"),
          onPress: () => Linking.openURL(`tel:${selectedSpot.phone || "+21671000000"}`),
        },
        {
          text: t("map.whatsapp"),
          onPress: () => {
            const digits = (selectedSpot.phone || "+21671000000").replace(/[^\d]/g, "");
            Linking.openURL(`https://wa.me/${digits}`);
          },
        },
        { text: t("map.cancel"), style: "cancel" },
      ]
    );
  }, [selectedSpot]);

  const handleDirections = useCallback(() => {
    if (!selectedSpot) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.coordinate.latitude},${selectedSpot.coordinate.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(t("map.errorTitle"), t("map.mapsError"));
    });
  }, [selectedSpot]);

  const handleLocateMe = useCallback(() => {
    sendToMap({
      type: "flyTo",
      spotId: SPOTS[0].id,
      lat: SPOTS[0].coordinate.latitude - 0.008,
      lng: SPOTS[0].coordinate.longitude,
    });
    setSelectedId(SPOTS[0].id);
  }, [sendToMap, SPOTS]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    []
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* ── Layer 1: Leaflet Map (WebView) ───────────────────────────────────── */}
      <WebView
        ref={webViewRef}
        style={StyleSheet.absoluteFillObject}
        source={{ html: leafletHTML }}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => setMapWebViewReady(true)}
        javaScriptEnabled
        originWhitelist={["*"]}
        scrollEnabled={false}
        mixedContentMode="compatibility"
      />

      {/* ── Layer 2: Header ──────────────────────────────────────────────────── */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <AppHeader
          safeTop
          userName={user?.name ?? ""}
          avatarUri={user?.avatar}
          onCartPress={() => navigation.navigate("CartPage")}
        />
      </View>

      {/* ── Layer 3: Category Chips (Redesigned) ─────────────────────────────── */}
      <View style={[styles.filterBar, { top: headerHeight + 12 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => handleFilterChange(f)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                activeOpacity={0.8}
              >
                <AppIcon
                  name={FILTER_ICONS[f] || "grid"}
                  size={14}
                  color={isActive ? "#FFFFFF" : "#6C757D"}
                  strokeWidth={2.4}
                />
                <Text
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : styles.filterTextInactive,
                  ]}
                >
                  {filterLabels[f] ?? f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.favoritesEntryBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("FavoritePlaces")}
        >
          <AppIcon name="heart" size={16} color="#C8102E" fill={favorites.length > 0 ? "#C8102E" : "none"} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── Layer 4: Bottom info card (single selected spot - Glassmorphic) ────── */}
      {selectedSpot && sheetIndex === -1 && (
        <TouchableOpacity
          style={[styles.infoCard, { bottom: insets.bottom + 16 }]}
          activeOpacity={0.92}
          onPress={openSheet}
        >
          <View style={styles.cardContentRow}>
            <Image
              source={{ uri: selectedSpot.coverImageUrl || SPOT_IMAGES[selectedSpot.id] || SPOT_IMAGES["1"] }}
              style={styles.cardImage}
            />
            
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {selectedSpot.name}
                </Text>
                <TouchableOpacity
                  style={styles.favoriteBtn}
                  activeOpacity={0.7}
                  onPress={() => toggleFavorite(selectedSpot)}
                >
                  <AppIcon
                    name="heart"
                    size={16}
                    color="#C8102E"
                    fill={favorites.some((f) => f.id === selectedSpot.id) ? "#C8102E" : "none"}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBadgeRow}>
                {selectedSpot.verified !== false && (
                  <View style={styles.verifiedBadge}>
                    <AppIcon name="shield-check" size={10} color="#8BC34A" strokeWidth={3} />
                    <Text style={styles.verifiedBadgeText}>{t("map.verifiedGF")}</Text>
                  </View>
                )}

                <View style={[styles.cardCategoryBadge, { backgroundColor: selectedSpot.color + "15" }]}>
                  <Text style={[styles.cardCategoryText, { color: selectedSpot.color }]}>
                    {filterLabels[selectedSpot.type] ?? selectedSpot.type}
                  </Text>
                </View>
              </View>

              <View style={styles.cardMetaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaPriceText}>{selectedSpot.avgPrice}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardActionRow}>
            <TouchableOpacity style={styles.cardCtaBtn} onPress={openSheet} activeOpacity={0.85}>
              <Text style={styles.cardCtaText}>{t("map.viewDetails")}</Text>
              <AppIcon name="chevron-right" size={14} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Layer 4.5: Floating circular Locate Me button ───────────────────── */}
      <TouchableOpacity
        style={[
          styles.locateMeBtn,
          { bottom: selectedSpot && sheetIndex === -1 ? insets.bottom + 214 : insets.bottom + 24 }
        ]}
        activeOpacity={0.85}
        onPress={handleLocateMe}
      >
        <AppIcon name="compass" size={20} color="#8BC34A" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Layer 5: Bottom Sheet (Premium Restaurant Details) ───────────────── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        animateOnMount={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
        onChange={setSheetIndex}
      >
        {selectedSpot && (
          <>
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              {/* Section 1: Hero Image + Gradient Overlay */}
              <View style={styles.sheetHero}>
                <Image
                  source={{ uri: selectedSpot.coverImageUrl || SPOT_IMAGES[selectedSpot.id] || SPOT_IMAGES["1"] }}
                  style={styles.heroImage}
                />
                <View style={styles.heroGradient}>
                  {selectedSpot.verified !== false && (
                    <View style={styles.heroBadgeRow}>
                      <View style={styles.gfCertBadge}>
                        <AppIcon name="shield-check" size={12} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.gfCertText}>{t("map.certifiedGF")}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.heroDetailsContainer}>
                    <Text style={styles.heroCategory}>{(filterLabels[selectedSpot.type] ?? selectedSpot.type).toUpperCase()}</Text>
                    <Text style={styles.heroTitle}>{selectedSpot.name}</Text>
                    
                    <View style={styles.heroMetaRow}>
                      <View style={styles.heroMetaItem}>
                        <AppIcon name="star" size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.heroMetaText}>
                          {selectedSpot.rating} ({t("map.reviewsCount", { count: selectedSpot.reviews })})
                        </Text>
                      </View>
                      <Text style={styles.heroMetaBullet}>•</Text>
                      <View style={styles.heroMetaItem}>
                        <AppIcon name="location" size={12} color="#FFFFFF" />
                        <Text style={styles.heroMetaText}>{selectedSpot.distance}</Text>
                      </View>
                      <Text style={styles.heroMetaBullet}>•</Text>
                      <View style={styles.heroMetaItem}>
                        <Text style={styles.heroMetaText}>{selectedSpot.avgPrice}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Section 2: About Card */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <AppIcon name="info" size={16} color="#8BC34A" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>{t("map.about")}</Text>
                </View>
                <Text style={styles.descriptionText}>
                  {selectedSpot.isReal
                    ? selectedSpot.description || t("map.noDescription")
                    : t(`map.spots.s${selectedSpot.id}.description`)}
                </Text>
              </View>

              {/* Section 3: Available GF Products */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <AppIcon name="leaf" size={16} color="#8BC34A" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>{t("map.availableProducts")}</Text>
                </View>
                <View style={styles.tagCloud}>
                  {(selectedSpot.isReal
                    ? selectedSpot.tags
                    : [
                        t(`map.spots.s${selectedSpot.id}.tag1`),
                        t(`map.spots.s${selectedSpot.id}.tag2`),
                        t(`map.spots.s${selectedSpot.id}.tag3`),
                      ]
                  ).map((tag) => (
                    <View key={tag} style={styles.gfProductTag}>
                      <AppIcon name="checkmark" size={10} color="#8BC34A" strokeWidth={3} />
                      <Text style={styles.gfProductTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Section 4: Safety & Facilities */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <AppIcon name="shield-check" size={16} color="#8BC34A" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>{t("map.safetyFacilities")}</Text>
                </View>
                <View style={styles.facilityGrid}>
                  {getFacilities(selectedSpot.type).map((fac) => (
                    <View key={fac} style={styles.facilityItem}>
                      <View style={styles.facilityDot} />
                      <Text style={styles.facilityText}>{fac}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Section 5: Opening Hours */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <AppIcon name="clock" size={16} color="#8BC34A" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>{t("map.openingHours")}</Text>
                </View>
                {selectedSpot.isReal && selectedSpot.hours ? (
                  <Text style={styles.descriptionText}>{selectedSpot.hours}</Text>
                ) : (
                  <View style={styles.hoursList}>
                    {hours.map((h) => (
                      <View key={h.day} style={styles.hoursItem}>
                        <Text style={styles.hoursDayText}>{h.day}</Text>
                        <Text style={styles.hoursTimeText}>{h.time}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Section 7: Location */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <AppIcon name="map-pin" size={16} color="#8BC34A" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>{t("map.location")}</Text>
                </View>
                <Text style={styles.locationAddressText}>{selectedSpot.address}</Text>
              </View>
            </BottomSheetScrollView>

            {/* Section 8: Sticky double CTA buttons */}
            <View
              style={[
                styles.ctaBar,
                { paddingBottom: insets.bottom + 16 },
              ]}
            >
              <TouchableOpacity
                style={styles.ctaCallBtn}
                activeOpacity={0.8}
                onPress={handleContact}
              >
                <AppIcon name="phone" size={16} color="#8BC34A" strokeWidth={2.5} />
                <Text style={styles.ctaCallBtnText}>{t("map.callUs")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.ctaDirectionsBtn}
                activeOpacity={0.8}
                onPress={handleDirections}
              >
                <AppIcon name="navigation" size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.ctaDirectionsBtnText}>{t("map.directions")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheet>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },

    headerWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    filterBar: {
      position: "absolute",
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      gap: 10,
      zIndex: 9,
    },
    filterScroll: { flex: 1 },
    filterRow: {
      gap: 8,
      alignItems: "center",
      paddingRight: 4,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 40,
      borderRadius: 20,
      paddingHorizontal: 16,
      borderWidth: 1,
    },
    filterPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 3,
    },
    filterPillInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    filterText: {
      fontSize: 13,
      fontWeight: "700",
    },
    filterTextActive: {
      color: "#FFFFFF",
    },
    filterTextInactive: {
      color: colors.textMuted,
    },
    favoritesEntryBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    infoCard: {
      position: "absolute",
      left: 16,
      right: 16,
      backgroundColor: hexToRgba(colors.surface, 0.94),
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: hexToRgba(colors.surface, 0.6),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
      zIndex: 8,
    },
    cardContentRow: {
      flexDirection: "row",
      gap: 16,
    },
    cardImage: {
      width: 88,
      height: 88,
      borderRadius: 16,
      backgroundColor: colors.primaryPale,
    },
    cardInfo: {
      flex: 1,
      justifyContent: "space-between",
    },
    cardTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    cardName: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textDark,
      flex: 1,
    },
    favoriteBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: hexToRgba(colors.danger, 0.04),
      alignItems: "center",
      justifyContent: "center",
    },
    cardBadgeRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      marginTop: 4,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primaryPale,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: hexToRgba(colors.primary, 0.2),
    },
    verifiedBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
    },
    cardCategoryBadge: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    cardCategoryText: {
      fontSize: 10,
      fontWeight: "700",
    },
    cardMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaPriceText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.primary,
    },
    cardActionRow: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: 12,
    },
    cardCtaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 16,
      height: 44,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    cardCtaText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    locateMeBtn: {
      position: "absolute",
      right: 16,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: hexToRgba(colors.primaryPale, 0.95),
      borderWidth: 1,
      borderColor: hexToRgba(colors.primary, 0.3),
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 7,
    },

    sheetBg: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    sheetHandle: {
      width: 48,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.border,
      alignSelf: "center",
    },
    sheetScrollContent: {
      paddingBottom: 130,
      paddingHorizontal: 16,
      paddingTop: 16,
    },

    sheetHero: {
      height: 240,
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 16,
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.42)",
      justifyContent: "space-between",
      padding: 16,
    },
    heroBadgeRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    gfCertBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    gfCertText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    heroDetailsContainer: {
      gap: 4,
    },
    heroCategory: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.primaryLight,
      letterSpacing: 1.2,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    heroMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    heroMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    heroMetaText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    heroMetaBullet: {
      color: "rgba(255, 255, 255, 0.6)",
      marginHorizontal: 8,
      fontSize: 12,
    },

    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 6,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textDark,
    },
    descriptionText: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 20,
    },

    hoursList: {
      gap: 8,
    },
    hoursItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    hoursDayText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: "600",
    },
    hoursTimeText: {
      fontSize: 13,
      color: colors.textDark,
      fontWeight: "700",
    },

    tagCloud: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    gfProductTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primaryPale,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: hexToRgba(colors.primary, 0.15),
    },
    gfProductTagText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },

    facilityGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    facilityItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      width: "47%",
    },
    facilityDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    facilityText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "600",
    },

    reviewsContainer: {
      gap: 12,
    },
    reviewItem: {
      gap: 6,
    },
    reviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    reviewAuthor: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textDark,
    },
    reviewStars: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    reviewRating: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textDark,
    },
    reviewText: {
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: "italic",
      lineHeight: 18,
    },
    reviewDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },

    locationAddressText: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },

    ctaBar: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    ctaCallBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primaryPale,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 16,
      height: 50,
    },
    ctaCallBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    ctaDirectionsBtn: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 16,
      height: 50,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    ctaDirectionsBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });

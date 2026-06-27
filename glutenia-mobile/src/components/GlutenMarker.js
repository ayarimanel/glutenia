import { Image } from "react-native";

// PNG dims: all 72×72 (square). Display sizes below are exact (no aspect correction needed).
const MARKER_SIZE_INACTIVE = { width: 36, height: 36 };
const MARKER_SIZE_ACTIVE   = { width: 48, height: 48 };

const MARKER_IMAGES = {
  green:  require("../../assets/markers/marker-food.png"),
  red:    require("../../assets/markers/marker-health.png"),
  active: require("../../assets/markers/marker-store.png"),
};

const TYPE_TO_COLOR = {
  Supermarket:    "green",
  "Health Store": "green",
  Restaurant:     "red",
  Bakery:         "red",
  Café:           "red",
};

export default function GlutenMarker({ type, isActive }) {
  const colorKey = TYPE_TO_COLOR[type] ?? "green";
  const source = isActive ? MARKER_IMAGES.active : MARKER_IMAGES[colorKey];
  const size   = isActive ? MARKER_SIZE_ACTIVE   : MARKER_SIZE_INACTIVE;

  return (
    <Image
      source={source}
      style={{ width: size.width, height: size.height }}
      resizeMode="contain"
    />
  );
}

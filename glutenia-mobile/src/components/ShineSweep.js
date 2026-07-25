import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

// A soft diagonal light sweep across a medallion, once, on mount/active.
// Shared by the badge unlock celebration and the profile Role medallion so
// every "you earned this" moment sweeps the same way.
export default function ShineSweep({ active, size = 92 }) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.delay(220),
      Animated.timing(sweep, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [active]);

  const width = size * 0.2;
  const height = size * 1.4;
  const travel = size * 0.98;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shine,
        {
          width,
          height,
          borderRadius: width / 2,
          opacity: sweep.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.5, 0.5, 0] }),
          transform: [
            { translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-travel, travel] }) },
            { rotate: "20deg" },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  shine: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
});

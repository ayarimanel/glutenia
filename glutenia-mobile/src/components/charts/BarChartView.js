import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const CHART_HEIGHT = 100; // slightly shorter for better proportions inside cards

function AnimatedBar({ height, color, barStyle }) {
  const animHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animHeight, {
      toValue: height,
      tension: 20,
      friction: 5,
      useNativeDriver: false,
    }).start();
  }, [height]);

  return (
    <Animated.View
      style={[
        barStyle,
        { height: animHeight, backgroundColor: color },
      ]}
    />
  );
}

export default function BarChartView({ data, color }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const barColor = color ?? colors.primary;
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <View style={styles.wrap}>
      {data.map((item) => {
        const barHeight = Math.max(4, (item.value / maxValue) * CHART_HEIGHT);
        return (
          <View key={item.label} style={styles.col}>
            <Text style={styles.value}>{item.value}</Text>
            <View style={styles.barTrack}>
              <AnimatedBar height={barHeight} color={item.color || barColor} barStyle={styles.bar} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingTop: 10,
    paddingBottom: 2,
  },
  col: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  value: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 6,
  },
  barTrack: {
    height: CHART_HEIGHT,
    width: 14,
    backgroundColor: colors.divider,
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 7,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    height: 26,
    maxWidth: 60,
  },
});


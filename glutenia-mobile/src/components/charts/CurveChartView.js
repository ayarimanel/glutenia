import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, Line as SvgLine, LinearGradient, Path, Stop } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

const CHART_HEIGHT = 120;
const TOP_PADDING = 12;
const H_PADDING = 16;
const POINT_GAP = 34;

function buildSmoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export default function CurveChartView({ data, color, labelEvery = 2 }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const lineColor = color ?? colors.primary;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data]);

  const width = Math.max(280, H_PADDING * 2 + (data.length - 1) * POINT_GAP);
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  const points = data.map((item, index) => ({
    x: H_PADDING + index * POINT_GAP,
    y: TOP_PADDING + (CHART_HEIGHT - TOP_PADDING) * (1 - item.value / maxValue),
    ...item,
  }));

  const linePath = buildSmoothPath(points);
  const fillPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`
    : "";

  const gridRatios = [0.25, 0.5, 0.75];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Svg width={width} height={CHART_HEIGHT + 8}>
            <Defs>
              <LinearGradient id={`curveGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={color} stopOpacity={0.24} />
                <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

            {/* Background Grid Lines */}
            {gridRatios.map((ratio, idx) => {
              const y = TOP_PADDING + (CHART_HEIGHT - TOP_PADDING) * ratio;
              return (
                <SvgLine
                  key={`grid-${idx}`}
                  x1={H_PADDING}
                  y1={y}
                  x2={width - H_PADDING}
                  y2={y}
                  stroke={colors.divider}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.6}
                />
              );
            })}

            {/* Baseline */}
            <SvgLine
              x1={H_PADDING}
              y1={CHART_HEIGHT}
              x2={width - H_PADDING}
              y2={CHART_HEIGHT}
              stroke={colors.divider}
              strokeWidth={1.2}
            />

            {/* Gradient Fill under Curve */}
            {points.length > 0 && (
              <Path d={fillPath} fill={`url(#curveGrad-${color})`} />
            )}

            {/* Curve Line */}
            <Path d={linePath} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />

            {/* Premium Interactive-style Dots */}
            {points.map((point) => (
              <G key={point.label}>
                {/* Glow ring */}
                <Circle cx={point.x} cy={point.y} r={6.5} fill={color} opacity={0.16} />
                {/* Core dot */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={3.2}
                  fill={colors.surface}
                  stroke={color}
                  strokeWidth={2}
                />
              </G>
            ))}
          </Svg>
          <View style={[styles.labelsRow, { width }]}>
            {points.map((point, index) => (
              <Text
                key={point.label}
                style={[styles.axisLabel, { left: point.x - 16 }]}
              >
                {index % labelEvery === 0 ? point.label : ""}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  labelsRow: {
    height: 16,
  },
  axisLabel: {
    position: "absolute",
    width: 32,
    fontSize: 9,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
});


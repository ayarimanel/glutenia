import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Radius, Spacing } from "../theme/colors";

const DAY_MINUTES = 24 * 60;
const STEP_MINUTES = 15;
const MIN_GAP_MINUTES = 30;
const THUMB_HIT_SIZE = 40;
const THUMB_VISUAL_SIZE = 24;
const TRACK_HEIGHT = 6;
const TICK_LABELS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

const clamp = (min, value, max) => Math.max(min, Math.min(max, value));

const toMinutes = (time) => Number(time.hour) * 60 + Number(time.minute);

const snapMinutes = (minutes) =>
  Math.round(clamp(0, minutes, DAY_MINUTES - STEP_MINUTES) / STEP_MINUTES) * STEP_MINUTES;

const toTime = (minutes) => {
  const snapped = snapMinutes(minutes);
  const hour = Math.floor(snapped / 60);
  const minute = snapped % 60;
  return { hour: String(hour).padStart(2, "0"), minute: String(minute).padStart(2, "0") };
};

const formatMinutes = (minutes) => {
  const t = toTime(minutes);
  return `${t.hour}:${t.minute}`;
};

export default function TimeRangeSlider({ openTime, closeTime, onChange }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const trackWidthRef = useRef(0);
  const openMinutesRef = useRef(toMinutes(openTime));
  const closeMinutesRef = useRef(toMinutes(closeTime));
  const openDragStartRef = useRef(0);
  const closeDragStartRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [, setTick] = useState(0);
  const rerender = () => setTick((n) => n + 1);
  const [activeThumb, setActiveThumb] = useState(null);

  const propOpenMinutes = toMinutes(openTime);
  const propCloseMinutes = toMinutes(closeTime);
  if (propOpenMinutes !== openMinutesRef.current && activeThumb !== "open") {
    openMinutesRef.current = propOpenMinutes;
  }
  if (propCloseMinutes !== closeMinutesRef.current && activeThumb !== "close") {
    closeMinutesRef.current = propCloseMinutes;
  }

  const openPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        openDragStartRef.current = openMinutesRef.current;
        setActiveThumb("open");
      },
      onPanResponderMove: (_, gesture) => {
        if (!trackWidthRef.current) return;
        const deltaMinutes = (gesture.dx / trackWidthRef.current) * DAY_MINUTES;
        const maxAllowed = closeMinutesRef.current - MIN_GAP_MINUTES;
        openMinutesRef.current = snapMinutes(
          clamp(0, openDragStartRef.current + deltaMinutes, maxAllowed)
        );
        rerender();
      },
      onPanResponderRelease: () => {
        setActiveThumb(null);
        onChangeRef.current(toTime(openMinutesRef.current), toTime(closeMinutesRef.current));
      },
    })
  ).current;

  const closePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        closeDragStartRef.current = closeMinutesRef.current;
        setActiveThumb("close");
      },
      onPanResponderMove: (_, gesture) => {
        if (!trackWidthRef.current) return;
        const deltaMinutes = (gesture.dx / trackWidthRef.current) * DAY_MINUTES;
        const minAllowed = openMinutesRef.current + MIN_GAP_MINUTES;
        closeMinutesRef.current = snapMinutes(
          clamp(minAllowed, closeDragStartRef.current + deltaMinutes, DAY_MINUTES)
        );
        rerender();
      },
      onPanResponderRelease: () => {
        setActiveThumb(null);
        onChangeRef.current(toTime(openMinutesRef.current), toTime(closeMinutesRef.current));
      },
    })
  ).current;

  const trackWidth = trackWidthRef.current;
  const rawX = (minutes) => (trackWidth ? (minutes / DAY_MINUTES) * trackWidth : 0);
  const openX = rawX(openMinutesRef.current);
  const closeX = rawX(closeMinutesRef.current);

  return (
    <View style={styles.wrap}>
      <View style={styles.valuesRow}>
        <View style={styles.valueBox}>
          <Text style={styles.valueCaption}>{t("seller.form.openTime")}</Text>
          <Text style={styles.valueText}>{formatMinutes(openMinutesRef.current)}</Text>
        </View>
        <View style={[styles.valueBox, styles.valueBoxEnd]}>
          <Text style={styles.valueCaption}>{t("seller.form.closeTime")}</Text>
          <Text style={styles.valueText}>{formatMinutes(closeMinutesRef.current)}</Text>
        </View>
      </View>

      <View
        style={styles.sliderArea}
        onLayout={(e) => {
          trackWidthRef.current = e.nativeEvent.layout.width;
          rerender();
        }}
      >
        <View style={styles.trackBg} />
        <View
          style={[
            styles.trackFill,
            { left: openX, width: Math.max(0, closeX - openX) },
          ]}
        />

        <View
          {...openPanResponder.panHandlers}
          style={[
            styles.thumbHit,
            { transform: [{ translateX: openX - THUMB_HIT_SIZE / 2 }] },
          ]}
        >
          <View style={[styles.thumb, activeThumb === "open" && styles.thumbActive]} />
        </View>

        <View
          {...closePanResponder.panHandlers}
          style={[
            styles.thumbHit,
            { transform: [{ translateX: closeX - THUMB_HIT_SIZE / 2 }] },
          ]}
        >
          <View style={[styles.thumb, activeThumb === "close" && styles.thumbActive]} />
        </View>
      </View>

      <View style={styles.ticksRow}>
        {TICK_LABELS.map((label) => (
          <Text key={label} style={styles.tickText}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  valueBox: {
    alignItems: "flex-start",
  },
  valueBoxEnd: {
    alignItems: "flex-end",
  },
  valueCaption: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  sliderArea: {
    height: THUMB_HIT_SIZE,
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  trackBg: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.divider,
  },
  trackFill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.primary,
  },
  thumbHit: {
    position: "absolute",
    width: THUMB_HIT_SIZE,
    height: THUMB_HIT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_VISUAL_SIZE,
    height: THUMB_VISUAL_SIZE,
    borderRadius: THUMB_VISUAL_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbActive: {
    width: THUMB_VISUAL_SIZE + 6,
    height: THUMB_VISUAL_SIZE + 6,
    borderRadius: (THUMB_VISUAL_SIZE + 6) / 2,
  },
  ticksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tickText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
});

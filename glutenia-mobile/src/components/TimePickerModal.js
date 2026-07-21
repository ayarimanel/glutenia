import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import WheelPicker from "./WheelPicker";
import { Radius, Spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export default function TimePickerModal({
  visible,
  title,
  hour,
  minute,
  onCancel,
  onConfirm,
  doneLabel,
  cancelLabel,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [hourIndex, setHourIndex] = useState(0);
  const [minuteIndex, setMinuteIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      const hIndex = HOURS.indexOf(hour);
      const mIndex = MINUTES.indexOf(minute);
      setHourIndex(hIndex >= 0 ? hIndex : 0);
      setMinuteIndex(mIndex >= 0 ? mIndex : 0);
    }
  }, [visible, hour, minute]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {visible ? (
            <View style={styles.wheels}>
              <WheelPicker items={HOURS} selectedIndex={hourIndex} onChange={setHourIndex} />
              <Text style={styles.colon}>:</Text>
              <WheelPicker items={MINUTES} selectedIndex={minuteIndex} onChange={setMinuteIndex} />
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={() => onConfirm(HOURS[hourIndex], MINUTES[minuteIndex])}
            >
              <Text style={styles.confirmText}>{doneLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  sheet: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  wheels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  colon: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    color: colors.surface,
    fontWeight: "800",
  },
});

import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  BackHandler,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
  CircleCheck,
  AlertTriangle,
  CircleX,
  Info,
  HelpCircle,
} from "lucide-react-native";

export default function CustomAlertDialog({
  visible,
  title,
  message,
  buttons,
  options,
  onClose,
}) {
  const { colors, isDark } = useTheme();
  const [active, setActive] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Track visibility state to run exit animations
  useEffect(() => {
    if (visible) {
      setActive(true);
      // Play entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1), // Apple-like easeOut
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      ]).start();
    }
  }, [visible]);

  // Handle hardware back button on Android
  useEffect(() => {
    if (!active) return;

    const cancelable = options?.cancelable ?? false;
    const onBackPress = () => {
      if (cancelable) {
        dismiss();
        return true;
      }
      // Return true to prevent default back action (disable back press)
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => {
      subscription.remove();
    };
  }, [active, options]);

  const dismiss = (callback) => {
    // Play exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start(() => {
      setActive(false);
      onClose();
      if (callback) callback();
    });
  };

  if (!active) return null;

  // 1. Classify the Alert
  const classifyAlert = (tTitle, tMsg, tButtons) => {
    const t = (tTitle || "").toLowerCase();
    const m = (tMsg || "").toLowerCase();
    const btnCount = tButtons ? tButtons.length : 0;

    const hasCancel = tButtons && tButtons.some(
      (b) =>
        b.style === "cancel" ||
        (b.text &&
          (b.text.toLowerCase().includes("cancel") ||
            b.text.toLowerCase().includes("annuler") ||
            b.text.toLowerCase().includes("إلغاء")))
    );
    const isDestructive = tButtons && tButtons.some((b) => b.style === "destructive");

    const successKeywords = [
      "success", "succeeded", "valider", "enregistré", "créé", "modifié",
      "terminé", "ajouté", "payé", "changé", "completed", "saved", "created",
      "added", "updated", "sent", "changed", "ready", "pin success", "pinned",
      "succès", "félicitations", "bravo", "نجاح", "تم ", "حفظ", "إضافة", "تعديل", "تحديث"
    ];
    const isSuccess = successKeywords.some((kw) => t.includes(kw) || m.includes(kw));

    const errorKeywords = [
      "error", "failed", "échec", "erreur", "impossible", "invalid", "wrong",
      "cannot", "unable", "denied", "fail", "incorrect", "too large", "tooLarge",
      "failedmsg", "خطأ", "فشل", "غير صالح", "لا يمكن"
    ];
    const isError = errorKeywords.some((kw) => t.includes(kw) || m.includes(kw));

    const warningKeywords = [
      "warning", "caution", "alert", "expire", "attention", "danger", "warn",
      "avertissement", "تحذير", "تنبيه"
    ];
    const isWarning = warningKeywords.some((kw) => t.includes(kw) || m.includes(kw));

    if (isError) return "error";
    if (isSuccess) return "success";
    if (isWarning) return "warning";
    if (btnCount > 1 || isDestructive || hasCancel) return "confirmation";

    return "information";
  };

  const type = classifyAlert(title, message, buttons);

  // 2. Determine Styling by Type
  let IconComponent = Info;
  let iconColor = colors.primary;
  let bgIconColor = isDark ? "rgba(139, 195, 74, 0.15)" : "rgba(139, 195, 74, 0.1)";

  switch (type) {
    case "success":
      IconComponent = CircleCheck;
      iconColor = colors.primary; // Green
      bgIconColor = isDark ? "rgba(139, 195, 74, 0.18)" : "rgba(139, 195, 74, 0.12)";
      break;
    case "error":
      IconComponent = CircleX;
      iconColor = colors.danger; // Red
      bgIconColor = isDark ? "rgba(255, 69, 58, 0.18)" : "rgba(200, 16, 46, 0.12)";
      break;
    case "warning":
      IconComponent = AlertTriangle;
      iconColor = colors.warning; // Amber
      bgIconColor = isDark ? "rgba(255, 214, 10, 0.18)" : "rgba(245, 158, 11, 0.12)";
      break;
    case "confirmation":
      IconComponent = HelpCircle;
      iconColor = colors.secondary; // Brown / Secondary Accent
      bgIconColor = isDark ? "rgba(196, 137, 90, 0.18)" : "rgba(123, 70, 38, 0.12)";
      break;
    case "information":
    default:
      IconComponent = Info;
      iconColor = "#007AFF"; // Apple Blue
      bgIconColor = isDark ? "rgba(10, 132, 255, 0.18)" : "rgba(0, 122, 255, 0.12)";
      break;
  }

  // 3. Setup Buttons
  const alertButtons = buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];

  const handleButtonPress = (onPress) => {
    dismiss(() => {
      if (onPress) onPress();
    });
  };

  const cancelable = options?.cancelable ?? false;
  const handleBackdropPress = () => {
    if (cancelable) {
      dismiss();
    }
  };

  // Get dynamic styles matching theme colors
  const styles = getStyles(colors, isDark);

  return (
    <Modal
      transparent
      visible={active}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (cancelable) dismiss();
      }}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Large Colorful Icon */}
          <View style={[styles.iconContainer, { backgroundColor: bgIconColor }]}>
            <IconComponent size={28} color={iconColor} strokeWidth={2.4} />
          </View>

          {/* Title */}
          {title ? <Text style={styles.title}>{title}</Text> : null}

          {/* Description Message */}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons Layout */}
          <View
            style={[
              styles.buttonsContainer,
              alertButtons.length === 2 ? styles.buttonsRow : styles.buttonsColumn,
            ]}
          >
            {alertButtons.map((btn, index) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";

              // Determine custom styling per button
              let btnBgColor = colors.primary;
              let btnBorderColor = "transparent";
              let btnTextColor = "#FFFFFF";

              if (isCancel) {
                btnBgColor = "transparent";
                btnBorderColor = colors.border;
                btnTextColor = colors.textMuted;
              } else if (isDestructive) {
                btnBgColor = colors.danger;
                btnTextColor = "#FFFFFF";
              }

              return (
                <Pressable
                  key={index}
                  android_ripple={{
                    color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                    borderless: false,
                  }}
                  onPress={() => handleButtonPress(btn.onPress)}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: btnBgColor,
                      borderColor: btnBorderColor,
                      borderWidth: isCancel ? 1.5 : 0,
                      flex: alertButtons.length === 2 ? 1 : 0,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: btnTextColor,
                        fontWeight: isCancel ? "600" : "700",
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(0, 0, 0, 0.45)",
      padding: 24,
    },
    card: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.35 : 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textDark,
      textAlign: "center",
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: 24,
      paddingHorizontal: 6,
    },
    buttonsContainer: {
      width: "100%",
      gap: 12,
    },
    buttonsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    buttonsColumn: {
      flexDirection: "column",
    },
    button: {
      height: 48,
      borderRadius: 24, // Pill shape
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden", // So ripple doesn't bleed out of rounded corners
    },
    buttonText: {
      fontSize: 14,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.85,
    },
  });

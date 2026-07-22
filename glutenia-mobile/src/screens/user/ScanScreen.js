import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import AppHeader from "../../components/AppHeader";
import AppIcon from "../../components/AppIcon";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { notifyGamification } from "../../context/GamificationContext";
import { useTheme } from "../../context/ThemeContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTranslation } from "react-i18next";

const FRAME_W = 260;
const FRAME_H = 120;
const TAB_BAR_HEIGHT = 66;

const SCANNING = "scanning";
const LOADING = "loading";
const FOUND = "found";
const NOT_FOUND = "not_found";

export default function ScanScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user, token } = useAuth();
  const cart = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState(SCANNING);
  const [product, setProduct] = useState(null);
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const scanLock = useRef(false);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Fix 3: reset scan lock whenever the screen loses focus so the
  // camera is ready for a fresh scan when the user returns to this tab.
  useFocusEffect(
    useCallback(() => {
      return () => {
        scanLock.current = false;
      };
    }, [])
  );

  // Fix 6: admin stack has no CartPage — avoid a navigation crash.
  const handleCartPress =
    user?.role === "admin"
      ? undefined
      : () => navigation.navigate("CartPage");

  // Fix 5: compute bottom padding once so every state uses the same value.
  const bottomPad = insets.bottom + TAB_BAR_HEIGHT + Spacing.lg;

  const resetToScanning = () => {
    setProduct(null);
    setScreenState(SCANNING);
    setFlagged(false);
    scanLock.current = false;
  };

  const handleFlagCommunityProduct = async () => {
    if (!product?._id) return;
    setFlagging(true);
    try {
      await api.flagCommunityProduct(token, product._id);
      setFlagged(true);
    } catch (error) {
      Alert.alert(t("scan.flagFailed"), error.message);
    } finally {
      setFlagging(false);
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanLock.current) return;
    scanLock.current = true;

    // Fix 4: transition to LOADING immediately so the user sees a
    // spinner instead of a frozen camera with no feedback.
    setScreenState(LOADING);
    setScannedBarcode(data);
    setFlagged(false);

    try {
      const { gamification, ...found } = await api.productByBarcode(data, token);
      setProduct(found);
      setScreenState(FOUND);
      notifyGamification(gamification);
    } catch (error) {
      if (error.status === 404) {
        setScreenState(NOT_FOUND);
      } else {
        // Non-404 error: show alert, then return to scanning on dismiss.
        Alert.alert(t("scan.scanError"), error.message, [
          {
            text: t("scan.ok"),
            onPress: () => {
              scanLock.current = false;
              setScreenState(SCANNING);
            },
          },
        ]);
      }
    }
  };

  // Permission status not yet resolved
  if (!permission) {
    return <View style={styles.root} />;
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <AppHeader
          userName={user?.name ?? ""}
          avatarUri={user?.avatar}
          onCartPress={handleCartPress}
          safeTop
        />
        <View style={[styles.center, { paddingBottom: bottomPad }]}>
          <View style={styles.iconCircle}>
            <AppIcon name="scan" size={48} color={colors.primary} />
          </View>
          <Text style={styles.headingText}>{t("scan.permissionTitle")}</Text>
          <Text style={styles.bodyText}>
            {t("scan.permissionBody")}
          </Text>
          {permission.canAskAgain ? (
            <Pressable style={styles.primaryBtn} onPress={requestPermission}>
              <Text style={styles.primaryBtnText}>{t("scan.grantAccess")}</Text>
            </Pressable>
          ) : (
            <>
              <Text style={styles.bodyText}>
                {t("scan.permissionDenied")}
              </Text>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.primaryBtnText}>{t("scan.openSettings")}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  // State LOADING: API call in flight
  if (screenState === LOADING) {
    return (
      <View style={styles.root}>
        <AppHeader
          userName={user?.name ?? ""}
          avatarUri={user?.avatar}
          onCartPress={handleCartPress}
          safeTop
        />
        <View style={[styles.center, { paddingBottom: bottomPad }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.bodyText}>{t("scan.checking")}</Text>
        </View>
      </View>
    );
  }

  // State FOUND, community-reported barcode: no price/stock, this isn't a
  // sellable shop listing, just a shared "someone already confirmed this
  // is/isn't gluten-free" flag — needs its own layout, not the shop card.
  if (screenState === FOUND && product?.isCommunityReport) {
    return (
      <View style={styles.root}>
        <AppHeader
          userName={user?.name ?? ""}
          avatarUri={user?.avatar}
          onCartPress={handleCartPress}
          safeTop
        />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View
              style={[
                styles.glutenBadge,
                !product.isGlutenFree && styles.glutenBadgeWarning,
              ]}
            >
              <AppIcon
                name={product.isGlutenFree ? "checkmark" : "close-circle"}
                size={15}
                color="#fff"
              />
              <Text style={styles.glutenBadgeText}>
                {product.isGlutenFree ? t("scan.glutenFree") : t("scan.containsGluten")}
              </Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            {!!product.brand && <Text style={styles.productDesc}>{product.brand}</Text>}
            <Text style={styles.productDesc}>{t("scan.communityReported")}</Text>
            {product.disputed && (
              <View style={styles.disputedBanner}>
                <AppIcon name="info" size={14} color={colors.warning} />
                <Text style={styles.disputedText}>{t("scan.disputedWarning")}</Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.secondaryBtn}
            onPress={handleFlagCommunityProduct}
            disabled={flagging || flagged}
          >
            <AppIcon name="close-circle" size={18} color={flagged ? colors.textMuted : colors.primary} />
            <Text style={styles.secondaryBtnText}>
              {flagged ? t("scan.flagged") : t("scan.flagIncorrect")}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={resetToScanning}>
            <AppIcon name="scan" size={18} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>{t("scan.scanAnother")}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // State FOUND: real shop product returned from API
  if (screenState === FOUND && product) {
    return (
      <View style={styles.root}>
        <AppHeader
          userName={user?.name ?? ""}
          avatarUri={user?.avatar}
          onCartPress={handleCartPress}
          safeTop
        />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPad },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.glutenBadge}>
              <AppIcon name="checkmark" size={15} color="#fff" />
              <Text style={styles.glutenBadgeText}>{t("scan.glutenFree")}</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>
              {product.price.toFixed(2)} TND
            </Text>
            {!!product.description && (
              <Text style={styles.productDesc}>{product.description}</Text>
            )}
          </View>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              if (cart) {
                cart.addItem(product, 1);
                Alert.alert(
                  t("scan.addedTitle"),
                  t("scan.addedMsg", { name: product.name })
                );
              }
            }}
            disabled={!cart}
          >
            <AppIcon name="basket" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{t("scan.addToCart")}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={resetToScanning}>
            <AppIcon name="scan" size={18} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>{t("scan.scanAnother")}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // State NOT_FOUND
  if (screenState === NOT_FOUND) {
    return (
      <View style={styles.root}>
        <AppHeader
          userName={user?.name ?? ""}
          avatarUri={user?.avatar}
          onCartPress={handleCartPress}
          safeTop
        />
        <View style={[styles.center, { paddingBottom: bottomPad }]}>
          <View style={[styles.iconCircle, styles.iconCircleGray]}>
            <AppIcon name="close-circle" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.headingText}>{t("scan.notFoundTitle")}</Text>
          <Text style={styles.bodyText}>
            {t("scan.notFoundBody")}
          </Text>
          <Pressable style={styles.primaryBtn} onPress={resetToScanning}>
            <AppIcon name="scan" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{t("scan.tryAgain")}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("LabelScan")}
          >
            <AppIcon name="image" size={18} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>{t("labelScan.fromScan")}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("SubmitProduct", { barcode: scannedBarcode })}
          >
            <AppIcon name="add-circle" size={18} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>{t("scan.addThisProduct")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // State SCANNING — full-screen camera with overlay frame
  return (
    <View style={styles.root}>
      {/* Fix 1: only mount CameraView while this tab is actually visible. */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}

      {/* Top mask */}
      <View
        style={[styles.maskTop, { paddingTop: insets.top + Spacing.md }]}
      >
        <Text style={styles.scanTitle}>{t("scan.title")}</Text>
      </View>

      {/* Middle row: dark sides + transparent guide frame */}
      <View style={styles.maskRow}>
        <View style={styles.maskSide} />
        <View style={styles.frame} />
        <View style={styles.maskSide} />
      </View>

      {/* Fix 2: bottom mask clears the floating tab bar so the hint is visible. */}
      <View
        style={[
          styles.maskBottom,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.md },
        ]}
      >
        <Text style={styles.scanHint}>{t("scan.hint")}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  iconCircleGray: {
    backgroundColor: colors.divider,
  },
  headingText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textDark,
    textAlign: "center",
  },
  bodyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignSelf: "stretch",
    marginTop: Spacing.sm,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignSelf: "stretch",
    marginTop: Spacing.sm,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow,
  },
  glutenBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  glutenBadgeWarning: {
    backgroundColor: colors.danger,
  },
  disputedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: `${colors.warning}22`,
  },
  disputedText: { flex: 1, fontSize: 12, color: colors.textDark, fontWeight: "600" },
  glutenBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  productName: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textDark,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  productDesc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },

  maskTop: {
    backgroundColor: "rgba(0,0,0,0.55)",
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: Spacing.md,
  },
  maskRow: {
    flexDirection: "row",
    height: FRAME_H,
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: Radius.md,
    backgroundColor: "transparent",
  },
  maskBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    width: "100%",
    alignItems: "center",
    paddingTop: Spacing.md,
  },
  scanTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  scanHint: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

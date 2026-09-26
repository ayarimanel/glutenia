import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import Field from "../../components/Field";
import ProductVisual from "../../components/ProductVisual";
import { IconButton, PrimaryButton } from "../../components/Buttons";
import { useAuthenticated } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { RouteProp } from "@react-navigation/native";
import type { AppNavigation, RootParamList } from "../../navigation/types";
import type { Product } from "../../types/models";

interface SellerListingFormScreenProps {
  navigation: AppNavigation;
  route: RouteProp<RootParamList, "SellerProductForm">;
}

interface ListingFormErrors {
  price?: string;
  stock?: string;
}

// A Professional can never create a brand-new product here - they pick an
// existing admin-managed catalog entry (step 1) then attach their own
// price/stock/availability to it (step 2). Editing an existing listing
// skips straight to step 2, since the catalog product it points to is fixed.
export default function SellerListingFormScreen({ navigation, route }: SellerListingFormScreenProps) {
  const { token } = useAuthenticated();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const listingId = route.params?.listingId;

  const [catalogProduct, setCatalogProduct] = useState<Pick<Product, "_id" | "name" | "category" | "imageUrl"> | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!listingId) return;

    const loadListing = async () => {
      try {
        const listing = await api.listing(listingId);
        setCatalogProduct({
          _id: listing.product,
          name: listing.name,
          category: listing.category,
          imageUrl: listing.imageUrl,
        });
        setPrice(String(listing.price));
        setStock(String(listing.stock));
        setIsAvailable(listing.isAvailable);
      } catch (err) {
        Alert.alert(t("seller.listingForm.errorTitle"), (err as ApiError).message);
        navigation.goBack();
      }
    };

    loadListing();
  }, [listingId]);

  useEffect(() => {
    if (listingId || !search.trim()) {
      setSearchResults([]);
      return;
    }

    const handle = setTimeout(() => {
      api.products({ search }).then(setSearchResults).catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, listingId]);

  const save = async () => {
    const numericPrice = Number(price.trim());
    const numericStock = Number(stock.trim());
    const nextErrors: ListingFormErrors = {};

    if (!price.trim() || Number.isNaN(numericPrice) || numericPrice < 0) {
      nextErrors.price = t("seller.listingForm.errors.priceInvalid");
    }

    if (!stock.trim() || !Number.isInteger(numericStock) || numericStock < 0) {
      nextErrors.stock = t("seller.listingForm.errors.stockInvalid");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !catalogProduct) {
      return;
    }

    try {
      setLoading(true);

      if (listingId) {
        await api.updateListing(token, listingId, { price: numericPrice, stock: numericStock, isAvailable });
      } else {
        await api.createListing(token, {
          productId: catalogProduct._id,
          price: numericPrice,
          stock: numericStock,
          isAvailable,
        });
      }

      Alert.alert(t("seller.listingForm.saved"), t("seller.listingForm.savedMsg"), [
        { text: t("admin.ok"), onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(t("seller.listingForm.saveFailed"), (err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <SectionHeader
          eyebrow={t("seller.listingForm.eyebrow")}
          title={listingId ? t("seller.listingForm.titleEdit") : t("seller.listingForm.titleAdd")}
          right={<IconButton icon="close" onPress={() => navigation.goBack()} />}
        />

        {!catalogProduct ? (
          <>
            <Field
              label={t("seller.listingForm.searchLabel")}
              value={search}
              onChangeText={setSearch}
              placeholder={t("seller.listingForm.searchPlaceholder")}
            />
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.resultsList}
              renderItem={({ item }) => (
                <Pressable style={styles.resultRow} onPress={() => setCatalogProduct(item)}>
                  <View style={styles.resultVisual}>
                    <ProductVisual product={item} />
                  </View>
                  <View>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultCategory}>{item.category}</Text>
                  </View>
                </Pressable>
              )}
            />
          </>
        ) : (
          <>
            <View style={styles.selectedCard}>
              <View style={styles.selectedVisual}>
                <ProductVisual product={catalogProduct} />
              </View>
              <View style={styles.selectedBody}>
                <Text style={styles.selectedName}>{catalogProduct.name}</Text>
                <Text style={styles.selectedCategory}>{catalogProduct.category}</Text>
              </View>
              {!listingId && (
                <Pressable onPress={() => setCatalogProduct(null)}>
                  <Text style={styles.changeLink}>{t("seller.listingForm.change")}</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.split}>
              <Field
                label={t("seller.listingForm.price")}
                value={price}
                error={errors.price}
                onChangeText={(value) => {
                  setPrice(value);
                  setErrors((current) => ({ ...current, price: "" }));
                }}
                keyboardType="decimal-pad"
                style={styles.flex}
              />
              <Field
                label={t("seller.listingForm.stock")}
                value={stock}
                error={errors.stock}
                onChangeText={(value) => {
                  setStock(value);
                  setErrors((current) => ({ ...current, stock: "" }));
                }}
                keyboardType="number-pad"
                style={styles.flex}
              />
            </View>

            <View style={styles.switchCard}>
              <View>
                <Text style={styles.switchTitle}>{t("seller.listingForm.available")}</Text>
                <Text style={styles.switchSub}>{t("seller.listingForm.availableSub")}</Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: colors.divider, true: colors.secondaryPale }}
                thumbColor={isAvailable ? colors.secondary : colors.textMuted}
              />
            </View>

            <PrimaryButton
              title={listingId ? t("seller.listingForm.update") : t("seller.listingForm.save")}
              icon="save"
              loading={loading}
              onPress={save}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  resultsList: {
    gap: 8,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: 10,
    ...Shadow,
  },
  resultVisual: {
    width: 56,
  },
  resultName: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "800",
  },
  resultCategory: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: 10,
    ...Shadow,
  },
  selectedVisual: {
    width: 64,
  },
  selectedBody: {
    flex: 1,
    gap: 4,
  },
  selectedName: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "900",
  },
  selectedCategory: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  changeLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  split: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  switchCard: {
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  switchTitle: {
    color: colors.textDark,
    fontWeight: "900",
  },
  switchSub: {
    color: colors.textMuted,
    marginTop: 4,
  },
});

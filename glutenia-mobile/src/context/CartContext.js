import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";

const storageKey = (userId) => `glutenia.cart.${userId}`;
const CartContext = createContext(null);

// A product with no numeric stock (shouldn't happen given the backend
// schema defaults to 0, but defensive) is treated as unlimited rather than
// silently blocking every add.
const availableStock = (product) =>
  typeof product?.stock === "number" ? product.stock : Infinity;

export const CartProvider = ({ children }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems([]);
    if (!user?.id) return;
    const restore = async () => {
      const saved = await AsyncStorage.getItem(storageKey(user.id));
      if (saved) setItems(JSON.parse(saved));
    };
    restore();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.setItem(storageKey(user.id), JSON.stringify(items));
  }, [items, user?.id]);

  // Adds a product to the cart, always capped at its available stock — the
  // one place every screen (Home/Shop/ProductDetail) should call through so
  // the "can't add more than what's in stock" rule and its user feedback
  // only exist once instead of being copy-pasted at every call site.
  const addItemWithStockCheck = (product, qty = 1) => {
    const stock = availableStock(product);

    if (stock <= 0) {
      Alert.alert(t("cart.outOfStockTitle"), t("cart.outOfStockMsg", { name: product.name }));
      return false;
    }

    let added = 0;
    setItems((current) => {
      const existing = current.find((item) => item.productId === product._id);
      const currentQty = existing?.qty ?? 0;
      const nextQty = Math.min(currentQty + qty, stock);
      added = nextQty - currentQty;

      if (added <= 0) return current;

      if (existing) {
        return current.map((item) =>
          item.productId === product._id ? { ...item, qty: nextQty, stock } : item
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          stock,
          qty: nextQty,
        },
      ];
    });

    if (added <= 0) {
      Alert.alert(t("cart.maxInCartTitle"), t("cart.maxInCartMsg", { stock }));
      return false;
    }

    Alert.alert(t("cart.addedTitle"), t("cart.addedMsg", { name: product.name }));
    return true;
  };

  // Lower-level setter kept for callers that already know exactly what they
  // want the cart to contain (e.g. syncing from persisted storage) — still
  // clamps to stock as a last line of defense, but doesn't show any alert.
  const addItem = (product, qty = 1) => {
    const stock = availableStock(product);
    setItems((current) => {
      const existing = current.find((item) => item.productId === product._id);
      const currentQty = existing?.qty ?? 0;
      const nextQty = Math.min(currentQty + qty, stock);
      if (nextQty <= 0) return current;

      if (existing) {
        return current.map((item) =>
          item.productId === product._id ? { ...item, qty: nextQty, stock } : item
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          stock,
          qty: nextQty,
        },
      ];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, qty: Math.min(qty, availableStock(item)) }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  const value = useMemo(
    () => ({ items, addItem, addItemWithStockCheck, updateQty, removeItem, clearCart, total, count }),
    [items, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";
import type { Listing } from "../types/models";

const storageKey = (userId: string) => `glutenia.cart.${userId}`;

export interface CartItem {
  listingId: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: Listing["category"];
  stock: number;
  qty: number;
}

export type CartProductInput = Pick<Listing, "_id" | "name" | "price" | "imageUrl" | "category" | "stock">;

export interface CartContextValue {
  items: CartItem[];
  addItem: (listing: CartProductInput, qty?: number) => void;
  addItemWithStockCheck: (listing: CartProductInput, qty?: number) => boolean;
  updateQty: (listingId: string, qty: number) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const availableStock = (listing: { stock?: number }): number =>
  typeof listing?.stock === "number" ? listing.stock : Infinity;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems([]);
    if (!user?._id) return;
    const restore = async () => {
      const saved = await AsyncStorage.getItem(storageKey(user._id));
      if (saved) setItems(JSON.parse(saved));
    };
    restore();
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    AsyncStorage.setItem(storageKey(user._id), JSON.stringify(items));
  }, [items, user?._id]);

  const addItemWithStockCheck = (listing: CartProductInput, qty = 1): boolean => {
    const stock = availableStock(listing);

    if (stock <= 0) {
      Alert.alert(t("cart.outOfStockTitle"), t("cart.outOfStockMsg", { name: listing.name }));
      return false;
    }

    let added = 0;
    setItems((current) => {
      const existing = current.find((item) => item.listingId === listing._id);
      const currentQty = existing?.qty ?? 0;
      const nextQty = Math.min(currentQty + qty, stock);
      added = nextQty - currentQty;

      if (added <= 0) return current;

      if (existing) {
        return current.map((item) =>
          item.listingId === listing._id ? { ...item, qty: nextQty, stock } : item
        );
      }

      return [
        ...current,
        {
          listingId: listing._id,
          name: listing.name,
          price: listing.price,
          imageUrl: listing.imageUrl,
          category: listing.category,
          stock,
          qty: nextQty,
        },
      ];
    });

    if (added <= 0) {
      Alert.alert(t("cart.maxInCartTitle"), t("cart.maxInCartMsg", { stock }));
      return false;
    }

    Alert.alert(t("cart.addedTitle"), t("cart.addedMsg", { name: listing.name }));
    return true;
  };

  const addItem = (listing: CartProductInput, qty = 1): void => {
    const stock = availableStock(listing);
    setItems((current) => {
      const existing = current.find((item) => item.listingId === listing._id);
      const currentQty = existing?.qty ?? 0;
      const nextQty = Math.min(currentQty + qty, stock);
      if (nextQty <= 0) return current;

      if (existing) {
        return current.map((item) =>
          item.listingId === listing._id ? { ...item, qty: nextQty, stock } : item
        );
      }

      return [
        ...current,
        {
          listingId: listing._id,
          name: listing.name,
          price: listing.price,
          imageUrl: listing.imageUrl,
          category: listing.category,
          stock,
          qty: nextQty,
        },
      ];
    });
  };

  const updateQty = (listingId: string, qty: number): void => {
    if (qty <= 0) {
      removeItem(listingId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.listingId === listingId
          ? { ...item, qty: Math.min(qty, availableStock(item)) }
          : item
      )
    );
  };

  const removeItem = (listingId: string): void => {
    setItems((current) => current.filter((item) => item.listingId !== listingId));
  };

  const clearCart = (): void => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  const value = useMemo(
    () => ({ items, addItem, addItemWithStockCheck, updateQty, removeItem, clearCart, total, count }),
    [items, total, count, t]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

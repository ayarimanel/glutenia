import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "glutenia.cart";
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const restore = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    };

    restore();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing) {
        return current.map((item) =>
          item.productId === product._id
            ? { ...item, qty: item.qty + qty }
            : item
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
          qty,
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
      current.map((item) => (item.productId === productId ? { ...item, qty } : item))
    );
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  const value = useMemo(
    () => ({ items, addItem, updateQty, removeItem, clearCart, total, count }),
    [items, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

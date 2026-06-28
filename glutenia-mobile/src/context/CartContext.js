import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const storageKey = (userId) => `glutenia.cart.${userId}`;
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
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

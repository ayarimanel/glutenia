import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { CartProvider, useCart } from "../CartContext";
import { useAuth } from "../AuthContext";
import type { User } from "../../types/models";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

const testUser = { _id: "user-123" } as User;

const product = {
  _id: "prod-1",
  name: "Gluten-Free Bread",
  price: 5,
  category: "Bread" as const,
  stock: 10,
};

describe("CartContext persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockUseAuth.mockReturnValue({ user: testUser });
  });

  it("persists added items to AsyncStorage under a key derived from user._id", async () => {
    const { result } = await renderHook(() => useCart(), { wrapper: CartProvider });

    await act(async () => {
      result.current.addItem(product, 1);
    });

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("glutenia.cart.user-123");
      const items = stored ? JSON.parse(stored) : [];
      expect(items).toHaveLength(1);
    });

    const stored = await AsyncStorage.getItem("glutenia.cart.user-123");
    const items = JSON.parse(stored as string);
    expect(items).toEqual([
      expect.objectContaining({ listingId: "prod-1", name: "Gluten-Free Bread", qty: 1 }),
    ]);
  });
});

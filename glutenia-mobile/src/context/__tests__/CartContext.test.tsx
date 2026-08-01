import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { CartProvider, useCart } from "../CartContext";
import { useAuth } from "../AuthContext";
import type { User } from "../../types/models";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories run before imports are wired, so this must be require()
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

// The real backend User document has no `id` field, only `_id` (verified
// against User.js and every controller that serializes it - Mongoose's `id`
// virtual is not included in JSON output anywhere in this app). A test user
// shaped exactly like the real API response, deliberately without `id`, so
// this test fails the same way production silently failed before the
// TS migration: if CartContext's storage key or effect guards ever go back
// to reading `user.id` instead of `user._id`, `user.id` here is `undefined`,
// the `if (!user?.id) return` guard fires, and the cart is never persisted -
// the assertion below on the stored content would then fail.
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
      expect.objectContaining({ productId: "prod-1", name: "Gluten-Free Bread", qty: 1 }),
    ]);
  });
});

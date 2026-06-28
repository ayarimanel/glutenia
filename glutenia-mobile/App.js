import "./src/i18n";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { EventsProvider } from "./src/context/EventsContext";
import RootNavigator from "./src/navigation/RootNavigator";
import AppErrorBoundary from "./src/components/AppErrorBoundary";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
        <SafeAreaProvider>
          <AuthProvider>
            <CartProvider>
              <EventsProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </EventsProvider>
            </CartProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

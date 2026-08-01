import "./src/i18n";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { EventsProvider } from "./src/context/EventsContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { AlertProvider } from "./src/context/AlertContext";
import { GamificationProvider } from "./src/context/GamificationContext";
import RootNavigator from "./src/navigation/RootNavigator";
import AppErrorBoundary from "./src/components/AppErrorBoundary";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
        <SafeAreaProvider>
          <ThemeProvider>
            <AlertProvider>
              <AuthProvider>
                <CartProvider>
                  <EventsProvider>
                    <NotificationProvider>
                      <GamificationProvider>
                        <RootNavigator />
                      </GamificationProvider>
                    </NotificationProvider>
                  </EventsProvider>
                </CartProvider>
              </AuthProvider>
            </AlertProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}


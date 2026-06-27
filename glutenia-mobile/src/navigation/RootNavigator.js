import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../screens/SplashScreen";
import { Colors } from "../theme/colors";
import CustomTabBar from "../components/CustomTabBar";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import HomeScreen from "../screens/user/HomeScreen";
import ProductDetailScreen from "../screens/user/ProductDetailScreen";
import CartScreen from "../screens/user/CartScreen";
import CheckoutScreen from "../screens/user/CheckoutScreen";
import OrderSuccessScreen from "../screens/user/OrderSuccessScreen";
import UserOrdersScreen from "../screens/user/UserOrdersScreen";
import ScanScreen from "../screens/user/ScanScreen";
import MapScreen from "../screens/user/MapScreen";
import MapDetailScreen from "../screens/user/MapDetailScreen";
import EventsScreen from "../screens/user/EventsScreen";
import EventDetailScreen from "../screens/user/EventDetailScreen";
import CreateEventScreen from "../screens/user/CreateEventScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminProductFormScreen from "../screens/admin/AdminProductFormScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AccountScreen from "../screens/AccountScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import OnboardingRoleScreen from "../screens/onboarding/OnboardingRoleScreen";
import OnboardingJourneyScreen from "../screens/onboarding/OnboardingJourneyScreen";
import OnboardingGoalScreen from "../screens/onboarding/OnboardingGoalScreen";
import OnboardingConfidenceScreen from "../screens/onboarding/OnboardingConfidenceScreen";
import BadgeCollectionScreen from "../screens/user/BadgeCollectionScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Colors.background },
};

function BlankScreen() {
  return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function UserTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Events" component={EventsScreen} />
      <Tabs.Screen name="Scan" component={ScanScreen} />
      <Tabs.Screen name="Map" component={MapScreen} />
      <Tabs.Screen name="Profile" component={AccountScreen} />
    </Tabs.Navigator>
  );
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="UserTabs" component={UserTabs} />
      <Stack.Screen name="CartPage" component={CartScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="Orders" component={UserOrdersScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="BadgeCollection" component={BadgeCollectionScreen} />
      <Stack.Screen name="MapDetail" component={MapDetailScreen} />
    </Stack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tabs.Screen name="Products" component={AdminProductsScreen} />
      <Tabs.Screen name="Scan" component={ScanScreen} />
      <Tabs.Screen name="Orders" component={AdminOrdersScreen} />
      <Tabs.Screen name="Account" component={AccountScreen} />
    </Tabs.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminProductForm" component={AdminProductFormScreen} />
    </Stack.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

function ProfileOnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingRole" component={OnboardingRoleScreen} />
      <Stack.Screen name="OnboardingJourney" component={OnboardingJourneyScreen} />
      <Stack.Screen name="OnboardingGoal" component={OnboardingGoalScreen} />
      <Stack.Screen name="OnboardingConfidence" component={OnboardingConfidenceScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, hasSeenOnboarding, profileOnboardingDone } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (splashVisible) return <SplashScreen />;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!hasSeenOnboarding
        ? <OnboardingStack />
        : !user
        ? <AuthStack />
        : user.role === "admin"
        ? <AdminStack />
        : !profileOnboardingDone
        ? <ProfileOnboardingStack />
        : <UserStack />}
    </NavigationContainer>
  );
}

import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import SplashScreen from "../screens/SplashScreen";
import CustomTabBar from "../components/CustomTabBar";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ProfessionalPendingScreen from "../screens/auth/ProfessionalPendingScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";
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
import NotificationsScreen from "../screens/user/NotificationsScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminEventsScreen from "../screens/admin/AdminEventsScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminProductFormScreen from "../screens/admin/AdminProductFormScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminProfessionalRequestsScreen from "../screens/admin/AdminProfessionalRequestsScreen";
import AccountScreen from "../screens/AccountScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import OnboardingRoleScreen from "../screens/onboarding/OnboardingRoleScreen";
import OnboardingJourneyScreen from "../screens/onboarding/OnboardingJourneyScreen";
import OnboardingGoalScreen from "../screens/onboarding/OnboardingGoalScreen";
import OnboardingConfidenceScreen from "../screens/onboarding/OnboardingConfidenceScreen";
import BadgeCollectionScreen from "../screens/user/BadgeCollectionScreen";
import ShopScreen from "../screens/user/ShopScreen";
import PatientResourcesScreen from "../screens/user/PatientResourcesScreen";
import VideoPlayerScreen from "../screens/user/VideoPlayerScreen";
import ResourceDetailScreen from "../screens/user/ResourceDetailScreen";
import RecipesScreen from "../screens/user/RecipesScreen";
import RecipeDetailScreen from "../screens/user/RecipeDetailScreen";
import SettingsScreen from "../screens/user/SettingsScreen";
import LabelScanScreen from "../screens/user/LabelScanScreen";
import AdminSettingsScreen from "../screens/admin/AdminSettingsScreen";
import SellerVisibilityScreen from "../screens/user/SellerVisibilityScreen";
import SellerOrdersScreen from "../screens/user/SellerOrdersScreen";
import SellerEstablishmentScreen from "../screens/user/SellerEstablishmentScreen";
import SellerEstablishmentFormScreen from "../screens/user/SellerEstablishmentFormScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthStack({ bg }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bg } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ProfessionalPending" component={ProfessionalPendingScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
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

function UserStack({ bg }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bg } }}>
      <Stack.Screen name="UserTabs" component={UserTabs} />
      <Stack.Screen name="CartPage" component={CartScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="Orders" component={UserOrdersScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BadgeCollection" component={BadgeCollectionScreen} />
      <Stack.Screen name="MapDetail" component={MapDetailScreen} />
      <Stack.Screen name="ShopScreen" component={ShopScreen} />
      <Stack.Screen name="PatientResources" component={PatientResourcesScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="ResourceDetail" component={ResourceDetailScreen} />
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="LabelScan" component={LabelScanScreen} />
      <Stack.Screen name="SellerProducts" component={AdminProductsScreen} />
      <Stack.Screen name="SellerProductForm" component={AdminProductFormScreen} />
      <Stack.Screen name="SellerVisibility" component={SellerVisibilityScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerEstablishment" component={SellerEstablishmentScreen} />
      <Stack.Screen name="SellerEstablishmentForm" component={SellerEstablishmentFormScreen} />
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

function AdminStack({ bg }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bg } }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminProductForm" component={AdminProductFormScreen} />
      <Stack.Screen name="AdminEvents" component={AdminEventsScreen} />
      <Stack.Screen name="AdminProfessionalRequests" component={AdminProfessionalRequestsScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="Settings" component={AdminSettingsScreen} />
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
  const { isDark, colors } = useTheme();
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (splashVisible) return <SplashScreen />;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      {!hasSeenOnboarding
        ? <OnboardingStack />
        : !user
        ? <AuthStack bg={colors.background} />
        : user.role === "admin"
        ? <AdminStack bg={colors.background} />
        : !profileOnboardingDone && user.role !== "professional"
        ? <ProfileOnboardingStack />
        : <UserStack bg={colors.background} />}
    </NavigationContainer>
  );
}

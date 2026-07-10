import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export default function Screen({ children, style }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

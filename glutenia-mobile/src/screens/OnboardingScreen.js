import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing } from "../theme/colors";
import LanguageSelector from "../components/LanguageSelector";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = width * 0.82;

const SLIDE_ASSETS = [
  { id: "1", image: require("../../assets/onboarding/scan.png") },
  { id: "2", image: require("../../assets/onboarding/discover.png") },
  { id: "3", image: require("../../assets/onboarding/community.png") },
];



export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const SLIDES = SLIDE_ASSETS.map((s) => ({
    ...s,
    titleNormal: t(`onboarding.slide${s.id}.titleNormal`),
    titleHighlight: t(`onboarding.slide${s.id}.titleHighlight`),
    description: t(`onboarding.slide${s.id}.description`),
  }));

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (!isLast) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <SafeAreaView style={styles.container}>
      {activeIndex === 0 && (
        <View style={styles.langButton}>
          <LanguageSelector />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.imageWrap}>
              <Image source={item.image} style={styles.image} resizeMode="contain" />
            </View>
            <Text style={styles.title}>
              {item.titleNormal}
              <Text style={styles.titleHighlight}>{item.titleHighlight}</Text>
            </Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <ArrowLeft color={Colors.textDark} size={24} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <View key={i} style={styles.dotContainer}>
                {isActive ? (
                  <View style={styles.activeDotOuter}>
                    <View style={styles.activeDotInner} />
                  </View>
                ) : (
                  <View style={styles.inactiveDot} />
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <ArrowRight color="#FFFFFF" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  langButton: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.lg,
    zIndex: 10,
    elevation: 10,
  },
  slide: {
    width,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 1.5,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginBottom: Spacing.xl * 1.5,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textDark,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  description: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl * 1.2,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dotContainer: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  activeDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
});

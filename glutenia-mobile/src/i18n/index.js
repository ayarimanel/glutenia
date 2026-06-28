import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import fr from "./locales/fr";
import ar from "./locales/ar";
import en from "./locales/en";

const LANG_KEY = "glutenia.language";
const supported = ["fr", "ar", "en"];
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? "fr";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: supported.includes(deviceLocale) ? deviceLocale : "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v3",
  react: { useSuspense: false },
});

// Load saved language on startup
AsyncStorage.getItem(LANG_KEY).then((saved) => {
  if (saved && supported.includes(saved)) i18n.changeLanguage(saved);
});

// Save language whenever it changes
i18n.on("languageChanged", (lng) => AsyncStorage.setItem(LANG_KEY, lng));

export default i18n;

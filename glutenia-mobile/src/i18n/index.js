import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import fr from "./locales/fr";
import ar from "./locales/ar";
import en from "./locales/en";

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? "fr";
const supported = ["fr", "ar", "en"];

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

export default i18n;

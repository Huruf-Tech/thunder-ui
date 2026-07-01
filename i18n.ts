import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import local translations
import enTranslations from "./src/locals/en/translation.json";
import arTranslations from "./src/locals/ar/translation.json";

i18n
    .use(LanguageDetector)
    // passes i18n down to react-i18next
    .use(initReactI18next)
    .init({
        // Use local translation files
        resources: {
            en: { translation: enTranslations },
            ar: { translation: arTranslations },
        },
        fallbackLng: "ar",
        supportedLngs: ["en", "ar"],
        detection: {
            order: ["localStorage"], // First check localStorage, then browser settings
            lookupLocalStorage: "i18nextLng",
        },
        interpolation: {
            escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
        },
    })
    .catch(console.error);
export default i18n 
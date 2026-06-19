import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import bn from "./locales/bn.json";

i18n
    .use(LanguageDetector)        // remembers the user's choice in localStorage
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            bn: { translation: bn },
        },
        fallbackLng: "en",
        supportedLngs: ["en", "bn"],
        interpolation: { escapeValue: false }, // React already escapes
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "appLanguage",
        },
    });

export default i18n;

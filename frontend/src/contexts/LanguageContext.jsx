import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "inclass_language";

export const LANGUAGES = [
  { code: "en", name: "English", nameNative: "English" },
  { code: "hi", name: "Hindi", nameNative: "हिन्दी" },
  { code: "te", name: "Telugu", nameNative: "తెలుగు" },
  { code: "ta", name: "Tamil", nameNative: "தமிழ்" },
  { code: "bn", name: "Bengali", nameNative: "বাংলা" },
  { code: "es", name: "Spanish", nameNative: "Español" },
  { code: "fr", name: "French", nameNative: "Français" },
  { code: "ar", name: "Arabic", nameNative: "العربية" },
  { code: "zh", name: "Chinese", nameNative: "简体中文" },
];

const translations = {
  en: {
    about: "About",
    accessibility: "Accessibility",
    userAgreement: "User Agreement",
    privacyPolicy: "Privacy Policy",
    cookiePolicy: "Cookie Policy",
    communityGuidelines: "Community Guidelines",
    language: "Language",
  },
  hi: {
    about: "के बारे में",
    accessibility: "पहुंच",
    userAgreement: "उपयोगकर्ता समझौता",
    privacyPolicy: "गोपनीयता नीति",
    cookiePolicy: "कुकी नीति",
    communityGuidelines: "सामुदायिक दिशानिर्देश",
    language: "भाषा",
  },
  te: {
    about: "గురించి",
    accessibility: "యాక్సెసిబిలిటీ",
    userAgreement: "వినియోగదారు ఒప్పందం",
    privacyPolicy: "గోప్యతా విధానం",
    cookiePolicy: "కుకీ విధానం",
    communityGuidelines: "సంఘం మార్గదర్శకాలు",
    language: "భాష",
  },
  ta: {
    about: "பற்றி",
    accessibility: "அணுகல்",
    userAgreement: "பயனர் ஒப்பந்தம்",
    privacyPolicy: "தனியுரிமைக் கொள்கை",
    cookiePolicy: "குக்கீக் கொள்கை",
    communityGuidelines: "சமூக வழிகாட்டுதல்கள்",
    language: "மொழி",
  },
  bn: {
    about: "সম্পর্কে",
    accessibility: "অ্যাক্সেসিবিলিটি",
    userAgreement: "ব্যবহারকারী চুক্তি",
    privacyPolicy: "গোপনীয়তা নীতি",
    cookiePolicy: "কুকি নীতি",
    communityGuidelines: "সম্প্রদায় নির্দেশিকা",
    language: "ভাষা",
  },
  es: {
    about: "Acerca de",
    accessibility: "Accesibilidad",
    userAgreement: "Acuerdo de usuario",
    privacyPolicy: "Política de privacidad",
    cookiePolicy: "Política de cookies",
    communityGuidelines: "Directrices de la comunidad",
    language: "Idioma",
  },
  fr: {
    about: "À propos",
    accessibility: "Accessibilité",
    userAgreement: "Accord utilisateur",
    privacyPolicy: "Politique de confidentialité",
    cookiePolicy: "Politique des cookies",
    communityGuidelines: "Règles de la communauté",
    language: "Langue",
  },
  ar: {
    about: "حول",
    accessibility: "إمكانية الوصول",
    userAgreement: "اتفاقية المستخدم",
    privacyPolicy: "سياسة الخصوصية",
    cookiePolicy: "سياسة ملفات تعريف الارتباط",
    communityGuidelines: "إرشادات المجتمع",
    language: "اللغة",
  },
  zh: {
    about: "关于",
    accessibility: "无障碍",
    userAgreement: "用户协议",
    privacyPolicy: "隐私政策",
    cookiePolicy: "Cookie 政策",
    communityGuidelines: "社区准则",
    language: "语言",
  },
};

const defaultLocale = "en";
const getStoredLocale = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch (_) {}
  return defaultLocale;
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch (_) {}
  }, [locale]);

  const setLocale = (code) => {
    if (LANGUAGES.some((l) => l.code === code)) setLocaleState(code);
  };

  const t = (key) => {
    const map = translations[locale] || translations.en;
    return map[key] ?? translations.en[key] ?? key;
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t, currentLanguage, languages: LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

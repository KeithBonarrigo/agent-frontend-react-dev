import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enSignup from './locales/en/signup.json';
import enModels from './locales/en/models.json';
import enIntegrations from './locales/en/integrations.json';
import enHome from './locales/en/home.json';

import esCommon from './locales/es/common.json';
import esDashboard from './locales/es/dashboard.json';
import esSignup from './locales/es/signup.json';
import esModels from './locales/es/models.json';
import esIntegrations from './locales/es/integrations.json';
import esHome from './locales/es/home.json';

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    signup: enSignup,
    models: enModels,
    integrations: enIntegrations,
    home: enHome
  },
  es: {
    common: esCommon,
    dashboard: esDashboard,
    signup: esSignup,
    models: esModels,
    integrations: esIntegrations,
    home: esHome
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'signup', 'models', 'integrations', 'home'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: {
      escapeValue: false // React already escapes
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;

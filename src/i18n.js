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
import enConfigurations from './locales/en/configurations.json';
import enStyling from './locales/en/styling.json';
import enAddons from './locales/en/addons.json';
import enConversations from './locales/en/conversations.json';
import enMetrics from './locales/en/metrics.json';
import enLeads from './locales/en/leads.json';
import enLegal from './locales/en/legal.json';
import enLogin from './locales/en/login.json';

import esCommon from './locales/es/common.json';
import esDashboard from './locales/es/dashboard.json';
import esSignup from './locales/es/signup.json';
import esModels from './locales/es/models.json';
import esIntegrations from './locales/es/integrations.json';
import esHome from './locales/es/home.json';
import esConfigurations from './locales/es/configurations.json';
import esStyling from './locales/es/styling.json';
import esAddons from './locales/es/addons.json';
import esConversations from './locales/es/conversations.json';
import esMetrics from './locales/es/metrics.json';
import esLeads from './locales/es/leads.json';
import esLegal from './locales/es/legal.json';
import esLogin from './locales/es/login.json';

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    signup: enSignup,
    models: enModels,
    integrations: enIntegrations,
    home: enHome,
    configurations: enConfigurations,
    styling: enStyling,
    addons: enAddons,
    conversations: enConversations,
    metrics: enMetrics,
    leads: enLeads,
    legal: enLegal,
    login: enLogin
  },
  es: {
    common: esCommon,
    dashboard: esDashboard,
    signup: esSignup,
    models: esModels,
    integrations: esIntegrations,
    home: esHome,
    configurations: esConfigurations,
    styling: esStyling,
    addons: esAddons,
    conversations: esConversations,
    metrics: esMetrics,
    leads: esLeads,
    legal: esLegal,
    login: esLogin
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'signup', 'models', 'integrations', 'home', 'configurations', 'styling', 'addons', 'conversations', 'metrics', 'leads', 'legal', 'login'],

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

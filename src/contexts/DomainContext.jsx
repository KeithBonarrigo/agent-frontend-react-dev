// DomainContext.jsx
// Client-side domain management with sessionStorage persistence

import { createContext, useContext, useState, useEffect } from 'react';

const DomainContext = createContext(null);

export const DomainProvider = ({ children }) => {
  // Initialize from sessionStorage if available
  const [domainInfo, setDomainInfo] = useState(() => {
    const stored = sessionStorage.getItem('domainInfo');
    return stored ? JSON.parse(stored) : null;
  });

  // Detect and set domain on mount
  useEffect(() => {
    const currentDomain = window.location.hostname;
    const fullUrl = window.location.href;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // Determine domain type and API URL - defaults to botwerx
    let domainType = 'botwerx';
    let targetDomain = 'botwerx.ai';
    let apiUrl = 'https://chat.botwerx.ai';

    if (currentDomain.includes('aibridge.global') || currentDomain.includes('base')) {
      domainType = 'base';
      targetDomain = 'base.aibridge.global';
      apiUrl = 'https://chat.aibridge.global';
    } else if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
      domainType = 'local';
      targetDomain = 'localhost';
      apiUrl = 'http://localhost:3000';
    } else if (currentDomain === 'botwerx.ai' || currentDomain.includes('botwerx.ai')) {
      domainType = 'botwerx';
      targetDomain = 'botwerx.ai';
      apiUrl = 'https://chat.botwerx.ai';
    }
    // Default case: uses botwerx (already set above)

    const info = {
      hostname: currentDomain,
      fullUrl,
      protocol,
      port,
      domainType,
      targetDomain,
      apiUrl,
      timestamp: new Date().toISOString()
    };

    console.log("=== Domain Check ===");
    console.log("Current Domain:", currentDomain);
    console.log("Domain Type:", domainType);
    console.log("Target Domain:", targetDomain);
    console.log("API URL:", apiUrl);
    console.log("Protocol:", protocol);
    console.log("Port:", port);
    console.log("Full URL:", fullUrl);
    console.log("===================");

    // Log detected domain type
    if (domainType === 'botwerx') {
      console.log("🤖 BotWerx Domain Detected");
    } else if (domainType === 'base') {
      console.log("🏠 Base Domain Detected");
    } else if (domainType === 'local') {
      console.log("💻 Local Development Environment");
    } else {
      console.log("🌐 Production Domain:", currentDomain);
    }

    // Update favicon and title based on domain type
    const faviconPath = domainType === 'botwerx' ? '/favicon-botwerx.png' : '/favicon-ai-fav.png';
    const pageTitle = domainType === 'botwerx' ? 'BotWerx - Agent Driven Engagement' : 'AIBridge - Agent Driven Engagement';
    const description = domainType === 'botwerx'
      ? 'BotWerx delivers intelligent agent-driven solutions to transform your business engagement and customer experience.'
      : 'AIBridge provides cutting-edge agent-driven engagement solutions to connect your business with customers seamlessly.';
    const siteName = domainType === 'botwerx' ? 'BotWerx' : 'AIBridge';

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = faviconPath;
    }

    document.title = pageTitle;

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', description);

    // Open Graph tags for social sharing
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:site_name', siteName, true);
    updateMetaTag('og:type', 'website', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', description);

    setDomainInfo(info);
  }, []);

  // Save to sessionStorage whenever domainInfo changes
  useEffect(() => {
    if (domainInfo) {
      sessionStorage.setItem('domainInfo', JSON.stringify(domainInfo));
    }
  }, [domainInfo]);

  // Helper function to check if we're on a specific domain
  const isDomain = (type) => {
    return domainInfo?.domainType === type;
  };

  // Helper function to get the target domain
  const getTargetDomain = () => {
    return domainInfo?.targetDomain;
  };

  // Helper function to get company name based on domain
  const getCompanyName = () => {
    if (domainInfo?.domainType === 'botwerx') {
      return 'Botwerx, LLC';
    }
    return 'AI Bridge';
  };

  // Helper functions to get domain-specific email addresses
  const getInfoEmail = () => {
    return domainInfo?.domainType === 'botwerx' ? 'info@botwerx.ai' : 'info@aibridge.global';
  };

  const getAdminEmail = () => {
    return domainInfo?.domainType === 'botwerx' ? 'admin@botwerx.ai' : 'admin@aibridge.global';
  };

  const getSupportEmail = () => {
    return domainInfo?.domainType === 'botwerx' ? 'support@botwerx.ai' : 'support@aibridge.global';
  };

  // Helper function to get domain-specific website URL
  const getWebsiteUrl = () => {
    return domainInfo?.domainType === 'botwerx' ? 'https://www.botwerx.ai' : 'https://aibridge.global';
  };

  // Helper function to get the API URL
  const getApiUrl = () => {
    return domainInfo?.apiUrl || 'http://localhost:3000';
  };

  const value = {
    domainInfo,
    isDomain,
    getTargetDomain,
    getApiUrl,
    apiUrl: domainInfo?.apiUrl || 'http://localhost:3000',
    isBotWerx: domainInfo?.domainType === 'botwerx',
    isBase: domainInfo?.domainType === 'base',
    isLocal: domainInfo?.domainType === 'local',
    companyName: domainInfo?.domainType === 'botwerx' ? 'Botwerx, LLC' : 'AI Bridge',
    infoEmail: domainInfo?.domainType === 'botwerx' ? 'info@botwerx.ai' : 'info@aibridge.global',
    adminEmail: domainInfo?.domainType === 'botwerx' ? 'admin@botwerx.ai' : 'admin@aibridge.global',
    supportEmail: domainInfo?.domainType === 'botwerx' ? 'support@botwerx.ai' : 'support@aibridge.global',
    websiteUrl: domainInfo?.domainType === 'botwerx' ? 'https://www.botwerx.ai' : 'https://aibridge.global'
  };

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
};

// Custom hook to use domain context
export const useDomain = () => {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomain must be used within DomainProvider');
  }
  return context;
};

export default DomainContext;

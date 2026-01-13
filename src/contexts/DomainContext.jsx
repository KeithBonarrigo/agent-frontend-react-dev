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

    // Determine domain type
    let domainType = 'unknown';
    let targetDomain = null;

    if (currentDomain === 'botwerx.ai' || currentDomain.includes('botwerx.ai')) {
      domainType = 'botwerx';
      targetDomain = 'botwerx.ai';
    } else if (currentDomain.includes('base')) {
      domainType = 'base';
      targetDomain = 'base.aibridge.global';
    } else if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
      domainType = 'local';
      targetDomain = 'localhost';
    } else {
      domainType = 'production';
      targetDomain = currentDomain;
    }

    const info = {
      hostname: currentDomain,
      fullUrl,
      protocol,
      port,
      domainType,
      targetDomain,
      timestamp: new Date().toISOString()
    };

    console.log("=== Domain Check ===");
    console.log("Current Domain:", currentDomain);
    console.log("Domain Type:", domainType);
    console.log("Target Domain:", targetDomain);
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

  const value = {
    domainInfo,
    isDomain,
    getTargetDomain,
    isBotWerx: domainInfo?.domainType === 'botwerx',
    isBase: domainInfo?.domainType === 'base',
    isLocal: domainInfo?.domainType === 'local',
    companyName: domainInfo?.domainType === 'botwerx' ? 'Botwerx, LLC' : 'AI Bridge',
    infoEmail: domainInfo?.domainType === 'botwerx' ? 'info@botwerx.ai' : 'info@aibridge.global',
    adminEmail: domainInfo?.domainType === 'botwerx' ? 'admin@botwerx.ai' : 'admin@aibridge.global',
    supportEmail: domainInfo?.domainType === 'botwerx' ? 'support@botwerx.ai' : 'support@aibridge.global'
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

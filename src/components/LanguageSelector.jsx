import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'EN', flagCode: 'us', fullName: 'English' },
  { code: 'es', name: 'ES', flagCode: 'es', fullName: 'Español' }
  // Future languages:
  // { code: 'pt', name: 'PT', flagCode: 'br', fullName: 'Português' },
  // { code: 'fr', name: 'FR', flagCode: 'fr', fullName: 'Français' },
  // { code: 'it', name: 'IT', flagCode: 'it', fullName: 'Italiano' },
];

export default function LanguageSelector({ fixed = false }) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const currentLangCode = i18n.language?.split('-')[0] || 'en';

  const containerStyle = fixed ? {
    position: 'fixed',
    top: '10px',
    right: '10px',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '4px 6px',
    borderRadius: '16px'
  } : {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  return (
    <div style={containerStyle}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px',
            fontSize: '13px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: currentLangCode === lang.code ? '#e7f3ff' : 'white',
            cursor: 'pointer',
            outline: 'none',
            fontWeight: currentLangCode === lang.code ? '600' : '400',
            transition: 'all 0.2s ease',
            boxShadow: 'none'
          }}
          title={lang.fullName}
        >
          <img
            src={`https://flagcdn.com/24x18/${lang.flagCode}.png`}
            srcSet={`https://flagcdn.com/48x36/${lang.flagCode}.png 2x`}
            alt={lang.fullName}
            style={{
              width: '24px',
              height: '18px',
              objectFit: 'cover',
              borderRadius: '2px'
            }}
          />
          <span style={{ fontSize: '13px' }}>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}

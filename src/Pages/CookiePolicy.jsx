import { useTranslation } from "react-i18next";
import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function CookiePolicy() {
  const { t } = useTranslation('legal');
  const { infoEmail, companyName, websiteUrl } = useDomain();

  return (
    <div className="policy-page">
      <section className="policy-header">
        <div className="home-container">
          <h1>{t('cookies.title')}</h1>
          <h4>{t('cookies.lastUpdated')}</h4>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-section">
            <h2>{t('cookies.sections.understanding.title')}</h2>
            <p>{t('cookies.sections.understanding.intro')}</p>
            <p>{t('cookies.sections.understanding.types')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('cookies.sections.categories.title')}</h2>
            <p>{t('cookies.sections.categories.intro', { websiteUrl })}</p>
            <ul>
              <li>
                <strong>{t('cookies.sections.categories.essential.title')}</strong>
                <br />
                {t('cookies.sections.categories.essential.content')}
              </li>
              <li>
                <strong>{t('cookies.sections.categories.performance.title')}</strong>
                <br />
                {t('cookies.sections.categories.performance.content')}
              </li>
              <li>
                <strong>{t('cookies.sections.categories.functional.title')}</strong>
                <br />
                {t('cookies.sections.categories.functional.content')}
              </li>
              <li>
                <strong>{t('cookies.sections.categories.advertising.title')}</strong>
                <br />
                {t('cookies.sections.categories.advertising.content')}
              </li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>{t('cookies.sections.thirdParty.title')}</h2>
            <p>{t('cookies.sections.thirdParty.intro')}</p>
            <ul>
              <li>{t('cookies.sections.thirdParty.items.analytics')}</li>
              <li>{t('cookies.sections.thirdParty.items.cloud')}</li>
              <li>{t('cookies.sections.thirdParty.items.ai')}</li>
              <li>{t('cookies.sections.thirdParty.items.social')}</li>
            </ul>
            <p>{t('cookies.sections.thirdParty.note')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('cookies.sections.controlling.title')}</h2>
            <p>{t('cookies.sections.controlling.intro')}</p>
            <ul>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://support.google.com/chrome/answer/95647?hl=en&co=GENIE.Platform%3DDesktop">
                  Google Chrome
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox">
                  Firefox
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d">
                  Edge
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://support.apple.com/en-us/105082">
                  Safari
                </a>
              </li>
            </ul>
            <p>{t('cookies.sections.controlling.warning')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('cookies.sections.modifications.title')}</h2>
            <p>{t('cookies.sections.modifications.content', { companyName })}</p>
          </div>

          <div className="policy-section">
            <h2>{t('cookies.sections.contact.title')}</h2>
            <p>
              {t('cookies.sections.contact.content')} <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

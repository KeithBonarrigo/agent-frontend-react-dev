import { useTranslation } from "react-i18next";
import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function TermsAndConditions() {
  const { t } = useTranslation('legal');
  const { companyName, supportEmail, websiteUrl } = useDomain();

  return (
    <div className="policy-page">
      <section className="policy-header">
        <div className="home-container">
          <h1>{t('terms.title')}</h1>
          <h4>{t('terms.lastUpdated')}</h4>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-section">
            <h2>{t('terms.sections.serviceOverview.title')}</h2>
            <p>{t('terms.sections.serviceOverview.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.eligibility.title')}</h2>
            <p>{t('terms.sections.eligibility.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.usage.title')}</h2>
            <p>{t('terms.sections.usage.intro')}</p>
            <ul>
              <li>{t('terms.sections.usage.items.legitimate')}</li>
              <li>{t('terms.sections.usage.items.integrity')}</li>
              <li>{t('terms.sections.usage.items.malware')}</li>
              <li>{t('terms.sections.usage.items.harassment')}</li>
            </ul>
            <p>{t('terms.sections.usage.authority')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.privacy.title')}</h2>
            <p>{t('terms.sections.privacy.intro')}</p>
            <ul>
              <li>{t('terms.sections.privacy.items.communications')}</li>
              <li>{t('terms.sections.privacy.items.metadata')}</li>
              <li>{t('terms.sections.privacy.items.behavioral')}</li>
            </ul>
            <p>
              {t('terms.sections.privacy.seePolicy')} <a href={`${websiteUrl}/privacy`}>{websiteUrl}/privacy</a>
            </p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.aiConstraints.title')}</h2>
            <p>{t('terms.sections.aiConstraints.intro')}</p>
            <ul>
              <li>{t('terms.sections.aiConstraints.items.accuracy')}</li>
              <li>{t('terms.sections.aiConstraints.items.professional')}</li>
              <li>{t('terms.sections.aiConstraints.items.inaccuracies')}</li>
            </ul>
            <p>{t('terms.sections.aiConstraints.responsibility')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.ownership.title')}</h2>
            <p>{t('terms.sections.ownership.content', { companyName })}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.disclaimers.title')}</h2>
            <p>{t('terms.sections.disclaimers.intro')}</p>
            <ul>
              <li>{t('terms.sections.disclaimers.items.suitability')}</li>
              <li>{t('terms.sections.disclaimers.items.uptime')}</li>
              <li>{t('terms.sections.disclaimers.items.precision')}</li>
            </ul>
            <p>{t('terms.sections.disclaimers.noLiability')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.modifications.title')}</h2>
            <p>{t('terms.sections.modifications.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.termination.title')}</h2>
            <p>{t('terms.sections.termination.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.revisions.title')}</h2>
            <p>{t('terms.sections.revisions.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('terms.sections.contact.title')}</h2>
            <p>{t('terms.sections.contact.intro')}</p>
            <p>
              Email: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </p>
            <p>{t('terms.sections.contact.address')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

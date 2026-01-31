import { useTranslation } from "react-i18next";
import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function PrivacyPolicy() {
  const { t } = useTranslation('legal');
  const { infoEmail, companyName, websiteUrl } = useDomain();

  return (
    <div className="policy-page">
      <section className="policy-header">
        <div className="home-container">
          <h1>{t('privacy.title')}</h1>
          <h4>{t('privacy.lastUpdated')}</h4>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-section">
            <h2>{t('privacy.sections.dataController.title')}</h2>
            <p>
              {t('privacy.sections.dataController.intro', { websiteUrl })}
            </p>
            <ul>
              <li>{t('privacy.sections.dataController.legalName')}</li>
              <li>{t('privacy.sections.dataController.tradeName', { companyName })}</li>
              <li>{t('privacy.sections.dataController.address')}</li>
              <li>{t('privacy.sections.dataController.email', { infoEmail })}</li>
              <li>{t('privacy.sections.dataController.ubi')}</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.dataGathered.title')}</h2>
            <p>
              {t('privacy.sections.dataGathered.intro', { companyName })}
            </p>
            <ul>
              <li>{t('privacy.sections.dataGathered.items.identifiers')}</li>
              <li>{t('privacy.sections.dataGathered.items.system')}</li>
              <li>{t('privacy.sections.dataGathered.items.activity')}</li>
              <li>{t('privacy.sections.dataGathered.items.submitted')}</li>
              <li>{t('privacy.sections.dataGathered.items.sensitive')}</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.processing.title')}</h2>
            <p>{t('privacy.sections.processing.intro')}</p>
            <ul>
              <li>{t('privacy.sections.processing.items.access')}</li>
              <li>{t('privacy.sections.processing.items.questions')}</li>
              <li>{t('privacy.sections.processing.items.relationships')}</li>
              <li>{t('privacy.sections.processing.items.performance')}</li>
              <li>{t('privacy.sections.processing.items.promotional')}</li>
              <li>{t('privacy.sections.processing.items.statutory')}</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.legalFoundation.title')}</h2>
            <p>{t('privacy.sections.legalFoundation.intro')}</p>
            <ul>
              <li>{t('privacy.sections.legalFoundation.items.consent')}</li>
              <li>{t('privacy.sections.legalFoundation.items.contractual')}</li>
              <li>{t('privacy.sections.legalFoundation.items.legitimate')}</li>
              <li>{t('privacy.sections.legalFoundation.items.regulatory')}</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.thirdParty.title')}</h2>
            <p>{t('privacy.sections.thirdParty.never', { companyName })}</p>
            <p>{t('privacy.sections.thirdParty.disclosure')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.crossBorder.title')}</h2>
            <p>{t('privacy.sections.crossBorder.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.retention.title')}</h2>
            <p>{t('privacy.sections.retention.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.security.title')}</h2>
            <p>{t('privacy.sections.security.measures')}</p>
            <p>{t('privacy.sections.security.caveat')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.rights.title')}</h2>
            <p>{t('privacy.sections.rights.intro')}</p>
            <ul>
              <li>{t('privacy.sections.rights.items.view')}</li>
              <li>{t('privacy.sections.rights.items.correction')}</li>
              <li>{t('privacy.sections.rights.items.erasure')}</li>
              <li>{t('privacy.sections.rights.items.challenge')}</li>
              <li>{t('privacy.sections.rights.items.portable')}</li>
              <li>{t('privacy.sections.rights.items.restrict')}</li>
            </ul>
            <p>{t('privacy.sections.rights.invoke', { infoEmail })}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.cookies.title')}</h2>
            <p>{t('privacy.sections.cookies.usage')}</p>
            <p>{t('privacy.sections.cookies.control')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.external.title')}</h2>
            <p>{t('privacy.sections.external.content', { companyName })}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.updates.title')}</h2>
            <p>{t('privacy.sections.updates.revise')}</p>
            <p>{t('privacy.sections.updates.acceptance')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('privacy.sections.contact.title')}</h2>
            <p>
              {t('privacy.sections.contact.content')} <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

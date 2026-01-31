import { useTranslation } from "react-i18next";
import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function DataDeletionPolicy() {
  const { t } = useTranslation('legal');
  const { companyName, infoEmail, websiteUrl } = useDomain();

  return (
    <div className="policy-page">
      {/* Header Section */}
      <section className="policy-header">
        <div className="home-container">
          <h1>{t('dataDeletion.title')}</h1>
          <h4>{t('dataDeletion.lastUpdated')}</h4>
        </div>
      </section>

      {/* Policy Content Section */}
      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-intro">
            <p>
              <strong>{t('dataDeletion.intro', { companyName })}</strong>
            </p>
          </div>

          <div className="policy-section">
            <h2>{t('dataDeletion.sections.whatWeCollect.title')}</h2>
            <p>{t('dataDeletion.sections.whatWeCollect.intro')}</p>
            <ul>
              <li>{t('dataDeletion.sections.whatWeCollect.items.profile')}</li>
              <li>{t('dataDeletion.sections.whatWeCollect.items.email')}</li>
              <li>{t('dataDeletion.sections.whatWeCollect.items.userId')}</li>
              <li>{t('dataDeletion.sections.whatWeCollect.items.additional')}</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>{t('dataDeletion.sections.howWeUse.title')}</h2>
            <p>{t('dataDeletion.sections.howWeUse.intro')}</p>
            <ul>
              <li>{t('dataDeletion.sections.howWeUse.items.access')}</li>
              <li>{t('dataDeletion.sections.howWeUse.items.personalize')}</li>
              <li>{t('dataDeletion.sections.howWeUse.items.contact')}</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>{t('dataDeletion.sections.requesting.title')}</h2>
            <p>{t('dataDeletion.sections.requesting.intro')}</p>

            <div className="policy-option">
              <h3>{t('dataDeletion.sections.requesting.optionA.title')}</h3>
              <ul>
                <li>{t('dataDeletion.sections.requesting.optionA.items.step1')}</li>
                <li>{t('dataDeletion.sections.requesting.optionA.items.step2')}</li>
                <li>{t('dataDeletion.sections.requesting.optionA.items.step3')}</li>
                <li>{t('dataDeletion.sections.requesting.optionA.items.step4')}</li>
              </ul>
            </div>

            <div className="policy-option">
              <h3>{t('dataDeletion.sections.requesting.optionB.title')}</h3>
              <p>
                {t('dataDeletion.sections.requesting.optionB.send')}{" "}
                <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
              </p>
              <p>{t('dataDeletion.sections.requesting.optionB.include')}</p>
              <ul>
                <li>{t('dataDeletion.sections.requesting.optionB.items.subject')}</li>
                <li>{t('dataDeletion.sections.requesting.optionB.items.name')}</li>
                <li>{t('dataDeletion.sections.requesting.optionB.items.userId')}</li>
              </ul>
              <p>{t('dataDeletion.sections.requesting.optionB.processing')}</p>
            </div>
          </div>

          <div className="policy-section">
            <h2>{t('dataDeletion.sections.retention.title')}</h2>
            <p>{t('dataDeletion.sections.retention.content')}</p>
          </div>

          <div className="policy-section">
            <h2>{t('dataDeletion.sections.contact.title')}</h2>
            <p>{t('dataDeletion.sections.contact.content')}</p>
            <div className="policy-contact">
              <p>
                <strong>{companyName}</strong>
                <br />
                {t('dataDeletion.sections.contact.address')}
                <br />
                <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
                <br />
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  {websiteUrl}
                </a>
              </p>
            </div>
          </div>

          <div className="policy-section">
            <h2>{t('dataDeletion.sections.updates.title')}</h2>
            <p>{t('dataDeletion.sections.updates.content')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

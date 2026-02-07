import { useTranslation } from "react-i18next";
import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function TermsAndConditions() {
  const { t } = useTranslation('legal');
  const { companyName, supportEmail } = useDomain();

  return (
    <div className="policy-page">
      <section className="policy-header">
        <div className="home-container">
          <h1>{t('terms.title')}</h1>
          <h4>{t('terms.developedBy')}</h4>
          <h4>{t('terms.lastUpdated')}</h4>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="home-container">
          {/* Introduction */}
          <div className="policy-section">
            <p><strong>{t('terms.disclaimer')}</strong></p>
            <p>{t('terms.platformDescription')}</p>
          </div>

          {/* Section 1: Acceptance */}
          <div className="policy-section">
            <h2>{t('terms.sections.acceptance.title')}</h2>
            <p>{t('terms.sections.acceptance.content')}</p>
          </div>

          {/* Section 2: Service Description */}
          <div className="policy-section">
            <h2>{t('terms.sections.serviceDescription.title')}</h2>
            <p>{t('terms.sections.serviceDescription.intro')}</p>
            <ul>
              <li>{t('terms.sections.serviceDescription.items.create')}</li>
              <li>{t('terms.sections.serviceDescription.items.sync')}</li>
              <li>{t('terms.sections.serviceDescription.items.manage')}</li>
              <li>{t('terms.sections.serviceDescription.items.automate')}</li>
            </ul>
            <p><strong>{t('terms.sections.serviceDescription.important')}</strong></p>
          </div>

          {/* Section 3: Registration */}
          <div className="policy-section">
            <h2>{t('terms.sections.registration.title')}</h2>

            <h3>{t('terms.sections.registration.subtitle1')}</h3>
            <p>{t('terms.sections.registration.registrationIntro')}</p>
            <ol>
              <li>{t('terms.sections.registration.registrationItems.complete')}</li>
              <li>{t('terms.sections.registration.registrationItems.signature')}</li>
              <li>{t('terms.sections.registration.registrationItems.credentials')}</li>
            </ol>

            <h3>{t('terms.sections.registration.subtitle2')}</h3>
            <p>{t('terms.sections.registration.syncIntro')}</p>
            <ol>
              <li>{t('terms.sections.registration.syncItems.apiKeys')}</li>
              <li>{t('terms.sections.registration.syncItems.signAgreement')}</li>
              <li>{t('terms.sections.registration.syncItems.acceptPrivacy')}</li>
            </ol>

            <h3>{t('terms.sections.registration.subtitle3')}</h3>
            <p>{t('terms.sections.registration.responsibilityIntro')}</p>
            <ul>
              <li>{t('terms.sections.registration.responsibilityItems.accuracy')}</li>
              <li>{t('terms.sections.registration.responsibilityItems.confidentiality')}</li>
              <li>{t('terms.sections.registration.responsibilityItems.security')}</li>
              <li>{t('terms.sections.registration.responsibilityItems.activities')}</li>
              <li>{t('terms.sections.registration.responsibilityItems.compliance')}</li>
            </ul>
          </div>

          {/* Section 4: API Keys */}
          <div className="policy-section">
            <h2>{t('terms.sections.apiKeys.title')}</h2>

            <h3>{t('terms.sections.apiKeys.subtitle1')}</h3>
            <p><strong>{t('terms.sections.apiKeys.warning')}</strong></p>
            <ul>
              <li>{t('terms.sections.apiKeys.warningItems.properties')}</li>
              <li>{t('terms.sections.apiKeys.warningItems.clientInfo')}</li>
              <li>{t('terms.sections.apiKeys.warningItems.sensitiveData')}</li>
              <li>{t('terms.sections.apiKeys.warningItems.configurations')}</li>
            </ul>

            <h3>{t('terms.sections.apiKeys.subtitle2')}</h3>
            <p>{t('terms.sections.apiKeys.declarationIntro')}</p>
            <ul>
              <li>{t('terms.sections.apiKeys.declarationItems.legitimate')}</li>
              <li>{t('terms.sections.apiKeys.declarationItems.authorization')}</li>
              <li>{t('terms.sections.apiKeys.declarationItems.readTerms')}</li>
              <li>{t('terms.sections.apiKeys.declarationItems.understandRisks')}</li>
              <li>{t('terms.sections.apiKeys.declarationItems.acceptUsage')}</li>
            </ul>

            <h3>{t('terms.sections.apiKeys.subtitle3')}</h3>
            <p>{t('terms.sections.apiKeys.usageIntro')}</p>
            <ul>
              <li>{t('terms.sections.apiKeys.usageItems.query')}</li>
              <li>{t('terms.sections.apiKeys.usageItems.sync')}</li>
              <li>{t('terms.sections.apiKeys.usageItems.generate')}</li>
              <li>{t('terms.sections.apiKeys.usageItems.improve')}</li>
            </ul>
            <p>{t('terms.sections.apiKeys.notUsageIntro')}</p>
            <ul>
              <li>{t('terms.sections.apiKeys.notUsageItems.modify')}</li>
              <li>{t('terms.sections.apiKeys.notUsageItems.accessUnrelated')}</li>
              <li>{t('terms.sections.apiKeys.notUsageItems.share')}</li>
              <li>{t('terms.sections.apiKeys.notUsageItems.operationsOutside')}</li>
            </ul>

            <h3>{t('terms.sections.apiKeys.subtitle4')}</h3>
            <p><strong>{t('terms.sections.apiKeys.limitationIntro')}</strong></p>
            <ul>
              <li>{t('terms.sections.apiKeys.limitationItems.security')}</li>
              <li>{t('terms.sections.apiKeys.limitationItems.measures')}</li>
              <li>{t('terms.sections.apiKeys.limitationItems.notResponsible')}</li>
              <li>{t('terms.sections.apiKeys.limitationItems.damages')}</li>
              <li>{t('terms.sections.apiKeys.limitationItems.changeKeys')}</li>
            </ul>
          </div>

          {/* Section 5: Third-Party Services */}
          <div className="policy-section">
            <h2>{t('terms.sections.thirdPartyServices.title')}</h2>

            <h3>{t('terms.sections.thirdPartyServices.subtitle1')}</h3>
            <p>{t('terms.sections.thirdPartyServices.relationIntro')}</p>
            <p>{t('terms.sections.thirdPartyServices.notImplyIntro')}</p>
            <ul>
              <li>{t('terms.sections.thirdPartyServices.notImplyItems.endorsement')}</li>
              <li>{t('terms.sections.thirdPartyServices.notImplyItems.association')}</li>
              <li>{t('terms.sections.thirdPartyServices.notImplyItems.responsibility')}</li>
            </ul>

            <h3>{t('terms.sections.thirdPartyServices.subtitle2')}</h3>
            <p>{t('terms.sections.thirdPartyServices.termsIntro')}</p>
            <ul>
              <li>{t('terms.sections.thirdPartyServices.termsItems.comply')}</li>
              <li>{t('terms.sections.thirdPartyServices.termsItems.mayModify')}</li>
              <li>{t('terms.sections.thirdPartyServices.termsItems.policies')}</li>
              <li>{t('terms.sections.thirdPartyServices.termsItems.noControl')}</li>
              <li>{t('terms.sections.thirdPartyServices.termsItems.exclusive')}</li>
            </ul>

            <h3>{t('terms.sections.thirdPartyServices.subtitle3')}</h3>
            <p><strong>{t('terms.sections.thirdPartyServices.liabilityIntro')}</strong></p>
            <ul>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.interruptions')}</li>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.apiChanges')}</li>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.dataLoss')}</li>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.disputes')}</li>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.regulations')}</li>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.privacyViolations')}</li>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.dataAccuracy')}</li>
              <li>{t('terms.sections.thirdPartyServices.liabilityItems.costs')}</li>
            </ul>
          </div>

          {/* Section 6: Availability */}
          <div className="policy-section">
            <h2>{t('terms.sections.availability.title')}</h2>

            <h3>{t('terms.sections.availability.subtitle1')}</h3>
            <p>{t('terms.sections.availability.asIsIntro')}</p>
            <ul>
              <li>{t('terms.sections.availability.asIsItems.uninterrupted')}</li>
              <li>{t('terms.sections.availability.asIsItems.results')}</li>
              <li>{t('terms.sections.availability.asIsItems.compatibility')}</li>
              <li>{t('terms.sections.availability.asIsItems.accuracy')}</li>
              <li>{t('terms.sections.availability.asIsItems.continuous')}</li>
              <li>{t('terms.sections.availability.asIsItems.realTime')}</li>
            </ul>

            <h3>{t('terms.sections.availability.subtitle2')}</h3>
            <p>{t('terms.sections.availability.uptimeIntro')}</p>
            <ul>
              <li>{t('terms.sections.availability.uptimeItems.specific')}</li>
              <li>{t('terms.sections.availability.uptimeItems.speed')}</li>
              <li>{t('terms.sections.availability.uptimeItems.permanent')}</li>
              <li>{t('terms.sections.availability.uptimeItems.noInterruptions')}</li>
              <li>{t('terms.sections.availability.uptimeItems.functioning')}</li>
            </ul>

            <h3>{t('terms.sections.availability.subtitle3')}</h3>
            <p><strong>{t('terms.sections.availability.aiWarning')}</strong></p>
            <ul>
              <li>{t('terms.sections.availability.aiItems.incorrect')}</li>
              <li>{t('terms.sections.availability.aiItems.noReplace')}</li>
              <li>{t('terms.sections.availability.aiItems.requires')}</li>
              <li>{t('terms.sections.availability.aiItems.misinterpret')}</li>
              <li>{t('terms.sections.availability.aiItems.notSole')}</li>
            </ul>
            <p>{t('terms.sections.availability.userResponsibilityIntro')}</p>
            <ul>
              <li>{t('terms.sections.availability.userResponsibilityItems.review')}</li>
              <li>{t('terms.sections.availability.userResponsibilityItems.correct')}</li>
              <li>{t('terms.sections.availability.userResponsibilityItems.maintain')}</li>
              <li>{t('terms.sections.availability.userResponsibilityItems.notDepend')}</li>
            </ul>

            <h3>{t('terms.sections.availability.subtitle4')}</h3>
            <p>{t('terms.sections.availability.maintenanceIntro')}</p>
            <ul>
              <li>{t('terms.sections.availability.maintenanceItems.scheduled')}</li>
              <li>{t('terms.sections.availability.maintenanceItems.modify')}</li>
              <li>{t('terms.sections.availability.maintenanceItems.suspend')}</li>
              <li>{t('terms.sections.availability.maintenanceItems.updateAi')}</li>
            </ul>
          </div>

          {/* Section 7: Limitation of Liability */}
          <div className="policy-section">
            <h2>{t('terms.sections.liabilityLimitation.title')}</h2>

            <h3>{t('terms.sections.liabilityLimitation.subtitle1')}</h3>
            <p><strong>{t('terms.sections.liabilityLimitation.exclusionIntro')}</strong></p>
            <p><strong>{t('terms.sections.liabilityLimitation.directDamages')}</strong></p>
            <ul>
              <li>{t('terms.sections.liabilityLimitation.directItems.dataLoss')}</li>
              <li>{t('terms.sections.liabilityLimitation.directItems.revenueLoss')}</li>
              <li>{t('terms.sections.liabilityLimitation.directItems.equipmentDamage')}</li>
              <li>{t('terms.sections.liabilityLimitation.directItems.substituteCosts')}</li>
              <li>{t('terms.sections.liabilityLimitation.directItems.clientLoss')}</li>
              <li>{t('terms.sections.liabilityLimitation.directItems.commissionsLost')}</li>
            </ul>
            <p><strong>{t('terms.sections.liabilityLimitation.indirectDamages')}</strong></p>
            <ul>
              <li>{t('terms.sections.liabilityLimitation.indirectItems.lostProfits')}</li>
              <li>{t('terms.sections.liabilityLimitation.indirectItems.reputational')}</li>
              <li>{t('terms.sections.liabilityLimitation.indirectItems.trustLoss')}</li>
              <li>{t('terms.sections.liabilityLimitation.indirectItems.interruption')}</li>
              <li>{t('terms.sections.liabilityLimitation.indirectItems.anyOther')}</li>
            </ul>

            <h3>{t('terms.sections.liabilityLimitation.subtitle2')}</h3>
            <p><strong>{t('terms.sections.liabilityLimitation.monetaryLimit')}</strong></p>

            <h3>{t('terms.sections.liabilityLimitation.subtitle3')}</h3>
            <p>{t('terms.sections.liabilityLimitation.acknowledgmentIntro')}</p>
            <ul>
              <li>{t('terms.sections.liabilityLimitation.acknowledgmentItems.readUnderstood')}</li>
              <li>{t('terms.sections.liabilityLimitation.acknowledgmentItems.ownRisk')}</li>
              <li>{t('terms.sections.liabilityLimitation.acknowledgmentItems.notDepend')}</li>
              <li>{t('terms.sections.liabilityLimitation.acknowledgmentItems.backups')}</li>
              <li>{t('terms.sections.liabilityLimitation.acknowledgmentItems.supervise')}</li>
              <li>{t('terms.sections.liabilityLimitation.acknowledgmentItems.understand')}</li>
            </ul>
          </div>

          {/* Section 8: Indemnification */}
          <div className="policy-section">
            <h2>{t('terms.sections.indemnification.title')}</h2>
            <p>{t('terms.sections.indemnification.content')}</p>
            <ol>
              <li>{t('terms.sections.indemnification.items.use')}</li>
              <li>{t('terms.sections.indemnification.items.violation')}</li>
              <li>{t('terms.sections.indemnification.items.thirdPartyRights')}</li>
              <li>{t('terms.sections.indemnification.items.content')}</li>
              <li>{t('terms.sections.indemnification.items.responses')}</li>
              <li>{t('terms.sections.indemnification.items.thirdPartyTerms')}</li>
              <li>{t('terms.sections.indemnification.items.unauthorized')}</li>
              <li>{t('terms.sections.indemnification.items.incorrectInfo')}</li>
              <li>{t('terms.sections.indemnification.items.clientDamages')}</li>
              <li>{t('terms.sections.indemnification.items.regulations')}</li>
              <li>{t('terms.sections.indemnification.items.clientDisputes')}</li>
            </ol>
          </div>

          {/* Section 9: Intellectual Property */}
          <div className="policy-section">
            <h2>{t('terms.sections.intellectualProperty.title')}</h2>

            <h3>{t('terms.sections.intellectualProperty.subtitle1')}</h3>
            <p>{t('terms.sections.intellectualProperty.propertyIntro')}</p>
            <ul>
              <li>{t('terms.sections.intellectualProperty.propertyItems.software')}</li>
              <li>{t('terms.sections.intellectualProperty.propertyItems.design')}</li>
              <li>{t('terms.sections.intellectualProperty.propertyItems.aiModels')}</li>
              <li>{t('terms.sections.intellectualProperty.propertyItems.documentation')}</li>
              <li>{t('terms.sections.intellectualProperty.propertyItems.brand')}</li>
            </ul>
            <p>{t('terms.sections.intellectualProperty.propertyNote')}</p>

            <h3>{t('terms.sections.intellectualProperty.subtitle2')}</h3>
            <p>{t('terms.sections.intellectualProperty.license')}</p>

            <h3>{t('terms.sections.intellectualProperty.subtitle3')}</h3>
            <p>{t('terms.sections.intellectualProperty.restrictionsIntro')}</p>
            <ul>
              <li>{t('terms.sections.intellectualProperty.restrictionsItems.copy')}</li>
              <li>{t('terms.sections.intellectualProperty.restrictionsItems.reverse')}</li>
              <li>{t('terms.sections.intellectualProperty.restrictionsItems.resell')}</li>
              <li>{t('terms.sections.intellectualProperty.restrictionsItems.remove')}</li>
              <li>{t('terms.sections.intellectualProperty.restrictionsItems.compete')}</li>
            </ul>
          </div>

          {/* Section 10: Privacy */}
          <div className="policy-section">
            <h2>{t('terms.sections.privacy.title')}</h2>

            <h3>{t('terms.sections.privacy.subtitle1')}</h3>
            <p>{t('terms.sections.privacy.policy')}</p>

            <h3>{t('terms.sections.privacy.subtitle2')}</h3>
            <p>{t('terms.sections.privacy.responsibilityIntro')}</p>
            <ul>
              <li>{t('terms.sections.privacy.responsibilityItems.consent')}</li>
              <li>{t('terms.sections.privacy.responsibilityItems.comply')}</li>
              <li>{t('terms.sections.privacy.responsibilityItems.inform')}</li>
              <li>{t('terms.sections.privacy.responsibilityItems.maintain')}</li>
            </ul>

            <h3>{t('terms.sections.privacy.subtitle3')}</h3>
            <p>{t('terms.sections.privacy.limitationIntro')}</p>
            <ul>
              <li>{t('terms.sections.privacy.limitationItems.noControl')}</li>
              <li>{t('terms.sections.privacy.limitationItems.notResponsible')}</li>
              <li>{t('terms.sections.privacy.limitationItems.implements')}</li>
              <li>{t('terms.sections.privacy.limitationItems.mayAccess')}</li>
            </ul>
          </div>

          {/* Section 11: Fees */}
          <div className="policy-section">
            <h2>{t('terms.sections.fees.title')}</h2>

            <h3>{t('terms.sections.fees.subtitle1')}</h3>
            <p>{t('terms.sections.fees.plans')}</p>

            <h3>{t('terms.sections.fees.subtitle2')}</h3>
            <ul>
              <li>{t('terms.sections.fees.billingItems.advance')}</li>
              <li>{t('terms.sections.fees.billingItems.nonRefundable')}</li>
              <li>{t('terms.sections.fees.billingItems.authorize')}</li>
              <li>{t('terms.sections.fees.billingItems.taxes')}</li>
            </ul>

            <h3>{t('terms.sections.fees.subtitle3')}</h3>
            <p>{t('terms.sections.fees.modification')}</p>

            <h3>{t('terms.sections.fees.subtitle4')}</h3>
            <p>{t('terms.sections.fees.suspensionIntro')}</p>
            <ul>
              <li>{t('terms.sections.fees.suspensionItems.immediate')}</li>
              <li>{t('terms.sections.fees.suspensionItems.possible')}</li>
              <li>{t('terms.sections.fees.suspensionItems.loss')}</li>
            </ul>
          </div>

          {/* Section 12: Cancellation */}
          <div className="policy-section">
            <h2>{t('terms.sections.cancellation.title')}</h2>

            <h3>{t('terms.sections.cancellation.subtitle1')}</h3>
            <p>{t('terms.sections.cancellation.userCancellationIntro')}</p>
            <ul>
              <li>{t('terms.sections.cancellation.userCancellationItems.effect')}</li>
              <li>{t('terms.sections.cancellation.userCancellationItems.noRefunds')}</li>
              <li>{t('terms.sections.cancellation.userCancellationItems.mayResult')}</li>
            </ul>

            <h3>{t('terms.sections.cancellation.subtitle2')}</h3>
            <p>{t('terms.sections.cancellation.terminationIntro')}</p>
            <ul>
              <li>{t('terms.sections.cancellation.terminationItems.violates')}</li>
              <li>{t('terms.sections.cancellation.terminationItems.fraudulent')}</li>
              <li>{t('terms.sections.cancellation.terminationItems.nonPayment')}</li>
              <li>{t('terms.sections.cancellation.terminationItems.security')}</li>
              <li>{t('terms.sections.cancellation.terminationItems.legalRisk')}</li>
              <li>{t('terms.sections.cancellation.terminationItems.misuse')}</li>
            </ul>

            <h3>{t('terms.sections.cancellation.subtitle3')}</h3>
            <p>{t('terms.sections.cancellation.effectsIntro')}</p>
            <ul>
              <li>{t('terms.sections.cancellation.effectsItems.losesAccess')}</li>
              <li>{t('terms.sections.cancellation.effectsItems.deleted')}</li>
              <li>{t('terms.sections.cancellation.effectsItems.survive')}</li>
              <li>{t('terms.sections.cancellation.effectsItems.noRefund')}</li>
            </ul>
          </div>

          {/* Section 13: Modifications */}
          <div className="policy-section">
            <h2>{t('terms.sections.modifications.title')}</h2>
            <p>{t('terms.sections.modifications.content')}</p>
            <ul>
              <li>{t('terms.sections.modifications.items.published')}</li>
              <li>{t('terms.sections.modifications.items.effective')}</li>
              <li>{t('terms.sections.modifications.items.notified')}</li>
              <li>{t('terms.sections.modifications.items.accepted')}</li>
            </ul>
            <p>{t('terms.sections.modifications.disagree')}</p>
          </div>

          {/* Section 14: Governing Law */}
          <div className="policy-section">
            <h2>{t('terms.sections.governing.title')}</h2>

            <h3>{t('terms.sections.governing.subtitle1')}</h3>
            <p>{t('terms.sections.governing.law')}</p>

            <h3>{t('terms.sections.governing.subtitle2')}</h3>
            <p>{t('terms.sections.governing.disputeIntro')}</p>
            <ol>
              <li>{t('terms.sections.governing.disputeItems.negotiation')}</li>
              <li>{t('terms.sections.governing.disputeItems.mediation')}</li>
              <li>{t('terms.sections.governing.disputeItems.jurisdiction')}</li>
            </ol>

            <h3>{t('terms.sections.governing.subtitle3')}</h3>
            <p>{t('terms.sections.governing.waiver')}</p>
          </div>

          {/* Section 15: General Provisions */}
          <div className="policy-section">
            <h2>{t('terms.sections.general.title')}</h2>

            <h3>{t('terms.sections.general.subtitle1')}</h3>
            <p>{t('terms.sections.general.entireAgreement')}</p>

            <h3>{t('terms.sections.general.subtitle2')}</h3>
            <p>{t('terms.sections.general.severability')}</p>

            <h3>{t('terms.sections.general.subtitle3')}</h3>
            <p>{t('terms.sections.general.noWaiver')}</p>

            <h3>{t('terms.sections.general.subtitle4')}</h3>
            <p>{t('terms.sections.general.assignment')}</p>

            <h3>{t('terms.sections.general.subtitle5')}</h3>
            <p>{t('terms.sections.general.language')}</p>

            <h3>{t('terms.sections.general.subtitle6')}</h3>
            <p>{t('terms.sections.general.contact')}</p>
          </div>

          {/* Footer */}
          <div className="policy-section" style={{ textAlign: 'center', marginTop: '2em', paddingTop: '2em', borderTop: '1px solid #ddd' }}>
            <p><strong>{t('terms.lastUpdated')}</strong></p>
            <p><strong>{t('terms.acceptanceFooter')}</strong></p>
          </div>
        </div>
      </section>
    </div>
  );
}

import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function CookiePolicy() {
  const { infoEmail, companyName, websiteUrl } = useDomain();

  return (
    <div className="policy-page">
      <section className="policy-header">
        <div className="home-container">
          <h1>Cookie Policy</h1>
          <h4>Last Updated: August 3, 2025</h4>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-section">
            <h2>1. Understanding Cookies</h2>
            <p>
              Cookies represent tiny text files that get saved to your device
              (including computers, smartphones, and tablets) during website visits.
              Websites commonly employ them to maintain functionality, improve
              browsing experiences, and gather analytics or promotional insights.
            </p>
            <p>
              These files can originate from the site you're currently viewing
              (first-party cookies) or from external parties (third-party cookies)
              whose features or services are embedded within the website.
            </p>
          </div>

          <div className="policy-section">
            <h2>2. Cookie Categories on Our Platform</h2>
            <p>
              Our website at {websiteUrl} may utilize the following cookie
              categories:
            </p>
            <ul>
              <li>
                <strong>Essential Cookies</strong>
                <br />
                Required for core site functionality, these cookies cannot be
                turned off. They facilitate critical features like secure login,
                site navigation, and correct page rendering.
              </li>
              <li>
                <strong>Performance & Analytics Cookies</strong>
                <br />
                These gather anonymized metrics that reveal user engagement
                patterns on our platform. Examples include which pages attract
                visitors, how long sessions last, and visitor drop-off points.
              </li>
              <li>
                <strong>Functional & Preference Cookies</strong>
                <br />
                These retain your customized settings and choices, including
                language selection, regional preferences, and interface layout,
                to provide a personalized experience on return visits.
              </li>
              <li>
                <strong>Advertising & Targeting Cookies (when applicable)</strong>
                <br />
                These monitor your browsing patterns across multiple sites to
                deliver advertising tailored to your interests. Implementation
                requires your explicit consent.
              </li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>3. External Service Cookies</h2>
            <p>
              Our platform integrates third-party services that may install
              cookies on your device. Such services encompass:
            </p>
            <ul>
              <li>Analytics and web tracking platforms;</li>
              <li>Cloud-hosted automation solutions;</li>
              <li>Artificial intelligence integrations and conversational agents;</li>
              <li>Social network widgets and monitoring tools.</li>
            </ul>
            <p>
              Since these cookies fall outside our direct control, we encourage
              you to consult the privacy and cookie documentation provided by
              these external vendors.
            </p>
          </div>

          <div className="policy-section">
            <h2>4. Controlling Your Cookie Settings</h2>
            <p>
              You maintain complete control over cookie preferences through your
              browser configuration. Access detailed guidance for popular browsers below:
            </p>
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
            <p>
              Be aware that blocking specific cookies could impact website
              functionality and overall user experience.
            </p>
          </div>

          <div className="policy-section">
            <h2>5. Policy Modifications</h2>
            <p>
              {companyName} retains the authority to modify this Cookie Policy
              as circumstances require. Material revisions will be reflected on
              this page.
            </p>
          </div>

          <div className="policy-section">
            <h2>6. Reach Out to Us</h2>
            <p>
              For inquiries regarding this Cookie Policy or our cookie
              implementation, please contact us at: <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
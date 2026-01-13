import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function PrivacyPolicy() {
  const { infoEmail } = useDomain();

  return (
    <div className="policy-page">
      <section className="policy-header">
        <div className="home-container">
          <h1>Our Privacy Policy</h1>
          <h4>Last Updated: August 3, 2025</h4>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-section">
            <h2>1. Data Controller</h2>
            <p>
              This Privacy Policy applies to the website www.aibridge.global,
              operated by:
            </p>
            <ul>
              <li>Legal Name: Keith Andrew Bonarrigo</li>
              <li>Registered Trade Name: AI BRIDGE</li>
              <li>
                Business Address: 45 S 3rd St, Pacific Beach, WA 98571-5017,
                United States
              </li>
              <li>Email Contact: {infoEmail}</li>
              <li>Unified Business ID (UBI): 602491939</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>2. Information We Collect</h2>
            <p>
              AI BRIDGE may collect, store, and process the following types of
              personal data:
            </p>
            <ul>
              <li>
                Identifying data: name, email address, phone number (only when
                you voluntarily provide it);
              </li>
              <li>
                Technical data: IP address, browser type, operating system, time
                zone, cookies, browsing behavior;
              </li>
              <li>
                Usage data: your interactions with the website, forms, APIs, or
                connected systems;
              </li>
              <li>
                Voluntarily provided data: such as messages, demo requests, or
                service inquiries.
              </li>
              <li>
                We do not intentionally collect sensitive personal information
                (e.g., health data, religious beliefs, etc.). Please avoid
                submitting such data when using our services.
              </li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>3. Purpose of Processing</h2>
            <p>
              We collect and process your personal data only for the following
              purposes:
            </p>
            <ul>
              <li>To provide access to our technology services;</li>
              <li>To respond to your inquiries or messages;</li>
              <li>To manage customer relationships and user accounts;</li>
              <li>
                To analyze website performance and improve user experience;
              </li>
              <li>
                To send marketing or informational communications, if you have
                given consent;
              </li>
              <li>To comply with legal and tax obligations.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>4. Legal Basis for Processing</h2>
            <p>
              We rely on the following legal grounds for processing your data:
            </p>
            <ul>
              <li>
                Your express consent, when submitting forms or using the
                platform voluntarily;
              </li>
              <li>Performance of a contract, when you request a service;</li>
              <li>
                Legitimate interest, for maintaining service quality and
                security;
              </li>
              <li>Legal obligations, under applicable U.S. laws.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>5. Sharing Data with Third Parties</h2>
            <p>
              AI BRIDGE does not sell, rent, or share your personal data with
              unauthorized third parties.
            </p>
            <p>
              We may share your data with service providers who help us operate
              this website (e.g., hosting, analytics, cloud infrastructure,
              email services), under strict confidentiality and in compliance
              with applicable privacy laws.
            </p>
          </div>

          <div className="policy-section">
            <h2>6. International Data Transfers</h2>
            <p>
              As we operate from the United States, your data may be processed
              and stored outside your country of residence. We apply reasonable
              security measures to protect your data regardless of your
              location.
            </p>
          </div>

          <div className="policy-section">
            <h2>7. Data Retention</h2>
            <p>
              We retain personal data only as long as necessary to fulfill the
              purposes for which it was collected, or while a commercial
              relationship exists. In some cases, data may be retained longer to
              comply with legal obligations or resolve disputes.
            </p>
          </div>

          <div className="policy-section">
            <h2>8. Data Security</h2>
            <p>
              We implement reasonable technical, administrative, and
              organizational measures to protect your personal data against
              unauthorized access, loss, or misuse.
            </p>
            <p>
              However, please note that no system is completely secure, and we
              cannot guarantee absolute protection of information transmitted
              over the internet.
            </p>
          </div>

          <div className="policy-section">
            <h2>9. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access your personal data;</li>
              <li>Request corrections or updates;</li>
              <li>
                Request deletion of your data ("right to be forgotten");
              </li>
              <li>Object to data processing;</li>
              <li>Request data portability;</li>
              <li>Limit data processing in certain situations.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at {infoEmail}
              with a clear explanation of your request. We respond to valid
              requests within a reasonable time.
            </p>
          </div>

          <div className="policy-section">
            <h2>10. Cookies</h2>
            <p>
              Our website may use first-party and third-party cookies to analyze
              traffic, improve functionality, and optimize user experience.
            </p>
            <p>
              You can manage your cookie preferences through your browser
              settings. For more details, see our Cookie Policy (coming soon).
            </p>
          </div>

          <div className="policy-section">
            <h2>11. Use of Third-Party Services and APIs</h2>
            <p>
              Some services offered by AI BRIDGE may integrate third-party
              platforms via APIs or other technical connectors. Use of these
              external services is entirely voluntary and controlled by the
              user. AI BRIDGE is not responsible for the privacy practices of
              third-party platforms and recommends reviewing their respective
              policies.
            </p>
          </div>

          <div className="policy-section">
            <h2>12. Changes to This Policy</h2>
            <p>
              We reserve the right to update or modify this Privacy Policy at
              any time. Any significant changes will be posted on this page.
            </p>
            <p>
              Your continued use of the site after such changes constitutes
              acceptance of the updated terms.
            </p>
          </div>

          <div className="policy-section">
            <h2>13. Contact</h2>
            <p>
              For questions or concerns regarding this Privacy Policy or the
              handling of your personal data, you may contact us at: <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
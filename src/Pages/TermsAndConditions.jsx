import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function TermsAndConditions() {
  const { companyName, supportEmail, websiteUrl } = useDomain();

  return (
    <div className="policy-page">
      <section className="policy-header">
        <div className="home-container">
          <h1>Terms and Conditions</h1>
          <h4>Effective Date: January 1, 2025</h4>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-section">
            <h2>1. Description of Service</h2>
            <p>
              Our chatbot provides automated responses to user queries through
              natural language processing. It may assist with information,
              guidance, or basic customer support functions. The chatbot is
              intended for general informational purposes only and may not
              always provide accurate or up-to-date information.
            </p>
          </div>

          <div className="policy-section">
            <h2>2. User Eligibility</h2>
            <p>
              By using the Service, you confirm that you are at least 18 years
              of age or the age of majority in your jurisdiction. If you are
              using the Service on behalf of an organization, you represent and
              warrant that you are authorized to agree to these Terms on its
              behalf.
            </p>
          </div>

          <div className="policy-section">
            <h2>3. Acceptable Use</h2>
            <p>You agree to:</p>
            <ul>
              <li>Use the Service only for lawful purposes.</li>
              <li>
                Not interfere with or disrupt the integrity or performance of
                the chatbot.
              </li>
              <li>
                Not input or transmit any viruses, malware, or harmful content.
              </li>
              <li>
                Not use the Service to harass, abuse, or harm another person.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate access for any user
              violating these conditions.
            </p>
          </div>

          <div className="policy-section">
            <h2>4. Data Collection & Privacy</h2>
            <p>
              The chatbot may collect and store certain information, such as:
            </p>
            <ul>
              <li>Messages you send to the bot</li>
              <li>Technical metadata (e.g. IP address, device type)</li>
              <li>Usage patterns for service improvement</li>
            </ul>
            <p>
              Please refer to our <a href={`${websiteUrl}/privacy.html`}>Privacy Policy</a> for full details on how your data is handled.
            </p>
          </div>

          <div className="policy-section">
            <h2>5. AI Limitations</h2>
            <p>
              The chatbot may use automated systems or AI to generate responses.
              These responses:
            </p>
            <ul>
              <li>
                Are not guaranteed to be accurate, complete, or applicable to
                your specific situation.
              </li>
              <li>
                Should not be considered legal, medical, financial, or
                professional advice.
              </li>
              <li>
                May occasionally contain errors or inappropriate content, which
                we work to minimize.
              </li>
            </ul>
            <p>Use of information provided by the chatbot is at your own risk.</p>
          </div>

          <div className="policy-section">
            <h2>6. Intellectual Property</h2>
            <p>
              All content, code, and intellectual property related to the
              chatbot are the property of {companyName} or its licensors. You may
              not reproduce, distribute, or create derivative works without
              written permission.
            </p>
          </div>

          <div className="policy-section">
            <h2>7. Disclaimers</h2>
            <p>
              The Service is provided "as is" and "as available". We make no
              warranties, express or implied, including but not limited to:
            </p>
            <ul>
              <li>Fitness for a particular purpose</li>
              <li>Availability or uptime of the chatbot</li>
              <li>Accuracy or completeness of responses</li>
            </ul>
            <p>
              We are not liable for any damages arising from use of the Service.
            </p>
          </div>

          <div className="policy-section">
            <h2>8. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Changes will be posted on
              this page with a revised effective date. Continued use of the
              Service after changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div className="policy-section">
            <h2>9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate the Service at any
              time, with or without notice. Your access may also be revoked if
              you violate these Terms.
            </p>
          </div>

          <div className="policy-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this policy at any time. We will notify you of
              changes by updating the "Effective Date" at the top of this page.
            </p>
          </div>

          <div className="policy-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this policy or how we handle your
              data, please contact us:
            </p>
            <p>
              Email: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </p>
            <p>3242 NE 3rd Ave. Camas, WA 98607</p>
          </div>
        </div>
      </section>
    </div>
  );
}
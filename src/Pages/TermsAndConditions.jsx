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
            <h2>1. Service Overview</h2>
            <p>
              Our conversational agent delivers automated replies to user
              inquiries using natural language understanding technology. It
              offers assistance through information delivery, directional
              guidance, and fundamental support capabilities. This chatbot
              serves general informational needs and cannot guarantee the
              accuracy or currency of all provided information.
            </p>
          </div>

          <div className="policy-section">
            <h2>2. Who May Use This Service</h2>
            <p>
              Your use of the Service constitutes confirmation that you have
              reached 18 years of age or your jurisdiction's legal age of
              majority. When accessing the Service as an organizational
              representative, you affirm possessing proper authorization to
              accept these Terms for that entity.
            </p>
          </div>

          <div className="policy-section">
            <h2>3. Permitted Usage Guidelines</h2>
            <p>You commit to:</p>
            <ul>
              <li>Employ the Service exclusively for legitimate purposes.</li>
              <li>
                Refrain from compromising the chatbot's operational integrity
                or performance.
              </li>
              <li>
                Avoid transmitting malicious software, viruses, or damaging content.
              </li>
              <li>
                Never leverage the Service for harassment, abuse, or inflicting
                harm upon others.
              </li>
            </ul>
            <p>
              We maintain authority to restrict or revoke access for users who
              breach these guidelines.
            </p>
          </div>

          <div className="policy-section">
            <h2>4. Information Gathering & Privacy</h2>
            <p>
              Our chatbot may capture and retain various data points, including:
            </p>
            <ul>
              <li>Communications you submit to the chatbot</li>
              <li>System metadata (such as IP addresses and device specifications)</li>
              <li>Behavioral patterns used to refine our service</li>
            </ul>
            <p>
              Consult our <a href={`${websiteUrl}/privacy.html`}>Privacy Policy</a> for comprehensive information about data handling practices.
            </p>
          </div>

          <div className="policy-section">
            <h2>5. Artificial Intelligence Constraints</h2>
            <p>
              Our chatbot employs automated intelligence systems to formulate
              responses. These outputs:
            </p>
            <ul>
              <li>
                Cannot be warranted for accuracy, completeness, or relevance to
                your particular circumstances.
              </li>
              <li>
                Must not be interpreted as legal, medical, financial, or expert
                professional counsel.
              </li>
              <li>
                May occasionally include inaccuracies or unsuitable material,
                despite our ongoing efforts to reduce such occurrences.
              </li>
            </ul>
            <p>You assume full responsibility when acting on chatbot-provided information.</p>
          </div>

          <div className="policy-section">
            <h2>6. Ownership Rights</h2>
            <p>
              Every element of content, source code, and intellectual property
              associated with the chatbot belongs to {companyName} or its authorized
              licensors. Reproduction, distribution, or derivative creation
              requires explicit written consent.
            </p>
          </div>

          <div className="policy-section">
            <h2>7. Service Disclaimers</h2>
            <p>
              This Service operates on an "as is" and "as available" basis. We
              provide no guarantees, whether stated or implied, concerning:
            </p>
            <ul>
              <li>Suitability for your specific use case</li>
              <li>Continuous accessibility or operational uptime</li>
              <li>Precision or thoroughness of generated responses</li>
            </ul>
            <p>
              No liability attaches to us for damages stemming from Service usage.
            </p>
          </div>

          <div className="policy-section">
            <h2>8. Terms Modifications</h2>
            <p>
              These Terms may be revised at our discretion. Modifications will
              appear on this page alongside an updated effective date. Your
              continued Service usage following changes indicates acceptance of
              the revised Terms.
            </p>
          </div>

          <div className="policy-section">
            <h2>9. Service Termination</h2>
            <p>
              We hold the right to discontinue or suspend the Service at our
              discretion, whether or not advance notice is provided. Access
              privileges may be withdrawn if you breach these Terms.
            </p>
          </div>

          <div className="policy-section">
            <h2>10. Policy Revisions</h2>
            <p>
              This policy may undergo updates as needed. Changes will be
              communicated through revision of the "Effective Date" displayed
              at the page header.
            </p>
          </div>

          <div className="policy-section">
            <h2>11. Contact Information</h2>
            <p>
              For questions about this policy or our data management practices,
              please reach out:
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
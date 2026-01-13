import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function PrivacyPolicy() {
  const { infoEmail, companyName, websiteUrl } = useDomain();

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
            <h2>1. Data Controller Information</h2>
            <p>
              This Privacy Policy governs the website {websiteUrl},
              operated by:
            </p>
            <ul>
              <li>Legal Name: Keith Andrew Bonarrigo</li>
              <li>Registered Trade Name: {companyName}</li>
              <li>
                Business Address: 45 S 3rd St, Pacific Beach, WA 98571-5017,
                United States
              </li>
              <li>Email Contact: {infoEmail}</li>
              <li>Unified Business ID (UBI): 602491939</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>2. Data We Gather</h2>
            <p>
              {companyName} may capture, retain, and handle the following
              categories of personal information:
            </p>
            <ul>
              <li>
                Personal identifiers: full name, email address, telephone number
                (provided voluntarily by you);
              </li>
              <li>
                System data: IP address, browser specifications, operating system
                details, time zone settings, cookies, and navigation patterns;
              </li>
              <li>
                Activity data: your engagement with our website, submission forms,
                APIs, or integrated systems;
              </li>
              <li>
                Submitted information: including correspondence, demonstration
                inquiries, or service requests.
              </li>
              <li>
                We deliberately avoid collecting sensitive personal details
                (such as medical records, religious affiliations, etc.). Please
                refrain from providing such information through our services.
              </li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>3. Why We Process Your Data</h2>
            <p>
              Personal information is gathered and utilized exclusively for these
              objectives:
            </p>
            <ul>
              <li>Enabling access to our technological solutions;</li>
              <li>Addressing your questions and correspondence;</li>
              <li>Administering client relationships and user profiles;</li>
              <li>
                Evaluating platform performance and enhancing user satisfaction;
              </li>
              <li>
                Delivering promotional or informational content, with your
                explicit approval;
              </li>
              <li>Meeting statutory and fiscal requirements.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>4. Legal Foundation for Data Processing</h2>
            <p>
              Our data processing activities rest upon these legal justifications:
            </p>
            <ul>
              <li>
                Your direct consent, obtained through voluntary form submissions
                or platform engagement;
              </li>
              <li>Contractual fulfillment, when delivering requested services;</li>
              <li>
                Legitimate business interests, including service quality
                maintenance and security protection;
              </li>
              <li>Regulatory compliance, as mandated by relevant U.S. legislation.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>5. Third-Party Data Disclosure</h2>
            <p>
              {companyName} never sells, leases, or distributes your personal
              information to unauthorized external entities.
            </p>
            <p>
              Information may be disclosed to service vendors supporting our
              website operations (including hosting providers, analytics platforms,
              cloud infrastructure, and email delivery services), bound by
              confidentiality agreements and privacy law compliance requirements.
            </p>
          </div>

          <div className="policy-section">
            <h2>6. Cross-Border Data Handling</h2>
            <p>
              Given our U.S.-based operations, your information may undergo
              processing and storage beyond your country's borders. We implement
              appropriate safeguards to secure your data irrespective of
              geographic location.
            </p>
          </div>

          <div className="policy-section">
            <h2>7. Information Retention Period</h2>
            <p>
              Personal data remains in our possession only for durations required
              to achieve collection objectives or throughout active business
              relationships. Certain circumstances may necessitate extended
              retention to satisfy legal mandates or settle disputes.
            </p>
          </div>

          <div className="policy-section">
            <h2>8. Security Measures</h2>
            <p>
              We deploy appropriate technical, administrative, and organizational
              controls to shield your personal information from unauthorized
              intrusion, data loss, or improper use.
            </p>
            <p>
              Nonetheless, recognize that perfect security remains unattainable,
              and we cannot promise absolute safeguarding of data transmitted
              via internet channels.
            </p>
          </div>

          <div className="policy-section">
            <h2>9. Your Privacy Rights</h2>
            <p>Subject to your jurisdiction, you may be entitled to:</p>
            <ul>
              <li>View your stored personal information;</li>
              <li>Submit correction or update requests;</li>
              <li>
                Demand data erasure ("right to be forgotten");
              </li>
              <li>Challenge data processing activities;</li>
              <li>Obtain portable copies of your data;</li>
              <li>Restrict processing under specific conditions.</li>
            </ul>
            <p>
              To invoke these rights, reach out via {infoEmail} with a detailed
              description of your request. Legitimate requests receive responses
              within reasonable timeframes.
            </p>
          </div>

          <div className="policy-section">
            <h2>10. Cookie Usage</h2>
            <p>
              Both first-party and third-party cookies may be deployed on our
              platform to examine traffic patterns, enhance functionality, and
              refine user experiences.
            </p>
            <p>
              Cookie preferences remain under your control via browser
              configurations. Additional information appears in our Cookie Policy
              (coming soon).
            </p>
          </div>

          <div className="policy-section">
            <h2>11. External Platform Integration</h2>
            <p>
              Certain offerings from {companyName} incorporate third-party
              platforms through APIs or similar technical connections. Engagement
              with these external services remains completely optional and
              user-directed. {companyName} bears no responsibility for external
              platform privacy approaches and advises consulting their individual
              policies.
            </p>
          </div>

          <div className="policy-section">
            <h2>12. Policy Updates</h2>
            <p>
              We maintain the prerogative to revise or amend this Privacy Policy
              at our discretion. Substantial modifications will be published on
              this page.
            </p>
            <p>
              Ongoing site usage following such revisions signifies your
              acceptance of modified terms.
            </p>
          </div>

          <div className="policy-section">
            <h2>13. Contact Information</h2>
            <p>
              For inquiries or concerns about this Privacy Policy or our personal
              data handling practices, contact us at: <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
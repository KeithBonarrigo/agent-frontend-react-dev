import "../styles/ContentStyles.css";
import { useDomain } from "../contexts/DomainContext";

export default function DataDeletionPolicy() {
  const { companyName, infoEmail, websiteUrl } = useDomain();

  return (
    <div className="policy-page">
      {/* Header Section */}
      <section className="policy-header">
        <div className="home-container">
          <h1>User Data Deletion Policy</h1>
          <h4>Effective Date: August 3, 2025</h4>
        </div>
      </section>

      {/* Policy Content Section */}
      <section className="policy-content-section">
        <div className="home-container">
          <div className="policy-intro">
            <p>
              <strong>{companyName} prioritizes your privacy and empowers you with complete control
              over your personal information. This policy details the process for requesting
              deletion of data gathered through our Facebook or Instagram application integrations.</strong>
            </p>
          </div>

          <div className="policy-section">
            <h2>1. Information We Collect</h2>
            <p>
              Through your authorized Meta login, our application may gather the
              following information when you connect via Facebook or Instagram:
            </p>
            <ul>
              <li>Publicly available profile details (display name, avatar image, etc.)</li>
              <li>Your email address</li>
              <li>Unique user identifier from Facebook or Instagram</li>
              <li>
                Additional information you've specifically authorized via Facebook Login
                permissions
              </li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>2. How We Use Your Information</h2>
            <p>Your data enables us to:</p>
            <ul>
              <li>Grant you access to our platform's functionality</li>
              <li>Tailor and enhance your experience</li>
              <li>Reach out to you when you've provided consent</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>3. Requesting Data Removal</h2>
            <p>
              Should you choose to remove your information from our platform,
              you have two convenient options:
            </p>

            <div className="policy-option">
              <h3>Option A: Self-Service Deletion</h3>
              <ul>
                <li>Access your Facebook Account Settings.</li>
                <li>Select Apps and Websites from the menu.</li>
                <li>Locate our application in your connected apps.</li>
                <li>Remove the application to automatically initiate data deletion.</li>
              </ul>
            </div>

            <div className="policy-option">
              <h3>Option B: Email Request</h3>
              <p>
                Send your deletion request directly to:{" "}
                <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
              </p>
              <p>Your email should contain:</p>
              <ul>
                <li>Subject line: User Data Deletion Request</li>
                <li>Your complete name</li>
                <li>
                  Your Facebook/Instagram User ID (alternatively, provide a screenshot
                  showing your app profile)
                </li>
              </ul>
              <p>
                Your request will be handled within 7 business days, and you'll receive
                email confirmation once the deletion is complete.
              </p>
            </div>
          </div>

          <div className="policy-section">
            <h2>4. Data Retention Timeline</h2>
            <p>
              Your information is stored only as long as needed to serve the purposes
              described in this policy or to meet legal obligations. Upon deletion,
              your personal information is permanently erased from our infrastructure.
            </p>
          </div>

          <div className="policy-section">
            <h2>5. Get in Touch</h2>
            <p>
              For questions or concerns regarding this Data Deletion Policy or our
              data handling practices, reach out to us:
            </p>
            <div className="policy-contact">
              <p>
                <strong>{companyName}</strong>
                <br />
                3242 NE 3rd Ave Camas, WA 98607
                <br />
                <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
                <br />

                <a  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {websiteUrl}
                </a>
              </p>
            </div>
          </div>

          <div className="policy-section">
            <h2>6. Updates to This Policy</h2>
            <p>
              This policy may be revised to accommodate legal or operational changes.
              Updates will appear on this page with a new "Effective Date" noted at the top.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
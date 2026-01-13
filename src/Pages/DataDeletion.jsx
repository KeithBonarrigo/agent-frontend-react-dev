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
              <strong>At {companyName}, we are committed to protecting your privacy and
              ensuring you have control over your data. This User Data Deletion
              Policy outlines how users can request the deletion of their data
              collected through Facebook or Instagram integrations with our
              application.</strong>
            </p>
          </div>

          <div className="policy-section">
            <h2>1. Types of Data Collected</h2>
            <p>
              When you use our application via Facebook or Instagram, we may
              collect the following data (as authorized by you through the Meta
              login process):
            </p>
            <ul>
              <li>Public profile information (name, profile picture, etc.)</li>
              <li>Email address</li>
              <li>Facebook or Instagram user ID</li>
              <li>
                Any other information explicitly granted through Facebook Login
                permissions
              </li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>2. Purpose of Data Collection</h2>
            <p>We use this data to:</p>
            <ul>
              <li>Provide access to our platform's features</li>
              <li>Customize and improve your user experience</li>
              <li>Communicate with you (if consent is given)</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>3. How to Request Data Deletion</h2>
            <p>
              If you wish to delete your data from our systems, you can do so by
              following one of these methods:
            </p>

            <div className="policy-option">
              <h3>Option A: Self-Service</h3>
              <ul>
                <li>Go to your Facebook Account Settings.</li>
                <li>Navigate to Apps and Websites.</li>
                <li>Find and remove our application from the list.</li>
                <li>This revokes our access and triggers a deletion request.</li>
              </ul>
            </div>

            <div className="policy-option">
              <h3>Option B: Direct Request</h3>
              <p>
                You can request deletion by emailing us at:{" "}
                <a href={`mailto:${infoEmail}`}>{infoEmail}</a>
              </p>
              <p>Please include the following in your email:</p>
              <ul>
                <li>Subject: User Data Deletion Request</li>
                <li>Your full name</li>
                <li>
                  Your Facebook/Instagram User ID (or a screenshot of your app
                  profile)
                </li>
              </ul>
              <p>
                We will process your request within 7 business days and confirm
                via email once your data has been deleted.
              </p>
            </div>
          </div>

          <div className="policy-section">
            <h2>4. Retention Period</h2>
            <p>
              We retain user data only for as long as necessary to fulfill the
              purposes outlined in this policy, or as required by law. Once
              deleted, all personal data is permanently removed from our servers.
            </p>
          </div>

          <div className="policy-section">
            <h2>5. Contact Us</h2>
            <p>
              If you have any questions or concerns about our Data Deletion Policy
              or data practices, please contact us:
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
            <h2>6. Policy Updates</h2>
            <p>
              We may update this policy to reflect changes in legal or operational
              requirements. Any changes will be posted on this page with a revised
              "Effective Date".
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
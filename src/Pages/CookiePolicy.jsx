import "../styles/ContentStyles.css";

export default function CookiePolicy() {
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
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device (computer,
              mobile phone, tablet, etc.) when you visit a website. They are
              widely used to enable websites to function, enhance user
              experience, and collect statistical or marketing data.
            </p>
            <p>
              Cookies may be set by the website you are visiting (first-party
              cookies) or by third parties (third-party cookies) providing
              services or functionalities integrated into the site.
            </p>
          </div>

          <div className="policy-section">
            <h2>2. Types of Cookies We Use</h2>
            <p>
              The website www.aibridge.global may use the following types of
              cookies:
            </p>
            <ul>
              <li>
                <strong>Strictly Necessary Cookies</strong>
                <br />
                These cookies are essential for the operation of the site and
                cannot be disabled. They enable features such as secure access,
                navigation, and proper page loading.
              </li>
              <li>
                <strong>Analytics or Performance Cookies</strong>
                <br />
                These cookies collect anonymized data to help us understand how
                users interact with the site. For example, pages visited,
                session duration, or bounce rate.
              </li>
              <li>
                <strong>Preference or Functionality Cookies</strong>
                <br />
                These remember your settings or preferences, such as language,
                region, or display layout, to enhance your experience on future
                visits.
              </li>
              <li>
                <strong>Marketing or Targeting Cookies (if used)</strong>
                <br />
                These track your browsing activity across websites to display
                relevant advertising based on your interests. These are only
                used with your consent.
              </li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>3. Third-Party Cookies</h2>
            <p>
              We may use third-party services that place cookies on your device.
              These may include:
            </p>
            <ul>
              <li>Website analytics providers;</li>
              <li>Cloud-based automation tools;</li>
              <li>AI integrations or chatbots;</li>
              <li>Social media plugins or trackers.</li>
            </ul>
            <p>
              We do not control these cookies and recommend reviewing the
              privacy and cookie policies of those third-party providers.
            </p>
          </div>

          <div className="policy-section">
            <h2>4. How to Manage Cookies</h2>
            <p>
              You can manage or disable cookies through your browser settings at
              any time. Below are links to instructions for common browsers:
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
              Please note that disabling certain cookies may affect the
              functionality and performance of the website.
            </p>
          </div>

          <div className="policy-section">
            <h2>5. Updates to This Cookie Policy</h2>
            <p>
              AI BRIDGE reserves the right to update this Cookie Policy at any
              time. Significant changes will be published on this page.
            </p>
          </div>

          <div className="policy-section">
            <h2>6. Contact</h2>
            <p>
              If you have questions about this Cookie Policy or our use of
              cookies, please contact us at: <a href="mailto:info@aibridge.global">info@aibridge.global</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
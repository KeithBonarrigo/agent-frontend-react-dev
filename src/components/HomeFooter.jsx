import { useDomain } from "../contexts/DomainContext";

function HomeFooter() {
  const currentYear = new Date().getFullYear();
  const { domainInfo, companyName } = useDomain();

  // Get logo based on domain
  const getLogoSrc = () => {
    if (domainInfo?.domainType === 'botwerx') {
      return '/img/logo-botwerx.jpeg';
    }
    return '/img/AI-Bridge-Logo-Med2.png';
  };

  // Get company address based on domain
  const getCompanyAddress = () => {
    if (domainInfo?.domainType === 'botwerx') {
      return 'Botwerx, LLC - 45 S 3rd St. Pacific Beach, WA 98571-5071';
    }
    return 'AI Bridge - 45 S 3rd St. Pacific Beach, WA 98571-5071';
  };

  return (
    <footer className="home-footer">
      <div className="home-container">
        <div className="home-footer-content">
          <div className="home-footer-left">
            <div className="home-footer-logo">
              <img src={getLogoSrc()} alt={`${companyName} Logo`} />
            </div>
            {/*<p className="home-footer-tagline">
              AI Solutions for Everyday Business
            </p>*/}
          </div>

          <div className="home-copyright">
            <p>© {currentYear}. All Rights Reserved.</p>
            <p className="home-footer-links">
              <a href="/data-deletion" className="home-footer-link">
                Our Data Deletion Policy
              </a>{" "}
              |{" "}
              <a href="/cookies" className="home-footer-link">
                Our Cookie Policy
              </a>{" "}
              <br />{" "}
              <a href="/terms-and-conditions" className="home-footer-link">
                Terms and Conditions
              </a>{" "}
              |{" "}
              <a href="/privacy" className="home-footer-link">
                Privacy
              </a>
            </p>
            <p>{getCompanyAddress()}</p>
          </div>

          <div className="home-social-icons">
            
              <a href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="home-social-link"
            >
              <i className="fab fa-linkedin"></i>
            </a>
            
              <a href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="home-social-link"
            >
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default HomeFooter;
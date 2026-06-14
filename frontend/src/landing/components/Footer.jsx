const LINKS = {
  Company: ['About WAKHAR', 'Our Mission', 'Leadership', 'Careers', 'Press & Media'],
  Platform: ['Farmer Portal', 'FPO Dashboard', 'Aggregator Console', 'Market Partner', 'API Docs'],
  Support: ['Help Center', 'Getting Started', 'Contact Us', 'System Status', 'Feature Requests'],
};

export default function Footer() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="lp-footer">
      <div className="lp-footer-inner">
        {/* Top grid */}
        <div className="lp-footer-top">
          {/* Brand */}
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <div className="lp-logo-icon">🌾</div>
              <div className="lp-logo-text">
                <span className="lp-logo-name">WAKHAR</span>
                <span className="lp-logo-tag">Digital Agriculture Ecosystem</span>
              </div>
            </div>
            <p className="lp-footer-tagline">
              Empowering farmers and FPOs with intelligent warehouse management,
              market linkage, and financial inclusion — from farm to market.
            </p>
            <div className="lp-footer-social">
              <div className="lp-footer-social-btn" title="Twitter">🐦</div>
              <div className="lp-footer-social-btn" title="LinkedIn">💼</div>
              <div className="lp-footer-social-btn" title="YouTube">▶</div>
              <div className="lp-footer-social-btn" title="WhatsApp">💬</div>
            </div>

            {/* Contact info */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📧</span> support@wakhar.in
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📞</span> 1800-XXX-WAKHAR (Toll Free)
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📍</span> Pune, Maharashtra, India
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([col, links]) => (
            <div key={col}>
              <div className="lp-footer-col-title">{col}</div>
              <ul className="lp-footer-links">
                {links.map(link => (
                  <li key={link}><a>{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="lp-footer-bottom">
          <div className="lp-footer-copy">
            © 2026 WAKHAR Digital Agriculture Ecosystem. All rights reserved.
          </div>

          <div className="lp-footer-legal">
            <a>Privacy Policy</a>
            <a>Terms & Conditions</a>
            <a>Cookie Policy</a>
            <a>Accessibility</a>
          </div>

          <div className="lp-footer-made">
            <span>🇮🇳</span> Made in India for Indian Farmers
          </div>
        </div>
      </div>
    </footer>
  );
}

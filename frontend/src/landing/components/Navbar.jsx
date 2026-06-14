import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className={`lp-navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="lp-navbar-inner">
        {/* Logo */}
        <div className="lp-logo" onClick={() => scrollTo('hero')}>
          <div className="lp-logo-icon">🌾</div>
          <div className="lp-logo-text">
            <span className="lp-logo-name">WAKHAR</span>
            <span className="lp-logo-tag">Digital Agriculture</span>
          </div>
        </div>

        {/* Nav Links */}
        <ul className="lp-nav-links">
          <li><a onClick={() => scrollTo('about')}>About</a></li>
          <li><a onClick={() => scrollTo('stakeholders')}>Portal</a></li>
        </ul>

        {/* CTA */}
        <div className="lp-nav-cta">
          <button className="lp-btn lp-btn-outline" onClick={() => scrollTo('stakeholders')}>
            Sign In
          </button>
          <button className="lp-btn lp-btn-primary" onClick={() => scrollTo('stakeholders')}>
            Get Started →
          </button>
        </div>

        {/* Hamburger */}
        <button className="lp-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
          <span style={menuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
          <span style={menuOpen ? { opacity: 0 } : {}} />
          <span style={menuOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(26,61,43,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {['about', 'stakeholders', 'contact'].map(id => (
            <a key={id} onClick={() => scrollTo(id)} style={{
              padding: '12px 0',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'var(--lp-font)',
              textTransform: 'capitalize'
            }}>
              {id === 'stakeholders' ? 'Portal Access' : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
          <button
            className="lp-btn lp-btn-primary"
            style={{ marginTop: '16px', justifyContent: 'center' }}
            onClick={() => scrollTo('stakeholders')}
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}

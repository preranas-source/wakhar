import { useEffect, useRef } from 'react';

const PILLARS = [
  { icon: '🏭', title: 'Warehouse Digitization', desc: 'Full digital twin of FPO warehouses with zone and rack-level tracking.' },
  { icon: '📦', title: 'Inventory Management', desc: 'Real-time commodity tracking from intake to dispatch with e-Receipts.' },
  { icon: '🔗', title: 'Market Linkage', desc: 'Direct connection to eNAM, traders, and national commodity exchanges.' },
  { icon: '👨‍🌾', title: 'Farmer Empowerment', desc: 'Digital access to receipts, collateral loans, and withdrawal requests.' },
];

export default function About() {
  const sectionRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.lp-animate, .lp-animate-left, .lp-animate-right').forEach(el => {
              el.classList.add('lp-visible');
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="lp-section lp-about" ref={sectionRef}>
      <div className="lp-section-inner">
        <div className="lp-about-grid">
          {/* Text */}
          <div className="lp-about-text lp-animate-left">
            <div className="lp-section-label">About WAKHAR</div>
            <h2 className="lp-section-title">
              Bridging the Digital Divide in Indian Agriculture
            </h2>
            <p className="lp-section-subtitle" style={{ marginBottom: 24, maxWidth: 'none' }}>
              WAKHAR is a comprehensive Digital Agriculture Ecosystem designed for Farmer Producer
              Organizations (FPOs) across India. We digitize every touchpoint — from farm gate to
              market — creating transparency, efficiency, and financial empowerment for smallholder farmers.
            </p>
            <p className="lp-section-subtitle" style={{ marginBottom: 36 }}>
              Our platform integrates warehouse management, quality control, logistics tracking,
              and market linkage into a single, intuitive system — accessible even in low-connectivity
              rural environments.
            </p>

            <div className="lp-about-pillars">
              {PILLARS.map((p, i) => (
                <div key={i} className={`lp-pillar lp-animate lp-animate-delay-${i + 1}`}>
                  <div className="lp-pillar-icon">{p.icon}</div>
                  <div>
                    <div className="lp-pillar-title">{p.title}</div>
                    <div className="lp-pillar-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="lp-about-visual lp-animate-right" ref={imgRef}>
            <div className="lp-about-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80"
                alt="Indian farmers and agriculture warehouse"
                loading="lazy"
              />
              {/* Overlay gradient */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(26,61,43,0.3) 0%, transparent 60%)'
              }} />
            </div>

            {/* Badge */}
            <div className="lp-about-badge">
              <div className="lp-about-badge-icon">✅</div>
              <div>
                <div className="lp-about-badge-num">13 Modules</div>
                <div className="lp-about-badge-label">Fully Integrated Platform</div>
              </div>
            </div>

            {/* Floating secondary badge */}
            <div style={{
              position: 'absolute', top: 24, right: -16,
              background: 'linear-gradient(135deg, #1e5035, #2d6a4f)',
              borderRadius: 14, padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              zIndex: 2
            }}>
              <span style={{ fontSize: 24 }}>📡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Live Tracking</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>GPS + Traccar</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

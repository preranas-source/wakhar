import { useEffect, useRef } from 'react';

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: 60 + Math.random() * 120,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 12 + Math.random() * 10,
  color: i % 3 === 0 ? '#52b788' : i % 3 === 1 ? '#d4a72c' : '#ffffff',
}));

export default function Hero() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { width, height } = el.getBoundingClientRect();
      const xPct = (clientX / width - 0.5) * 12;
      const yPct = (clientY / height - 0.5) * 8;
      el.querySelector('.lp-hero-bg').style.transform =
        `scale(1.05) translate(${xPct * 0.4}px, ${yPct * 0.4}px)`;
    };
    el.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMouseMove);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="lp-hero" ref={ref}>
      {/* Background */}
      <div className="lp-hero-bg" style={{ transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }} />

      {/* Particles */}
      <div className="lp-hero-particles">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="lp-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: '-10%',
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="lp-hero-content">
        <div className="lp-hero-eyebrow" style={{ animation: 'fadeIn 0.8s ease both' }}>
          <span className="dot" />
          India's Smart Agricultural Ecosystem Platform
        </div>

        <h1 className="lp-hero-heading" style={{ animation: 'fadeInUp 0.9s ease 0.1s both' }}>
          Empowering Agriculture Through{' '}
          <em>Smart Warehouse Management</em>
        </h1>

        <p className="lp-hero-sub" style={{ animation: 'fadeInUp 0.9s ease 0.2s both' }}>
          Digitizing Storage, Quality Control, Market Linkage, and Commodity
          Tracking from Farm to Market — connecting farmers, FPOs, aggregators
          and markets in one unified ecosystem.
        </p>

        <div className="lp-hero-actions" style={{ animation: 'fadeInUp 0.9s ease 0.3s both' }}>
          <button className="lp-btn-hero-primary" onClick={() => scrollTo('stakeholders')}>
            🚀 Get Started
          </button>
          <button className="lp-btn-hero-secondary" onClick={() => scrollTo('about')}>
            <span>▶</span>
            Learn More
          </button>
        </div>

        {/* Quick stats */}
        <div className="lp-hero-stats" style={{ animation: 'fadeInUp 0.9s ease 0.4s both' }}>
          <div className="lp-hero-stat">
            <span className="lp-hero-stat-num">1,000+</span>
            <span className="lp-hero-stat-label">Warehouses</span>
          </div>
          <div className="lp-hero-divider" />
          <div className="lp-hero-stat">
            <span className="lp-hero-stat-num">50,000+</span>
            <span className="lp-hero-stat-label">Active Farmers</span>
          </div>
          <div className="lp-hero-divider" />
          <div className="lp-hero-stat">
            <span className="lp-hero-stat-num">₹120 Cr+</span>
            <span className="lp-hero-stat-label">Commodities Managed</span>
          </div>
          <div className="lp-hero-divider" />
          <div className="lp-hero-stat">
            <span className="lp-hero-stat-num">Real-Time</span>
            <span className="lp-hero-stat-label">GPS Tracking</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="lp-hero-scroll" onClick={() => scrollTo('about')}>
        <div className="lp-scroll-mouse">
          <div className="lp-scroll-wheel" />
        </div>
        <span>Scroll</span>
      </div>
    </section>
  );
}

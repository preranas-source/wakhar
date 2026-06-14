import { useEffect, useRef } from 'react';

const FEATURES = [
  {
    icon: '📥', color: 'green',
    name: 'Commodity Intake Management',
    desc: 'Gate-in registration, weighbridge integration, bag counting, and lot generation for all incoming produce.'
  },
  {
    icon: '🧾', color: 'earth',
    name: 'Warehouse Receipt Generation',
    desc: 'Negotiable e-WRs with WDRA compliance, QR codes, face valuation, and collateral linkage to NABARD/banks.'
  },
  {
    icon: '📊', color: 'green',
    name: 'Inventory Tracking',
    desc: 'Live stock visibility across zones, racks, and bins with real-time quantity and status updates.'
  },
  {
    icon: '🔬', color: 'gold',
    name: 'Quality Control & Grading',
    desc: 'Lab-certified moisture, purity, and foreign matter testing with grade assignment and rejection workflows.'
  },
  {
    icon: '🚛', color: 'earth',
    name: 'Dispatch & Logistics',
    desc: 'Automated dispatch notes, e-Way Bill integration, vehicle tracking, and digital proof of delivery.'
  },
  {
    icon: '🏪', color: 'green',
    name: 'Market Linkage',
    desc: 'Integration with eNAM, direct buyer connections, purchase order management, and price discovery.'
  },
  {
    icon: '📡', color: 'gold',
    name: 'Real-time GPS Tracking',
    desc: 'Live vehicle and shipment tracking via Traccar integration with geo-fencing and ETA predictions.'
  },
  {
    icon: '📈', color: 'green',
    name: 'Analytics Dashboard',
    desc: 'Comprehensive reports, commodity trends, revenue analytics, and custom KPI dashboards for management.'
  },
];

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.lp-animate').forEach((el, i) => {
              setTimeout(() => el.classList.add('lp-visible'), i * 80);
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
    <section id="features" className="lp-section lp-features" ref={sectionRef}>
      <div className="lp-section-inner">
        <div className="lp-features-header lp-animate">
          <div className="lp-section-label">Platform Features</div>
          <h2 className="lp-section-title">Everything You Need to Run a Modern Warehouse</h2>
          <p className="lp-section-subtitle">
            A complete suite of tools built specifically for India's agricultural supply chain —
            from intake to delivery.
          </p>
        </div>

        <div className="lp-features-grid">
          {FEATURES.map((feat, i) => (
            <div key={i} className="lp-feature-card lp-animate" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className={`lp-feature-icon ${feat.color}`}>{feat.icon}</div>
              <div className="lp-feature-name">{feat.name}</div>
              <div className="lp-feature-desc">{feat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

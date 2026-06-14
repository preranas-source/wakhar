import { useEffect, useRef } from 'react';

const STEPS = [
  {
    icon: '👨‍🌾',
    title: 'Farmer',
    desc: 'Deposits produce at the FPO warehouse and receives a digital warehouse receipt.',
    color: 'green-dark',
    num: '01',
  },
  {
    icon: '🏭',
    title: 'FPO Warehouse',
    desc: 'Grades commodities, manages storage, issues e-WRs, and prepares stock for dispatch.',
    color: 'green',
    num: '02',
  },
  {
    icon: '🔗',
    title: 'Aggregator',
    desc: 'Consolidates stock from multiple FPOs, arranges bulk logistics, and coordinates transfers.',
    color: 'earth',
    num: '03',
  },
  {
    icon: '🏪',
    title: 'Market Partner',
    desc: 'Places purchase orders, receives certified commodities, and completes digital payments.',
    color: 'gold',
    num: '04',
  },
];

export default function ProcessFlow() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.lp-animate').forEach((el, i) => {
              setTimeout(() => el.classList.add('lp-visible'), i * 150);
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="process" className="lp-section lp-process" ref={sectionRef}>
      <div className="lp-section-inner">
        <div className="lp-process-header lp-animate">
          <div className="lp-section-label">Value Chain Flow</div>
          <h2 className="lp-section-title">From Farm Gate to Market</h2>
          <p className="lp-section-subtitle">
            WAKHAR digitizes every step of the agricultural supply chain, creating a transparent,
            efficient, and traceable journey for every commodity.
          </p>
        </div>

        <div className="lp-process-flow">
          {STEPS.map((step, i) => (
            <>
              <div key={step.num} className="lp-process-step lp-animate" style={{ transitionDelay: `${i * 120}ms` }}>
                <div className={`lp-process-node ${step.color}`}>
                  {step.icon}
                  <div className="lp-process-step-num">{step.num}</div>
                </div>
                <div className="lp-process-step-title">{step.title}</div>
                <div className="lp-process-step-desc">{step.desc}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div key={`conn-${i}`} className="lp-process-connector">
                  <div className="lp-process-line" />
                </div>
              )}
            </>
          ))}
        </div>

        {/* Bottom banner */}
        <div className="lp-animate" style={{ transitionDelay: '0.5s' }}>
          <div style={{
            marginTop: 60,
            background: 'linear-gradient(135deg, #1e5035, #2d6a4f)',
            borderRadius: 20,
            padding: '32px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>
                🌐 End-to-End Digital Traceability
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                Every lot, receipt, transfer, and payment is permanently recorded and auditable.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {['QR-Coded Receipts', 'GPS Tracking', 'Digital Payments', 'eNAM Integration'].map(tag => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52b788' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

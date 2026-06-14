import { useEffect, useRef } from 'react';

const TECH = [
  {
    logoClass: 'erpnext',
    logoText: 'ERP',
    name: 'ERPNext',
    desc: 'Core ERP integration for accounting, procurement, HR, and financial management across all FPO operations.',
    tag: 'ERP Integration',
  },
  {
    logoClass: 'fleetbase',
    logoText: 'FB',
    name: 'Fleetbase',
    desc: 'Dispatch management and order orchestration platform for coordinating deliveries and logistics workflows.',
    tag: 'Logistics API',
  },
  {
    logoClass: 'traccar',
    logoText: '📍',
    name: 'Traccar',
    desc: 'Open-source GPS tracking server providing real-time vehicle telemetry, geo-fencing, and route monitoring.',
    tag: 'GPS Tracking',
  },
  {
    logoClass: 'enam',
    logoText: 'eNAM',
    name: 'eNAM Portal',
    desc: 'National Agriculture Market integration for price discovery, digital auctions, and inter-state commodity trade.',
    tag: 'Market Linkage',
  },
  {
    logoClass: 'whatsapp',
    logoText: '💬',
    name: 'WhatsApp Business',
    desc: 'Automated notifications to farmers — warehouse receipts, QC results, dispatch alerts, and loan approvals via WhatsApp.',
    tag: 'Notifications',
  },
  {
    logoClass: 'payment',
    logoText: '💳',
    name: 'Payment Gateway',
    desc: 'Integrated UPI, NEFT, and bank transfer support for farmer payments, purchase settlements, and loan disbursals.',
    tag: 'Fintech',
  },
];

export default function Technology() {
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
    <section id="technology" className="lp-section lp-technology" ref={sectionRef}>
      <div className="lp-section-inner">
        <div className="lp-technology-header lp-animate">
          <div className="lp-section-label">Integrations</div>
          <h2 className="lp-section-title">Powered by Best-in-Class Technology</h2>
          <p className="lp-section-subtitle">
            WAKHAR seamlessly integrates with government platforms, fintech providers, and
            logistics systems to deliver a fully connected ecosystem.
          </p>
        </div>

        <div className="lp-tech-grid">
          {TECH.map((t, i) => (
            <div key={i} className="lp-tech-card lp-animate" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className={`lp-tech-logo ${t.logoClass}`}>{t.logoText}</div>
              <div>
                <div className="lp-tech-name">{t.name}</div>
                <div className="lp-tech-desc">{t.desc}</div>
                <span className="lp-tech-tag">✓ {t.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Integration note */}
        <div className="lp-animate" style={{ transitionDelay: '0.4s', marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--lp-text-muted)' }}>
            All integrations are API-first and built for scalability.
            <strong style={{ color: 'var(--lp-green-700)' }}> Custom integrations</strong> available on request.
          </p>
        </div>
      </div>
    </section>
  );
}

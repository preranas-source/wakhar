import { useEffect, useRef, useState } from 'react';

const TESTIMONIALS = [
  {
    stars: 5,
    text: '"WAKHAR transformed how we manage our warehouse in Sangli. I can see all stocks from my phone — which lot is where, its moisture, and when it will be dispatched. This is exactly what FPOs needed."',
    name: 'Prakash Salunkhe',
    role: 'FPO Manager, Sahyadri FPC, Sangli',
    initials: 'PS',
    bg: '#2d6a4f',
  },
  {
    stars: 5,
    text: '"Before WAKHAR, I had no idea where my produce was after depositing at the warehouse. Now I get a WhatsApp message with my warehouse receipt and I can check everything online. My faith in FPO has increased."',
    name: 'Sushila Devi',
    role: 'Farmer, Wai, Maharashtra',
    initials: 'SD',
    bg: '#40916c',
  },
  {
    stars: 5,
    text: '"As an aggregator handling 12 warehouses across Pune district, WAKHAR gave me a single view of all inventory. The transfer and consolidation features save us 3-4 hours of manual work every day."',
    name: 'Mohan Kulkarni',
    role: 'Aggregator Partner, Pune',
    initials: 'MK',
    bg: '#6b4f2a',
  },
  {
    stars: 5,
    text: '"The eNAM integration is a game changer. We can see certified-grade produce listings and place purchase orders directly from the platform. The quality documentation gives us confidence in every trade."',
    name: 'Rajiv Verma',
    role: 'Commodity Trader, New Delhi',
    initials: 'RV',
    bg: '#1a4d7a',
  },
  {
    stars: 5,
    text: '"NABARD\'s collateral lending through WAKHAR\'s e-WR system is exactly the innovation rural India needed. Farmers can now access institutional credit against their stored produce within 48 hours."',
    name: 'Dr. Asha Patel',
    role: 'Regional Head, NABARD Maharashtra',
    initials: 'AP',
    bg: '#4a3080',
  },
  {
    stars: 5,
    text: '"The GPS tracking and Traccar integration means we always know where our vehicles are. Dispatch management went from chaos to clockwork — the platform pays for itself in the first week."',
    name: 'Suresh Waghmare',
    role: 'Logistics Coordinator, Nashik FPC',
    initials: 'SW',
    bg: '#1a5c6b',
  },
];

export default function Testimonials() {
  const sectionRef = useRef(null);
  const [current, setCurrent] = useState(0);

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

  // Auto-cycle featured testimonial on mobile is handled via CSS
  // Show all 6 on desktop in 3-column grid
  return (
    <section id="testimonials" className="lp-section lp-testimonials" ref={sectionRef}>
      <div className="lp-section-inner">
        <div className="lp-testimonials-header lp-animate">
          <div className="lp-section-label">Testimonials</div>
          <h2 className="lp-section-title">Trusted by Farmers, FPOs & Partners</h2>
          <p className="lp-section-subtitle">
            Real voices from across India's agricultural value chain.
          </p>
        </div>

        <div className="lp-testimonials-track">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="lp-testimonial-card lp-animate" style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="lp-testimonial-quote">"</div>
              <div className="lp-testimonial-stars">
                {'★'.repeat(t.stars)}
              </div>
              <div className="lp-testimonial-text">{t.text}</div>
              <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar" style={{ background: t.bg }}>
                  {t.initials}
                </div>
                <div>
                  <div className="lp-testimonial-name">{t.name}</div>
                  <div className="lp-testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

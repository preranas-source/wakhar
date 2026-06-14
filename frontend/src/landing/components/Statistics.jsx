import { useEffect, useRef, useState } from 'react';

const STATS = [
  { icon: '🏭', target: 1000, suffix: '+', label: 'Warehouses', sub: 'Across 8 states', prefix: '' },
  { icon: '🧾', target: 500000, suffix: '+', label: 'Warehouse Receipts', sub: 'Issued to farmers', prefix: '' },
  { icon: '👨‍🌾', target: 50000, suffix: '+', label: 'Farmers Onboarded', sub: 'Active on platform', prefix: '' },
  { icon: '📡', target: null, suffix: '', label: 'Real-Time Tracking', sub: 'GPS-enabled fleet', prefix: '', display: 'Live' },
];

function useCountUp(target, duration = 2000, enabled = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || target === null) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);

  return count;
}

function StatItem({ stat, animate }) {
  const count = useCountUp(stat.target, 2200, animate);

  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return n.toLocaleString('en-IN');
    return n.toString();
  };

  return (
    <div className="lp-stat-item lp-animate">
      <span className="lp-stat-icon">{stat.icon}</span>
      <div className="lp-stat-num">
        {stat.display
          ? stat.display
          : `${stat.prefix}${formatNum(animate ? count : stat.target)}${stat.suffix}`}
      </div>
      <div className="lp-stat-label">{stat.label}</div>
      <div className="lp-stat-sub">{stat.sub}</div>
    </div>
  );
}

export default function Statistics() {
  const sectionRef = useRef(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !animate) {
            setAnimate(true);
            entry.target.querySelectorAll('.lp-animate').forEach((el, i) => {
              setTimeout(() => el.classList.add('lp-visible'), i * 100);
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <section id="statistics" className="lp-stats" ref={sectionRef}>
      <div className="lp-stats-inner">
        {STATS.map((stat, i) => (
          <StatItem key={i} stat={stat} animate={animate} />
        ))}
      </div>
    </section>
  );
}

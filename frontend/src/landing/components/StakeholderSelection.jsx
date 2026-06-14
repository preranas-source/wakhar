import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleCard from './RoleCard';

const STAKEHOLDERS = [
  {
    icon: '👨‍🌾',
    role: 'Stakeholder',
    name: 'Farmer',
    roleKey: 'farmer',
    desc: 'Deposit produce at FPO warehouses, receive digital warehouse receipts, track your stored commodities, access collateral loans, and raise withdrawal requests — all from your phone.',
    btn: 'Continue as Farmer',
    route: '/farmer-login',
    highlights: ['Deposit & Receive e-WR', 'Track Inventory', 'Apply for Loans', 'Withdrawal Requests'],
  },
  {
    icon: '🏭',
    role: 'Stakeholder',
    name: 'FPO Manager',
    roleKey: 'fpo',
    desc: 'Manage your entire warehouse operations — commodity intake, quality grading, inventory tracking, stock movement, dispatch, and comprehensive reports for your FPO.',
    btn: 'Continue as FPO',
    route: '/fpo-login',
    highlights: ['Intake & Grading', 'Inventory Control', 'Receipts Management', 'Reports & Analytics'],
  },
  {
    icon: '🔗',
    role: 'Stakeholder',
    name: 'Aggregator',
    roleKey: 'aggregator',
    desc: 'Consolidate stock from multiple FPO warehouses, manage inter-warehouse transfers, oversee bulk dispatch operations, and coordinate with market partners at scale.',
    btn: 'Continue as Aggregator',
    route: '/aggregator-login',
    highlights: ['Multi-Warehouse View', 'Stock Consolidation', 'Bulk Transfers', 'Logistics Oversight'],
  },
  {
    icon: '🏪',
    role: 'Stakeholder',
    name: 'Market Partner',
    roleKey: 'market_partner',
    desc: 'Browse available commodity stock with quality certifications, create purchase orders, negotiate prices with FPOs, and track your deliveries from warehouse to doorstep.',
    btn: 'Continue as Market Partner',
    route: '/market-login',
    highlights: ['Browse Stock', 'Create Purchase Orders', 'Price Negotiation', 'Delivery Tracking'],
  },
];

export default function StakeholderSelection() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.lp-animate').forEach((el, i) => {
              setTimeout(() => el.classList.add('lp-visible'), i * 120);
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
    <section id="stakeholders" className="lp-section lp-stakeholders" ref={sectionRef}>
      <div className="lp-section-inner">
        <div className="lp-stakeholders-header lp-animate">
          <div className="lp-section-label">Portal Access</div>
          <h2 className="lp-section-title">Choose Your Role to Get Started</h2>
          <p className="lp-section-subtitle">
            WAKHAR serves every participant in the agricultural value chain with a tailored,
            role-specific experience.
          </p>
        </div>

        <div className="lp-stakeholders-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {STAKEHOLDERS.map((s, i) => (
            <div
              key={i}
              id={`stakeholder-${s.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="lp-animate"
              style={{ transitionDelay: `${i * 100}ms`, height: '100%' }}
            >
              <RoleCard
                icon={s.icon}
                title={s.name}
                description={s.desc}
                highlights={s.highlights}
                onClick={() => navigate(s.route)}
                roleKey={s.roleKey}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

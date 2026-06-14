import { useState } from 'react';
import { getTranslation } from '@wakhar/shared';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  currentUser,
  setCurrentUser,
  alertsCount,
  onShowAlertsModal,
  intakesCount,
  dispatchesCount,
  language = 'en',
  setLanguage,
  role,
  setRole
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const t = (key) => getTranslation(key, language);
  const navigate = useNavigate();

  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    intake: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
    dispatch: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    grading: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 1.2-.504 2.317-1.313 3.12L12 22l-7.687-6.88A4.5 4.5 0 013 12V6a1 1 0 011-1h16a1 1 0 011 1v6z"/></svg>,
    receipts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
    market: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
    transfers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
    stockcount: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    farmer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    aggregator: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="9" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><path d="M5 9v3M12 9v3M19 9v3M5 12h14M12 12v9"/></svg>,
    warehouses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    integrations: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
  };

  const getNavigationByRole = (currentRole) => {
    switch (currentRole) {
      case 'farmer':
        return [
          {
            group: 'Overview',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard }
            ]
          },
          {
            group: 'Finance',
            items: [
              { id: 'receipts', label: 'Warehouse Receipts', icon: icons.receipts }
            ]
          },
          {
            group: 'Deposits & Withdrawals',
            items: [
              { id: 'farmer', label: 'My Deposits', icon: icons.farmer },
              { id: 'withdrawal-requests', label: 'Withdrawal Requests', icon: icons.transfers },
              { id: 'farmer-profile', label: 'Farmer Profile', icon: icons.farmer }
            ]
          }
        ];
      case 'fpo':
        return [
          {
            group: 'Overview',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard }
            ]
          },
          {
            group: 'Operations',
            items: [
              { id: 'intake', label: 'Commodity Intake', badge: intakesCount > 0 ? intakesCount : null, icon: icons.intake },
              { id: 'inventory', label: 'Inventory', icon: icons.inventory },
              { id: 'dispatch', label: 'Dispatch', badge: dispatchesCount > 0 ? dispatchesCount : null, icon: icons.dispatch },
              { id: 'grading', label: 'Grading & QC', icon: icons.grading }
            ]
          },
          {
            group: 'Finance',
            items: [
              { id: 'receipts', label: 'Warehouse Receipts', icon: icons.receipts }
            ]
          },
          {
            group: 'Admin',
            items: [
              { id: 'reports', label: 'Reports', icon: icons.reports }
            ]
          }
        ];
      case 'aggregator':
        return [
          {
            group: 'Overview',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard }
            ]
          },
          {
            group: 'Warehouse Network',
            items: [
              { id: 'warehouses', label: 'Multi-Warehouse View', icon: icons.warehouses },
              { id: 'inventory', label: 'Inventory', icon: icons.inventory }
            ]
          },
          {
            group: 'Logistics',
            items: [
              { id: 'transfers', label: 'Transfer Management', icon: icons.transfers },
              { id: 'aggregator', label: 'Dispatch Tracking', icon: icons.aggregator }
            ]
          },
          {
            group: 'Trade & Analytics',
            items: [
              { id: 'market', label: 'Market Linkage', icon: icons.market },
              { id: 'reports', label: 'Analytics', icon: icons.reports }
            ]
          }
        ];
      case 'market_partner':
        return [
          {
            group: 'Overview',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard }
            ]
          },
          {
            group: 'Stock & Orders',
            items: [
              { id: 'market', label: 'Available Stock', icon: icons.market },
              { id: 'purchase-orders', label: 'Purchase Orders', icon: icons.receipts }
            ]
          },
          {
            group: 'Logistics',
            items: [
              { id: 'dispatch', label: 'Dispatch Tracking', icon: icons.dispatch },
              { id: 'transfers', label: 'Goods Receipt Note (GRN)', icon: icons.transfers }
            ]
          }
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigationByRole(role);

  const getPageTitle = () => {
    for (const group of navigation) {
      const item = group.items.find(i => i.id === activeTab);
      if (item) return t(item.label);
    }
    if (activeTab === 'intake-new') return t('New Commodity Intake');
    return t('Wakhar WMS');
  };

  const usersList = [
    { name: 'Rajesh Bhosale', role: 'FPO Manager', initials: 'RB', view: 'dashboard', roleKey: 'fpo', phone: '+919876500001' },
    { name: 'Suresh Patil', role: 'Farmer (FM-00412)', initials: 'SP', view: 'farmer', roleKey: 'farmer', phone: '+919876543210' },
    { name: 'Satara Aggregators', role: 'Aggregator Buyer', initials: 'SA', view: 'aggregator', roleKey: 'aggregator', phone: '+919876500003' },
    { name: 'Raigad Mart', role: 'Market Partner', initials: 'RM', view: 'dashboard', roleKey: 'market_partner', phone: '+919876500004' }
  ];

  const handleUserChange = async (user) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        phone: user.phone,
        password: '123456'
      });
      
      const { access_token, user: resUser } = response.data;
      localStorage.setItem('wakhar_access_token', access_token);
      
      const mappedRole = (resUser.role === 'fpo_manager' || resUser.role === 'fpo_staff') ? 'fpo' : resUser.role;
      localStorage.setItem('role', mappedRole);
      
      setShowUserDropdown(false);
      navigate(`/${mappedRole}/${user.view}`);
      
      setTimeout(() => {
        window.location.reload();
      }, 50);
    } catch (err) {
      console.error('Switch perspective failed:', err);
      alert('Failed to switch perspective. Please check backend connectivity.');
    }
  }; return (
    <>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="app-name">🌾 Wakhar</div>
          <div className="app-sub">Warehouse Management</div>
        </div>

        {navigation.map((section, idx) => (
          <div className="sidebar-section" key={idx}>
            <div className="sidebar-section-label">{t(section.group)}</div>
            {section.items.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{t(item.label)}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}

        <div className="sidebar-footer" style={{ position: 'relative' }}>
          <div className="user-pill" onClick={() => setShowUserDropdown(!showUserDropdown)}>
            <div className="avatar">{currentUser.initials}</div>
            <div>
              <div className="user-name">{currentUser.name}</div>
              <div className="user-role">{currentUser.role}</div>
            </div>
          </div>
          {showUserDropdown && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '12px',
                right: '12px',
                background: '#FEFCF8',
                border: '1px solid #D8D2C4',
                borderRadius: '8px',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.15)',
                zIndex: 110,
                marginBottom: '8px',
                padding: '4px 0',
                color: '#1C1A14'
              }}
            >
              {/* Logout Option */}
              <div 
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--red)',
                  fontWeight: '600',
                  transition: 'background 0.1s',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#FDE8EB'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                onClick={() => {
                  setShowUserDropdown(false);
                  localStorage.removeItem('wakhar_access_token');
                  localStorage.removeItem('role');
                  navigate('/');
                }}
              >
                <span>🚪</span>
                <span>Log Out</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="main">
        {/* TOP BAR */}
        <div className="topbar">
          <span className="topbar-title">{getPageTitle()}</span>
          <div className="topbar-actions">
            <div className="language-selector" style={{ marginRight: '8px' }}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="en">English</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search farmers, lots, WR…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div
              className={`icon-btn ${alertsCount > 0 ? 'notif-dot' : ''}`}
              title="Notifications & Alerts"
              onClick={onShowAlertsModal}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
            </div>
            <div className="icon-btn" title="Settings" onClick={() => setActiveTab('integrations')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {children}
        </div>
      </main>
    </>
  );
}

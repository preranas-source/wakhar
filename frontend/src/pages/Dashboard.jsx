import MapTracker from '../components/MapTracker';
import LineChart from '../components/LineChart';

const COMMODITY_COLORS = {
  Rice: '#2D6A4F',
  Wheat: '#B5620A',
  Soybean: '#1A4D7A',
  Onion: '#9B2335',
  Groundnut: '#4A3080',
  Others: '#8A8070',
};

export default function Dashboard({
  intakes,
  dispatches,
  receipts,
  setActiveTab,
  activities,
  role = 'fpo'
}) {
  // --- Operational Calculations (FPO / Core data) ---
  const totalStockKg = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
  const totalStockMT = (totalStockKg / 1000).toFixed(1);

  const activeWRs = receipts.length;
  const pledgedWRs = receipts.filter(r => r.collateralStatus === 'Disbursed' || r.collateralStatus === 'Applied').length;
  const inTransitCount = dispatches.filter(d => d.status === 'In Transit').length;

  const commodityTotals = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((acc, lot) => {
      const comm = lot.commodity || 'Others';
      acc[comm] = (acc[comm] || 0) + Number(lot.quantity || 0);
      return acc;
    }, {});
  const totalFilteredStock = Object.values(commodityTotals).reduce((a, b) => a + b, 0) || 1;

  const cropRates = { Rice: 62.5, Wheat: 22.8, Soybean: 47.2, Onion: 18.5, Groundnut: 68 };
  const totalValue = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((sum, lot) => {
      const rate = cropRates[lot.commodity] || 20;
      return sum + (lot.quantity * rate);
    }, 0);
  const totalValueL = (totalValue / 100000).toFixed(2);

  const highMoistureLots = intakes.filter(lot => lot.moisture > 14 && lot.status !== 'Returned');
  const alertCount = highMoistureLots.length;
  const pendingQCCount = intakes.filter(lot => lot.status === 'QC Pending').length;
  const recentDispatches = dispatches.slice(0, 3);

  // --- Farmer Specific Calculations (Suresh Patil: FM-00412) ---
  const farmerIntakes = intakes.filter(lot => lot.farmerId === 'FM-00412' && lot.status !== 'Returned');
  const farmerReceipts = receipts.filter(r => r.farmerId === 'FM-00412');
  const farmerStockKg = farmerReceipts.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const farmerActiveWRs = farmerReceipts.filter(r => r.quantity > 0).length;
  const farmerPledgedLoans = farmerReceipts.reduce((sum, r) => sum + Number(r.loanAmount || 0), 0);
  const farmerEstValue = farmerReceipts.reduce((sum, r) => {
    const rate = cropRates[r.commodity] || 20;
    return sum + (r.quantity * rate);
  }, 0);

  // --- Aggregator Calculations (Multi-Warehouse grid) ---
  const networkCapacities = [
    { name: 'Wai FPO WH', used: 342, total: 500, percent: 68 },
    { name: 'Phaltan FPO WH', used: 712, total: 800, percent: 89, warning: true },
    { name: 'Baramati FPO WH', used: 288, total: 600, percent: 48 }
  ];

  // --- Market Partner / Buyer Calculations (Raigad Mart) ---
  const marketplaceTotalTonnage = (totalStockKg / 1000 * 0.75).toFixed(1); // 75% of stock listed for sale
  const buyerActivePOsCount = 3;
  const buyerInTransitTons = 12; // DN-0082 soybean cargo
  const buyerDuesPending = 12.3; // ₹12.3L outstanding invoices

  // Activity type config
  const activityConfig = {
    intake: { color: 'var(--green)', bg: 'var(--green-light)', label: 'Intake' },
    dispatch: { color: 'var(--amber)', bg: 'var(--amber-light)', label: 'Dispatch' },
    qc: { color: 'var(--red)', bg: 'var(--red-light)', label: 'QC Alert' },
    market: { color: 'var(--blue)', bg: 'var(--blue-light)', label: 'Finance' },
  };

  return (
    <div className="page active" id="page-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* -------------------- 1. FARMER DASHBOARD VIEW -------------------- */}
      {role === 'farmer' && (
        <>
          {/* STAT CARDS */}
          <div className="stat-grid">
            <div className="stat-card db-stat-card" onClick={() => setActiveTab('farmer')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="stat-label">My Deposited Balance</div>
              <div className="stat-value">
                {farmerStockKg.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>kg</span>
              </div>
              <div className="stat-sub">Active in storage</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('receipts')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="stat-label">My Warehouse Receipts</div>
              <div className="stat-value">{farmerActiveWRs} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>active</span></div>
              <div className="stat-sub">eNAM linked & Negotiable</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('receipts')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div className="stat-label">Pledged Lien Loans</div>
              <div className="stat-value">
                ₹{farmerPledgedLoans.toLocaleString() || '0'}
              </div>
              <div className="stat-sub">NABARD Agri-Credit fund</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('farmer')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div className="stat-label">Net Asset Equity Value</div>
              <div className="stat-value">
                ₹{Math.max(0, Math.round(farmerEstValue - farmerPledgedLoans)).toLocaleString()}
              </div>
              <div className="stat-sub">Estimated net worth</div>
            </div>
          </div>

          {/* MAIN BODY farmer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
            
            {/* Left: Collateral details ledger */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">My e-WR Loan status references</div>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>e-WR ID</th>
                      <th>Commodity</th>
                      <th>Value</th>
                      <th>Lien Status</th>
                      <th>Lender Bank</th>
                      <th>Disbursed Loan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmerReceipts.map(wr => (
                      <tr key={wr.id}>
                        <td><strong>{wr.id}</strong></td>
                        <td>{wr.commodity} ({wr.quantity} kg)</td>
                        <td style={{ fontWeight: '500' }}>₹{wr.value.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${
                            wr.collateralStatus === 'None' ? 'badge-blue' :
                            wr.collateralStatus === 'Applied' ? 'badge-amber' : 'badge-green'
                          }`}>
                            {wr.collateralStatus === 'None' ? 'Eligible' : wr.collateralStatus}
                          </span>
                        </td>
                        <td>{wr.pledgeBank || '—'}</td>
                        <td style={{ fontWeight: '600' }}>{wr.loanAmount > 0 ? `₹${wr.loanAmount.toLocaleString()}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Farmer Quick actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div className="card-header">
                  <div className="section-title">Quick Operations</div>
                </div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="db-quicklink" onClick={() => setActiveTab('farmer')} style={{ borderColor: 'rgba(45,106,79,0.2)' }}>
                    <span>🌾</span>
                    <span style={{ fontWeight: '600', color: 'var(--green)', fontSize: '12.5px' }}>My Deposits</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Browse ledger</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('withdrawal-requests')} style={{ borderColor: 'rgba(181,98,10,0.2)' }}>
                    <span>📦</span>
                    <span style={{ fontWeight: '600', color: 'var(--amber)', fontSize: '12.5px' }}>Withdrawals</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Initiate request</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('receipts')} style={{ borderColor: 'rgba(26,77,122,0.2)' }}>
                    <span>📄</span>
                    <span style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '12.5px' }}>WR Receipts</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Apply pledge</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('farmer-profile')} style={{ borderColor: 'rgba(74,48,128,0.2)' }}>
                    <span>👤</span>
                    <span style={{ fontWeight: '600', color: 'var(--purple)', fontSize: '12.5px' }}>My Profile</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Bank & FPO Details</span>
                  </button>
                </div>
              </div>

              {/* FPO Coordinator Contact Card */}
              <div className="card" style={{ background: 'var(--green-light)', border: '1px solid rgba(45,106,79,0.2)' }}>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 'bold', textTransform: 'uppercase' }}>Linked FPO Coordination Office</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text)', marginTop: '6px' }}>Wai Farmer Producer Organization</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '4px' }}>Manager: Rajesh Bhosale</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '2px' }}>Office Hotlines: +91 98210 55660</div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* -------------------- 2. FPO MANAGER DASHBOARD VIEW -------------------- */}
      {role === 'fpo' && (
        <>
          {/* ALERT BANNER */}
          {alertCount > 0 && (
            <div className="dashboard-alert-banner" onClick={() => setActiveTab('grading')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13.5px' }}>Quality Alert: {alertCount} lot{alertCount > 1 ? 's' : ''} exceed moisture threshold (14%)</div>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Click to review in Grading & QC → Reject / Return Workflow</div>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          )}

          {/* STAT CARDS */}
          <div className="stat-grid">
            <div className="stat-card db-stat-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div className="stat-label">Total Stock</div>
              <div className="stat-value">
                {Number(totalStockMT).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>MT</span>
              </div>
              <div className="stat-sub stat-trend-up">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                Live warehouse inventory
              </div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('receipts')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="stat-label">Active Receipts (WR)</div>
              <div className="stat-value">{activeWRs}</div>
              <div className="stat-sub">
                <span style={{ color: 'var(--purple)', fontWeight: '500' }}>{pledgedWRs} pledged</span>
                <span style={{ margin: '0 4px', color: 'var(--text3)' }}>·</span>
                eNAM-compatible
              </div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('dispatch')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div className="stat-label">In-Transit</div>
              <div className="stat-value">{inTransitCount}</div>
              <div className="stat-sub stat-trend-up">Active logistics routes</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('market')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div className="stat-label">Stock Valuation</div>
              <div className="stat-value">
                ₹{totalValueL}<span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>L</span>
              </div>
              <div className="stat-sub stat-trend-up">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                Est. local market value
              </div>
            </div>
          </div>

          {/* QUICK STATUS ROW */}
          {(pendingQCCount > 0 || alertCount > 0) && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {pendingQCCount > 0 && (
                <div
                  onClick={() => setActiveTab('grading')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'var(--amber-light)', border: '1px solid rgba(181,98,10,0.25)',
                    borderRadius: '100px', padding: '6px 14px', cursor: 'pointer',
                    fontSize: '12.5px', fontWeight: '500', color: 'var(--amber)'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }}/>
                  {pendingQCCount} Lots Pending QC Inspection
                </div>
              )}
              {alertCount > 0 && (
                <div
                  onClick={() => setActiveTab('grading')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'var(--red-light)', border: '1px solid rgba(155,35,53,0.25)',
                    borderRadius: '100px', padding: '6px 14px', cursor: 'pointer',
                    fontSize: '12.5px', fontWeight: '500', color: 'var(--red)'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }}/>
                  {alertCount} High Moisture Alerts
                </div>
              )}
            </div>
          )}

          {/* MAIN BODY GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Stock by Commodity */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-title">Stock by Commodity</div>
                  <div className="section-sub">Real-time allocation across FPOs</div>
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(commodityTotals).map(([commodity, qty]) => {
                    const percent = Math.max(8, Math.round((qty / totalFilteredStock) * 100));
                    const color = COMMODITY_COLORS[commodity] || COMMODITY_COLORS.Others;
                    return (
                      <div key={commodity}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12.5px' }}>
                          <span style={{ fontWeight: '500', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, display: 'inline-block' }}/>
                            {commodity}
                          </span>
                          <span style={{ fontWeight: '600', color: 'var(--text)' }}>{(qty / 1000).toFixed(2)} MT</span>
                        </div>
                        <div style={{ height: '7px', background: 'var(--surface2)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '10px' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Weekly Deposit Volume Chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-title">Weekly Deposit Volume</div>
                  <div className="section-sub">Total inbound volume trend (MT)</div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ height: '180px' }}>
                  <LineChart
                    data={[8.5, 12.0, 16.4, 22.1, 14.8, Number(totalStockMT)]}
                    labels={['W1', 'W2', 'W3', 'W4', 'W5', 'Now']}
                    color="var(--green)"
                    fillColor="rgba(45,106,79,0.1)"
                    suffix=" MT"
                  />
                </div>
              </div>
            </div>

            {/* Live Dispatch Tracking */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">Live Dispatch Tracking</div>
              </div>
              <div className="card-body no-padding" style={{ padding: '12px' }}>
                <MapTracker />
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">Recent Activity Logs</div>
              </div>
              <div className="card-body no-padding">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activities.slice(0, 4).map((act, index) => {
                    const cfg = activityConfig[act.type] || activityConfig.market;
                    return (
                      <div key={index} className="db-activity-item">
                        <div className="db-activity-badge" style={{ background: cfg.bg, color: cfg.color }}>✓</div>
                        <div style={{ flex: 1 }}>
                          <div className="db-activity-tag" style={{ color: cfg.color }}>{cfg.label}</div>
                          <div className="activity-text" dangerouslySetInnerHTML={{ __html: act.text }}/>
                          <div className="activity-time">{act.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick links & recent dispatches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div className="card-header">
                  <div className="section-title">Quick Operations</div>
                </div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="db-quicklink" onClick={() => setActiveTab('intake-new')} style={{ borderColor: 'rgba(45,106,79,0.2)' }}>
                    <span>📥</span>
                    <span style={{ fontWeight: '600', color: 'var(--green)', fontSize: '12.5px' }}>New Intake</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('grading')} style={{ borderColor: 'rgba(155,35,53,0.2)' }}>
                    <span>🔬</span>
                    <span style={{ fontWeight: '600', color: 'var(--red)', fontSize: '12.5px' }}>Grading & QC</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('stockcount')} style={{ borderColor: 'rgba(26,77,122,0.2)' }}>
                    <span>✅</span>
                    <span style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '12.5px' }}>Stock Verify</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('reports')} style={{ borderColor: 'rgba(74,48,128,0.2)' }}>
                    <span>📊</span>
                    <span style={{ fontWeight: '600', color: 'var(--purple)', fontSize: '12.5px' }}>Reports</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------------------- 3. AGGREGATOR DASHBOARD VIEW -------------------- */}
      {role === 'aggregator' && (
        <>
          {/* STAT CARDS */}
          <div className="stat-grid">
            <div className="stat-card db-stat-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div className="stat-label">Consolidated Net Inventory</div>
              <div className="stat-value">
                {totalStockMT} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>MT</span>
              </div>
              <div className="stat-sub">Consolidated FPO warehouses</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('warehouses')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="stat-label">Active network warehouses</div>
              <div className="stat-value">3 <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>centers</span></div>
              <div className="stat-sub">MahaFPC Satara Network</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('reports')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div className="stat-label">Consolidated Stock Value</div>
              <div className="stat-value">₹{totalValueL}<span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>L</span></div>
              <div className="stat-sub">Current warehouse holdings valuation</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('market')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="stat-label">eNAM Listings Published</div>
              <div className="stat-value">12 <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>lots</span></div>
              <div className="stat-sub">Syncing active mandi bids</div>
            </div>
          </div>

          {/* MAIN BODY aggregator */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
            
            {/* Left: Capacity rollup charts */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">Linked FPO Warehouse Capacities</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {networkCapacities.map(wh => (
                  <div key={wh.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span><strong>{wh.name}</strong></span>
                      <span style={{ color: wh.warning ? 'var(--amber)' : 'var(--green)', fontWeight: 'bold' }}>
                        {wh.percent}% Capacity ({wh.used}/{wh.total} MT)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '15px', background: '#EDE9E0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${wh.percent}%`, height: '100%', background: wh.warning ? 'var(--amber)' : 'var(--green)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div className="card-header">
                  <div className="section-title">Aggregator Operations</div>
                </div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="db-quicklink" onClick={() => setActiveTab('warehouses')} style={{ borderColor: 'rgba(45,106,79,0.2)' }}>
                    <span>🏢</span>
                    <span style={{ fontWeight: '600', color: 'var(--green)', fontSize: '12.5px' }}>Warehouses</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Multi-WH View</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('transfers')} style={{ borderColor: 'rgba(181,98,10,0.2)' }}>
                    <span>🚚</span>
                    <span style={{ fontWeight: '600', color: 'var(--amber)', fontSize: '12.5px' }}>Stock Transfer</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>FPO Transfer</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('aggregator')} style={{ borderColor: 'rgba(26,77,122,0.2)' }}>
                    <span>📍</span>
                    <span style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '12.5px' }}>Fleet Tracking</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Traccar GPS</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('market')} style={{ borderColor: 'rgba(74,48,128,0.2)' }}>
                    <span>🛒</span>
                    <span style={{ fontWeight: '600', color: 'var(--purple)', fontSize: '12.5px' }}>Market Link</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Publish Lots</span>
                  </button>
                </div>
              </div>

              {/* Traccar Vehicle In transit */}
              <div className="card">
                <div className="card-header">
                  <div className="section-title">Active Transits</div>
                </div>
                <div className="card-body no-padding" style={{ padding: '12px' }}>
                  <MapTracker />
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* -------------------- 4. MARKET PARTNER DASHBOARD VIEW -------------------- */}
      {role === 'market_partner' && (
        <>
          {/* STAT CARDS */}
          <div className="stat-grid">
            <div className="stat-card db-stat-card" onClick={() => setActiveTab('market')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <div className="stat-label">Marketplace Inventory</div>
              <div className="stat-value">
                {marketplaceTotalTonnage} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>MT</span>
              </div>
              <div className="stat-sub">Available listed tonnage</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('purchase-orders')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="stat-label">Active Purchase Orders</div>
              <div className="stat-value">{buyerActivePOsCount} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>POs</span></div>
              <div className="stat-sub">Fulfillment & Shipping status</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('dispatch')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div className="stat-label">Cargo In-Transit</div>
              <div className="stat-value">{buyerInTransitTons} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>MT</span></div>
              <div className="stat-sub">Incoming shipments via Traccar</div>
            </div>

            <div className="stat-card db-stat-card" onClick={() => setActiveTab('purchase-orders')} style={{ cursor: 'pointer' }}>
              <div className="db-stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div className="stat-label">Pending Settlements</div>
              <div className="stat-value">₹{buyerDuesPending}<span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>L</span></div>
              <div className="stat-sub">Invoice totals due for release</div>
            </div>
          </div>

          {/* MAIN BODY market partner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
            
            {/* Left: Mandi Benchmarks list */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">eNAM Price Fluctuation Benchmarks</div>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Commodity</th>
                      <th>Mandi Standard rate</th>
                      <th>Raigad Mart Target</th>
                      <th>Variance Pct</th>
                      <th>FPO Source Option</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Rice (Basmati)</strong></td>
                      <td>₹27,600 / MT</td>
                      <td>₹28,000 / MT</td>
                      <td style={{ color: 'var(--green)', fontWeight: '600' }}>+1.4%</td>
                      <td>Wai FPO</td>
                    </tr>
                    <tr>
                      <td><strong>Wheat (Lokwan)</strong></td>
                      <td>₹22,800 / MT</td>
                      <td>₹22,000 / MT</td>
                      <td style={{ color: 'var(--red)', fontWeight: '600' }}>-3.5%</td>
                      <td>Phaltan FPO</td>
                    </tr>
                    <tr>
                      <td><strong>Soybean (JS-335)</strong></td>
                      <td>₹38,200 / MT</td>
                      <td>₹38,500 / MT</td>
                      <td style={{ color: 'var(--green)', fontWeight: '600' }}>+0.7%</td>
                      <td>Wai FPO</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Market Partner Quick Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div className="card-header">
                  <div className="section-title">Buyer Actions</div>
                </div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="db-quicklink" onClick={() => setActiveTab('market')} style={{ borderColor: 'rgba(45,106,79,0.2)' }}>
                    <span>🛒</span>
                    <span style={{ fontWeight: '600', color: 'var(--green)', fontSize: '12.5px' }}>Marketplace</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Browse Stock</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('purchase-orders')} style={{ borderColor: 'rgba(181,98,10,0.2)' }}>
                    <span>📄</span>
                    <span style={{ fontWeight: '600', color: 'var(--amber)', fontSize: '12.5px' }}>My Orders</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Create & Track PO</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('dispatch')} style={{ borderColor: 'rgba(26,77,122,0.2)' }}>
                    <span>📍</span>
                    <span style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '12.5px' }}>Shipments</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Track Cargo</span>
                  </button>
                  <button className="db-quicklink" onClick={() => setActiveTab('transfers')} style={{ borderColor: 'rgba(74,48,128,0.2)' }}>
                    <span>✅</span>
                    <span style={{ fontWeight: '600', color: 'var(--purple)', fontSize: '12.5px' }}>GRN Verification</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Reconcile Receipts</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

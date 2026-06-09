
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
  activities
}) {
  // Compute metrics dynamically from state
  const totalStockKg = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

  const totalStockMT = (totalStockKg / 1000).toFixed(1);

  const activeWRs = receipts.length;
  const pledgedWRs = receipts.filter(r => r.collateralStatus === 'Disbursed' || r.collateralStatus === 'Applied').length;

  const inTransitCount = dispatches.filter(d => d.status === 'In Transit').length;

  // Compute stock by commodity for the bar chart
  const commodityTotals = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((acc, lot) => {
      const comm = lot.commodity || 'Others';
      acc[comm] = (acc[comm] || 0) + Number(lot.quantity || 0);
      return acc;
    }, {});

  const totalFilteredStock = Object.values(commodityTotals).reduce((a, b) => a + b, 0) || 1;

  // Alerts calculations
  const highMoistureLots = intakes.filter(lot => lot.moisture > 14 && lot.status !== 'Returned');
  const alertCount = highMoistureLots.length;
  const pendingQCCount = intakes.filter(lot => lot.status === 'QC Pending').length;

  // Estimated stock value
  const cropRates = { Rice: 62.5, Wheat: 22.8, Soybean: 47.2, Onion: 18.5, Groundnut: 68 };
  const totalValue = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((sum, lot) => {
      const rate = cropRates[lot.commodity] || 20;
      return sum + (lot.quantity * rate);
    }, 0);

  const totalValueL = (totalValue / 100000).toFixed(2);

  // Recent dispatches
  const recentDispatches = dispatches.slice(0, 3);

  // Activity type config
  const activityConfig = {
    intake: { color: 'var(--green)', bg: 'var(--green-light)', label: 'Intake' },
    dispatch: { color: 'var(--amber)', bg: 'var(--amber-light)', label: 'Dispatch' },
    qc: { color: 'var(--red)', bg: 'var(--red-light)', label: 'QC Alert' },
    market: { color: 'var(--blue)', bg: 'var(--blue-light)', label: 'Finance' },
  };

  return (
    <div className="page active" id="page-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

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
                fontSize: '12.5px', fontWeight: '500', color: 'var(--amber)',
                transition: 'all 0.15s'
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
                fontSize: '12.5px', fontWeight: '500', color: 'var(--red)',
                transition: 'all 0.15s'
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
            {Object.keys(commodityTotals).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)' }}>No inventory recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(commodityTotals).map(([commodity, qty]) => {
                  const percent = Math.max(8, Math.round((qty / totalFilteredStock) * 100));
                  const color = COMMODITY_COLORS[commodity] || COMMODITY_COLORS.Others;
                  return (
                    <div key={commodity}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12.5px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, display: 'inline-block', flexShrink: 0 }}/>
                          {commodity}
                        </span>
                        <span style={{ fontWeight: '600', color: 'var(--text)' }}>{(qty / 1000).toFixed(2)} MT</span>
                      </div>
                      <div style={{ height: '7px', background: 'var(--surface2)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '10px', transition: 'width 0.5s ease' }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>This Week</div>
                <div style={{ fontWeight: '600', color: 'var(--green)', fontSize: '14px' }}>{totalStockMT} MT</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>Avg / Week</div>
                <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>
                  {((8.5 + 12.0 + 16.4 + 22.1 + 14.8 + Number(totalStockMT)) / 6).toFixed(1)} MT
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>Lots Active</div>
                <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>
                  {intakes.filter(l => l.status !== 'Returned').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Dispatch Tracking */}
        <div className="card">
          <div className="card-header">
            <div className="section-title">Live Dispatch Tracking</div>
            <span className="badge badge-green">{inTransitCount} active</span>
          </div>
          <div className="card-body no-padding" style={{ padding: '12px' }}>
            <MapTracker />
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div className="section-title">Recent Activity Logs</div>
            <button className="btn btn-ghost" onClick={() => setActiveTab('reports')}>View Audit →</button>
          </div>
          <div className="card-body no-padding">
            {activities.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)' }}>No activity logged.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activities.slice(0, 5).map((act, index) => {
                  const cfg = activityConfig[act.type] || activityConfig.market;
                  return (
                    <div
                      key={index}
                      className="db-activity-item"
                      style={{ borderBottom: index < Math.min(activities.length - 1, 4) ? '1px solid var(--border)' : 'none' }}
                    >
                      <div className="db-activity-badge" style={{ background: cfg.bg, color: cfg.color }}>
                        {act.type === 'intake' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        )}
                        {act.type === 'dispatch' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        )}
                        {act.type === 'qc' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        )}
                        {act.type === 'market' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="db-activity-tag" style={{ color: cfg.color }}>{cfg.label}</div>
                        <div className="activity-text" dangerouslySetInnerHTML={{ __html: act.text }}/>
                        <div className="activity-time">{act.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Quick Actions + Recent Dispatches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div className="section-title">Operations Quick Links</div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="db-quicklink"
                onClick={() => setActiveTab('intake-new')}
                style={{ borderColor: 'rgba(45,106,79,0.25)', background: 'var(--green-light)' }}
              >
                <span style={{ fontSize: '18px' }}>📥</span>
                <span style={{ fontWeight: '600', color: 'var(--green)', fontSize: '12.5px' }}>New Intake</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Gate-in new lot</span>
              </button>
              <button
                className="db-quicklink"
                onClick={() => setActiveTab('grading')}
                style={{ borderColor: 'rgba(155,35,53,0.2)', background: 'var(--red-light)' }}
              >
                <span style={{ fontSize: '18px' }}>🔬</span>
                <span style={{ fontWeight: '600', color: 'var(--red)', fontSize: '12.5px' }}>Grading & QC</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Lab certification</span>
              </button>
              <button
                className="db-quicklink"
                onClick={() => setActiveTab('stockcount')}
                style={{ borderColor: 'rgba(26,77,122,0.2)', background: 'var(--blue-light)' }}
              >
                <span style={{ fontSize: '18px' }}>✅</span>
                <span style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '12.5px' }}>Stock Verify</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Audit physical stock</span>
              </button>
              <button
                className="db-quicklink"
                onClick={() => setActiveTab('farmer')}
                style={{ borderColor: 'rgba(74,48,128,0.2)', background: 'var(--purple-light)' }}
              >
                <span style={{ fontSize: '18px' }}>👨‍🌾</span>
                <span style={{ fontWeight: '600', color: 'var(--purple)', fontSize: '12.5px' }}>Farmer Portal</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Self-service portal</span>
              </button>
            </div>
          </div>

          {/* Recent Dispatches */}
          <div className="card">
            <div className="card-header">
              <div className="section-title">Recent Dispatches</div>
              <button className="btn btn-ghost" onClick={() => setActiveTab('dispatch')}>View All →</button>
            </div>
            <div className="card-body no-padding">
              {recentDispatches.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)' }}>No dispatches yet.</div>
              ) : (
                <div>
                  {recentDispatches.map((d, idx) => (
                    <div
                      key={d.id}
                      style={{
                        padding: '12px 20px',
                        borderBottom: idx < recentDispatches.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', alignItems: 'center', gap: '12px'
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: d.status === 'In Transit' ? 'var(--amber-light)' : 'var(--green-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={d.status === 'In Transit' ? 'var(--amber)' : 'var(--green)'} strokeWidth="2">
                          <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/>
                          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text)' }}>{d.id}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.commodity} → {d.destination}
                        </div>
                      </div>
                      <span className={`badge ${d.status === 'In Transit' ? 'badge-amber' : 'badge-green'}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

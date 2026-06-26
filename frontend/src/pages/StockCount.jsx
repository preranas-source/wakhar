import { useState } from 'react';
import toast from 'react-hot-toast';

export default function StockCount() {
  // 1. Active Cycle count lot list matching the screenshot
  const [activeLots, setActiveLots] = useState([
    { id: 'LOT-2026-091', commodity: 'Rice', variety: 'Basmati', systemQty: 900, physicalQty: '900' },
    { id: 'LOT-2026-085', commodity: 'Soybean', variety: 'JS-335', systemQty: 2400, physicalQty: '2362' },
    { id: 'LOT-2026-079', commodity: 'Onion', variety: 'Nasik Red', systemQty: 800, physicalQty: '800' },
    { id: 'LOT-2026-072', commodity: 'Groundnut', variety: 'GPBD-4', systemQty: 1500, physicalQty: '' }
  ]);

  // 2. Variance report history database
  const [history, setHistory] = useState([
    { date: '15 May 2026', warehouse: 'Wai FPO', lots: 52, variance: -22, approvedBy: 'R. Bhosale' },
    { date: '1 May 2026', warehouse: 'Phaltan FPO', lots: 68, variance: 0, approvedBy: 'S. Kamble' },
    { date: '15 Apr 2026', warehouse: 'Baramati FPO', lots: 41, variance: -14, approvedBy: 'R. Bhosale' }
  ]);

  // Form input update handler
  const handleQtyChange = (lotId, value) => {
    setActiveLots(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return { ...lot, physicalQty: value };
      }
      return lot;
    }));
  };

  // Computations
  const getVariance = (lot) => {
    if (lot.physicalQty === '') return null;
    const physVal = Number(lot.physicalQty);
    if (isNaN(physVal)) return null;
    return physVal - lot.systemQty;
  };

  const getStatus = (lot) => {
    const variance = getVariance(lot);
    if (variance === null) return 'Pending';
    return variance === 0 ? 'OK' : 'Variance';
  };

  // Total variance calculation for stats card
  const totalVariance = activeLots.reduce((sum, lot) => {
    const variance = getVariance(lot);
    return sum + (variance || 0);
  }, 0);

  const totalVariancesCount = activeLots.filter(lot => {
    const stat = getStatus(lot);
    return stat === 'Variance';
  }).length;

  const totalVerifiedCount = activeLots.filter(lot => {
    const stat = getStatus(lot);
    return stat !== 'Pending';
  }).length;

  const handleSubmitReport = () => {
    const uncompleted = activeLots.find(lot => getStatus(lot) === 'Pending');
    if (uncompleted) {
      if (!confirm('You still have pending verification counts. Are you sure you want to lock and submit this cycle count?')) return;
    }

    const newHistory = {
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      warehouse: 'Wai FPO',
      lots: activeLots.length,
      variance: totalVariance,
      approvedBy: 'R. Bhosale'
    };

    setHistory(prev => [newHistory, ...prev]);
    toast.success(`Cycle count submitted! Variance Report generated for Wai FPO (Net variance: ${totalVariance} kg).`);
  };

  const formatLotId = (id) => {
    const parts = id.split('-');
    if (parts.length === 3) {
      return (
        <>
          {parts[0]}-<br/>
          {parts[1]}-{parts[2]}
        </>
      );
    }
    return id;
  };

  return (
    <div className="page active" id="page-stockcount" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title block */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>Physical Stock Verification</div>
          <div style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '6px' }}>
            Cycle count · Variance reports · Audit trail
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-outline" 
            style={{ background: '#fff' }}
            onClick={() => toast.success('Variance report PDF download started.')}
          >
            Export Variance Report
          </button>
          <button 
            className="btn btn-primary" 
            style={{ background: '#1E4D36', borderColor: '#1E4D36' }}
            onClick={() => toast.success('New physical count verification cycle started for Phaltan FPO.')}
          >
            + Start New Count
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">LAST FULL COUNT</div>
          <div className="stat-value">15 May</div>
          <div className="stat-sub">Wai FPO — 24 days ago</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">LOTS VERIFIED</div>
          <div className="stat-value">{totalVerifiedCount + 45}</div>
          <div className="stat-sub">This cycle</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">VARIANCES FOUND</div>
          <div className="stat-value">{totalVariancesCount + 2}</div>
          <div className="stat-sub">2 approved, {totalVariancesCount} pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TOTAL VARIANCE QTY</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>
            {totalVariance - 22} kg
          </div>
          <div className="stat-sub">0.002% of stock</div>
        </div>
      </div>

      {/* Split grid */}
      <div className="stockcount-split-layout">
        
        {/* Left Column: Active Cycle Count */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">Active Cycle Count — Wai FPO</div>
            <span className="badge badge-amber">• In Progress</span>
          </div>
          
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Lot ID</th>
                  <th>Commodity</th>
                  <th>System Qty</th>
                  <th>Physical Qty</th>
                  <th>Variance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeLots.map(lot => {
                  const variance = getVariance(lot);
                  const status = getStatus(lot);

                  return (
                    <tr key={lot.id}>
                      <td style={{ whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                        <strong>{formatLotId(lot.id)}</strong>
                      </td>
                      <td>
                        <strong>{lot.commodity}</strong><br/>
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{lot.variety}</span>
                      </td>
                      <td style={{ fontWeight: '500' }}>{lot.systemQty.toLocaleString()} kg</td>
                      <td>
                        <input 
                          type="number"
                          className="table-input"
                          placeholder="—"
                          value={lot.physicalQty}
                          onChange={(e) => handleQtyChange(lot.id, e.target.value)}
                        />
                      </td>
                      <td style={{ 
                        fontWeight: '600', 
                        color: variance < 0 ? 'var(--red)' : (variance > 0 ? 'var(--green)' : 'var(--text)')
                      }}>
                        {variance === null ? '—' : `${variance} kg`}
                      </td>
                      <td>
                        <span className={`badge ${
                          status === 'OK' ? 'badge-green' : (status === 'Variance' ? 'badge-amber' : 'badge-gray')
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="form-footer" style={{ padding: '16px 20px', background: '#fff', borderTop: '1px solid var(--border)' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ background: '#fff' }}
              onClick={() => toast.success('Audit progress saved to local ledger draft.')}
            >
              Save Progress
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ background: '#1E4D36', borderColor: '#1E4D36' }}
              onClick={handleSubmitReport}
            >
              Submit Count & Generate Report
            </button>
          </div>
        </div>

        {/* Right Column: Variance Report History */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-header">
            <div className="section-title">Variance Report History</div>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Warehouse</th>
                  <th>Lots</th>
                  <th>Variance</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, hidx) => (
                  <tr key={hidx}>
                    <td style={{ fontWeight: '500' }}>{h.date}</td>
                    <td>{h.warehouse}</td>
                    <td>{h.lots}</td>
                    <td style={{ 
                      fontWeight: '600', 
                      color: h.variance < 0 ? 'var(--red)' : (h.variance > 0 ? 'var(--green)' : 'var(--text)') 
                    }}>
                      {h.variance === 0 ? '0 kg' : `${h.variance} kg`}
                    </td>
                    <td style={{ fontWeight: '500' }}>{h.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

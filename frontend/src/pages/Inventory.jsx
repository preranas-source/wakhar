import { useState } from 'react';
import { getTranslation } from '@wakhar/shared';

export default function Inventory({ intakes, onDispatchLot, searchQuery, language = 'en' }) {
  const t = (key) => getTranslation(key, language);

  const [activeTab, setActiveTab] = useState('All lots');
  const [selectedLot, setSelectedLot] = useState(null);
  
  // FIFO / FEFO Rule Enforcement
  const [dispatchRule, setDispatchRule] = useState('FIFO'); // 'FIFO' or 'FEFO'
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [violationDetails, setViolationDetails] = useState(null);
  const [targetDispatchLot, setTargetDispatchLot] = useState(null);

  // Stats
  const totalInStorage = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
  
  const reservedStock = intakes
    .filter(lot => lot.status === 'Reserved')
    .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

  // Expiring lots simulator (lots with moisture > 14% have expiring warning)
  const expiringStock = intakes
    .filter(lot => lot.moisture > 15 && lot.status === 'Available')
    .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

  // Filters logic
  const filteredLots = intakes
    .filter(lot => {
      // Exclude returned/rejected lots from core inventory
      if (lot.status === 'Returned') return false;

      // Filter by Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          lot.id.toLowerCase().includes(query) ||
          lot.farmerName.toLowerCase().includes(query) ||
          lot.commodity.toLowerCase().includes(query) ||
          lot.variety.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Filter by tab selection
      if (activeTab === 'All lots') return true;
      if (activeTab === 'Grade A') return lot.grade === 'Grade A';
      if (activeTab === 'Grade B') return lot.grade === 'Grade B';
      if (activeTab === 'Reserved') return lot.status === 'Reserved';
      if (activeTab === 'Expiring soon') return lot.moisture > 15; 

      return true;
    });

  const checkSequenceViolation = (targetLot) => {
    // Filter active lots of the SAME commodity
    const activeSameCommodity = intakes.filter(lot => 
      lot.commodity === targetLot.commodity && 
      lot.status === 'Available' && 
      lot.id !== targetLot.id
    );

    if (dispatchRule === 'FIFO') {
      // Oldest deposit has a lower LOT number (e.g. LOT-2026-087 is older than LOT-2026-091)
      const olderLots = activeSameCommodity.filter(lot => {
        const targetNum = parseInt(targetLot.id.split('-').pop() || '0');
        const lotNum = parseInt(lot.id.split('-').pop() || '0');
        return lotNum < targetNum;
      });
      if (olderLots.length > 0) {
        olderLots.sort((a, b) => {
          const aNum = parseInt(a.id.split('-').pop() || '0');
          const bNum = parseInt(b.id.split('-').pop() || '0');
          return aNum - bNum;
        });
        return { type: 'FIFO', lot: olderLots[0] };
      }
    } else if (dispatchRule === 'FEFO') {
      // FEFO targets the highest moisture lot in priority
      const higherMoistureLots = activeSameCommodity.filter(lot => lot.moisture > targetLot.moisture && lot.moisture > 14);
      if (higherMoistureLots.length > 0) {
        higherMoistureLots.sort((a, b) => b.moisture - a.moisture);
        return { type: 'FEFO', lot: higherMoistureLots[0] };
      }
    }
    return null;
  };

  const handleDispatchClick = (lot) => {
    const violation = checkSequenceViolation(lot);
    if (violation) {
      setViolationDetails(violation);
      setTargetDispatchLot(lot);
      setShowWarningModal(true);
    } else {
      handleDispatchTrigger(lot);
    }
  };

  const handleDispatchTrigger = (lot) => {
    onDispatchLot(lot.id);
    setSelectedLot(null);
  };

  return (
    <div className="page active" id="page-inventory">
      <div style={{ display: 'flex', alignItems: 'center', justifyScontent: 'space-between', marginBottom: '20px', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title" style={{ fontSize: '16px' }}>{t('Inventory')} Ledger</div>
          <div className="section-sub">Real-time shelf tracking · FIFO / FEFO rules matching</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Active Dispatch Rule Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)' }}>Dispatch Rule:</span>
            <select 
              value={dispatchRule} 
              onChange={(e) => setDispatchRule(e.target.value)}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                fontFamily: 'inherit',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              <option value="FIFO">FIFO (Oldest Deposit)</option>
              <option value="FEFO">FEFO (Highest Risk / Moisture)</option>
            </select>
          </div>
          
          <button 
            className="btn btn-outline"
            onClick={() => {
              const csvData = intakes.map(l => `${l.id},${l.farmerName},${l.commodity},${l.quantity},${l.grade},${l.status}`).join('\n');
              const blob = new Blob([`LotID,Farmer,Commodity,Qty(kg),Grade,Status\n${csvData}`], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('href', url);
              a.setAttribute('download', 'wakhar_stock_ledger.csv');
              a.click();
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div className="stat-label">Total in Storage</div>
          <div className="stat-value" style={{ fontSize: '22px' }}>{totalInStorage.toLocaleString()} kg</div>
          <div className="stat-sub">Across active warehouses</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div className="stat-label">Reserved (Active Orders)</div>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--blue)' }}>{reservedStock.toLocaleString()} kg</div>
          <div className="stat-sub">Secured for FPO purchase orders</div>
        </div>
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div className="stat-label">Critical Warning Stock</div>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--amber)' }}>{expiringStock.toLocaleString()} kg</div>
          <div className="stat-sub">High moisture level lots</div>
        </div>
      </div>

      <div className="three-col">
        {/* Main inventory list */}
        <div className="card">
          <div className="card-header">
            <div className="filter-tabs">
              {['All lots', 'Grade A', 'Grade B', 'Reserved', 'Expiring soon'].map(t => (
                <button 
                  key={t} 
                  className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(t);
                    setSelectedLot(null);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>{t('Lot ID')}</th>
                  <th>{t('Commodity')} / {t('Variety')}</th>
                  <th>{t('Quantity')}</th>
                  <th>{t('Grade')}</th>
                  <th>{t('Moisture')} %</th>
                  <th>{t('Warehouse')} Location</th>
                  <th>{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>
                      No inventory lots match this search filter.
                    </td>
                  </tr>
                ) : (
                  filteredLots.map(lot => (
                    <tr 
                      key={lot.id} 
                      onClick={() => setSelectedLot(lot)}
                      className={selectedLot && selectedLot.id === lot.id ? 'active-row' : ''}
                      style={{
                        background: selectedLot && selectedLot.id === lot.id ? 'var(--surface2)' : '',
                        cursor: 'pointer'
                      }}
                    >
                      <td><strong>{lot.id}</strong></td>
                      <td>
                        {t(lot.commodity)}
                        <div className="td-secondary">{lot.variety}</div>
                      </td>
                      <td>{lot.quantity.toLocaleString()} kg</td>
                      <td>
                        <span className={`badge ${lot.gradeClass}`}>{lot.grade}</span>
                      </td>
                      <td>{lot.moisture}%</td>
                      <td>
                        {lot.warehouse}
                        <div className="td-secondary">{lot.zone}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          lot.status === 'Available' ? 'badge-teal' : 
                          lot.status === 'Reserved' ? 'badge-blue' : 'badge-amber'
                        }`}>{lot.status === 'Available' && lot.moisture > 15 ? '⚠ Warning' : t(lot.status)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Lot Detail Side Drawer */}
        <div className="card">
          <div className="card-header">
            <div className="section-title">Lot Inspector</div>
          </div>
          <div className="card-body">
            {selectedLot ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>{selectedLot.id}</span>
                  <span className={`badge ${selectedLot.gradeClass}`}>{selectedLot.grade}</span>
                </div>
                <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />
                
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Depositor Farmer</div>
                  <div style={{ fontSize: '13.5px', fontWeight: '500' }}>{selectedLot.farmerName} ({selectedLot.farmerId})</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Storage Section</div>
                  <div style={{ fontSize: '13.5px' }}>{selectedLot.warehouse} &mdash; {selectedLot.zone}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Weight (kg)</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{selectedLot.quantity.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Moisture</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: selectedLot.moisture > 14 ? 'var(--amber)' : 'var(--green)' }}>
                      {selectedLot.moisture}%
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Status</div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${
                      selectedLot.status === 'Available' ? 'badge-teal' : 'badge-blue'
                    }`}>{t(selectedLot.status)}</span>
                  </div>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedLot.status === 'Available' && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleDispatchClick(selectedLot)}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      🚚 Initiate Outbound Dispatch
                    </button>
                  )}
                  {selectedLot.moisture > 14 && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => alert(`Aeration scheduled for lot ${selectedLot.id}`)}
                      style={{ width: '100%', justifyContent: 'center', background: '#fff' }}
                    >
                      💨 Request Aeration
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, marginBottom: '8px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <p>Click on any lot in the ledger row to inspect details and initiate actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FIFO / FEFO VIOLATION WARNING MODAL */}
      {showWarningModal && violationDetails && targetDispatchLot && (
        <div className="modal-overlay" onClick={() => setShowWarningModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', border: '1px solid var(--amber)' }}>
            <div className="modal-header" style={{ background: 'var(--amber-light)', borderBottom: '1px solid rgba(181,98,10,0.2)' }}>
              <div className="modal-title" style={{ color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span>
                <span>Sequence Policy Violation</span>
              </div>
              <button className="modal-close" onClick={() => setShowWarningModal(false)}>×</button>
            </div>
            
            <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: 'var(--text2)', lineHeight: '1.4' }}>
              {violationDetails.type === 'FIFO' ? (
                <div>
                  An out-of-sequence dispatch was detected! An older lot of <strong>{t(targetDispatchLot.commodity)}</strong> is available in storage:
                  <div style={{ marginTop: '12px', background: 'var(--surface2)', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                    • Older Stock: <strong style={{ color: 'var(--green)' }}>{violationDetails.lot.id}</strong> (Deposited: {violationDetails.lot.date})<br/>
                    • Target Stock: <strong>{targetDispatchLot.id}</strong> (Deposited: {targetDispatchLot.date})
                  </div>
                  <p style={{ marginTop: '12px' }}>
                    To prevent stock stagnation, WMS guidelines recommend dispatching the oldest stock first.
                  </p>
                </div>
              ) : (
                <div>
                  A quality degradation risk was detected! A high moisture lot of <strong>{t(targetDispatchLot.commodity)}</strong> has priority FEFO dispatch:
                  <div style={{ marginTop: '12px', background: 'var(--surface2)', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                    • Priority Stock: <strong style={{ color: 'var(--red)' }}>{violationDetails.lot.id}</strong> (Moisture: {violationDetails.lot.moisture}%)<br/>
                    • Target Stock: <strong>{targetDispatchLot.id}</strong> (Moisture: {targetDispatchLot.moisture}%)
                  </div>
                  <p style={{ marginTop: '12px' }}>
                    To prevent spoilage in storage, WMS guidelines recommend dispatching higher moisture lots first.
                  </p>
                </div>
              )}
            </div>

            <div className="form-footer" style={{ padding: '16px 20px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ background: '#fff' }}
                onClick={() => {
                  handleDispatchTrigger(violationDetails.lot);
                  setShowWarningModal(false);
                }}
              >
                Enforce {violationDetails.type}
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ background: 'var(--amber)', borderColor: 'var(--amber)', color: '#fff' }}
                onClick={() => {
                  handleDispatchTrigger(targetDispatchLot);
                  setShowWarningModal(false);
                }}
              >
                Override Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

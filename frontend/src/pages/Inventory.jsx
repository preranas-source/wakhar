import { useState, useEffect } from 'react';
import { getTranslation } from '@wakhar/shared';
import toast from 'react-hot-toast';

function SearchableSelect({ value, onChange, options, placeholder = "Select...", width = "120px" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isOpen]);

  return (
    <div 
      className="custom-select-container" 
      style={{ position: 'relative', width }}
      onClick={e => e.stopPropagation()}
    >
      <div 
        className="custom-select-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 8px',
          fontSize: '12px',
          background: '#fff',
          border: '1px solid rgba(0, 0, 0, 0.15)',
          borderRadius: '6px',
          cursor: 'pointer',
          userSelect: 'none',
          color: '#1C1A14',
          minHeight: '28px',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          width="10" 
          height="6" 
          viewBox="0 0 10 6" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '6px',
            color: '#8A8070',
            flexShrink: 0
          }}
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </div>

      {isOpen && (
        <div 
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '240px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '6px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <input 
              type="text" 
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '4px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '180px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#8A8070', textAlign: 'center' }}>
                No results
              </div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value}
                  onClick={() => {
                    onChange({ target: { value: opt.value } });
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: value === opt.value ? 'var(--green-light)' : 'transparent',
                    color: value === opt.value ? 'var(--green)' : '#1C1A14',
                    fontWeight: value === opt.value ? '600' : 'normal',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.target.style.background = value === opt.value ? 'var(--green-light)' : 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.target.style.background = value === opt.value ? 'var(--green-light)' : 'transparent'}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Inventory({ intakes, receipts = [], dispatches = [], onDispatchLot, searchQuery, language = 'en' }) {
  const t = (key) => getTranslation(key, language);

  const zoneOptions = [
    { value: 'All', label: 'All Zones' },
    { value: 'Zone A', label: 'Zone A' },
    { value: 'Zone B', label: 'Zone B' },
    { value: 'Zone C', label: 'Zone C' }
  ];

  const categoryOptions = [
    { value: 'All', label: 'All Categories' },
    { value: 'Grains', label: 'Grains (Wheat/Rice)' },
    { value: 'Oilseeds', label: 'Oilseeds (Soy/Ground)' },
    { value: 'Vegetables', label: 'Vegetables (Onion)' }
  ];

  const ruleOptions = [
    { value: 'FIFO', label: 'FIFO (Oldest Deposit)' },
    { value: 'FEFO', label: 'FEFO (Highest Risk)' }
  ];

  const [activeTab, setActiveTab] = useState('All lots');
  const [selectedLot, setSelectedLot] = useState(null);
  
  // New Filters State
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // FIFO / FEFO Rule Enforcement
  const [dispatchRule, setDispatchRule] = useState('FIFO'); // 'FIFO' or 'FEFO'
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [violationDetails, setViolationDetails] = useState(null);
  const [targetDispatchLot, setTargetDispatchLot] = useState(null);

  // Commodity category helper
  const getCommodityCategory = (commodity = '') => {
    const crop = commodity.toLowerCase();
    if (crop.includes('rice') || crop.includes('wheat')) return 'Grains';
    if (crop.includes('soybean') || crop.includes('groundnut')) return 'Oilseeds';
    if (crop.includes('onion')) return 'Vegetables';
    return 'Other';
  };

  // Stats
  const totalInStorage = intakes
    .filter(lot => lot.status !== 'Returned')
    .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
  
  const reservedStock = intakes
    .filter(lot => lot.status === 'Reserved')
    .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

  // Expiring lots simulator (lots with moisture > 15% have expiring warning)
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

      // Filter by Warehouse Zone
      if (selectedZone !== 'All') {
        // e.g. "Zone A — Rack 3" matches "Zone A"
        if (!lot.zone.toLowerCase().includes(selectedZone.toLowerCase())) {
          return false;
        }
      }

      // Filter by Commodity Category
      if (selectedCategory !== 'All') {
        const cat = getCommodityCategory(lot.commodity);
        if (cat !== selectedCategory) {
          return false;
        }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="section-title" style={{ fontSize: '16px' }}>{t('Inventory')} Ledger</div>
          <div className="section-sub">Real-time stock tracking by zones, categories & FIFO policy checks</div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Warehouse Zones Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)' }}>Zone:</span>
            <SearchableSelect 
              value={selectedZone} 
              onChange={(e) => setSelectedZone(e.target.value)}
              options={zoneOptions}
              width="110px"
            />
          </div>

          {/* Commodity Categories Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)' }}>Category:</span>
            <SearchableSelect 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryOptions}
              width="130px"
            />
          </div>

          {/* Active Dispatch Rule Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)' }}>Rule:</span>
            <SearchableSelect 
              value={dispatchRule} 
              onChange={(e) => setDispatchRule(e.target.value)}
              options={ruleOptions}
              width="160px"
            />
          </div>
          
          <button 
            className="btn btn-outline"
            style={{ background: '#fff' }}
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
                  <th>Category</th>
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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>
                      No inventory lots match the search and filtering parameters.
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
                      <td>{getCommodityCategory(lot.commodity)}</td>
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
                
                <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--green-mid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📋</span> {t('Lot Batch Traceability Timeline')}
                </div>

                <div className="timeline" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Stage 1: Intake */}
                  <div className="timeline-item" style={{ display: 'flex', gap: '12px' }}>
                    <div className="timeline-dot done" style={{ width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--green)', color: '#fff', borderRadius: '50%', flexShrink: 0 }}>✓</div>
                    <div className="tl-content" style={{ flex: 1 }}>
                      <div className="tl-title" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>{t('Intake Gate-In')}</div>
                      <div className="tl-sub" style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px', lineHeight: '1.3' }}>
                        Deposited: {selectedLot.date}<br/>
                        Farmer: {selectedLot.farmerName} ({selectedLot.farmerId})<br/>
                        Bags: {selectedLot.bags} ({selectedLot.quantity.toLocaleString()} kg)<br/>
                        Origin: {selectedLot.gps || 'Wai farm'} <br/>
                        <span style={{ color: 'var(--green)', fontWeight: '600' }}>Synced to ERPNext (STE-Submitted)</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage 2: Quality */}
                  <div className="timeline-item" style={{ display: 'flex', gap: '12px' }}>
                    <div className={`timeline-dot ${selectedLot.grade !== 'QC Pending' ? 'done' : 'active'}`} style={{ width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedLot.grade !== 'QC Pending' ? 'var(--green)' : 'var(--amber)', color: '#fff', borderRadius: '50%', flexShrink: 0 }}>
                      {selectedLot.grade !== 'QC Pending' ? '✓' : '•'}
                    </div>
                    <div className="tl-content" style={{ flex: 1 }}>
                      <div className="tl-title" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>{t('Quality Grading')}</div>
                      <div className="tl-sub" style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px', lineHeight: '1.3' }}>
                        Moisture: {selectedLot.moisture}% (Impurity: 0.45%)<br/>
                        Grade: {selectedLot.grade}<br/>
                        Protein: {selectedLot.commodity === 'Wheat' ? '12.4%' : '11.5%'}<br/>
                        Assayer: Govt Lab Officer
                      </div>
                    </div>
                  </div>

                  {/* Stage 3: WR */}
                  {selectedLot.grade !== 'Rejected' && (
                    <div className="timeline-item" style={{ display: 'flex', gap: '12px' }}>
                      <div className={`timeline-dot ${receipts.find(r => r.lotId === selectedLot.id) ? 'done' : ''}`} style={{ width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: receipts.find(r => r.lotId === selectedLot.id) ? 'var(--green)' : '#ccc', color: '#fff', borderRadius: '50%', flexShrink: 0 }}>
                        {receipts.find(r => r.lotId === selectedLot.id) ? '✓' : '•'}
                      </div>
                      <div className="tl-content" style={{ flex: 1 }}>
                        <div className="tl-title" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>{t('Warehouse Receipt')}</div>
                        <div className="tl-sub" style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px', lineHeight: '1.3' }}>
                          {(() => {
                            const wr = receipts.find(r => r.lotId === selectedLot.id);
                            if (wr) {
                              return (
                                <>
                                  Ref: {wr.id}<br/>
                                  Valuation: ₹{wr.value.toLocaleString()}<br/>
                                  Lien status: <span style={{ color: wr.collateralStatus === 'Disbursed' ? 'var(--purple)' : 'inherit', fontWeight: 'bold' }}>{wr.collateralStatus}</span>
                                  {wr.pledgeBank && ` (${wr.pledgeBank})`}
                                </>
                              );
                            }
                            return 'Awaiting WR authorization...';
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage 4: Outbound / Dispatch */}
                  <div className="timeline-item" style={{ display: 'flex', gap: '12px' }}>
                    <div className={`timeline-dot ${selectedLot.status === 'Reserved' || selectedLot.status === 'Returned' ? 'done' : ''}`} style={{ width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedLot.status === 'Reserved' || selectedLot.status === 'Returned' ? 'var(--blue)' : '#ccc', color: '#fff', borderRadius: '50%', flexShrink: 0 }}>
                      {selectedLot.status === 'Reserved' || selectedLot.status === 'Returned' ? '✓' : '•'}
                    </div>
                    <div className="tl-content" style={{ flex: 1 }}>
                      <div className="tl-title" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>{t('Fulfillment / Dispatch')}</div>
                      <div className="tl-sub" style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px', lineHeight: '1.3' }}>
                        {(() => {
                          const disp = dispatches.find(d => d.lotId === selectedLot.id);
                          if (disp) {
                            return (
                              <>
                                Ref: {disp.id}<br/>
                                Truck: {disp.vehicle}<br/>
                                Destination: {disp.destination}<br/>
                                Transit Status: <span style={{ fontWeight: '600' }}>{disp.status}</span>
                              </>
                            );
                          }
                          if (selectedLot.status === 'Reserved') {
                            return 'Reserved for market Purchase Order (Awaiting dispatch gatepass)...';
                          }
                          if (selectedLot.status === 'Returned') {
                            return 'Lot rejected: Returned to farmer due to high moisture.';
                          }
                          return 'Available in storage racks (FIFO dispatch queues).';
                        })()}
                      </div>
                    </div>
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
                  {selectedLot.moisture > 14 && selectedLot.status !== 'Returned' && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => toast.success(`Aeration scheduled for lot ${selectedLot.id}`)}
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

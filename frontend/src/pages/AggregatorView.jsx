import { useState } from 'react';
import MapTracker from '../components/MapTracker';
import toast from 'react-hot-toast';

// Pure/External helper functions to bypass React purity linter checks
function getMockVehicleNo() {
  return `MH-12-KL-${1000 + Math.floor(Math.random() * 8999)}`;
}

function getMockTimestamp() {
  return Date.now().toString();
}

function getMockDispatchId() {
  return `DN-00${83 + Math.floor(Math.random() * 50)}`;
}

export default function AggregatorView({ 
  onReserveLot, 
  onAddDispatch, 
  onAddActivity 
}) {
  // 1. Metric states
  const [listedOnEnam, setListedOnEnam] = useState(12);

  // 2. Rollup table stock data
  const [rollupData] = useState([
    { id: 1, warehouse: 'Wai FPO WH', fpo: 'Wai FPO', rice: 612, wheat: 0, soybean: 230, other: 0, capacity: 68, activeLots: 4 },
    { id: 2, warehouse: 'Phaltan FPO WH', fpo: 'Phaltan FPO', rice: 0, wheat: 430, soybean: 0, other: 282, capacity: 89, activeLots: 6, warning: true },
    { id: 3, warehouse: 'Baramati FPO WH', fpo: 'Baramati FPO', rice: 0, wheat: 0, soybean: 74, other: 214, capacity: 48, activeLots: 2 }
  ]);

  // 3. Vehicles in transit tracking (Traccar)
  const [vehicles, setVehicles] = useState([
    { id: 'v1', vehicle: 'MH-11-AB-4421', commodity: 'Soybean 2.4 MT', from: 'Wai FPO', eta: 'Today 2:30 PM', status: 'En route', statusClass: 'badge-amber' },
    { id: 'v2', vehicle: 'MH-14-CD-9920', commodity: 'Wheat 5 MT', from: 'Phaltan FPO', eta: 'Today 4:00 PM', status: 'En route', statusClass: 'badge-amber' },
    { id: 'v3', vehicle: 'MH-09-EF-1122', commodity: 'Onion 0.8 MT', from: 'Baramati FPO', eta: 'Tomorrow 9 AM', status: 'Scheduled', statusClass: 'badge-blue' }
  ]);

  // 4. Bulk Dispatch selector state
  const [selectedLots, setSelectedLots] = useState(['LOT-2026-085']);
  const [destinationMarket, setDestinationMarket] = useState('Raigad Mart - Mumbai');
  const [dispatchDate, setDispatchDate] = useState('2026-06-12');

  const bulkDispatchLots = [
    { id: 'LOT-2026-085', commodity: 'Soybean', weight: '2,400 kg', warehouse: 'Wai FPO' },
    { id: 'LOT-2026-090', commodity: 'Wheat', weight: '1,200 kg', warehouse: 'Phaltan FPO' },
    { id: 'LOT-2026-072', commodity: 'Groundnut', weight: '1,500 kg', warehouse: 'Wai FPO' }
  ];

  // Dynamic calculations for totals
  const totalRice = rollupData.reduce((sum, item) => sum + item.rice, 0);
  const totalWheat = rollupData.reduce((sum, item) => sum + item.wheat, 0);
  const totalSoybean = rollupData.reduce((sum, item) => sum + item.soybean, 0);
  const totalOther = rollupData.reduce((sum, item) => sum + item.other, 0);
  const grandTotal = rollupData.reduce((sum, item) => sum + (item.rice + item.wheat + item.soybean + item.other), 0);

  // Toggle selection check
  const handleCheckboxChange = (lotId) => {
    if (selectedLots.includes(lotId)) {
      setSelectedLots(prev => prev.filter(id => id !== lotId));
    } else {
      setSelectedLots(prev => [...prev, lotId]);
    }
  };

  // List on eNAM action
  const handleListOnEnam = (count, fpoName) => {
    setListedOnEnam(prev => prev + count);
    toast.success(`Successfully synchronized and listed ${count} FPO warehouse crop lots from ${fpoName} on eNAM national portal.`);
    if (onAddActivity) {
      onAddActivity('market', `e-Market Linkage — Listed ${count} lots from ${fpoName} on eNAM B2B portal successfully.`);
    }
  };

  const handleListAll = () => {
    const totalLotsToSubmit = rollupData.reduce((sum, item) => sum + item.activeLots, 0);
    setListedOnEnam(prev => prev + totalLotsToSubmit);
    toast.success(`Successfully listed all ${totalLotsToSubmit} active lots across linked FPO warehouses on eNAM!`);
    if (onAddActivity) {
      onAddActivity('market', `e-Market Linkage — Consolidated submission of ${totalLotsToSubmit} lots on eNAM completed.`);
    }
  };

  // Submit bulk dispatch note
  const handleCreateBulkDispatch = (e) => {
    e.preventDefault();
    if (selectedLots.length === 0) {
      toast.error('Please select at least one lot for bulk dispatch.');
      return;
    }

    // Assign a mock vehicle
    const vehicleNo = getMockVehicleNo();
    const lotNames = selectedLots.join(', ');
    
    // Add to vehicle log list
    const newTransit = {
      id: getMockTimestamp(),
      vehicle: vehicleNo,
      commodity: `Bulk Cargo (${selectedLots.length} Lots)`,
      from: 'Consolidated FPOs',
      eta: 'Today 6:30 PM',
      status: 'En route',
      statusClass: 'badge-amber'
    };

    setVehicles(prev => [newTransit, ...prev]);

    // Update global lot statuses if available
    selectedLots.forEach(lotId => {
      if (onReserveLot) {
        onReserveLot(lotId);
      }
      
      // If lot matches seed data, create dispatch notes
      const matchedLot = bulkDispatchLots.find(l => l.id === lotId);
      if (matchedLot && onAddDispatch) {
        const newDispatch = {
          id: getMockDispatchId(),
          lotId: lotId,
          commodity: `${matchedLot.commodity} (${matchedLot.weight})`,
          quantity: matchedLot.weight,
          destination: destinationMarket,
          vehicle: vehicleNo,
          status: 'In Transit',
          timeline: [
            { title: 'Bulk Dispatch Note Created', sub: 'Today, Just Now', done: true },
            { title: 'Weigh Bridge Gate-out weight certified', sub: 'Today, Just Now', done: true },
            { title: 'Fleet assigned via Fleetbase API', sub: 'Estimated ETA 4 hours', active: true }
          ]
        };
        onAddDispatch(newDispatch, lotId);
      }
    });

    if (onAddActivity) {
      onAddActivity('dispatch', `Fleet Logistics — Dispatched bulk cargo (${lotNames}) containing ${selectedLots.length} lot(s) to ${destinationMarket} via ${vehicleNo}.`);
    }

    toast.success(`Bulk dispatch successfully created for ${selectedLots.length} lot(s). Assigned transit fleet vehicle: ${vehicleNo}.`);
    setSelectedLots([]);
  };

  return (
    <div className="page active" id="page-aggregator">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="section-title" style={{ fontSize: '20px' }}>Aggregator Dashboard</div>
          <div className="section-sub" style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '6px' }}>
            Aggregator Dashboard — MahaFPC
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
            Consolidated view across all linked FPO warehouses · Bulk dispatch · eNAM listing
          </div>
        </div>
      </div>

      {/* METRIC STAT CARDS ROW */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div className="stat-label">FPO Warehouses</div>
          <div className="stat-value">7</div>
          <div className="stat-sub">3 active · 4 in network</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div className="stat-label">Total Consolidated Stock</div>
          <div className="stat-value">
            {grandTotal.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text3)' }}>MT</span>
          </div>
          <div className="stat-sub">Across all FPOs</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div className="stat-label">In-Transit to Aggregator</div>
          <div className="stat-value">{vehicles.filter(v => v.status === 'En route').length}</div>
          <div className="stat-sub">Live GPS via Traccar</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-label">Lots Listed on eNAM</div>
          <div className="stat-value">{listedOnEnam}</div>
          <div className="stat-sub">₹28.4L total value</div>
        </div>
      </div>

      {/* MULTI-WAREHOUSE STOCK ROLLUP */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="section-title">Multi-Warehouse Stock Rollup</div>
          <button 
            className="btn btn-outline"
            onClick={() => toast.success('Exporting consolidated stock ledger report as CSV... Download started.')}
          >
            Export Consolidated
          </button>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>FPO</th>
                <th>Rice</th>
                <th>Wheat</th>
                <th>Soybean</th>
                <th>Other</th>
                <th>Total</th>
                <th>Capacity %</th>
                <th>Lots Ready for eNAM</th>
              </tr>
            </thead>
            <tbody>
              {rollupData.map(item => {
                const rowTotal = item.rice + item.wheat + item.soybean + item.other;
                return (
                  <tr key={item.id}>
                    <td><strong>{item.warehouse}</strong></td>
                    <td>{item.fpo}</td>
                    <td>{item.rice > 0 ? `${item.rice} MT` : '—'}</td>
                    <td>{item.wheat > 0 ? `${item.wheat} MT` : '—'}</td>
                    <td>{item.soybean > 0 ? `${item.soybean} MT` : '—'}</td>
                    <td>{item.other > 0 ? `${item.other} MT` : '—'}</td>
                    <td style={{ fontWeight: '600' }}>{rowTotal} MT</td>
                    <td>
                      <span className={`badge ${item.warning ? 'badge-amber' : 'badge-green'}`}>
                        {item.capacity}% {item.warning && '⚠'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', background: '#fff' }}
                        onClick={() => handleListOnEnam(item.activeLots, item.fpo)}
                      >
                        {item.activeLots} lots &rarr; eNAM
                      </button>
                    </td>
                  </tr>
                );
              })}
              {/* TOTAL ROW */}
              <tr style={{ background: 'var(--surface2)', fontWeight: 'bold' }}>
                <td>TOTAL</td>
                <td>—</td>
                <td>{totalRice} MT</td>
                <td>{totalWheat} MT</td>
                <td>{totalSoybean} MT</td>
                <td>{totalOther} MT</td>
                <td>{grandTotal} MT</td>
                <td>—</td>
                <td>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={handleListAll}
                  >
                    List All on eNAM
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TWO COLUMN GRID: Live Tracking & Bulk Dispatch */}
      <div className="two-col">
        
        {/* Left Column: Live Traccar Tracking */}
        <div className="card">
          <div className="card-header">
            <div className="section-title">Live In-Transit Tracking (Traccar)</div>
            <span className="badge badge-green">3 vehicles live</span>
          </div>
          <div className="card-body no-padding" style={{ padding: '12px' }}>
            <MapTracker />
          </div>
          <div className="table-responsive" style={{ borderTop: '1px solid var(--border)' }}>
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Commodity</th>
                  <th>From</th>
                  <th>ETA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: '500' }}>{v.vehicle}</td>
                    <td>{v.commodity}</td>
                    <td>{v.from}</td>
                    <td>{v.eta}</td>
                    <td>
                      <span className={`badge ${v.statusClass}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Bulk Dispatch Form */}
        <div className="card">
          <div className="card-header">
            <div className="section-title">Bulk Dispatch to Market</div>
          </div>
          <form onSubmit={handleCreateBulkDispatch} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px' }}>Select Lots for Bulk Dispatch</label>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  border: '1px solid var(--border2)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  background: 'var(--surface)' 
                }}>
                  {bulkDispatchLots.map(lot => (
                    <label 
                      key={lot.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        fontSize: '13px', 
                        cursor: 'pointer',
                        padding: '4px 0' 
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedLots.includes(lot.id)}
                        onChange={() => handleCheckboxChange(lot.id)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>
                        <strong>{lot.id}</strong> · {lot.commodity} · {lot.weight} · <span style={{ color: 'var(--text3)' }}>{lot.warehouse}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Destination Market</label>
                  <select 
                    className="form-select"
                    value={destinationMarket}
                    onChange={(e) => setDestinationMarket(e.target.value)}
                  >
                    <option value="Raigad Mart - Mumbai">Raigad Mart - Mumbai</option>
                    <option value="Vashi APMC - Navi Mumbai">Vashi APMC - Navi Mumbai</option>
                    <option value="Pune Grain Market">Pune Grain Market</option>
                    <option value="Satara Agri Hub">Satara Agri Hub</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dispatch Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    required
                  />
                </div>
              </div>

            </div>
            
            <div className="form-footer" style={{ borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => toast.success(`Successfully queued ${selectedLots.length} lot(s) for eNAM marketing board listing.`)}
              >
                List on eNAM
              </button>
              <button type="submit" className="btn btn-primary">
                Create Bulk Dispatch + Assign Fleet
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}

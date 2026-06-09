import { useState } from 'react';

export default function Warehouses({ intakes }) {
  // 1. Warehouses list state
  const [warehouses, setWarehouses] = useState([
    { id: 1, name: 'Wai FPO Warehouse', location: 'Wai, Satara - Maharashtra', capacity: 500, baselineStock: 342, baselineFarmers: 84, prefix: 'wai' },
    { id: 2, name: 'Phaltan FPO Warehouse', location: 'Phaltan, Satara - Maharashtra', capacity: 800, baselineStock: 712, baselineFarmers: 131, prefix: 'phaltan' },
    { id: 3, name: 'Baramati FPO Warehouse', location: 'Baramati, Pune - Maharashtra', capacity: 600, baselineStock: 288, baselineFarmers: 97, prefix: 'baramati' }
  ]);

  // 2. Modal registration states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');
  const [newWhCapacity, setNewWhCapacity] = useState('500');
  const [newWhStock, setNewWhStock] = useState('0');
  const [newWhFarmers, setNewWhFarmers] = useState('0');

  // Compute stock adjustments dynamically from intakes delta (current session active vs baseline)
  const getFpoDelta = (prefix) => {
    if (!prefix) return 0;

    // Seed database reference (from initialApp seed state)
    const initialSeeds = [
      { id: 'LOT-2026-091', commodity: 'Rice', quantity: 900, warehouse: 'Wai FPO' },
      { id: 'LOT-2026-090', commodity: 'Wheat', quantity: 1200, warehouse: 'Phaltan FPO' },
      { id: 'LOT-2026-089', commodity: 'Soybean', quantity: 600, warehouse: 'Wai FPO' },
      { id: 'LOT-2026-088', commodity: 'Onion', quantity: 800, warehouse: 'Baramati FPO' }
    ];

    const currentTotal = intakes
      .filter(lot => lot.warehouse.toLowerCase().includes(prefix.toLowerCase()) && lot.status === 'Available')
      .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

    const initialTotal = initialSeeds
      .filter(lot => lot.warehouse.toLowerCase().includes(prefix.toLowerCase()))
      .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

    return (currentTotal - initialTotal) / 1000; // Return delta in MT
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!newWhName.trim() || !newWhLocation.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const newWh = {
      id: Date.now(),
      name: newWhName,
      location: newWhLocation,
      capacity: Number(newWhCapacity) || 500,
      baselineStock: Number(newWhStock) || 0,
      baselineFarmers: Number(newWhFarmers) || 0,
      prefix: newWhName
    };

    setWarehouses(prev => [...prev, newWh]);
    setIsModalOpen(false);

    alert(`Warehouse "${newWhName}" registered successfully in the regional WMS infrastructure!`);

    // Reset fields
    setNewWhName('');
    setNewWhLocation('');
    setNewWhCapacity('500');
    setNewWhStock('0');
    setNewWhFarmers('0');
  };

  return (
    <div className="page active" id="page-warehouses">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="section-title" style={{ fontSize: '20px' }}>Warehouses</div>
          <div className="section-sub" style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '6px' }}>
            Master data · Zones · Capacity management
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Register Warehouse
        </button>
      </div>

      {/* CARDS GRID */}
      <div className="warehouse-grid">
        {warehouses.map(wh => {
          const delta = getFpoDelta(wh.prefix);
          const stock = Number((wh.baselineStock + delta).toFixed(1));
          const capacity = wh.capacity;
          const farmers = wh.baselineFarmers;

          const usedPercent = Math.min(100, Math.round((stock / capacity) * 100));
          const freeCapacity = Math.max(0, Number((capacity - stock).toFixed(1)));
          const isNearFull = usedPercent >= 85;

          return (
            <div className="warehouse-card" key={wh.id}>
              <div className="warehouse-card-header">
                <div>
                  <div className="warehouse-card-title">{wh.name}</div>
                  <div className="warehouse-card-location">{wh.location}</div>
                </div>
                <span className="badge badge-green">Active</span>
              </div>

              <div className="warehouse-card-stats">
                <div className="warehouse-card-stat-item">
                  <div className="warehouse-card-stat-label">Capacity</div>
                  <div className="warehouse-card-stat-val">{capacity} MT</div>
                </div>
                <div className="warehouse-card-stat-item">
                  <div className="warehouse-card-stat-label">In Stock</div>
                  <div className="warehouse-card-stat-val">{stock} MT</div>
                </div>
                <div className="warehouse-card-stat-item">
                  <div className="warehouse-card-stat-label">Farmers</div>
                  <div className="warehouse-card-stat-val">{farmers}</div>
                </div>
              </div>

              <div className="warehouse-progress-container">
                <div className="warehouse-progress-bar">
                  <div
                    className={`warehouse-progress-fill ${isNearFull ? 'near-full' : ''}`}
                    style={{ width: `${usedPercent}%` }}
                  ></div>
                </div>
                <div className="warehouse-progress-text-row">
                  <span className={`warehouse-progress-used ${isNearFull ? 'near-full' : ''}`}>
                    {usedPercent}% capacity {isNearFull ? '— near full' : 'used'}
                  </span>
                  <span className="warehouse-progress-free">
                    {freeCapacity} MT free
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* REGISTER NEW WAREHOUSE PLACEHOLDER CARD */}
        <div className="warehouse-register-card" onClick={() => setIsModalOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Register new warehouse</span>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div className="modal-title">Register New Warehouse</div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Warehouse Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Satara Aggregation Hub"
                    value={newWhName}
                    onChange={(e) => setNewWhName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location / Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Satara, Maharashtra"
                    value={newWhLocation}
                    onChange={(e) => setNewWhLocation(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Capacity (MT)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhCapacity}
                      onChange={(e) => setNewWhCapacity(e.target.value)}
                      min="10"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">In Stock (MT)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhStock}
                      onChange={(e) => setNewWhStock(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Farmers</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhFarmers}
                      onChange={(e) => setNewWhFarmers(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

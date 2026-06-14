import { useState } from 'react';
import { getTranslation } from '@wakhar/shared';

export default function Warehouses({ intakes, language = 'en' }) {
  const t = (key) => getTranslation(key, language);

  // 1. Expanded Warehouses list state with full master data
  const [warehouses, setWarehouses] = useState([
    { 
      id: 1, 
      name: 'Wai FPO Warehouse', 
      location: 'Wai, Satara - Maharashtra', 
      capacity: 500, 
      baselineStock: 342, 
      baselineFarmers: 84, 
      prefix: 'wai',
      type: 'FPO-level',
      zones: 'Zone A (Racks 1-5), Zone B (Racks 1-3), Bin A1-A20',
      assignedTo: 'Wai FPO',
      geoLat: '17.9462',
      geoLng: '73.8821',
      hours: '09:00 AM - 06:00 PM',
      contact: '+91 98210 55660',
      permittedCrops: ['Rice', 'Soybean', 'Groundnut']
    },
    { 
      id: 2, 
      name: 'Phaltan FPO Warehouse', 
      location: 'Phaltan, Satara - Maharashtra', 
      capacity: 800, 
      baselineStock: 712, 
      baselineFarmers: 131, 
      prefix: 'phaltan',
      type: 'FPO-level',
      zones: 'Zone A (Racks 1-8), Zone B (Racks 1-4), Bins 1-40',
      assignedTo: 'Phaltan FPO',
      geoLat: '17.9810',
      geoLng: '74.4120',
      hours: '08:00 AM - 08:00 PM',
      contact: '+91 99230 44556',
      permittedCrops: ['Wheat', 'Soybean', 'Groundnut']
    },
    { 
      id: 3, 
      name: 'Baramati FPO Warehouse', 
      location: 'Baramati, Pune - Maharashtra', 
      capacity: 600, 
      baselineStock: 288, 
      baselineFarmers: 97, 
      prefix: 'baramati',
      type: 'Cold storage',
      zones: 'Cold Zone A (Bins 1-10), Zone B (Racks 1-2)',
      assignedTo: 'Baramati FPO',
      geoLat: '18.1502',
      geoLng: '74.5690',
      hours: '24 Hours Open',
      contact: '+91 91300 22334',
      permittedCrops: ['Onion', 'Potato', 'Garlic']
    }
  ]);

  // Selected warehouse for details modal
  const [selectedWh, setSelectedWh] = useState(null);

  // 2. Modal registration states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');
  const [newWhCapacity, setNewWhCapacity] = useState('500');
  const [newWhStock, setNewWhStock] = useState('0');
  const [newWhFarmers, setNewWhFarmers] = useState('0');
  const [newWhType, setNewWhType] = useState('FPO-level');
  const [newWhZones, setNewWhZones] = useState('Zone A (Racks 1-5), Zone B (Racks 1-3)');
  const [newWhAssignedTo, setNewWhAssignedTo] = useState('Regional FPO');
  const [newWhGeoLat, setNewWhGeoLat] = useState('17.9123');
  const [newWhGeoLng, setNewWhGeoLng] = useState('73.8421');
  const [newWhHours, setNewWhHours] = useState('09:00 AM - 06:00 PM');
  const [newWhContact, setNewWhContact] = useState('+91 98765 43210');
  const [newWhPermittedCrops, setNewWhPermittedCrops] = useState(['Rice', 'Wheat', 'Soybean']);

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

  const handleCropCheckboxChange = (crop) => {
    if (newWhPermittedCrops.includes(crop)) {
      setNewWhPermittedCrops(prev => prev.filter(c => c !== crop));
    } else {
      setNewWhPermittedCrops(prev => [...prev, crop]);
    }
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
      prefix: newWhName.toLowerCase().replace(/[^a-z]/g, ''),
      type: newWhType,
      zones: newWhZones,
      assignedTo: newWhAssignedTo,
      geoLat: newWhGeoLat,
      geoLng: newWhGeoLng,
      hours: newWhHours,
      contact: newWhContact,
      permittedCrops: newWhPermittedCrops
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
    setNewWhType('FPO-level');
    setNewWhZones('Zone A (Racks 1-5), Zone B (Racks 1-3)');
    setNewWhAssignedTo('Regional FPO');
    setNewWhGeoLat('17.9123');
    setNewWhGeoLng('73.8421');
    setNewWhHours('09:00 AM - 06:00 PM');
    setNewWhContact('+91 98765 43210');
    setNewWhPermittedCrops(['Rice', 'Wheat', 'Soybean']);
  };

  return (
    <div className="page active" id="page-warehouses">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="section-title" style={{ fontSize: '20px' }}>{t('Warehouses')}</div>
          <div className="section-sub" style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '6px' }}>
            Master data · Zones · Capacity management · IoT Geofencing
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
            <div className="warehouse-card" key={wh.id} onClick={() => setSelectedWh(wh)} style={{ cursor: 'pointer' }}>
              <div className="warehouse-card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="warehouse-card-title">{wh.name}</div>
                    <span className={`badge ${wh.type === 'Cold storage' ? 'badge-blue' : 'badge-teal'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {t(wh.type)}
                    </span>
                  </div>
                  <div className="warehouse-card-location">📍 {wh.location}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                    GPS: {wh.geoLat}, {wh.geoLng} · Hours: {wh.hours}
                  </div>
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
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">Register New Warehouse Center</div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Warehouse Type *</label>
                    <select className="form-select" value={newWhType} onChange={(e) => setNewWhType(e.target.value)}>
                      <option value="FPO-level">FPO-level Warehouse</option>
                      <option value="Aggregator-level">Aggregator Consolidation Center</option>
                      <option value="Cold storage">Cold Storage Facility</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned FPO/Region *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newWhAssignedTo}
                      onChange={(e) => setNewWhAssignedTo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Satara MIDC, Maharashtra"
                    value={newWhLocation}
                    onChange={(e) => setNewWhLocation(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Total Capacity (MT)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhCapacity}
                      onChange={(e) => setNewWhCapacity(e.target.value)}
                      min="10"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Stock (MT)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhStock}
                      onChange={(e) => setNewWhStock(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Farmers Registered</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhFarmers}
                      onChange={(e) => setNewWhFarmers(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Geo Latitude coordinates *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newWhGeoLat}
                      onChange={(e) => setNewWhGeoLat(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Geo Longitude coordinates *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newWhGeoLng}
                      onChange={(e) => setNewWhGeoLng(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Operating Hours *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 09:00 AM - 06:00 PM"
                      value={newWhHours}
                      onChange={(e) => setNewWhHours(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone / Contacts *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newWhContact}
                      onChange={(e) => setNewWhContact(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Warehouse Zones, Racks, Bins Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Zone A (Rack 1-5), Zone B (Bin A1-A10)"
                    value={newWhZones}
                    onChange={(e) => setNewWhZones(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Permitted Commodity Categories</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {['Rice', 'Wheat', 'Soybean', 'Onion', 'Groundnut'].map(crop => (
                      <label key={crop} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newWhPermittedCrops.includes(crop)}
                          onChange={() => handleCropCheckboxChange(crop)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>{t(crop)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-footer" style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '14px' }}>
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

      {/* DETAIL MODAL DRAWER */}
      {selectedWh && (
        <div className="modal-overlay" onClick={() => setSelectedWh(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="modal-title" style={{ fontSize: '18px' }}>{selectedWh.name}</div>
                  <span className={`badge ${selectedWh.type === 'Cold storage' ? 'badge-blue' : 'badge-teal'}`}>
                    {t(selectedWh.type)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                  📍 {selectedWh.location}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedWh(null)}>×</button>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
              
              {/* Detailed Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--surface2)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Total Capacity</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedWh.capacity} MT</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>In Stock (MT)</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--blue)' }}>
                    {(selectedWh.baselineStock + getFpoDelta(selectedWh.prefix)).toFixed(1)} MT
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Registered Farmers</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedWh.baselineFarmers}</div>
                </div>
              </div>

              {/* Master details specifications */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', paddingBottom: '6px' }}>
                  <span style={{ width: '160px', color: 'var(--text3)' }}>{t('Warehouse Type')}:</span>
                  <span style={{ fontWeight: '500' }}>{selectedWh.type}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', paddingBottom: '6px' }}>
                  <span style={{ width: '160px', color: 'var(--text3)' }}>{t('Assigned to')}:</span>
                  <span style={{ fontWeight: '500' }}>{selectedWh.assignedTo}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', paddingBottom: '6px' }}>
                  <span style={{ width: '160px', color: 'var(--text3)' }}>{t('Operating Hours')}:</span>
                  <span style={{ fontWeight: '500' }}>{selectedWh.hours}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', paddingBottom: '6px' }}>
                  <span style={{ width: '160px', color: 'var(--text3)' }}>{t('Contact Info')}:</span>
                  <span style={{ fontWeight: '500' }}>{selectedWh.contact}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', paddingBottom: '6px' }}>
                  <span style={{ width: '160px', color: 'var(--text3)' }}>{t('Geo-Coordinates')}:</span>
                  <span style={{ fontWeight: '500', color: 'var(--blue)' }}>📍 Lat: {selectedWh.geoLat}, Lng: {selectedWh.geoLng}</span>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', paddingBottom: '6px' }}>
                  <span style={{ width: '160px', color: 'var(--text3)' }}>{t('Zones, Racks, Bins')}:</span>
                  <span style={{ fontWeight: '500' }}>{selectedWh.zones}</span>
                </div>
              </div>

              {/* Permitted crops badges */}
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                  {t('Permitted Commodities')}:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedWh.permittedCrops.map(crop => (
                    <span key={crop} className="badge badge-gray" style={{ padding: '4px 10px', fontSize: '11.5px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      🌾 {t(crop)}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            <div className="form-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ background: '#fff' }}
                onClick={() => alert(`Synchronizing geofence bounds with Traccar API for ${selectedWh.name}...`)}
              >
                🛰️ Sync Traccar Geofence
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedWh(null)}>
                Close Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

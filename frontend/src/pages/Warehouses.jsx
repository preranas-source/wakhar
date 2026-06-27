import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getTranslation } from '@wakhar/shared';
import warehouseService from '../services/warehouseService';
import toast from 'react-hot-toast';

export default function Warehouses({ 
  intakes, 
  language = 'en',
  dbWarehouses = [],
  dbFarmers = [],
  dbFpos = [],
  onRefreshData,
  role
}) {
  const t = (key) => getTranslation(key, language);

  // Selected warehouse for details modal
  const [selectedWh, setSelectedWh] = useState(null);

  // Modal registration states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');
  const [newWhCapacity, setNewWhCapacity] = useState('500');
  const [newWhStock, setNewWhStock] = useState('0');
  const [newWhType, setNewWhType] = useState('FPO-level');
  const [newWhZones, setNewWhZones] = useState('Zone A (Racks 1-5), Zone B (Racks 1-3)');
  const [newWhFpoId, setNewWhFpoId] = useState('');
  const [newWhGeoLat, setNewWhGeoLat] = useState('17.950000');
  const [newWhGeoLng, setNewWhGeoLng] = useState('73.880000');
  const [newWhHours, setNewWhHours] = useState('09:00 AM - 06:00 PM');
  const [newWhContact, setNewWhContact] = useState('+91 98765 43210');
  const [newWhPermittedCrops, setNewWhPermittedCrops] = useState(['Rice', 'Wheat', 'Soybean']);

  // Edit Warehouse states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWhId, setEditingWhId] = useState(null);

  const handleEditClick = (wh) => {
    setEditingWhId(wh.id);
    setNewWhName(wh.name);
    setNewWhLocation(wh.location);
    setNewWhCapacity(wh.capacity.toString());
    setNewWhStock(wh.stock.toString());
    setNewWhType(wh.type === 'Aggregator-level' ? 'Aggregator-level' : (wh.type === 'Cold storage' ? 'Cold storage' : 'FPO-level'));
    setNewWhZones(wh.zones);
    setNewWhFpoId(wh.fpo_id || dbFpos[0]?.id || '');
    setNewWhGeoLat(wh.geoLat);
    setNewWhGeoLng(wh.geoLng);
    setNewWhHours(wh.hours);
    setNewWhContact(wh.contact);
    setNewWhPermittedCrops(wh.permittedCrops);
    setIsEditModalOpen(true);
    setSelectedWh(null); // Close detail modal
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!newWhName.trim() || !newWhLocation.trim()) {
      toast.error('Please fill out all required fields.');
      return;
    }

    const typeMapping = {
      'FPO-level': 'fpo',
      'Aggregator-level': 'aggregator',
      'Cold storage': 'cold_storage'
    };

    try {
      const payload = {
        name: newWhName,
        code: `WH-${newWhName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)}-${Math.floor(Math.random() * 900 + 100)}`,
        type: typeMapping[newWhType] || 'fpo',
        fpo_id: Number(newWhFpoId) || dbFpos[0]?.id || 1,
        geo_lat: parseFloat(newWhGeoLat),
        geo_lng: parseFloat(newWhGeoLng),
        capacity_mt: parseFloat(newWhCapacity) || 0,
        current_stock_mt: parseFloat(newWhStock) || 0,
        address: newWhLocation,
        contact_person: 'FPO Representative',
        contact_phone: newWhContact,
        operating_hours: newWhHours,
        permitted_commodities: newWhPermittedCrops.join(','),
        is_active: true
      };

      await warehouseService.updateWarehouse(editingWhId, payload);
      toast.success(`Warehouse "${newWhName}" updated successfully!`);
      
      if (onRefreshData) {
        await onRefreshData();
      }

      setIsEditModalOpen(false);
      setEditingWhId(null);
    } catch (err) {
      console.error('Failed to update warehouse:', err);
      toast.error('Failed to update warehouse on the backend.');
    }
  };

  const handleDeleteWarehouse = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete warehouse "${name}"?`)) return;
    try {
      await warehouseService.deleteWarehouse(id);
      toast.success(`Warehouse "${name}" deleted successfully.`);
      if (onRefreshData) await onRefreshData();
      setSelectedWh(null);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("Failed to delete warehouse.");
      }
    }
  };

  // Set default FPO ID when dbFpos is available
  useEffect(() => {
    if (dbFpos.length > 0 && !newWhFpoId) {
      setNewWhFpoId(dbFpos[0].id);
    }
  }, [dbFpos, newWhFpoId]);

  // Leaflet map initialization
  useEffect(() => {
    if (!isModalOpen) return;

    let mapInstance = null;

    const startMapInit = () => {
      setTimeout(() => {
        const mapDiv = document.getElementById('register-wh-map');
        if (!mapDiv || !window.L) return;

        const L = window.L;
        const initialLat = 17.95;
        const initialLng = 73.88;

        // Fix default Leaflet icon paths
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map('register-wh-map', { keyboard: false }).setView([initialLat, initialLng], 10);
        mapInstance = map;

        // Reset scroll position of modal elements to counteract Leaflet focus-shift
        setTimeout(() => {
          const scrollContainers = document.querySelectorAll('.modal-container, .modal-overlay, .card-body');
          scrollContainers.forEach(el => {
            el.scrollTop = 0;
          });
        }, 50);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

        const updateCoordsAndAddress = async (lat, lng) => {
          setNewWhGeoLat(lat.toFixed(6));
          setNewWhGeoLng(lng.toFixed(6));
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
              headers: {
                'User-Agent': 'WakharWMS/1.0'
              }
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.display_name) {
                setNewWhLocation(data.display_name);
              }
            }
          } catch (err) {
            console.error('Nominatim reverse lookup error:', err);
          }
        };

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          updateCoordsAndAddress(lat, lng);
        });

        marker.on('dragend', () => {
          const { lat, lng } = marker.getLatLng();
          updateCoordsAndAddress(lat, lng);
        });

        setNewWhGeoLat(initialLat.toFixed(6));
        setNewWhGeoLng(initialLng.toFixed(6));
      }, 200);
    };

    // Load Leaflet css if not already present
    let link = document.querySelector('link[href*="leaflet.css"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet js if not already present
    let script = document.querySelector('script[src*="leaflet.js"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = startMapInit;
      document.body.appendChild(script);
    } else {
      if (window.L) {
        startMapInit();
      } else {
        script.addEventListener('load', startMapInit);
      }
    }

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [isModalOpen]);

  // Map database warehouses to UI format
  const displayWarehouses = dbWarehouses.map(wh => {
    let displayType = 'FPO-level';
    if (wh.type === 'aggregator') displayType = 'Aggregator-level';
    if (wh.type === 'cold_storage') displayType = 'Cold storage';

    const fpo = dbFpos.find(f => f.id === wh.fpo_id);
    const assignedTo = fpo ? fpo.name : 'Unknown FPO';

    const farmersCount = dbFarmers.filter(f => f.fpo_id === wh.fpo_id).length;

    let permittedCrops = ['Rice', 'Wheat', 'Soybean'];
    if (wh.permitted_commodities) {
      permittedCrops = wh.permitted_commodities.split(',').map(s => s.trim()).filter(Boolean);
    }

    return {
      id: wh.id,
      name: wh.name,
      location: wh.address || 'Unknown Location',
      capacity: parseFloat(wh.capacity_mt) || 0,
      stock: parseFloat(wh.current_stock_mt) || 0,
      farmers: farmersCount,
      type: displayType,
      zones: wh.zones || 'Zone A, Zone B',
      assignedTo: assignedTo,
      fpo_id: wh.fpo_id,
      geoLat: wh.geo_lat?.toString() || '0.0',
      geoLng: wh.geo_lng?.toString() || '0.0',
      hours: wh.operating_hours || '09:00 AM - 06:00 PM',
      contact: wh.contact_phone || 'N/A',
      permittedCrops: permittedCrops
    };
  });

  const handleCropCheckboxChange = (crop) => {
    if (newWhPermittedCrops.includes(crop)) {
      setNewWhPermittedCrops(prev => prev.filter(c => c !== crop));
    } else {
      setNewWhPermittedCrops(prev => [...prev, crop]);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!newWhName.trim() || !newWhLocation.trim()) {
      toast.error('Please fill out all required fields.');
      return;
    }

    const typeMapping = {
      'FPO-level': 'fpo',
      'Aggregator-level': 'aggregator',
      'Cold storage': 'cold_storage'
    };

    try {
      const payload = {
        name: newWhName,
        code: `WH-${newWhName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)}-${Math.floor(Math.random() * 900 + 100)}`,
        type: typeMapping[newWhType] || 'fpo',
        fpo_id: Number(newWhFpoId) || dbFpos[0]?.id || 1,
        geo_lat: parseFloat(newWhGeoLat),
        geo_lng: parseFloat(newWhGeoLng),
        capacity_mt: parseFloat(newWhCapacity) || 0,
        current_stock_mt: parseFloat(newWhStock) || 0,
        address: newWhLocation,
        contact_person: 'FPO Representative',
        contact_phone: newWhContact,
        operating_hours: newWhHours,
        permitted_commodities: newWhPermittedCrops.join(','),
        is_active: true
      };

      await warehouseService.createWarehouse(payload);
      
      toast.success(`Warehouse "${newWhName}" registered successfully in the database!`);
      
      if (onRefreshData) {
        await onRefreshData();
      }

      setIsModalOpen(false);

      // Reset fields
      setNewWhName('');
      setNewWhLocation('');
      setNewWhCapacity('500');
      setNewWhStock('0');
      setNewWhType('FPO-level');
      setNewWhZones('Zone A (Racks 1-5), Zone B (Racks 1-3)');
      setNewWhFpoId(dbFpos[0]?.id || '');
      setNewWhGeoLat('17.950000');
      setNewWhGeoLng('73.880000');
      setNewWhHours('09:00 AM - 06:00 PM');
      setNewWhContact('+91 98765 43210');
      setNewWhPermittedCrops(['Rice', 'Wheat', 'Soybean']);
    } catch (err) {
      console.error('Failed to create warehouse:', err);
      toast.success('Failed to register warehouse on the backend.');
    }
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
        {displayWarehouses.map(wh => {
          const stock = wh.stock;
          const capacity = wh.capacity;
          const farmers = wh.farmers;

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

      {/* EDIT MODAL */}
      {isEditModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => { setIsEditModalOpen(false); setEditingWhId(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '90%' }}>
            <div className="modal-header">
              <div className="modal-title">Edit Warehouse Center</div>
              <button className="modal-close" onClick={() => { setIsEditModalOpen(false); setEditingWhId(null); }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Warehouse Name *</label>
                  <input
                    type="text"
                    className="form-input"
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
                    <select
                      className="form-select"
                      value={newWhFpoId}
                      onChange={(e) => setNewWhFpoId(e.target.value)}
                      required
                    >
                      {dbFpos.map(fpo => (
                        <option key={fpo.id} value={fpo.id}>{fpo.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newWhLocation}
                    onChange={(e) => setNewWhLocation(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Total Capacity (MT) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhCapacity}
                      onChange={(e) => setNewWhCapacity(e.target.value)}
                      min="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Stock (MT) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhStock}
                      onChange={(e) => setNewWhStock(e.target.value)}
                      min="0"
                      required
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
                <button type="button" className="btn btn-outline" onClick={() => { setIsEditModalOpen(false); setEditingWhId(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* REGISTRATION MODAL */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '90%' }}>
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
                    <select
                      className="form-select"
                      value={newWhFpoId}
                      onChange={(e) => setNewWhFpoId(e.target.value)}
                      required
                    >
                      {dbFpos.map(fpo => (
                        <option key={fpo.id} value={fpo.id}>{fpo.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Click on map below to auto-fetch address"
                    value={newWhLocation}
                    onChange={(e) => setNewWhLocation(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Total Capacity (MT) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhCapacity}
                      onChange={(e) => setNewWhCapacity(e.target.value)}
                      min="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Stock (MT) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWhStock}
                      onChange={(e) => setNewWhStock(e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Location on Map</label>
                  <div id="register-wh-map" style={{ height: '200px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}></div>
                  <small style={{ color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
                    Click or drag the marker to pinpoint the warehouse location. This will automatically populate coordinates and reverse-geocode the address.
                  </small>
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
      , document.body)}

      {/* DETAIL MODAL DRAWER */}
      {selectedWh && createPortal(
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
                    {selectedWh.stock.toFixed(1)} MT
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Registered Farmers</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedWh.farmers}</div>
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

            <div className="form-footer" style={{ borderTop: '1px solid var(--border)', justifyContent: 'space-between', width: '100%', display: 'flex' }}>
              {role === 'admin' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ background: '#fff', borderColor: 'var(--amber)', color: 'var(--amber)' }}
                    onClick={() => handleEditClick(selectedWh)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ background: '#fff', borderColor: 'var(--red)', color: 'var(--red)' }}
                    onClick={() => handleDeleteWarehouse(selectedWh.id, selectedWh.name)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ background: '#fff' }}
                  onClick={() => toast.success(`Synchronizing geofence bounds with Traccar API for ${selectedWh.name}...`)}
                >
                  🛰️ Sync Traccar Geofence
                </button>
                <button className="btn btn-primary" onClick={() => setSelectedWh(null)}>
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

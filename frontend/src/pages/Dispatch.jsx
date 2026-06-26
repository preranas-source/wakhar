import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiSim } from '@wakhar/shared';
import MapTracker from '../components/MapTracker';
import toast from 'react-hot-toast';

export default function Dispatch({ 
  dispatches, 
  intakes, 
  onAddDispatch, 
  onUpdateDispatch,
  searchQuery,
  role
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [destination, setDestination] = useState('');
  const [destLat, setDestLat] = useState('18.5204');
  const [destLng, setDestLng] = useState('73.8567');
  
  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen]);
  
  // Leaflet map initialization for destination
  useEffect(() => {
    if (!isFormOpen) return;

    let mapInstance = null;

    const startMapInit = () => {
      setTimeout(() => {
        const mapDiv = document.getElementById('dispatch-dest-map');
        if (!mapDiv || !window.L) return;

        const L = window.L;
        const initialLat = parseFloat(destLat);
        const initialLng = parseFloat(destLng);

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map('dispatch-dest-map').setView([initialLat, initialLng], 10);
        mapInstance = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

        const updateCoordsAndAddress = async (lat, lng) => {
          setDestLat(lat.toFixed(6));
          setDestLng(lng.toFixed(6));
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
              headers: { 'User-Agent': 'WakharWMS/1.0' }
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.display_name) {
                setDestination(data.display_name);
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

      }, 200);
    };

    let link = document.querySelector('link[href*="leaflet.css"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let script = document.querySelector('script[src*="leaflet.js"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = startMapInit;
      document.head.appendChild(script);
    } else {
      startMapInit();
    }

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [isFormOpen]);
  
  const [selectedDispatch, setSelectedDispatch] = useState(dispatches[0] || null);

  const availableLots = intakes.filter(lot => lot.status === 'Available');

  // Timeline Action Simulations
  const handleSimulateWeighbridge = (dispatch) => {
    const updatedTimeline = dispatch.timeline.map((step, idx) => {
      if (idx === 1) return { ...step, sub: 'Gate-out weight certified: 12.4 MT', done: true, active: false };
      if (idx === 2) return { ...step, active: true };
      return step;
    });
    const updatedDispatch = { ...dispatch, status: 'In Transit', timeline: updatedTimeline };
    onUpdateDispatch(updatedDispatch);
    setSelectedDispatch(updatedDispatch);
    
    // Log to integrations console via SMS notification simulation
    apiSim.sendSMSNotification('+91 98765 43210', `Weighbridge gate-out certified for dispatch ${dispatch.id}. Weight: 12.4 MT.`);
    toast.success(`Weighbridge certified for ${dispatch.id}! Status is now "In Transit".`);
  };

  const handleGenerateEWayBill = (dispatch) => {
    const updatedTimeline = dispatch.timeline.map((step, idx) => {
      if (idx === 2) return { ...step, sub: 'NIC e-Way Bill generated: EWB-90182739182', done: true, active: false };
      if (idx === 3) return { ...step, active: true };
      return step;
    });
    const updatedDispatch = { ...dispatch, timeline: updatedTimeline };
    onUpdateDispatch(updatedDispatch);
    setSelectedDispatch(updatedDispatch);
    
    // Log to integrations console
    apiSim.sendSMSNotification('+91 98765 43210', `e-Way Bill EWB-90182739182 generated for vehicle ${dispatch.vehicle}.`);
    toast.success(`e-Way Bill generated successfully for ${dispatch.id}!`);
  };

  const handleConfirmEPOD = (dispatch) => {
    const updatedTimeline = dispatch.timeline.map((step, idx) => {
      if (idx === 3) return { ...step, sub: 'e-POD completed & signed at gate-in', done: true, active: false };
      return step;
    });
    const updatedDispatch = { ...dispatch, status: 'Delivered', timeline: updatedTimeline };
    onUpdateDispatch(updatedDispatch);
    setSelectedDispatch(updatedDispatch);
    
    // Log to integrations console
    apiSim.sendSMSNotification('+91 98765 43210', `Delivery confirmed for ${dispatch.id}. e-POD signature uploaded.`);
    toast.success(`Delivery confirmed and e-POD signature verified for ${dispatch.id}!`);
  };

  // Pre-registered vehicle roster
  const vehicleRoster = [
    { plate: 'MH-11-AB-4421', desc: 'MH-11-AB-4421 [Available - 12 MT Cap]' },
    { plate: 'MH-12-PQ-9080', desc: 'MH-12-PQ-9080 [Available - 8 MT Cap]' },
    { plate: 'MH-14-CD-9920', desc: 'MH-14-CD-9920 [In Transit - Phaltan]' },
    { plate: 'MH-09-EF-1122', desc: 'MH-09-EF-1122 [Available - 10 MT Cap]' }
  ];

  // Pre-configured routing paths
  const routeRoster = [
    { id: 'NH-48', name: 'NH-48 Wai Satara Expressway (45 min, 42 km, Toll)' },
    { id: 'Bypass', name: 'Old Bypass Highway (65 min, 56 km, No Toll)' },
    { id: 'SH-11', name: 'State Highway 11 bypass (50 min, 39 km, Minor work)' }
  ];

  const handleCreateDispatch = (e) => {
    e.preventDefault();
    if (!selectedLotId) return toast.error('Please select an available lot to dispatch.');
    if (!destination) return toast.error('Please enter or select a destination on the map.');

    const lot = intakes.find(l => l.id === selectedLotId);

    const newDispatch = {
      id: `DN-00${83 + dispatches.length}`,
      lotId: lot.id,
      commodity: `${lot.commodity} (${lot.variety})`,
      quantity: `${lot.quantity / 1000} MT`,
      destination: destination,
      destinationLat: parseFloat(destLat),
      destinationLng: parseFloat(destLng),
      vehicle: 'Pending Assignment',
      status: 'Pending Assignment',
      route: 'Pending Assignment',
      timeline: [
        { title: 'Transport Request Sent', sub: `Waiting for Agri Fleet vehicle assignment`, done: true },
        { title: 'Vehicle Assigned', sub: 'Pending Agri Fleet assignment', active: true },
        { title: 'Weigh Bridge Clearance', sub: 'Pending gate-out weight checks', active: false },
        { title: 'Delivery e-POD Uploaded', sub: 'Awaiting digital signing', active: false }
      ]
    };

    onAddDispatch(newDispatch, lot.id);
    setIsFormOpen(false);
    setSelectedLotId('');
    setSelectedDispatch(newDispatch);
  };

  // Filter logic: If Buyer, only show dispatches sent to their hub (e.g. Satara or Mumbai)
  const filteredDispatches = dispatches.filter(d => {
    if (role === 'market_partner') {
      const dest = d.destination.toLowerCase();
      // Only show dispatches sent to APMC, Satara Hub, or Raigad Mart
      if (!dest.includes('satara') && !dest.includes('mumbai') && !dest.includes('market') && !dest.includes('mart')) {
        return false;
      }
    }

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.id.toLowerCase().includes(query) ||
      d.commodity.toLowerCase().includes(query) ||
      d.destination.toLowerCase().includes(query) ||
      d.vehicle.toLowerCase().includes(query)
    );
  });

  return (
    <div className="page active" id="page-dispatch">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="section-title" style={{ fontSize: '16px' }}>
            {role === 'market_partner' ? 'Shipment Logistics Tracking Hub' : 'Dispatch & Outbound Logistics'}
          </div>
          <div className="section-sub">
            {role === 'market_partner' 
              ? 'Real-time transit tracker for purchase orders, ETA calculations & digital Proof of Delivery'
              : 'Outbound gatepass generation · Fleet GPS tracing · Digital Pod tracking'}
          </div>
        </div>
        
        {/* Hide Dispatch Note creation for buyers */}
        {role !== 'market_partner' && (
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
            🚚 Create Dispatch Note
          </button>
        )}
      </div>

      <div className="three-col">
        {/* Dispatches ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="section-title">
                {role === 'market_partner' ? 'Incoming Shipments' : 'Active Dispatches'}
              </div>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>DN No.</th>
                    <th>Commodity</th>
                    <th>Destination</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispatches.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>
                        No dispatches found.
                      </td>
                    </tr>
                  ) : (
                    filteredDispatches.map(d => (
                      <tr 
                        key={d.id} 
                        onClick={() => setSelectedDispatch(d)}
                        style={{
                          background: selectedDispatch && selectedDispatch.id === d.id ? 'var(--surface2)' : '',
                          cursor: 'pointer'
                        }}
                      >
                        <td><strong>{d.id}</strong></td>
                        <td>
                          {d.commodity}
                          <div className="td-secondary">{d.quantity}</div>
                        </td>
                        <td>{d.destination}</td>
                        <td>{d.vehicle}</td>
                        <td>
                          <span className={`badge ${
                            d.status === 'Delivered' ? 'badge-green' : 
                            d.status === 'In Transit' ? 'badge-amber' : 'badge-blue'
                          }`}>{d.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="section-title">Traccar Live Fleet Tracking</div>
            </div>
            <div className="card-body no-padding" style={{ padding: '12px' }}>
              <MapTracker />
            </div>
          </div>
        </div>

        {/* Selected Dispatch Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="section-title">Route Timeline Tracker</div>
          </div>
          <div className="card-body">
            {selectedDispatch ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{selectedDispatch.id}</span>
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Vehicle: {selectedDispatch.vehicle}</div>
                    {selectedDispatch.route && (
                      <div style={{ fontSize: '11.5px', color: 'var(--blue)', marginTop: '4px' }}>Route: {selectedDispatch.route.split(' (')[0]}</div>
                    )}
                  </div>
                  <span className={`badge ${
                    selectedDispatch.status === 'Delivered' ? 'badge-green' : 
                    selectedDispatch.status === 'In Transit' ? 'badge-amber' : 'badge-blue'
                  }`}>{selectedDispatch.status}</span>
                </div>
                <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />
                
                <div className="timeline">
                  {selectedDispatch.timeline.map((event, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className={`timeline-dot ${event.done ? 'done' : event.active ? 'active' : ''}`}>
                        {event.done ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/></svg>
                        )}
                      </div>
                      <div className="tl-content">
                        <div className="tl-title">{event.title}</div>
                        <div className="tl-sub">{event.sub}</div>
                        {event.active && !event.done && (
                          <div style={{ marginTop: '8px' }}>
                            {idx === 1 && (
                              <button 
                                type="button" 
                                className="btn btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--green)', borderColor: 'var(--green)' }}
                                onClick={() => handleSimulateWeighbridge(selectedDispatch)}
                              >
                                ⚖️ Certify Weighbridge Gate-out
                              </button>
                            )}
                            {idx === 2 && (
                              <button 
                                type="button" 
                                className="btn btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--blue)', borderColor: 'var(--blue)' }}
                                onClick={() => handleGenerateEWayBill(selectedDispatch)}
                              >
                                📄 Sync NIC e-Way Bill
                              </button>
                            )}
                            {idx === 3 && (
                              <button 
                                type="button" 
                                className="btn btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--purple)', borderColor: 'var(--purple)', color: '#fff' }}
                                onClick={() => handleConfirmEPOD(selectedDispatch)}
                              >
                                ✍️ Sign & Upload e-POD
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedDispatch.status === 'Delivered' && (
                  <div style={{ marginTop: '24px', background: 'var(--green-light)', border: '1px solid rgba(45,106,79,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--green)' }}>✔ Digital e-POD Verified</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>
                      Signed electronically at weighing bridge gate-in. Variance checked and approved.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <p>Select a shipment from the list to trace shipping status.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dispatch Modal */}
      {isFormOpen && createPortal(
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ maxWidth: '640px', width: '90%', position: 'relative', maxHeight: '85vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div className="modal-title">Create Outbound Dispatch pass</div>
              <button className="modal-close" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateDispatch} style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(85vh - 65px)', overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '14px', padding: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Available Inventory Lot</label>
                    <select 
                      className="form-select" 
                      value={selectedLotId}
                      onChange={(e) => setSelectedLotId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Available Lot --</option>
                      {availableLots.map(lot => (
                        <option key={lot.id} value={lot.id}>
                          {lot.id} - {lot.commodity} ({lot.variety}) - {lot.quantity}kg available
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Destination Location *</label>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px' }}>
                      Click on the map or drag the marker to pinpoint the exact destination for Agri Fleet routing.
                    </div>
                    <div id="dispatch-dest-map" style={{ height: '300px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}></div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Address / Name</label>
                    <textarea 
                      className="form-input" 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      rows="2"
                      required
                    ></textarea>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Destination Latitude</label>
                      <input type="text" className="form-input" value={destLat} readOnly style={{ background: 'var(--surface2)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Destination Longitude</label>
                      <input type="text" className="form-input" value={destLng} readOnly style={{ background: 'var(--surface2)' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-footer" style={{ marginTop: '0' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Authorize & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

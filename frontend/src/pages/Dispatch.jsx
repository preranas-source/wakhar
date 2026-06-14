import { useState } from 'react';
import { apiSim } from '@wakhar/shared';
import MapTracker from '../components/MapTracker';

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
  const [destination, setDestination] = useState('Satara Aggregator');
  
  // New dispatch vehicle and route selections
  const [vehicleSelection, setVehicleSelection] = useState('MH-11-AB-4421');
  const [customVehicleNo, setCustomVehicleNo] = useState('');
  const [routeSelection, setRouteSelection] = useState('NH-48 Wai Satara Expressway');
  
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
    alert(`Weighbridge certified for ${dispatch.id}! Status is now "In Transit".`);
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
    alert(`e-Way Bill generated successfully for ${dispatch.id}!`);
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
    alert(`Delivery confirmed and e-POD signature verified for ${dispatch.id}!`);
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
    if (!selectedLotId) return alert('Please select an available lot to dispatch.');
    
    const finalVehicle = vehicleSelection === 'custom' ? customVehicleNo : vehicleSelection;
    if (!finalVehicle.trim()) return alert('Please enter a vehicle registration number.');

    const lot = intakes.find(l => l.id === selectedLotId);
    const selectedRouteObj = routeRoster.find(r => r.name.startsWith(routeSelection)) || routeRoster[0];

    const newDispatch = {
      id: `DN-00${83 + dispatches.length}`,
      lotId: lot.id,
      commodity: `${lot.commodity} (${lot.variety})`,
      quantity: `${lot.quantity / 1000} MT`,
      destination: destination,
      vehicle: finalVehicle,
      status: 'Scheduled',
      route: selectedRouteObj.name,
      timeline: [
        { title: 'Dispatch Note Authorized', sub: `Via ${selectedRouteObj.name.split(' (')[0]}`, done: true },
        { title: 'Weigh Bridge Clearance', sub: 'Pending gate-out weight checks', active: true },
        { title: 'E-way Bill Generation', sub: 'Pending RTO synchronization', active: false },
        { title: 'Delivery e-POD Uploaded', sub: 'Awaiting digital signing', active: false }
      ]
    };

    onAddDispatch(newDispatch, lot.id);
    setIsFormOpen(false);
    setSelectedLotId('');
    setCustomVehicleNo('');
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
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">Create Outbound Dispatch pass</div>
              <button className="modal-close" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateDispatch}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '14px' }}>
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
                  <label className="form-label">Destination Hub</label>
                  <select 
                    className="form-select" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="Satara Aggregator Hub">Satara Aggregator Hub</option>
                    <option value="Phaltan Aggregator Center">Phaltan Aggregator Center</option>
                    <option value="Baramati Processing Facility">Baramati Processing Facility</option>
                    <option value="Mumbai Wholesale Market (Raigad Mart)">Mumbai Wholesale Market (Raigad Mart)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fleet Vehicle Selection</label>
                  <select 
                    className="form-select" 
                    value={vehicleSelection}
                    onChange={(e) => setVehicleSelection(e.target.value)}
                  >
                    {vehicleRoster.map(veh => (
                      <option key={veh.plate} value={veh.plate}>{veh.desc}</option>
                    ))}
                    <option value="custom">-- Custom Vehicle Number --</option>
                  </select>
                </div>

                {vehicleSelection === 'custom' && (
                  <div className="form-group">
                    <label className="form-label">Type Custom Vehicle Plate *</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      value={customVehicleNo}
                      onChange={(e) => setCustomVehicleNo(e.target.value)}
                      placeholder="e.g. MH-11-AB-1234"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Route Selection & Details</label>
                  <select 
                    className="form-select" 
                    value={routeSelection}
                    onChange={(e) => setRouteSelection(e.target.value)}
                  >
                    {routeRoster.map(route => (
                      <option key={route.id} value={route.name}>{route.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Authorize & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

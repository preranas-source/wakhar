import { useState } from 'react';
import MapTracker from '../components/MapTracker';

export default function Dispatch({ 
  dispatches, 
  intakes, 
  onAddDispatch, 
  searchQuery 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [destination, setDestination] = useState('Satara Aggregator');
  const [vehicleNo, setVehicleNo] = useState('MH-11-AB-4421');
  const [selectedDispatch, setSelectedDispatch] = useState(dispatches[0] || null);

  const availableLots = intakes.filter(lot => lot.status === 'Available');

  const handleCreateDispatch = (e) => {
    e.preventDefault();
    if (!selectedLotId) return alert('Please select an available lot to dispatch.');
    
    const lot = intakes.find(l => l.id === selectedLotId);
    const newDispatch = {
      id: `DN-00${83 + dispatches.length}`,
      lotId: lot.id,
      commodity: `${lot.commodity} (${lot.variety})`,
      quantity: `${lot.quantity / 1000} MT`,
      destination: destination,
      vehicle: vehicleNo,
      status: 'Scheduled',
      timeline: [
        { title: 'Dispatch Note Authorized', sub: 'Today, Just Now', done: true },
        { title: 'Weigh Bridge Clearance', sub: 'Pending gate-out weight checks', active: true },
        { title: 'E-way Bill Generation', sub: 'Pending RTO synchronization', active: false },
        { title: 'Delivery e-POD Uploaded', sub: 'Awaiting digital signing', active: false }
      ]
    };

    onAddDispatch(newDispatch, lot.id);
    setIsFormOpen(false);
    setSelectedLotId('');
    setSelectedDispatch(newDispatch);
  };

  const filteredDispatches = dispatches.filter(d => {
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
          <div className="section-title" style={{ fontSize: '16px' }}>Dispatch & Outbound Logistics</div>
          <div className="section-sub">Outbound gatepass generation · Fleet GPS tracing · Digital Pod tracking</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
          🚚 Create Dispatch Note
        </button>
      </div>

      <div className="three-col">
        {/* Dispatches ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="section-title">Active Dispatches</div>
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
                        No dispatches recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredDispatches.map(d => (
                      <tr 
                        key={d.id} 
                        onClick={() => setSelectedDispatch(d)}
                        style={{
                          background: selectedDispatch && selectedDispatch.id === d.id ? 'var(--surface2)' : ''
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
              <div className="section-title">Live Dispatch Tracking</div>
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <p>Select a dispatch from the list to trace shipping status.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dispatch Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title">Create Outbound Dispatch pass</div>
              <button className="modal-close" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateDispatch}>
              <div className="form-grid">
                <div className="form-group full">
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
                    <option>Satara Aggregator Hub</option>
                    <option>Phaltan Aggregator Center</option>
                    <option>Baramati Processing Facility</option>
                    <option>Mumbai Wholesale Market</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Registration Number</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="e.g. MH-11-AB-1234"
                    required
                  />
                </div>
              </div>
              <div className="form-footer">
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

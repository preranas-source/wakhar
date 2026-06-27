import { useState, useEffect } from 'react';
import stockTransferService from '../services/stockTransferService';
import toast from 'react-hot-toast';

export default function Transfers({ intakes = [], warehouses = [], onAddActivity, role }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTransferId, setActiveTransferId] = useState(null);

  // Initiate Transfer Form States
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [transferQty, setTransferQty] = useState('0');
  const [vehicleReg, setVehicleReg] = useState('Auto-assign via Agri Fleet');
  const [inspectorNotes, setInspectorNotes] = useState('');

  const fpoWarehouses = warehouses.filter(w => w.type === 'fpo');
  const aggregatorWarehouses = warehouses.filter(w => w.type === 'aggregator');

  // Load transfers from API
  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const data = await stockTransferService.getTransfers();
      setTransfers(data);
      if (data.length > 0) {
        setActiveTransferId(prev => prev || data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch stock transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Set default values for warehouse selects when data arrives
  useEffect(() => {
    if (fpoWarehouses.length > 0 && !sourceWarehouseId) {
      setSourceWarehouseId(fpoWarehouses[0].id.toString());
    }
    if (aggregatorWarehouses.length > 0 && !destinationWarehouseId) {
      setDestinationWarehouseId(aggregatorWarehouses[0].id.toString());
    }
  }, [warehouses]);

  const selectedSourceWhId = Number(sourceWarehouseId);
  const availableLots = intakes.filter(lot => lot.status === 'Available' && lot.warehouseId === selectedSourceWhId);

  const activeTransfer = transfers.find(t => t.id === activeTransferId) || transfers[0];

  const handleSelectLot = (e) => {
    const lotId = e.target.value;
    setSelectedLotId(lotId);
    const lot = intakes.find(l => l.id === lotId);
    if (lot) {
      setTransferQty(lot.quantity.toString());
    } else {
      setTransferQty('0');
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!selectedLotId) return toast.error('Please select a commodity lot to transfer.');
    const lot = intakes.find(l => l.id === selectedLotId);
    if (!lot) return;

    const qtyKg = Number(transferQty);
    if (qtyKg <= 0 || qtyKg > lot.quantity) {
      return toast.error(`Invalid quantity. Must be between 1 and ${lot.quantity} kg.`);
    }

    try {
      const nextIdNum = 19 + transfers.length;
      const trfCode = `TRF-2026-0${nextIdNum < 10 ? '0' + nextIdNum : nextIdNum}`;

      const payload = {
        trf_code: trfCode,
        lot_id: lot.dbId,
        quantity_kg: qtyKg,
        source_warehouse_id: Number(sourceWarehouseId),
        destination_warehouse_id: Number(destinationWarehouseId),
        vehicle_reg: vehicleReg,
        status: 'GRN Pending',
        dispatch_date: new Date().toISOString()
      };

      const newTransfer = await stockTransferService.createTransfer(payload);
      toast.success(`Transfer ${trfCode} initiated successfully! Sent request to Agri Fleet.`);
      
      // Refresh list
      await fetchTransfers();
      setActiveTransferId(newTransfer.id);
      setSelectedLotId('');
      setTransferQty('0');

      if (onAddActivity) {
        const srcWh = warehouses.find(w => w.id === Number(sourceWarehouseId));
        const destWh = warehouses.find(w => w.id === Number(destinationWarehouseId));
        onAddActivity();
      }
    } catch (err) {
      console.error('Failed to create transfer:', err);
      toast.success('Failed to initiate transfer on WMS backend.');
    }
  };

  const handleApproveGRN = async () => {
    if (!activeTransfer) return;
    try {
      await stockTransferService.reconcileTransfer(activeTransfer.id);
      toast.success(`GRN approved and reconciled for ${activeTransfer.trf_code}! Inventory is now in the destination warehouse.`);
      
      // Refresh data
      await fetchTransfers();
      if (onAddActivity) {
        onAddActivity();
      }
    } catch (err) {
      console.error('Failed to reconcile GRN:', err);
      toast.success('Failed to reconcile GRN on backend.');
    }
  };

  const formatTrfId = (idStr) => {
    const parts = idStr.split('-');
    if (parts.length === 3) {
      return (
        <>
          {parts[0]}-<br/>
          {parts[1]}-{parts[2]}
        </>
      );
    }
    return idStr;
  };

  const isBuyer = role === 'market_partner';

  // Helper to map DB warehouse ID to name
  const getWarehouseName = (whId) => {
    const wh = warehouses.find(w => w.id === whId);
    return wh ? wh.name : `Warehouse #${whId}`;
  };

  return (
    <div className="page active" id="page-transfers" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
            {isBuyer ? 'Goods Receipt Note (GRN) Reconciliation' : 'FPO \u2192 Aggregator Transfer'}
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '6px' }}>
            {isBuyer 
              ? 'Record goods receipt, verify weights, and flag variance reconciliation details' 
              : 'Outbound dispatch from FPO · GRN at aggregator · Quantity reconciliation'}
          </div>
        </div>
      </div>

      {/* Two-Column split grid */}
      <div className={isBuyer ? '' : 'transfers-split-layout'} style={{ display: 'grid', gridTemplateColumns: isBuyer ? '1fr' : '1fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Initiate FPO Transfer (Hidden for Buyers) */}
        {!isBuyer ? (
          <div className="card">
            <div className="card-header">
              <div className="section-title">Initiate FPO Transfer</div>
            </div>
            <form onSubmit={handleCreateTransfer}>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Source FPO Warehouse</label>
                  <select className="form-select" value={sourceWarehouseId} onChange={(e) => setSourceWarehouseId(e.target.value)}>
                    <option value="">-- Choose Source --</option>
                    {fpoWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                    {fpoWarehouses.length === 0 && (
                      <option disabled>No source FPO warehouse found.</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Aggregator</label>
                  <select className="form-select" value={destinationWarehouseId} onChange={(e) => setDestinationWarehouseId(e.target.value)}>
                    <option value="">-- Choose Destination --</option>
                    {aggregatorWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                    {aggregatorWarehouses.length === 0 && (
                      <option disabled>No aggregator hub found. Please register one first!</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Commodity Lot(s)</label>
                  <select className="form-select" value={selectedLotId} onChange={handleSelectLot}>
                    <option value="">-- Choose Stock Lot --</option>
                    {availableLots.map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.id} — {lot.commodity} ({lot.quantity.toLocaleString()} kg)
                      </option>
                    ))}
                    {availableLots.length === 0 && (
                      <option disabled>No available stock found. Deposit lots first!</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Quantity (kg)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Agri Fleet Vehicle Registration</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={vehicleReg} 
                    onChange={(e) => setVehicleReg(e.target.value)} 
                    placeholder="Auto-assign via Agri Fleet"
                  />
                </div>
              </div>

              <div className="form-footer" style={{ padding: '16px 20px', background: '#fff' }}>
                <button type="submit" className="btn btn-primary" style={{ background: '#1E4D36', borderColor: '#1E4D36' }}>
                  Create Transfer + Assign Vehicle
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Right/Main Column: Transfer History */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">{isBuyer ? 'Consolidated Goods Receipt Note (GRN) Ledger' : 'Transfer History'}</div>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>{isBuyer ? 'GRN Ref ID' : 'Transfer ID'}</th>
                  <th>Origin FPO</th>
                  <th>Destination Hub</th>
                  <th>Commodity</th>
                  <th>Dispatched</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(tr => {
                  const isSelected = activeTransferId === tr.id;
                  
                  return (
                    <tr 
                      key={tr.id}
                      onClick={() => {
                        setActiveTransferId(tr.id);
                        setInspectorNotes(tr.notes || '');
                      }}
                      style={{
                        background: isSelected ? 'var(--surface2)' : '',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                        <strong>{formatTrfId(tr.trf_code)}</strong>
                      </td>
                      <td>{getWarehouseName(tr.source_warehouse_id)}</td>
                      <td>{getWarehouseName(tr.destination_warehouse_id)}</td>
                      <td>
                        <strong>{tr.trf_code}</strong><br/>
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{tr.quantity_kg.toLocaleString()} kg</span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text2)' }}>
                        {tr.dispatch_date ? new Date(tr.dispatch_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                      </td>
                      <td>
                        <span className={`badge ${tr.status === 'GRN Done' ? 'badge-green' : 'badge-amber'}`}>
                          {tr.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {transfers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>
                      No stock transfers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Bottom Panel: GRN Reconciliation Card */}
      {activeTransfer && (
        <div className="card" style={{ marginTop: '10px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-title">GRN Verification — {activeTransfer.trf_code}</div>
              <div className="section-sub" style={{ marginTop: '4px' }}>
                Receiving Center · {getWarehouseName(activeTransfer.destination_warehouse_id)}
              </div>
            </div>
            {activeTransfer.status === 'GRN Done' ? (
              <span style={{ color: 'var(--green)', fontWeight: '600', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px' }}>•</span> Reconciled
              </span>
            ) : (
              <span style={{ color: 'var(--amber)', fontWeight: '600', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px' }}>•</span> Arrived / Pending Verification
              </span>
            )}
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Dispatched Quantity</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={`${activeTransfer.quantity_kg.toLocaleString()} kg`} 
                  disabled 
                  readOnly 
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text2)', fontWeight: '500' }}>
                  ℹ️ Received weight is automatically matched to the dispatched weight (no variance).
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">GRN Inspector Notes</label>
              <textarea 
                className="form-textarea" 
                placeholder="Write observations (e.g. quality check comments, gate receipt confirmation)..."
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                disabled={activeTransfer.status === 'GRN Done'}
              />
            </div>

            {activeTransfer.status !== 'GRN Done' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ background: '#1E4D36', borderColor: '#1E4D36' }}
                  onClick={handleApproveGRN}
                >
                  Approve GRN & Reconcile
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text3)', fontWeight: '500' }}>
                Reconciliation finalized and closed. Ledger updated.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

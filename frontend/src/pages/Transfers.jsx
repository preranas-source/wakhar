import { useState } from 'react';

export default function Transfers({ intakes = [], onAddActivity, role }) {
  // 1. Seed transfers matching the screenshot
  const [transfers, setTransfers] = useState([
    { 
      id: 'TRF-2026-018', 
      fromFpo: 'Wai FPO', 
      commodity: 'Soybean', 
      quantity: 2400, 
      dispatchedDate: '7 Jun 2026', 
      status: 'GRN Pending', 
      variance: -12, 
      receivedQty: 2388, 
      arrivalTime: 'Arrived 8 Jun 2026, 09:14 AM', 
      varianceReason: 'Transit moisture loss', 
      notes: 'Observations at destination..' 
    },
    { 
      id: 'TRF-2026-017', 
      fromFpo: 'Phaltan FPO', 
      commodity: 'Wheat', 
      quantity: 5000, 
      dispatchedDate: '3 Jun 2026', 
      status: 'GRN Done', 
      variance: 0, 
      receivedQty: 5000, 
      arrivalTime: 'Arrived 4 Jun 2026, 11:30 AM', 
      varianceReason: '', 
      notes: 'Reconciled successfully.' 
    },
    { 
      id: 'TRF-2026-014', 
      fromFpo: 'Baramati FPO', 
      commodity: 'Groundnut', 
      quantity: 3200, 
      dispatchedDate: '25 May 2026', 
      status: 'GRN Done', 
      variance: -8, 
      receivedQty: 3192, 
      arrivalTime: 'Arrived 26 May 2026, 10:45 AM', 
      varianceReason: 'Transit moisture loss', 
      notes: 'Minor shrinkage.' 
    }
  ]);

  const [activeTransferId, setActiveTransferId] = useState('TRF-2026-018');

  // Initiate Transfer Form States
  const [sourceFpo, setSourceFpo] = useState('Wai FPO Warehouse');
  const [destAggregator, setDestAggregator] = useState('Satara MahaFPC Aggregator');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [transferQty, setTransferQty] = useState('0');
  const [vehicleNo, setVehicleNo] = useState('MH-11-AB-4421 (Auto-assign via Fleetbase)');
  const [expectedDate, setExpectedDate] = useState('2026-06-10');

  // GRN Reconciliation Form States
  const [receivedQtyInput, setReceivedQtyInput] = useState('2388');
  const [varianceReason, setVarianceReason] = useState('Transit moisture loss');
  const [inspectorNotes, setInspectorNotes] = useState('Observations at destination..');

  const availableLots = intakes.filter(lot => lot.status === 'Available');

  // Sync reconciliation fields when active transfer changes
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

  const handleCreateTransfer = (e) => {
    e.preventDefault();
    if (!selectedLotId) {
      alert('Please select a commodity lot to transfer.');
      return;
    }
    const lot = intakes.find(l => l.id === selectedLotId);
    if (!lot) return;

    const qtyKg = Number(transferQty);
    if (qtyKg <= 0 || qtyKg > lot.quantity) {
      alert(`Invalid quantity. Must be between 1 and ${lot.quantity} kg.`);
      return;
    }

    const nextIdNum = 19 + (transfers.length - 3);
    const newTrfId = `TRF-2026-0${nextIdNum < 10 ? '0' + nextIdNum : nextIdNum}`;

    const newTransfer = {
      id: newTrfId,
      fromFpo: lot.warehouse,
      commodity: lot.commodity,
      quantity: qtyKg,
      dispatchedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'GRN Pending',
      variance: 0,
      receivedQty: qtyKg,
      arrivalTime: 'In Transit',
      varianceReason: '',
      notes: ''
    };

    setTransfers(prev => [newTransfer, ...prev]);
    setActiveTransferId(newTrfId);
    setSelectedLotId('');
    setTransferQty('0');
    setReceivedQtyInput(qtyKg.toString());
    setVarianceReason('');
    setInspectorNotes('');

    alert(`Transfer ${newTrfId} initiated successfully. Outbound logistics pass dispatched to vehicle ${vehicleNo}.`);

    if (onAddActivity) {
      onAddActivity('dispatch', `FPO Transfer <strong>${newTrfId}</strong> created: ${qtyKg} kg ${lot.commodity} dispatched from ${lot.warehouse} to ${destAggregator} via vehicle ${vehicleNo}.`);
    }
  };

  const handleApproveGRN = () => {
    if (!activeTransfer) return;

    const recQty = Number(receivedQtyInput);
    const diff = recQty - activeTransfer.quantity;

    setTransfers(prev => prev.map(t => {
      if (t.id === activeTransferId) {
        return {
          ...t,
          status: 'GRN Done',
          receivedQty: recQty,
          variance: diff,
          varianceReason: diff === 0 ? '' : varianceReason,
          notes: inspectorNotes
        };
      }
      return t;
    }));

    alert(`GRN approved and reconciled for ${activeTransfer.id}! Status updated to GRN Done.`);

    if (onAddActivity) {
      onAddActivity('qc', `Reconciliation — Approved GRN for Transfer <strong>${activeTransfer.id}</strong>. Received: ${recQty} kg (Variance: ${diff} kg). Reason: ${diff === 0 ? 'None' : varianceReason}.`);
    }
  };

  const handleEscalateVariance = () => {
    if (!activeTransfer) return;
    alert(`Variance for Transfer ${activeTransfer.id} has been escalated to aggregate auditor gateway for verification!`);
    if (onAddActivity) {
      onAddActivity('qc', `Audit Escalate — Escalated variance of ${activeTransfer.variance} kg on Transfer <strong>${activeTransfer.id}</strong> for supervisor review.`);
    }
  };

  const handleRowClick = (tr) => {
    setActiveTransferId(tr.id);
    setReceivedQtyInput(tr.receivedQty.toString());
    setVarianceReason(tr.varianceReason || 'Transit moisture loss');
    setInspectorNotes(tr.notes || '');
  };

  // Calculate dynamic variance % for active item
  const currentVarianceVal = activeTransfer ? Number(receivedQtyInput) - activeTransfer.quantity : 0;
  const currentVariancePct = activeTransfer && activeTransfer.quantity > 0
    ? ((currentVarianceVal / activeTransfer.quantity) * 100).toFixed(1)
    : '0.0';

  // Check if there is any pending variance to display warning at the top
  const pendingVarianceTrf = transfers.find(t => t.status === 'GRN Pending' && t.variance !== 0);

  const formatTrfId = (id) => {
    const parts = id.split('-');
    if (parts.length === 3) {
      return (
        <>
          {parts[0]}-<br/>
          {parts[1]}-{parts[2]}
        </>
      );
    }
    return id;
  };

  const isBuyer = role === 'market_partner';

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
        
        {!isBuyer && (
          <button 
            className="btn btn-primary" 
            style={{ background: '#1E4D36', borderColor: '#1E4D36' }}
            onClick={() => alert('Inter-Warehouse transfer batch mode initialized.')}
          >
            + New Transfer
          </button>
        )}
      </div>

      {/* Warning Alert Banner */}
      {pendingVarianceTrf && (
        <div 
          className="alert alert-warning" 
          style={{ marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
          onClick={() => handleRowClick(pendingVarianceTrf)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ flex: 1, fontSize: '12.5px' }}>
            <strong>Transfer {pendingVarianceTrf.id}</strong> arrived at warehouse hub — GRN pending. Variance: {pendingVarianceTrf.variance} kg. <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Review & Approve</span>
          </div>
        </div>
      )}

      {/* Two-Column split grid */}
      <div className={isBuyer ? '' : 'transfers-split-layout'} style={{ display: 'grid', gridTemplateColumns: isBuyer ? '1fr' : '1fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Initiate FPO Transfer (Hidden for Buyers, replaced with instructions card if Buyer) */}
        {!isBuyer ? (
          <div className="card">
            <div className="card-header">
              <div className="section-title">Initiate FPO Transfer</div>
            </div>
            <form onSubmit={handleCreateTransfer}>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Source FPO Warehouse</label>
                  <select className="form-select" value={sourceFpo} onChange={(e) => setSourceFpo(e.target.value)}>
                    <option value="Wai FPO Warehouse">Wai FPO Warehouse</option>
                    <option value="Phaltan FPO Warehouse">Phaltan FPO Warehouse</option>
                    <option value="Baramati FPO Warehouse">Baramati FPO Warehouse</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Aggregator</label>
                  <select className="form-select" value={destAggregator} onChange={(e) => setDestAggregator(e.target.value)}>
                    <option value="Satara MahaFPC Aggregator">Satara MahaFPC Aggregator</option>
                    <option value="Pune Central Aggregator Hub">Pune Central Aggregator Hub</option>
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

                <div className="form-group">
                  <label className="form-label">Fleetbase Vehicle</label>
                  <select className="form-select" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)}>
                    <option value="MH-11-AB-4421 (Auto-assign via Fleetbase)">MH-11-AB-4421 (Auto-assign)</option>
                    <option value="MH-12-PQ-9080 (Manual Dispatch)">MH-12-PQ-9080 (Manual)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Dispatch Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-footer" style={{ padding: '16px 20px', background: '#fff' }}>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  style={{ background: '#fff' }}
                  onClick={() => alert('Draft saved successfully.')}
                >
                  Save Draft
                </button>
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
            {isBuyer && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  // Simulate creating a new manual GRN
                  const newGrnId = `TRF-2026-0${19 + transfers.length - 3}`;
                  const newGrn = {
                    id: newGrnId,
                    fromFpo: 'Phaltan FPO',
                    commodity: 'Wheat',
                    quantity: 4000,
                    dispatchedDate: 'Today',
                    status: 'GRN Pending',
                    variance: 0,
                    receivedQty: 4000,
                    arrivalTime: 'Arrived Just Now',
                    varianceReason: '',
                    notes: ''
                  };
                  setTransfers(prev => [newGrn, ...prev]);
                  setActiveTransferId(newGrnId);
                  setReceivedQtyInput('4000');
                  alert(`Manually created new pending GRN note entry: ${newGrnId}`);
                }}
              >
                + Create Goods Receipt Note
              </button>
            )}
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>{isBuyer ? 'GRN Ref ID' : 'Transfer ID'}</th>
                  <th>Origin FPO</th>
                  <th>Commodity</th>
                  <th>Dispatched</th>
                  <th>Status</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(tr => {
                  const isSelected = activeTransferId === tr.id;
                  
                  return (
                    <tr 
                      key={tr.id}
                      onClick={() => handleRowClick(tr)}
                      style={{
                        background: isSelected ? 'var(--surface2)' : '',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                        <strong>{formatTrfId(tr.id)}</strong>
                      </td>
                      <td>{tr.fromFpo}</td>
                      <td>
                        <strong>{tr.commodity}</strong><br/>
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{tr.quantity.toLocaleString()} kg</span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text2)' }}>
                        {tr.dispatchedDate}
                      </td>
                      <td>
                        <span className={`badge ${tr.status === 'GRN Done' ? 'badge-green' : 'badge-amber'}`}>
                          {tr.status === 'GRN Pending' ? 'GRN Pending' : 'GRN Done'}
                        </span>
                      </td>
                      <td style={{ 
                        fontWeight: '600', 
                        color: tr.variance < 0 ? 'var(--red)' : (tr.variance > 0 ? 'var(--green)' : 'var(--text)') 
                      }}>
                        {tr.variance === 0 ? '0 kg' : `${tr.variance} kg`}
                      </td>
                    </tr>
                  );
                })}
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
              <div className="section-title">GRN Verification & Verification — {activeTransfer.id}</div>
              <div className="section-sub" style={{ marginTop: '4px' }}>
                Receiving Center · {activeTransfer.arrivalTime}
              </div>
            </div>
            {currentVarianceVal !== 0 ? (
              <span style={{ color: 'var(--amber)', fontWeight: '600', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px' }}>•</span> Variance Flagged
              </span>
            ) : (
              <span style={{ color: 'var(--green)', fontWeight: '600', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px' }}>•</span> Reconciled
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
                  value={`${activeTransfer.quantity.toLocaleString()} kg`} 
                  disabled 
                  readOnly 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Received Quantity (Weigh Bridge)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={receivedQtyInput} 
                  onChange={(e) => setReceivedQtyInput(e.target.value)}
                  disabled={activeTransfer.status === 'GRN Done'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Variance</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={`${currentVarianceVal} kg (${currentVariancePct}%)`} 
                  disabled 
                  readOnly 
                  style={{
                    color: currentVarianceVal < 0 ? 'var(--red)' : (currentVarianceVal > 0 ? 'var(--green)' : 'var(--text)'),
                    background: currentVarianceVal !== 0 ? 'var(--amber-light)' : 'var(--surface2)',
                    fontWeight: '600'
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Variance Reason</label>
                <select 
                  className="form-select" 
                  value={varianceReason} 
                  onChange={(e) => setVarianceReason(e.target.value)}
                  disabled={activeTransfer.status === 'GRN Done'}
                >
                  <option value="Transit moisture loss">Transit moisture loss</option>
                  <option value="Weighbridge calibration variance">Weighbridge calibration variance</option>
                  <option value="Pilferage / Spillage in-transit">Pilferage / Spillage in-transit</option>
                  <option value="Quality rejection (impurities)">Quality rejection (impurities)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">GRN Inspector Notes</label>
              <textarea 
                className="form-textarea" 
                placeholder="Write observations (e.g. moisture check results, shrinkage comments)..."
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                disabled={activeTransfer.status === 'GRN Done'}
              />
            </div>

            {activeTransfer.status === 'GRN Pending' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ borderColor: 'var(--red)', color: 'var(--red)', background: '#fff' }}
                  onClick={handleEscalateVariance}
                >
                  Escalate Variance
                </button>
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

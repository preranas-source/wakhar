import { useState } from 'react';

export default function Receipts({ receipts, intakes = [], onApplyCollateral, searchQuery }) {
  const [filterTab, setFilterTab] = useState('Active');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Pledge Modal State
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [targetReceipt, setTargetReceipt] = useState(null);
  const [pledgeBank, setPledgeBank] = useState('NABARD');
  const [pledgeAmount, setPledgeAmount] = useState(0);

  const handleOpenPledge = (receipt) => {
    setTargetReceipt(receipt);
    setPledgeAmount(Math.round(receipt.value * 0.7)); // Default to 70% limit
    setIsPledgeModalOpen(true);
  };

  const handleApplyPledge = (e) => {
    e.preventDefault();
    if (!targetReceipt) return;

    onApplyCollateral(targetReceipt.id, pledgeBank, pledgeAmount);
    setIsPledgeModalOpen(false);
    setTargetReceipt(null);
  };

  // Status calculation helper
  const getReceiptStatus = (wr) => {
    if (wr.collateralStatus === 'Disbursed' || wr.collateralStatus === 'Applied') {
      return 'Collateral';
    }
    const lot = intakes.find(l => l.id === wr.lotId);
    if (lot && lot.status === 'Reserved') {
      return 'Reserved';
    }
    return 'Active';
  };

  // Filter logic
  const filteredReceipts = receipts.filter(wr => {
    // 1. Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesQuery = 
        wr.id.toLowerCase().includes(query) ||
        wr.farmerName.toLowerCase().includes(query) ||
        wr.commodity.toLowerCase().includes(query);
      if (!matchesQuery) return false;
    }

    // 2. Tab filter
    const status = getReceiptStatus(wr);
    if (filterTab === 'Active') {
      return status === 'Active' || status === 'Reserved';
    } else if (filterTab === 'Collateral') {
      return status === 'Collateral';
    } else if (filterTab === 'Redeemed') {
      return status === 'Redeemed';
    }
    return true;
  });

  const activeReceipt = selectedReceipt || filteredReceipts[0] || null;

  const formatWRId = (id) => {
    const parts = id.split('-');
    if (parts.length === 3) {
      return (
        <>
          {parts[0]}-<br />
          {parts[1]}-<br />
          {parts[2]}
        </>
      );
    }
    return id;
  };

  return (
    <div className="page active" id="page-receipts" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title block */}
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>Warehouse Receipts</div>
        <div style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '6px' }}>
          eNAM-compatible · Usable as loan collateral
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filterTab === 'Active' ? 'active' : ''}`}
          onClick={() => {
            setFilterTab('Active');
            setSelectedReceipt(null); // Reset detail selected receipt
          }}
        >
          Active
        </button>
        <button 
          className={`filter-tab ${filterTab === 'Collateral' ? 'active' : ''}`}
          onClick={() => {
            setFilterTab('Collateral');
            setSelectedReceipt(null);
          }}
        >
          Collateral
        </button>
        <button 
          className={`filter-tab ${filterTab === 'Redeemed' ? 'active' : ''}`}
          onClick={() => {
            setFilterTab('Redeemed');
            setSelectedReceipt(null);
          }}
        >
          Redeemed
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="receipts-layout">
        {/* Left Column: Receipts Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>WR ID</th>
                  <th>Farmer</th>
                  <th>Commodity</th>
                  <th>Qty</th>
                  <th>Grade</th>
                  <th>Validity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                      No receipts found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(wr => {
                    const isSelected = activeReceipt && activeReceipt.id === wr.id;
                    const status = getReceiptStatus(wr);
                    
                    return (
                      <tr 
                        key={wr.id}
                        onClick={() => setSelectedReceipt(wr)}
                        style={{
                          background: isSelected ? 'var(--surface2)' : '',
                          cursor: 'pointer'
                        }}
                      >
                        <td style={{ whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                          <strong>{formatWRId(wr.id)}</strong>
                        </td>
                        <td>{wr.farmerName}</td>
                        <td>{wr.commodity}</td>
                        <td style={{ fontWeight: '500' }}>
                          {wr.quantity.toLocaleString()} kg
                        </td>
                        <td>
                          <span className={`badge ${wr.grade === 'Grade A' ? 'badge-green' : 'badge-amber'}`}>
                            {wr.grade === 'Grade A' ? 'A' : (wr.grade === 'Grade B' ? 'B' : wr.grade)}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text2)' }}>
                          {wr.validity || '30 Aug 2026'}
                        </td>
                        <td>
                          <span className={`badge ${
                            status === 'Collateral' ? 'badge-purple' :
                            status === 'Reserved' ? 'badge-blue' :
                            'badge-blue'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Receipt Details Card */}
        {activeReceipt ? (
          <div className="receipt-details-card">
            {/* Header */}
            <div className="receipt-details-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.3px' }}>
                  {activeReceipt.id}
                </span>
                <svg style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.9)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 11 2 2 4-4"/>
                </svg>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '6px' }}>
                Issued: {activeReceipt.date} · Valid until {activeReceipt.validity || '30 Aug 2026'}
              </div>
            </div>

            {/* Grid details */}
            <div className="receipt-details-grid">
              <div className="receipt-detail-item">
                <label className="form-label">Farmer</label>
                <div className="receipt-detail-val">{activeReceipt.farmerName}</div>
              </div>
              <div className="receipt-detail-item">
                <label className="form-label">Farmer ID</label>
                <div className="receipt-detail-val">{activeReceipt.farmerId}</div>
              </div>
              <div className="receipt-detail-item" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Commodity</label>
                <div className="receipt-detail-val">
                  {activeReceipt.commodity} · {activeReceipt.variety || 'Basmati'}
                </div>
              </div>
              <div className="receipt-detail-item" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Quantity</label>
                <div className="receipt-detail-val">
                  {activeReceipt.quantity.toLocaleString()} kg · {activeReceipt.bags} bags
                </div>
              </div>
              <div className="receipt-detail-item">
                <label className="form-label">Moisture</label>
                <div className="receipt-detail-val">{activeReceipt.moisture}%</div>
              </div>
              <div className="receipt-detail-item" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Warehouse</label>
                <div className="receipt-detail-val">
                  {activeReceipt.warehouse} · {activeReceipt.zone || 'Zone A-3'}
                </div>
              </div>
            </div>

            {/* Large Grade Character Display */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 20px', marginTop: '-20px' }}>
              <span style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: '64px', 
                fontWeight: 'bold', 
                color: activeReceipt.grade === 'Grade A' ? 'var(--green)' : (activeReceipt.grade === 'Grade B' ? 'var(--amber)' : 'var(--red)'),
                lineHeight: '1',
                opacity: '0.85'
              }}>
                {activeReceipt.grade === 'Grade A' ? 'A' : (activeReceipt.grade === 'Grade B' ? 'B' : 'C')}
              </span>
            </div>

            {/* Separator */}
            <div style={{ borderTop: '1px dashed var(--border)', margin: '0 20px' }} />

            {/* Footer Buttons */}
            <div className="receipt-details-footer">
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, background: '#fff' }}
                onClick={() => alert(`Downloading quality certificate PDF for Receipt ${activeReceipt.id}...`)}
              >
                📥 Download PDF
              </button>
              {activeReceipt.collateralStatus === 'None' ? (
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--green)', borderColor: 'var(--green)' }}
                  onClick={() => handleOpenPledge(activeReceipt)}
                >
                  Mark Collateral
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--purple)', borderColor: 'var(--purple)' }}
                  disabled
                >
                  Pledged
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
            Select a receipt from the table to view details.
          </div>
        )}
      </div>

      {/* Pledge Loan Application Modal */}
      {isPledgeModalOpen && targetReceipt && (
        <div className="modal-overlay" onClick={() => setIsPledgeModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">Apply for Collateral Pledge Loan</div>
              <button className="modal-close" onClick={() => setIsPledgeModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleApplyPledge}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>e-WR Reference:</strong> {targetReceipt.id}<br/>
                  <strong>Asset Value:</strong> ₹{targetReceipt.value.toLocaleString()}<br/>
                  <strong>Max Loan Eligibility (70%):</strong> ₹{Math.round(targetReceipt.value * 0.7).toLocaleString()}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Partner Lender Bank</label>
                  <select 
                    className="form-select" 
                    value={pledgeBank}
                    onChange={(e) => setPledgeBank(e.target.value)}
                  >
                    <option value="NABARD">NABARD Co-operative Bank (7.2% APR)</option>
                    <option value="State Bank of India">State Bank of India (7.8% APR)</option>
                    <option value="HDFC Bank">HDFC Agri Finance (8.5% APR)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Requested Loan Amount (₹)</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    max={Math.round(targetReceipt.value * 0.7)}
                    value={pledgeAmount}
                    onChange={(e) => setPledgeAmount(Number(e.target.value))}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    Loan is disbursed directly to the farmer's linked bank account.
                  </span>
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsPledgeModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Lien Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

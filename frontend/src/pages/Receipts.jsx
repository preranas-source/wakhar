import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Receipts({ receipts, intakes = [], onApplyCollateral, searchQuery, role, currentFarmerCode }) {
  const [filterTab, setFilterTab] = useState('Active');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Pledge Modal State
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [targetReceipt, setTargetReceipt] = useState(null);
  const [pledgeBank, setPledgeBank] = useState('NABARD');
  const [pledgeAmount, setPledgeAmount] = useState(0);

  // View Receipt Certificate Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

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
    // 1. Role-based scoping: Farmer only sees their own receipts
    if (role === 'farmer' && wr.farmerId !== currentFarmerCode) {
      return false;
    }

    // 2. Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesQuery = 
        wr.id.toLowerCase().includes(query) ||
        wr.farmerName.toLowerCase().includes(query) ||
        wr.commodity.toLowerCase().includes(query);
      if (!matchesQuery) return false;
    }

    // 3. Tab filter
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

  const handleViewReceipt = (receipt) => {
    setViewingReceipt(receipt);
    setIsViewModalOpen(true);
  };

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
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
          {role === 'farmer' ? 'My Warehouse Receipts' : 'Warehouse Receipts'}
        </div>
        <div style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '6px' }}>
          eNAM-compatible Negotiable Electronic Warehouse Receipts (e-WR)
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filterTab === 'Active' ? 'active' : ''}`}
          onClick={() => {
            setFilterTab('Active');
            setSelectedReceipt(null);
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
          Pledged / Collateral
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
                  <th>Actions</th>
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
                          <button 
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#fff' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReceipt(wr);
                            }}
                          >
                            🔍 View
                          </button>
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
                onClick={() => handleViewReceipt(activeReceipt)}
              >
                🔍 View Certificate
              </button>
              {activeReceipt.collateralStatus === 'None' ? (
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--green)', borderColor: 'var(--green)' }}
                  onClick={() => handleOpenPledge(activeReceipt)}
                >
                  Apply Pledge Loan
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--purple)', borderColor: 'var(--purple)', color: '#fff' }}
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

      {/* 1. View Electronic Certificate Modal (View Receipt Modal) */}
      {isViewModalOpen && viewingReceipt && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div 
            className="modal-container" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '580px', 
              background: '#FFFDF9', 
              border: '3px double #C4B293', 
              padding: '30px',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
            }}
          >
            {/* Header / Watermark Border */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #8C7853', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', fontWeight: 'bold', color: '#8C7853', textTransform: 'uppercase' }}>
                Government of Maharashtra · Department of Agriculture
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'var(--green)', marginTop: '4px' }}>
                WAKHAR WAREHOUSING CORPORATION
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic', marginTop: '2px' }}>
                Negotiable Electronic Warehouse Receipt (e-WR)
              </div>
            </div>

            {/* Certificate Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: '#1C1A14' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E5DCC6', paddingBottom: '8px' }}>
                <span><strong>Receipt Number (WR ID):</strong></span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14.5px', color: 'var(--blue)' }}>{viewingReceipt.id}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Farmer Name</span>
                  <div style={{ fontWeight: '600' }}>{viewingReceipt.farmerName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Farmer Registration ID</span>
                  <div style={{ fontWeight: '600' }}>{viewingReceipt.farmerId}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #EDE9E0', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Commodity Type</span>
                  <div style={{ fontWeight: '600' }}>{viewingReceipt.commodity} ({viewingReceipt.variety || 'Basmati'})</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>AGMARK Certified Grade</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--green)' }}>{viewingReceipt.grade}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #EDE9E0', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Total Net Weight</span>
                  <div style={{ fontWeight: '700' }}>{viewingReceipt.quantity.toLocaleString()} kg ({viewingReceipt.bags} standard bags)</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Measured Moisture Content</span>
                  <div style={{ fontWeight: '600' }}>{viewingReceipt.moisture}%</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #EDE9E0', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Issue Date</span>
                  <div style={{ fontWeight: '500' }}>{viewingReceipt.date}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Validity Expiry Date</span>
                  <div style={{ fontWeight: '500', color: 'var(--red)' }}>{viewingReceipt.validity || '30 Aug 2026'}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #EDE9E0', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Storage Center</span>
                <div style={{ fontWeight: '600' }}>{viewingReceipt.warehouse} (Zone / Bin: {viewingReceipt.zone || 'Zone A-3'})</div>
              </div>

              {/* QR and Signature Block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '2px solid #8C7853', paddingTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  {/* Mock QR Representation */}
                  <div style={{ width: '70px', height: '70px', background: '#e0e0e0', border: '1px solid #999', display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <div style={{ width: '16px', height: '16px', background: '#000' }}></div>
                      <div style={{ width: '16px', height: '16px', background: '#ccc' }}></div>
                      <div style={{ width: '16px', height: '16px', background: '#000' }}></div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <div style={{ width: '16px', height: '16px', background: '#ccc' }}></div>
                      <div style={{ width: '16px', height: '16px', background: '#000' }}></div>
                      <div style={{ width: '16px', height: '16px', background: '#ccc' }}></div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <div style={{ width: '16px', height: '16px', background: '#000' }}></div>
                      <div style={{ width: '16px', height: '16px', background: '#ccc' }}></div>
                      <div style={{ width: '16px', height: '16px', background: '#000' }}></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '4px', display: 'block' }}>e-WR Secure QR</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontFamily: 'cursive', color: '#2B2B2B', paddingBottom: '4px' }}>Rajesh Bhosale</div>
                  <div style={{ borderTop: '1px solid #5A5446', width: '180px', marginTop: '4px' }} />
                  <span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginTop: '4px' }}>Authorized Signatory (FPO)</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="form-footer" style={{ borderTop: '1px solid var(--border)', marginTop: '20px', padding: '16px 0 0', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => {
                  toast.success('Launching system print dialog...');
                  window.print();
                }}
              >
                🖨 Print Certificate
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => toast.success(`Simulating PDF compile for e-WR: ${viewingReceipt.id}... PDF file downloaded successfully.`)}
              >
                📥 Download PDF
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

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

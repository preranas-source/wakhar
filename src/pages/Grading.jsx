import { useState } from 'react';

export default function Grading({ 
  intakes = [], 
  onUpdateGrade, 
  searchQuery, 
  onAddActivity 
}) {
  // 1. Highlight states for active panels
  const [selectedRejectedLotId, setSelectedRejectedLotId] = useState('LOT-2026-087');
  const [selectedCertifiedLotId, setSelectedCertifiedLotId] = useState('LOT-2026-091');

  // 2. Reject / Return Form State
  const [rejectionReason, setRejectionReason] = useState('Moisture above threshold');
  const [farmerNotification, setFarmerNotification] = useState('Send SMS + WhatsApp');
  const [returnAction, setReturnAction] = useState('Return to farmer');
  const [returnDate, setReturnDate] = useState('2026-06-12');
  const [inspectorNotes, setInspectorNotes] = useState(
    'Moisture content 21.5% significantly exceeds acceptable limit of 14%. Produce requires mechanical drying before resubmission.'
  );

  // 3. New QC Record Wizard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLotId, setNewLotId] = useState('');
  const [newMoisture, setNewMoisture] = useState('13.5');
  const [newForeignMatter, setNewForeignMatter] = useState('0.8');
  const [newBrokenGrains, setNewBrokenGrains] = useState('1.5');
  const [newInspector, setNewInspector] = useState('FPO Staff');

  // Enrich intake lot database with mock visual parameters matching the mockup screenshots
  const getQualityParams = (lot) => {
    if (lot.id === 'LOT-2026-091') {
      return { fm: '0.8%', bg: '1.2%', inspector: 'Inspectorate Ltd.', date: '30 May', certStatus: 'Download' };
    }
    if (lot.id === 'LOT-2026-090') {
      return { fm: '1.0%', bg: '2.1%', inspector: 'FPO Staff', date: '30 May', certStatus: 'Download' };
    }
    if (lot.id === 'LOT-2026-089') {
      return { fm: '2.4%', bg: '4.5%', inspector: 'FPO Staff', date: '29 May', certStatus: 'Pending' };
    }
    if (lot.id === 'LOT-2026-087') {
      return { fm: '5.2%', bg: '8.0%', inspector: 'FPO Staff', date: '28 May', certStatus: 'N/A' };
    }

    // Default calculations for newly certified dynamic lots
    const isHighMoisture = lot.moisture > 14;
    return {
      fm: isHighMoisture ? '2.8%' : '0.6%',
      bg: isHighMoisture ? '4.8%' : '1.4%',
      inspector: 'FPO Staff',
      date: lot.date || 'Today',
      certStatus: lot.status === 'QC Pending' ? 'Pending' : (lot.grade === 'Rejected' ? 'N/A' : 'Download')
    };
  };

  // Find targeted lot details
  const rejectedLot = intakes.find(lot => lot.id === selectedRejectedLotId) || intakes.find(lot => lot.grade === 'Rejected');
  const certifiedLot = intakes.find(lot => lot.id === selectedCertifiedLotId) || intakes.find(lot => lot.grade === 'Grade A');

  const certifiedParams = certifiedLot ? getQualityParams(certifiedLot) : null;

  // Filter intakes list
  const filteredLots = intakes.filter(lot => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lot.id.toLowerCase().includes(query) ||
      lot.commodity.toLowerCase().includes(query) ||
      (lot.variety && lot.variety.toLowerCase().includes(query)) ||
      lot.grade.toLowerCase().includes(query)
    );
  });

  // Handle lot selection from table row click
  const handleLotSelect = (lot) => {
    if (lot.grade === 'Rejected') {
      setSelectedRejectedLotId(lot.id);
      setInspectorNotes(`Moisture content ${lot.moisture}% significantly exceeds acceptable limit of 14%. Produce requires drying before resubmission.`);
    } else {
      setSelectedCertifiedLotId(lot.id);
    }
  };

  // Submit new QC record form
  const handleCreateQCRecord = (e) => {
    e.preventDefault();
    if (!newLotId) {
      alert('Please select a pending lot to test.');
      return;
    }

    const targetLot = intakes.find(l => l.id === newLotId);
    if (!targetLot) return;

    const moistVal = Number(newMoisture);
    const fmVal = Number(newForeignMatter);

    // Dynamic grading algorithms
    let computedGrade = 'Grade A';
    let gradeClass = 'badge-green';
    let status = 'Available';

    if (moistVal > 20 || fmVal > 4.5) {
      computedGrade = 'Rejected';
      gradeClass = 'badge-red';
      status = 'Returned';
    } else if (moistVal > 14 || fmVal > 2.0) {
      computedGrade = 'Grade B';
      gradeClass = 'badge-amber';
      status = 'Available';
    }

    onUpdateGrade(newLotId, computedGrade, gradeClass, moistVal, status);
    
    // Select the newly graded lot
    if (computedGrade === 'Rejected') {
      setSelectedRejectedLotId(newLotId);
    } else {
      setSelectedCertifiedLotId(newLotId);
    }

    setIsModalOpen(false);

    alert(`Lab testing complete for Lot ${newLotId}! Grade Certified: "${computedGrade}".`);
    
    if (onAddActivity) {
      onAddActivity(
        'qc',
        `Lab Certification — Tested Lot <strong>${newLotId}</strong> (${targetLot.commodity}). Certified Grade: <strong>${computedGrade}</strong> (Moisture: ${moistVal}%, Foreign Matter: ${fmVal}%).`
      );
    }
  };

  const handleConfirmRejection = () => {
    if (!rejectedLot) return;
    alert(`Rejection note issued for Lot ${rejectedLot.id}! Scheduled for return to farmer on ${returnDate}.`);
    if (onAddActivity) {
      onAddActivity(
        'qc',
        `QC Workflow — Rejected Lot <strong>${rejectedLot.id}</strong> return confirmed. Action: ${returnAction}. Notification: ${farmerNotification}.`
      );
    }
  };

  const handleSendToEnam = () => {
    if (!certifiedLot) return;
    alert(`Quality Certificate for Lot ${certifiedLot.id} successfully synchronized with eNAM national marketing portal!`);
    if (onAddActivity) {
      onAddActivity(
        'market',
        `e-Market Linkage — Synchronized Quality Certificate for Lot <strong>${certifiedLot.id}</strong> (Moisture: ${certifiedLot.moisture}%) with eNAM.`
      );
    }
  };

  return (
    <div className="page active" id="page-grading" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* REJECT / RETURN WORKFLOW PANEL */}
      {rejectedLot && (
        <div className="card" style={{ border: '1px solid rgba(155, 35, 53, 0.2)' }}>
          <div className="card-header" style={{ background: 'var(--red-light)', borderBottom: '1px solid rgba(155, 35, 53, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: '600', color: 'var(--red)' }}>
                Reject / Return Workflow — {rejectedLot.id}
              </div>
              <span style={{ color: 'var(--red)', fontWeight: '600', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px' }}>•</span> Action Required
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>
              Moisture {rejectedLot.moisture}% exceeds threshold (14%) — Below AGMARK Grade C standard
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <select 
                  className="form-select"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                >
                  <option value="Moisture above threshold">Moisture above threshold</option>
                  <option value="Foreign matter exceeds limit">Foreign matter exceeds limit</option>
                  <option value="Infestation / Weevils detected">Infestation / Weevils detected</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Farmer Notification</label>
                <select 
                  className="form-select"
                  value={farmerNotification}
                  onChange={(e) => setFarmerNotification(e.target.value)}
                >
                  <option value="Send SMS + WhatsApp">Send SMS + WhatsApp</option>
                  <option value="SMS notification only">SMS notification only</option>
                  <option value="Direct phone call">Direct phone call</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Return Action</label>
                <select 
                  className="form-select"
                  value={returnAction}
                  onChange={(e) => setReturnAction(e.target.value)}
                >
                  <option value="Return to farmer">Return to farmer</option>
                  <option value="Dry storage and re-aeration">Dry storage and re-aeration</option>
                  <option value="Fumigation and re-test">Fumigation and re-test</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Return Scheduled Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={returnDate} 
                  onChange={(e) => setReturnDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Inspector Notes (Sent to Farmer)</label>
              <textarea 
                className="form-textarea"
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ background: '#fff' }}
                onClick={() => alert(`Draft inspection notes saved for Lot ${rejectedLot.id}.`)}
              >
                Save & Notify Farmer
              </button>
              <button className="btn btn-dark-red" onClick={handleConfirmRejection}>
                Confirm Rejection & Schedule Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUALITY CERTIFICATE PANEL */}
      {certifiedLot && certifiedParams && (
        <div className="card" style={{ border: '1px solid rgba(45, 106, 79, 0.2)' }}>
          <div className="card-header" style={{ background: 'var(--green-light)', borderBottom: '1px solid rgba(45, 106, 79, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: '600', color: 'var(--green)' }}>
              Quality Certificate — {certifiedLot.id} ({certifiedLot.grade})
            </div>
            <span style={{ color: 'var(--green)', fontWeight: '600', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '14px' }}>•</span> Eligible for Financing
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderBottom: '1px solid rgba(45,106,79,0.15)', paddingBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Commodity</label>
                <div className="qc-field-val">{certifiedLot.commodity} · {certifiedLot.variety || 'Basmati'}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Grade Awarded</label>
                <div className="qc-field-val green">
                  {certifiedLot.grade}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Standard</label>
                <div className="qc-field-val">AGMARK / eNAM</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '4px' }}>
              <div className="form-group">
                <label className="form-label">Moisture</label>
                <div className="qc-field-val-check">
                  <span>{certifiedLot.moisture}%</span>
                  <span className="check-icon-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Foreign Matter</label>
                <div className="qc-field-val-check">
                  <span>{certifiedParams.fm}</span>
                  <span className="check-icon-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Broken Grains</label>
                <div className="qc-field-val-check">
                  <span>{certifiedParams.bg}</span>
                  <span className="check-icon-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ background: '#fff' }}
                onClick={() => alert(`Simulating PDF generation for Quality Certificate ${certifiedLot.id}... Document download started.`)}
              >
                📄 Download Quality Certificate PDF
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ background: 'var(--green)', color: '#fff' }}
                onClick={() => alert(`Quality certificate for Lot ${certifiedLot.id} sent to depositor farmer via WhatsApp/SMS successfully.`)}
              >
                Send to Farmer (WhatsApp)
              </button>
              <button type="button" className="btn btn-outline" style={{ background: '#fff' }} onClick={handleSendToEnam}>
                Submit to eNAM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QC DATABASE SUMMARY TABLE */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-title">QC Inspection Database</div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + New QC Record
          </button>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>Commodity</th>
                <th>Moisture %</th>
                <th>Foreign Matter %</th>
                <th>Broken Grains %</th>
                <th>Grade Awarded</th>
                <th>Inspected By</th>
                <th>Date</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map(lot => {
                const params = getQualityParams(lot);
                const isSelected = selectedRejectedLotId === lot.id || selectedCertifiedLotId === lot.id;
                
                // Color formatting for moisture thresholds
                let moistureColor = 'var(--text)';
                if (lot.moisture > 20) moistureColor = 'var(--red)';
                else if (lot.moisture > 14) moistureColor = 'var(--amber)';
                else if (lot.moisture <= 14 && lot.status !== 'QC Pending') moistureColor = 'var(--green)';

                return (
                  <tr 
                    key={lot.id} 
                    onClick={() => handleLotSelect(lot)}
                    style={{
                      background: isSelected ? 'var(--surface2)' : '',
                      cursor: 'pointer'
                    }}
                  >
                    <td><strong>{lot.id}</strong></td>
                    <td>{lot.commodity} {lot.variety ? `· ${lot.variety}` : ''}</td>
                    <td style={{ fontWeight: '600', color: moistureColor }}>
                      {lot.moisture}%
                    </td>
                    <td>{params.fm}</td>
                    <td>{params.bg}</td>
                    <td>
                      <span className={`badge ${lot.gradeClass || 'badge-gray'}`}>
                        {lot.grade}
                      </span>
                    </td>
                    <td>{params.inspector}</td>
                    <td>{params.date}</td>
                    <td>
                      {params.certStatus === 'Download' ? (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '11px', background: '#fff', borderRadius: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Downloading quality certificate PDF for Lot ${lot.id}...`);
                          }}
                        >
                          📄 Download
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{params.certStatus}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW QC RECORD DIALOG MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div className="modal-title">New Quality Control Record</div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateQCRecord}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Select Pending Lot ID *</label>
                  <select 
                    className="form-select"
                    value={newLotId}
                    onChange={(e) => setNewLotId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Lot --</option>
                    {intakes.map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.id} — {lot.commodity} ({lot.quantity} kg, Status: {lot.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Moisture (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input"
                      value={newMoisture}
                      onChange={(e) => setNewMoisture(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Foreign Matter</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input"
                      value={newForeignMatter}
                      onChange={(e) => setNewForeignMatter(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Broken Grains</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input"
                      value={newBrokenGrains}
                      onChange={(e) => setNewBrokenGrains(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Inspector / Agency</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={newInspector}
                    onChange={(e) => setNewInspector(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Lab Test & Certify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

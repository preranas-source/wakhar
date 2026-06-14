import { useState, useEffect } from 'react';
import { getTranslation } from '@wakhar/shared';

export default function Intake({ 
  intakes, 
  onAddIntake, 
  farmersList = [], 
  language = 'en'
}) {
  const t = (key) => getTranslation(key, language);

  const [isWizard, setIsWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [filter, setFilter] = useState('All');
  
  // Intake Mode: 'walk-in' or 'pre-registered'
  const [intakeMode, setIntakeMode] = useState('walk-in');
  const [selectedBookingId, setSelectedBookingId] = useState('');

  // QR Scanner Modal Mockup State
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanningStatus, setQrScanningStatus] = useState('Position QR Code inside the camera guide...');

  // Wizard States
  const [selectedFarmer, setSelectedFarmer] = useState(farmersList[0] || {});
  const [warehouse, setWarehouse] = useState('Wai FPO Warehouse');
  const [commodity, setCommodity] = useState('Rice');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState(900);
  const [bags, setBags] = useState(18);
  const [moisture, setMoisture] = useState(12.4);
  const [zone, setZone] = useState('Zone A — Rack 3');
  const [remarks, setRemarks] = useState('');
  const [farmGPS, setFarmGPS] = useState('17.9123, 73.8421');

  // Seed mock bookings
  const mockBookings = [
    { id: 'BK-0081', farmerId: 'FM-00301', farmerName: 'Ramesh Jadhav', commodity: 'Soybean', variety: 'JS-335', quantity: 1200, bags: 24, gps: '17.9011, 73.8114' },
    { id: 'BK-0082', farmerId: 'FM-00389', farmerName: 'Anita Shinde', commodity: 'Wheat', variety: 'Lokwan', quantity: 1500, bags: 30, gps: '17.9810, 74.4120' },
    { id: 'BK-0083', farmerId: 'FM-00451', farmerName: 'Priya More', commodity: 'Onion', variety: 'Nasik Red', quantity: 800, bags: 40, gps: '18.1502, 74.5690' }
  ];

  // Auto fill booking details
  useEffect(() => {
    if (intakeMode === 'pre-registered' && selectedBookingId) {
      const bk = mockBookings.find(b => b.id === selectedBookingId);
      if (bk) {
        const farmerObj = farmersList.find(f => f.id === bk.farmerId) || { id: bk.farmerId, name: bk.farmerName };
        setSelectedFarmer(farmerObj);
        setCommodity(bk.commodity);
        setVariety(bk.variety);
        setQuantity(bk.quantity);
        setBags(bk.bags);
        setFarmGPS(bk.gps);
      }
    }
  }, [intakeMode, selectedBookingId]);

  // Auto Quality compute
  const getAutoGrade = () => {
    const moist = Number(moisture);
    if (moist > 20) return { name: 'Rejected', class: 'badge-red', status: 'Returned' };
    if (moist > 14) return { name: 'Grade B', class: 'badge-amber', status: 'QC Pending' };
    return { name: 'Grade A', class: 'badge-green', status: 'Available' };
  };

  const handleStartWizard = () => {
    setIsWizard(true);
    setWizardStep(1);
    setIntakeMode('walk-in');
    setSelectedBookingId('');
    setSelectedFarmer(farmersList[0] || {});
    setCommodity('Rice');
    setVariety('');
    setQuantity(900);
    setBags(18);
    setMoisture(12.4);
    setFarmGPS('17.9123, 73.8421');
  };

  const handleCancelWizard = () => {
    setIsWizard(false);
    setWizardStep(1);
  };

  const handleNextStep = () => {
    if (wizardStep < 4) {
      setWizardStep(prev => prev + 1);
    } else {
      // Commit intake on step 4
      const autoGrade = getAutoGrade();
      const newLot = {
        id: `LOT-2026-0${100 + intakes.length}`,
        farmerId: selectedFarmer.id,
        farmerName: selectedFarmer.name,
        commodity: commodity,
        variety: variety || 'Common',
        quantity: Number(quantity),
        bags: Number(bags),
        moisture: Number(moisture),
        grade: autoGrade.name,
        gradeClass: autoGrade.class,
        warehouse: warehouse.replace(' Warehouse', ''),
        zone: zone,
        status: autoGrade.status,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        remarks: remarks,
        gps: farmGPS
      };
      
      onAddIntake(newLot);
      setIsWizard(false);
      setWizardStep(1);
    }
  };

  const handlePrevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(prev => prev - 1);
    }
  };

  // Simulate scanning QR Code
  const handleQrScanTrigger = () => {
    setIsQrScannerOpen(true);
    setQrScanningStatus('Accessing camera feed...');
    
    // Phase 1: Accessing camera
    setTimeout(() => {
      setQrScanningStatus('Camera active. Align farmer booking barcode or QR...');
    }, 1000);

    // Phase 2: Detecting QR Code
    setTimeout(() => {
      setQrScanningStatus('Detecting QR matrix. Hold still...');
    }, 2200);

    // Phase 3: Decrypting & Populating
    setTimeout(() => {
      // Pick a random mock booking
      const randomBk = mockBookings[Math.floor(Math.random() * mockBookings.length)];
      setIntakeMode('pre-registered');
      setSelectedBookingId(randomBk.id);
      
      // Auto-fill wizard parameters
      const farmerObj = farmersList.find(f => f.id === randomBk.farmerId) || { id: randomBk.farmerId, name: randomBk.farmerName, phone: '+91 94210 77889', aadhaar: '3210-6789-0123' };
      setSelectedFarmer(farmerObj);
      setCommodity(randomBk.commodity);
      setVariety(randomBk.variety);
      setQuantity(randomBk.quantity);
      setBags(randomBk.bags);
      setFarmGPS(randomBk.gps);

      setQrScanningStatus('Success! Decrypted booking data. Closing scanner...');
      
      // Auto beep & close
      setTimeout(() => {
        setIsQrScannerOpen(false);
        setWizardStep(2); // Jump directly to step 2 after scan success
      }, 800);
    }, 3800);
  };

  // Filtered Intakes
  const filteredIntakes = intakes.filter(lot => {
    if (filter === 'All') return true;
    if (filter === 'Today') return lot.date.includes('Jun') || lot.date.includes('30 May') || lot.date.includes('Today');
    if (filter === 'Pending WR') return lot.status === 'QC Pending';
    if (filter === 'Rejected') return lot.status === 'Returned' || lot.grade === 'Rejected';
    return true;
  });

  return (
    <div className="page active" id="page-intake">
      {!isWizard ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div className="section-title" style={{ fontSize: '16px' }}>{t('Commodity Intake')}</div>
              <div className="section-sub">Record farmer deposits, perform moisture analysis, and issue receipts</div>
            </div>
            <button className="btn btn-primary" onClick={handleStartWizard} style={{ gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Intake
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', justifyContent: 'space-between' }}>
            <div className="filter-tabs">
              {['All', 'Today', 'Pending WR', 'Rejected'].map(t => (
                <button 
                  key={t} 
                  className={`filter-tab ${filter === t ? 'active' : ''}`}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>{t('Lot ID')}</th>
                    <th>{t('Farmer')}</th>
                    <th>{t('Commodity')} / {t('Variety')}</th>
                    <th>{t('Quantity')}</th>
                    <th>{t('Moisture')} %</th>
                    <th>{t('Grade')}</th>
                    <th>{t('Warehouse')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIntakes.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>
                        No intake lots found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredIntakes.map(lot => (
                      <tr key={lot.id}>
                        <td><strong>{lot.id}</strong></td>
                        <td>
                          {lot.farmerName}
                          <div className="td-secondary">{lot.farmerId}</div>
                        </td>
                        <td>
                          {t(lot.commodity)}
                          <div className="td-secondary">{lot.variety}</div>
                        </td>
                        <td>
                          {lot.quantity.toLocaleString()} kg
                          <div className="td-secondary">{lot.bags} bags</div>
                        </td>
                        <td>{lot.moisture}%</td>
                        <td>
                          <span className={`badge ${lot.gradeClass || 'badge-gray'}`}>{lot.grade}</span>
                        </td>
                        <td>
                          {lot.warehouse}
                          <div className="td-secondary">{lot.zone} {lot.gps && `· 📍 GPS: ${lot.gps}`}</div>
                        </td>
                        <td>
                          <span className={`badge ${
                            lot.status === 'Available' ? 'badge-teal' : 
                            lot.status === 'Reserved' ? 'badge-blue' : 
                            lot.status === 'Returned' ? 'badge-red' : 'badge-amber'
                          }`}>{t(lot.status)}</span>
                        </td>
                        <td>{lot.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // wizard layout
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button className="btn btn-ghost" onClick={handleCancelWizard} style={{ padding: '6px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <div className="section-title" style={{ fontSize: '16px' }}>New Commodity Intake Wizard</div>
              <div className="section-sub">Farmer Gate-In → Warehouse Allocation</div>
            </div>
          </div>

          <div className="steps">
            <div className={`step ${wizardStep > 1 ? 'done' : wizardStep === 1 ? 'active' : ''}`}>
              <div className="step-num">{wizardStep > 1 ? '✓' : '1'}</div>
              <span className="step-text">Farmer Details</span>
            </div>
            <div className={`step-line ${wizardStep > 1 ? 'done' : ''}`} />
            <div className={`step ${wizardStep > 2 ? 'done' : wizardStep === 2 ? 'active' : ''}`}>
              <div className="step-num">{wizardStep > 2 ? '✓' : '2'}</div>
              <span className="step-text">Commodity & Storage</span>
            </div>
            <div className={`step-line ${wizardStep > 2 ? 'done' : ''}`} />
            <div className={`step ${wizardStep > 3 ? 'done' : wizardStep === 3 ? 'active' : ''}`}>
              <div className="step-num">{wizardStep > 3 ? '✓' : '3'}</div>
              <span className="step-text">QC Parameters</span>
            </div>
            <div className={`step-line ${wizardStep > 3 ? 'done' : ''}`} />
            <div className={`step ${wizardStep === 4 ? 'active' : ''}`}>
              <div className="step-num">4</div>
              <span className="step-text">Warehouse Receipt</span>
            </div>
          </div>

          <div className="card">
            {wizardStep === 1 && (
              <>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="section-title">Select Farmer Profile</div>
                    <div className="section-sub">Step 1 of 4: Search and link depositor</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* QR Scan Button */}
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={handleQrScanTrigger}
                      style={{ padding: '6px 12px', fontSize: '12.5px', background: 'var(--surface)', borderColor: 'var(--green)', color: 'var(--green)', fontWeight: '600', gap: '5px' }}
                    >
                      📷 Scan Booking QR
                    </button>

                    {/* Intake Mode Switch */}
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', padding: '4px', borderRadius: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => setIntakeMode('walk-in')}
                        style={{ 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '12px', 
                          fontWeight: '500', 
                          cursor: 'pointer',
                          background: intakeMode === 'walk-in' ? '#fff' : 'transparent',
                          boxShadow: intakeMode === 'walk-in' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        Walk-In
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIntakeMode('pre-registered')}
                        style={{ 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '12px', 
                          fontWeight: '500', 
                          cursor: 'pointer',
                          background: intakeMode === 'pre-registered' ? '#fff' : 'transparent',
                          boxShadow: intakeMode === 'pre-registered' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        Pre-Registered Booking
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-grid" style={{ padding: '20px' }}>
                  {intakeMode === 'pre-registered' ? (
                    <div className="form-group full">
                      <label className="form-label">Active Booking References *</label>
                      <select 
                        className="form-select"
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Booking Ref --</option>
                        {mockBookings.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} : {b.farmerName} — {b.quantity} kg {b.commodity} ({b.variety})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group full">
                      <label className="form-label">Registered Farmer</label>
                      <select 
                        className="form-select"
                        value={selectedFarmer.id}
                        onChange={(e) => {
                          const farm = farmersList.find(f => f.id === e.target.value);
                          setSelectedFarmer(farm || {});
                        }}
                      >
                        {farmersList.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.id}) - {f.village}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" value={selectedFarmer.phone || ''} readOnly style={{ background: 'var(--surface2)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhaar Number</label>
                    <input className="form-input" value={selectedFarmer.aadhaar || 'XXXX-XXXX-XXXX'} readOnly style={{ background: 'var(--surface2)' }} />
                  </div>
                </div>
              </>
            )}

            {wizardStep === 2 && (
              <>
                <div className="card-header">
                  <div>
                    <div className="section-title">Commodity & Storage specs</div>
                    <div className="section-sub">Step 2 of 4: Input weight, source address & warehouse target</div>
                  </div>
                </div>
                <div className="form-grid" style={{ padding: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Target Warehouse</label>
                    <select className="form-select" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                      <option>Wai FPO Warehouse</option>
                      <option>Phaltan FPO Warehouse</option>
                      <option>Baramati FPO Warehouse</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Commodity Type</label>
                    <select className="form-select" value={commodity} onChange={(e) => setCommodity(e.target.value)} disabled={intakeMode === 'pre-registered'}>
                      <option value="Rice">Rice</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Soybean">Soybean</option>
                      <option value="Onion">Onion</option>
                      <option value="Groundnut">Groundnut</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Variety</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Basmati, Lokwan, JS-335" 
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      readOnly={intakeMode === 'pre-registered'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Quantity (kg)</label>
                    <input 
                      className="form-input" 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      readOnly={intakeMode === 'pre-registered'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bag Count</label>
                    <input 
                      className="form-input" 
                      type="number" 
                      value={bags}
                      onChange={(e) => setBags(Number(e.target.value))}
                      readOnly={intakeMode === 'pre-registered'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zone / Storage Rack</label>
                    <select className="form-select" value={zone} onChange={(e) => setZone(e.target.value)}>
                      <option>Zone A — Rack 3</option>
                      <option>Zone A — Rack 4</option>
                      <option>Zone B — Rack 1</option>
                      <option>Zone C — Rack 2</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Farm Source Geo-coordinates (GPS for tracking)</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. 17.9123, 73.8421" 
                      value={farmGPS}
                      onChange={(e) => setFarmGPS(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <div className="card-header">
                  <div>
                    <div className="section-title">Quality Assurance Lab Parameters</div>
                    <div className="section-sub">Step 3 of 4: Dry matter analysis and sensor checks</div>
                  </div>
                </div>
                <div className="form-grid" style={{ padding: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Moisture Content (%)</label>
                    <input 
                      className="form-input" 
                      type="number" 
                      step="0.1" 
                      value={moisture}
                      onChange={(e) => setMoisture(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Foreign Matter / Impurities (%)</label>
                    <input className="form-input" type="number" step="0.01" defaultValue="0.45" />
                  </div>
                  <div className="form-group full">
                    <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Auto Grading Computation Engine</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Computed Quality Grade:</span>
                        <span className={`badge ${getAutoGrade().class}`}>{getAutoGrade().name}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '8px' }}>
                        {Number(moisture) > 20 ? '⛔ Rejected: Moisture above critical threshold (20%). Returning to farmer.' :
                         Number(moisture) > 14 ? '⚠️ Grade B: Moisture above safe storage threshold (14%). Marked for re-drying.' :
                         '✅ Grade A: Excellent safe storage moisture levels.'}
                      </div>
                    </div>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Remarks / Inspection Notes</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Needs prompt aeration..." 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {wizardStep === 4 && (
              <>
                <div className="card-header">
                  <div>
                    <div className="section-title">Warehouse Receipt Generation</div>
                    <div className="section-sub">Step 4 of 4: Preview e-WR parameters before authorization</div>
                  </div>
                </div>
                <div style={{ padding: '24px' }}>
                  <div 
                    style={{ 
                      border: '2px dashed var(--border2)', 
                      borderRadius: '12px', 
                      background: 'var(--surface2)', 
                      padding: '20px',
                      maxWidth: '480px',
                      margin: '0 auto' 
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 'bold', color: 'var(--green)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>WAKHAR E-WR</span>
                      <span>PREVIEW</span>
                    </div>
                    <table style={{ marginTop: '10px', fontSize: '13px' }}>
                      <tbody>
                        <tr style={{ borderBottom: 'none' }}>
                          <td style={{ padding: '4px 0', fontWeight: '600', width: '140px' }}>Farmer:</td>
                          <td style={{ padding: '4px 0' }}>{selectedFarmer.name}</td>
                        </tr>
                        <tr style={{ borderBottom: 'none' }}>
                          <td style={{ padding: '4px 0', fontWeight: '600' }}>Commodity:</td>
                          <td style={{ padding: '4px 0' }}>{commodity} ({variety || 'Common'})</td>
                        </tr>
                        <tr style={{ borderBottom: 'none' }}>
                          <td style={{ padding: '4px 0', fontWeight: '600' }}>Weight / Bags:</td>
                          <td style={{ padding: '4px 0' }}>{quantity} kg / {bags} bags</td>
                        </tr>
                        <tr style={{ borderBottom: 'none' }}>
                          <td style={{ padding: '4px 0', fontWeight: '600' }}>Moisture / Grade:</td>
                          <td style={{ padding: '4px 0' }}>{moisture}% / {getAutoGrade().name}</td>
                        </tr>
                        <tr style={{ borderBottom: 'none' }}>
                          <td style={{ padding: '4px 0', fontWeight: '600' }}>GPS Origin:</td>
                          <td style={{ padding: '4px 0' }}>{farmGPS}</td>
                        </tr>
                        <tr style={{ borderBottom: 'none' }}>
                          <td style={{ padding: '4px 0', fontWeight: '600' }}>Est. Valuation:</td>
                          <td style={{ padding: '4px 0', fontWeight: '600', color: 'var(--amber)' }}>₹{(quantity * 22).toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="form-footer" style={{ padding: '16px 20px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={handlePrevStep} disabled={wizardStep === 1}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleNextStep}>
                {wizardStep === 4 ? 'Confirm & Generate e-WR' : 'Next Step'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2. QR SCANNER MOCKUP OVERLAY MODAL */}
      {isQrScannerOpen && (
        <div className="modal-overlay" onClick={() => setIsQrScannerOpen(false)}>
          <div 
            className="modal-container" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '440px', 
              background: '#1a1a1a', 
              color: '#fff', 
              textAlign: 'center', 
              padding: '24px', 
              borderRadius: '16px' 
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📷 QR Intake Scanner</span>
              <button onClick={() => setIsQrScannerOpen(false)} style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Scanning Guide Box */}
            <div 
              style={{ 
                width: '240px', 
                height: '240px', 
                margin: '20px auto', 
                border: '4px solid var(--green)', 
                borderRadius: '12px', 
                position: 'relative', 
                background: 'rgba(255,255,255,0.03)',
                boxShadow: '0 0 20px rgba(45,106,79,0.3)',
                overflow: 'hidden'
              }}
            >
              {/* Laser animation */}
              <div 
                style={{ 
                  position: 'absolute', 
                  width: '100%', 
                  height: '3px', 
                  background: '#2D6A4F', 
                  boxShadow: '0 0 8px #2D6A4F',
                  top: '10%',
                  left: 0,
                  animation: 'scan-laser 2.2s infinite ease-in-out'
                }}
              />
              
              {/* Corner brackets representation */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: '1px dashed rgba(255,255,255,0.2)' }} />
              
              {/* Mock QR matrix image in background */}
              <div style={{ width: '120px', height: '120px', background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'2\'%3E%3Crect x=\'3\' y=\'3\' width=\'6\' height=\'6\'/%3E%3Crect x=\'15\' y=\'3\' width=\'6\' height=\'6\'/%3E%3Crect x=\'3\' y=\'15\' width=\'6\' height=\'6\'/%3E%3Cpath d=\'M9 9h6v6H9z\'/%3E%3C/svg%3E") no-repeat center', backgroundSize: 'contain', opacity: 0.25, position: 'absolute', top: '60px', left: '60px' }} />
            </div>

            <div style={{ fontSize: '13px', color: '#ccc', margin: '12px 0 20px' }}>
              {qrScanningStatus}
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: 'var(--green)', borderColor: 'var(--green)' }}
              onClick={() => {
                // Simulate manual force scan
                setQrScanningStatus('Verifying security checksum...');
                setTimeout(() => {
                  setIsQrScannerOpen(false);
                  setWizardStep(2);
                }, 600);
              }}
            >
              Simulate Scan Beep
            </button>
          </div>
        </div>
      )}

      {/* Embedded CSS Animation for Scanner Laser */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}

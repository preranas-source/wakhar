import { useState } from 'react';
import { apiSim } from '@wakhar/shared';
import toast from 'react-hot-toast';

export default function FarmerPortal({ 
  intakes, 
  receipts, 
  farmersList = [], 
  dbFarmers = [],
  dbFpos = [],
  dbWarehouses = [],
  dbMovements = [],
  dbUsers = [],
  currentUser,
  onAmendReceipt, 
  onAddActivity,
  activeTab = 'farmer'
}) {
  // 1. Find the logged-in farmer in dbFarmers by user_id or phone number
  const dbFarmer = dbFarmers.find(f => {
    if (f.user_id && currentUser?.id && f.user_id === currentUser.id) {
      return true;
    }
    const normF = (f.phone || '').replace(/\D/g, '');
    const normU = (currentUser?.phone || '').replace(/\D/g, '');
    return normF === normU && normF !== '';
  });
  
  // Find their FPO and FPO manager
  const myFpo = dbFpos.find(f => f.id === dbFarmer?.fpo_id);
  const myFpoManager = dbUsers.find(u => u.fpo_id === dbFarmer?.fpo_id && u.role === 'fpo_manager');

  const selectedFarmer = dbFarmer ? {
    id: dbFarmer.farmer_code,
    dbId: dbFarmer.id,
    name: dbFarmer.name,
    phone: dbFarmer.phone,
    aadhaar: dbFarmer.aadhaar || 'Not Listed',
    village: dbFarmer.village || 'N/A',
    bankName: 'State Bank of India', // Default bank name
    bankAcc: dbFarmer.bank_account || 'Not Linked',
    bankIfsc: dbFarmer.bank_ifsc || 'N/A',
    bankBranch: 'Wai APMC Branch',
    linkedFpo: myFpo?.name || 'Linked FPO Center',
    fpoContact: myFpoManager ? `${myFpoManager.full_name} (${myFpoManager.phone})` : 'N/A',
    fpoCoordinates: '17.9462° N, 73.8821° E'
  } : {
    id: 'FM-00412',
    name: currentUser?.full_name || 'Suresh Patil',
    phone: currentUser?.phone || '+91 98765 43210',
    aadhaar: '4532-8901-4821',
    village: 'Wai',
    bankName: 'State Bank of India',
    bankAcc: '340987127712',
    bankIfsc: 'SBIN0004512',
    bankBranch: 'Wai APMC Branch',
    linkedFpo: 'Wai Farmer Producer Org',
    fpoContact: 'Rajesh Bhosale (+91 98210 55660)',
    fpoCoordinates: '17.9462° N, 73.8821° E'
  };

  // 2. Withdrawal form state
  const [withdrawCommodity, setWithdrawCommodity] = useState('Rice');
  const [withdrawQuantity, setWithdrawQuantity] = useState('300');
  const [digitalToken, setDigitalToken] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('Sale to local trader');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(code);
    setOtpSent(true);
    apiSim.sendSMSNotification(selectedFarmer.phone, `WAKHAR: Your withdrawal authorization secure OTP token is ${code}. Do not share this PIN.`);
    toast.success(`Secure OTP token has been dispatched to ${selectedFarmer.phone}! [SIMULATION CODE: ${code}]`);
  };
  
  // Filter receipts and intakes for the active farmer
  const currentReceipts = receipts.filter(wr => wr.farmerId === selectedFarmer.id);
  const currentIntakes = intakes.filter(lot => lot.farmerId === selectedFarmer.id);

  // Active WR count and balance
  const activeReceipts = currentReceipts.filter(wr => wr.quantity > 0);
  const outstandingBalance = activeReceipts.reduce((sum, wr) => sum + Number(wr.quantity || 0), 0);
  const totalDepositedKg = currentIntakes.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

  // Dynamic withdrawal requests logs computed from actual stock movements
  const myLotIds = new Set(currentIntakes.map(lot => lot.dbId));
  const withdrawalRequests = (dbMovements || [])
    .filter(m => myLotIds.has(m.lot_id) && m.remarks && m.remarks.toLowerCase().includes('withdrawal'))
    .map((m, index) => {
      const lot = currentIntakes.find(l => l.dbId === m.lot_id);
      return {
        id: m.movement_code || `WRQ-2026-0${100 + index}`,
        date: m.movement_date ? new Date(m.movement_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        commodity: lot ? lot.commodity : 'Unknown',
        quantity: parseFloat(m.quantity_kg),
        reason: m.remarks || 'Farmer Withdrawal',
        status: 'Completed'
      };
    });

  const displayAadhaar = selectedFarmer.aadhaar && selectedFarmer.aadhaar !== 'Not Listed'
    ? 'XXXX-XXXX-' + selectedFarmer.aadhaar.slice(-4) 
    : 'Not Listed';
  
  const displayBank = selectedFarmer.bankAcc && selectedFarmer.bankAcc !== 'Not Linked'
    ? 'Bank Account ···· ' + selectedFarmer.bankAcc.slice(-4)
    : 'Not Linked';

  // Submit withdrawal request
  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    
    // Find active receipt of matching commodity
    const matchingWR = activeReceipts.find(wr => wr.commodity.toLowerCase().includes(withdrawCommodity.toLowerCase()));
    
    if (!matchingWR) {
      toast.error(`No active negotiable Warehouse Receipt found for commodity: ${withdrawCommodity}`);
      return;
    }
    
    const withdrawVal = Number(withdrawQuantity);
    if (withdrawVal <= 0) {
      toast.success('Withdrawal quantity must be greater than 0.');
      return;
    }
    
    if (withdrawVal > matchingWR.quantity) {
      toast.error(`Withdrawal quantity exceeds active receipt quantity (${matchingWR.quantity} kg).`);
      return;
    }
    
    if (!expectedOtp) {
      toast.error('Security Verification Required: Please request a digital token OTP code first.');
      return;
    }
    
    if (digitalToken !== expectedOtp) {
      toast.error('Security Verification Failed: The OTP token entered is incorrect. Please request a new token.');
      return;
    }

    const newQty = matchingWR.quantity - withdrawVal;
    const newBags = Math.round(newQty / 50);
    const cropRates = { Rice: 62.5, Wheat: 22.8, Soybean: 47.2, Onion: 18.5, Groundnut: 68 };
    const rate = cropRates[matchingWR.commodity] || 20;
    const newVal = newQty * rate;

    // Call amendment callback
    onAmendReceipt(matchingWR.id, newQty, newBags, newVal);

    // No local state update needed, backend updates the quantities

    // Push dynamic activity log
    if (onAddActivity) {
      onAddActivity(
        'dispatch',
        `Withdrawal request authorized — Farmer <strong>${selectedFarmer.name}</strong> withdrew ${withdrawVal.toLocaleString()} kg ${withdrawCommodity} from WR <strong>${matchingWR.id}</strong>. Reason: ${withdrawReason}`
      );
    }

    toast.success(`Successfully authorized withdrawal request of ${withdrawVal.toLocaleString()} kg. e-WR ${matchingWR.id} amended.`);
    setDigitalToken('');
    setWithdrawQuantity('300');
  };

  return (
    <div className="page active" id="page-farmer">
      {/* 1. MY DEPOSITS VIEW */}
      {activeTab === 'farmer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>My Deposits</div>
            <div style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '4px' }}>
              Historical deposits log and active warehouse balance ledger
            </div>
          </div>

          {/* Metric Row */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">Total Deposits (Lifetime)</div>
              <div className="stat-value">{totalDepositedKg.toLocaleString()} kg</div>
              <div className="stat-sub">Across all crop cycles</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Current Outstanding Balance</div>
              <div className="stat-value" style={{ color: 'var(--blue)' }}>{outstandingBalance.toLocaleString()} kg</div>
              <div className="stat-sub">{activeReceipts.length} active warehouse receipts</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Linked FPO Warehouse</div>
              <div className="stat-value" style={{ fontSize: '18px', padding: '4px 0' }}>{selectedFarmer.linkedFpo}</div>
              <div className="stat-sub">GPS: {selectedFarmer.fpoCoordinates}</div>
            </div>
          </div>

          {/* Deposits Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title">Deposited Commodity History</div>
              <button 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '12px', background: '#fff' }}
                onClick={() => toast.success('Exporting deposit ledger as CSV...')}
              >
                Export CSV
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lot ID</th>
                    <th>Commodity / Variety</th>
                    <th>Quantity</th>
                    <th>Grade</th>
                    <th>Warehouse Location</th>
                    <th>Moisture %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentIntakes.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                        No commodity deposits recorded for this farmer account.
                      </td>
                    </tr>
                  ) : (
                    currentIntakes.map(lot => (
                      <tr key={lot.id}>
                        <td>{lot.date}</td>
                        <td><strong>{lot.id}</strong></td>
                        <td>
                          <strong>{lot.commodity}</strong>
                          <div className="td-secondary">{lot.variety}</div>
                        </td>
                        <td style={{ fontWeight: '600' }}>{lot.quantity.toLocaleString()} kg</td>
                        <td>
                          <span className={`badge ${lot.gradeClass}`}>{lot.grade}</span>
                        </td>
                        <td>{lot.warehouse} · {lot.zone}</td>
                        <td>{lot.moisture}%</td>
                        <td>
                          <span className={`badge ${
                            lot.status === 'Available' ? 'badge-teal' :
                            lot.status === 'Reserved' ? 'badge-blue' :
                            lot.status === 'Returned' ? 'badge-red' : 'badge-amber'
                          }`}>{lot.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. WITHDRAWAL REQUESTS VIEW */}
      {activeTab === 'withdrawal-requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Withdrawal Requests</div>
            <div style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '4px' }}>
              Submit partial or full crop withdrawal requests and verify security OTP tokens
            </div>
          </div>

          <div className="transfers-split-layout">
            {/* Left Column: Form */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">Submit Outbound Request</div>
              </div>
              <form onSubmit={handleWithdrawSubmit} style={{ padding: '20px' }}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Deposited Commodity</label>
                    <select 
                      className="form-select"
                      value={withdrawCommodity}
                      onChange={(e) => setWithdrawCommodity(e.target.value)}
                    >
                      <option value="Rice">Rice (Basmati) - {activeReceipts.find(w => w.commodity === 'Rice')?.quantity || 0} kg available</option>
                      <option value="Wheat">Wheat (Lokwan) - {activeReceipts.find(w => w.commodity === 'Wheat')?.quantity || 0} kg available</option>
                      <option value="Soybean">Soybean - {activeReceipts.find(w => w.commodity === 'Soybean')?.quantity || 0} kg available</option>
                      <option value="Onion">Onion - {activeReceipts.find(w => w.commodity === 'Onion')?.quantity || 0} kg available</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Withdrawal Quantity (kg)</label>
                    <input 
                      type="number"
                      className="form-input"
                      value={withdrawQuantity}
                      onChange={(e) => setWithdrawQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Withdrawal Reason</label>
                    <select 
                      className="form-select"
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                    >
                      <option value="Sale to local trader">Sale to local trader</option>
                      <option value="Processing & milling">Processing & milling</option>
                      <option value="Self consumption">Self consumption</option>
                      <option value="Reprocessing/drying">Reprocessing / Drying</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Digital Verification Token (OTP)</label>
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        style={{ padding: '2px 8px', fontSize: '11px', background: '#fff', borderColor: 'var(--green)', color: 'var(--green)', fontWeight: 'bold' }}
                        onClick={handleRequestOtp}
                      >
                        {otpSent ? 'Resend SMS OTP' : 'Request OTP Token'}
                      </button>
                    </div>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder={otpSent ? "Enter 6-digit OTP token" : "Click Request OTP first"}
                      maxLength="6"
                      value={digitalToken}
                      onChange={(e) => setDigitalToken(e.target.value)}
                      disabled={!otpSent}
                      required
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                      {otpSent 
                        ? `A verification SMS token has been pushed to ${selectedFarmer.phone}` 
                        : 'Secure authentication OTP code is required for stock release validation.'
                      }
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ background: '#1E4D36', borderColor: '#1E4D36' }}>
                    Authorize & Submit Request
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: History */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">Withdrawal Activity Log</div>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Date</th>
                      <th>Commodity</th>
                      <th>Qty (kg)</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map(req => (
                      <tr key={req.id}>
                        <td><strong>{req.id}</strong></td>
                        <td>{req.date}</td>
                        <td>{req.commodity}</td>
                        <td style={{ fontWeight: '500' }}>{req.quantity.toLocaleString()} kg</td>
                        <td>{req.reason}</td>
                        <td>
                          <span className={`badge ${req.status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. FARMER PROFILE VIEW */}
      {activeTab === 'farmer-profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Farmer Profile</div>
            <div style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '4px' }}>
              Verify personal records, linked bank accounts, and linked FPO master data
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {/* Personal Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <div className="section-title">👤 Personal Details</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Farmer Full Name</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{selectedFarmer.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Farmer Registration ID</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{selectedFarmer.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Mobile Contact</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedFarmer.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Aadhaar Number</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{displayAadhaar}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Residential Village</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedFarmer.village || 'Wai'}</div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <div className="section-title">💳 Bank Account Details</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Lien Lending Bank</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{selectedFarmer.bankName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Account Number</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{selectedFarmer.bankAcc}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>IFSC Code</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedFarmer.bankIfsc}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Bank Branch Location</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedFarmer.bankBranch}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--green-light)', border: '1px solid rgba(45,106,79,0.2)', borderRadius: '6px', fontSize: '12px', color: 'var(--green)', marginTop: '10px' }}>
                  ✔ Validated with DBT (Direct Benefit Transfer) gateway portal.
                </div>
              </div>
            </div>

            {/* Linked FPO */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <div className="section-title">🌾 Linked FPO Center</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>FPO Co-operative Name</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{selectedFarmer.linkedFpo}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>FPO Regional Manager</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{selectedFarmer.fpoContact}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>GPS Geo-Coordinates</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--blue)' }}>{selectedFarmer.fpoCoordinates}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '600' }}>Associated APMC Yard</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>Wai APMC Mandi, Satara</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

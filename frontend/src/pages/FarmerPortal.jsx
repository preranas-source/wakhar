import { useState } from 'react';

export default function FarmerPortal({ 
  intakes, 
  receipts, 
  farmersList = [], 
  onAmendReceipt, 
  onAddActivity 
}) {
  // 1. Farmer search and selection
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(() => {
    return farmersList.find(f => f.id === 'FM-00412') || farmersList[0] || {
      id: 'FM-00412',
      name: 'Suresh Patil',
      phone: '+91 98765 43210',
      aadhaar: '4532-8901-4821',
      village: 'Wai'
    };
  });

  // 2. Withdrawal form state
  const [withdrawQuantity, setWithdrawQuantity] = useState('300');
  const [digitalToken, setDigitalToken] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('Sale to trader');
  const [showWithdrawForm, setShowWithdrawForm] = useState(true);

  // 3. Static & dynamic history list state (specific to Suresh Patil or fallback)
  const [historyList, setHistoryList] = useState([
    { id: 1, date: '30 May 2026', type: 'Deposit', commodity: 'Rice · Basmati', quantity: 900, grade: 'Grade A', warehouse: 'Wai FPO', wrToken: 'WR-2026-0347', status: 'Active', isRiceDeposit: true },
    { id: 2, date: '12 Mar 2026', type: 'Withdrawal', commodity: 'Wheat · Lokwan', quantity: 1200, grade: 'Grade A', warehouse: 'Wai FPO', wrToken: 'WR-2026-0201', status: 'Closed' },
    { id: 3, date: '5 Jan 2026', type: 'Deposit', commodity: 'Soybean', quantity: 1800, grade: 'Grade B', warehouse: 'Wai FPO', wrToken: 'WR-2026-0088', status: 'Closed' }
  ]);

  // Handle live farmer search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setFarmerSearchQuery(query);
    if (!query.trim()) return;

    const matched = farmersList.find(f => 
      f.id.toLowerCase().includes(query.toLowerCase()) || 
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.aadhaar.includes(query) ||
      f.phone.includes(query)
    );
    if (matched) {
      setSelectedFarmer(matched);
    }
  };

  // Filter receipts and intakes for the active farmer
  const currentReceipts = receipts.filter(wr => wr.farmerId === selectedFarmer.id);
  const currentIntakes = intakes.filter(lot => lot.farmerId === selectedFarmer.id);

  // Find active WR (quantity > 0)
  const activeWR = currentReceipts.find(wr => wr.quantity > 0) || currentReceipts[0];

  // Outstanding calculations
  const totalDepositedKg = currentIntakes.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
  const lifetimeDeposited = selectedFarmer.id === 'FM-00412' 
    ? '12,450 kg' 
    : `${totalDepositedKg.toLocaleString()} kg`;

  const activeReceipts = currentReceipts.filter(wr => wr.quantity > 0);
  const outstandingBalance = activeReceipts.reduce((sum, wr) => sum + Number(wr.quantity || 0), 0);
  const activeWRCount = activeReceipts.length;
  const outstandingText = `${outstandingBalance.toLocaleString()} kg (${activeWRCount} active WR${activeWRCount !== 1 ? 's' : ''})`;

  // Display details formatting
  const displayAadhaar = selectedFarmer.aadhaar 
    ? 'XXXX-XXXX-' + selectedFarmer.aadhaar.slice(-4) 
    : 'XXXX-XXXX-4821';
  
  const displayBank = selectedFarmer.id === 'FM-00412' 
    ? 'SBI ··· 7712' 
    : 'SBI ··· ' + selectedFarmer.phone.slice(-4);

  // Remaining calculations
  const currentQty = activeWR ? activeWR.quantity : 0;
  const withdrawVal = Number(withdrawQuantity) || 0;
  const remainingQty = Math.max(0, currentQty - withdrawVal);
  const remainingText = `${remainingQty.toLocaleString()} kg (WR amended)`;

  // History mapping (Suresh Patil uses custom data matching screenshots, others are fully dynamic)
  const getHistoryList = () => {
    if (selectedFarmer.id === 'FM-00412') {
      return historyList.map(item => {
        if (item.isRiceDeposit) {
          const qty = activeWR ? activeWR.quantity : 0;
          return {
            ...item,
            quantity: qty,
            status: qty > 0 ? 'Active' : 'Closed'
          };
        }
        return item;
      });
    } else {
      // Dynamic rendering for other farmers
      return currentReceipts.map((wr, idx) => ({
        id: `dyn-${wr.id}-${idx}`,
        date: wr.date || 'Today',
        type: 'Deposit',
        commodity: `${wr.commodity} · ${wr.variety || ''}`,
        quantity: wr.quantity,
        grade: wr.grade || 'Grade A',
        warehouse: intakes.find(lot => lot.id === wr.lotId)?.warehouse || 'Wai FPO',
        wrToken: wr.id,
        status: wr.quantity > 0 ? 'Active' : 'Closed'
      }));
    }
  };

  // Trigger partial withdrawal submission
  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    if (!activeWR) {
      alert('No active warehouse receipt found to withdraw from.');
      return;
    }
    if (withdrawVal <= 0) {
      alert('Withdrawal quantity must be greater than 0.');
      return;
    }
    if (withdrawVal > activeWR.quantity) {
      alert(`Withdrawal quantity exceeds active receipt quantity (${activeWR.quantity} kg).`);
      return;
    }
    if (!digitalToken.trim()) {
      alert('Security verification failed. Please enter the 6-digit OTP token sent to your device.');
      return;
    }

    // Trigger amendment callbacks
    const newQty = activeWR.quantity - withdrawVal;
    const newBags = Math.round(newQty / 50);
    const cropRates = { Rice: 62.5, Wheat: 22.8, Soybean: 47.2, Onion: 18.5, Groundnut: 68 };
    const rate = cropRates[activeWR.commodity] || 20;
    const newVal = newQty * rate;

    onAmendReceipt(activeWR.id, newQty, newBags, newVal);

    // Append to local history list
    const logDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setHistoryList(prev => [
      {
        id: Date.now(),
        date: logDate,
        type: 'Withdrawal',
        commodity: `${activeWR.commodity} · ${activeWR.variety || 'Basmati'}`,
        quantity: withdrawVal,
        grade: activeWR.grade,
        warehouse: activeWR.warehouse || 'Wai FPO',
        wrToken: activeWR.id,
        status: 'Closed'
      },
      ...prev
    ]);

    // Push dynamic activity log
    if (onAddActivity) {
      onAddActivity(
        'dispatch',
        `Withdrawal recorded — Farmer <strong>${selectedFarmer.name}</strong> withdrew ${withdrawVal.toLocaleString()} kg crop from WR <strong>${activeWR.id}</strong>. Reason: ${withdrawReason}`
      );
    }

    alert(`Successfully authorized withdrawal of ${withdrawVal.toLocaleString()} kg. Active WR ${activeWR.id} has been amended to ${newQty.toLocaleString()} kg.`);
    setDigitalToken('');
  };

  const handleFullWithdrawal = () => {
    if (!activeWR) return;
    setWithdrawQuantity(activeWR.quantity.toString());
    setShowWithdrawForm(true);
    // Focus the token field
    setTimeout(() => {
      document.getElementById('token-input')?.focus();
    }, 100);
  };

  return (
    <div className="page active" id="page-farmer">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="section-title" style={{ fontSize: '20px' }}>Farmer Portal</div>
          <div className="section-sub" style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '6px' }}>
            Deposit history · Warehouse Receipts · Withdrawal requests · Balance
          </div>
        </div>
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="Search farmer ID / Aadhaar"
            value={farmerSearchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="farmer-layout">
        
        {/* LEFT COLUMN: Profile Card */}
        <div className="farmer-profile-card">
          <div className="farmer-profile-header">
            <div className="farmer-profile-name">{selectedFarmer.name}</div>
            <div className="farmer-profile-meta">{selectedFarmer.id} · Linked: {selectedFarmer.village || 'Wai'} FPO</div>
          </div>
          <div className="farmer-profile-body">
            <div className="farmer-info-item">
              <div className="farmer-info-label">Aadhaar</div>
              <div className="farmer-info-value">{displayAadhaar}</div>
            </div>
            <div className="farmer-info-item">
              <div className="farmer-info-label">Mobile</div>
              <div className="farmer-info-value">{selectedFarmer.phone}</div>
            </div>
            <div className="farmer-info-item">
              <div className="farmer-info-label">Bank Account</div>
              <div className="farmer-info-value">{displayBank}</div>
            </div>
            <div className="farmer-info-item">
              <div className="farmer-info-label">Total Deposited (Lifetime)</div>
              <div className="farmer-info-value">{lifetimeDeposited}</div>
            </div>
            <div className="farmer-info-item">
              <div className="farmer-info-label">Outstanding Balance</div>
              <div className="farmer-info-value" style={{ fontWeight: '600', color: 'var(--blue)' }}>
                {outstandingText}
              </div>
            </div>
          </div>
          <div className="farmer-profile-footer">
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setWithdrawQuantity('300');
                setShowWithdrawForm(true);
              }}
            >
              + New Withdrawal Request
            </button>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', justifyContent: 'center', background: '#fff' }}
              onClick={() => alert(`Warehouse receipt data pushed to ${selectedFarmer.phone} via WhatsApp notification link successfully.`)}
            >
              Send WR via WhatsApp/SMS
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Active WR & Withdrawal Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active WR Receipt Fields */}
          {activeWR ? (
            <div className="card">
              <div className="card-header">
                <div className="section-title">Active Warehouse Receipt</div>
                <span className="badge badge-green">Valid</span>
              </div>
              <div className="card-body">
                <div className="wr-details-grid">
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">WR ID</div>
                    <div className="wr-grid-value">
                      <span className="wr-grid-value-link" onClick={() => alert(`Showing electronic metadata verification summary for negotiable e-WR: ${activeWR.id}`)}>
                        {activeWR.id}
                      </span>
                    </div>
                  </div>
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">Commodity / Grade</div>
                    <div className="wr-grid-value">{activeWR.commodity} - {activeWR.grade}</div>
                  </div>
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">Quantity</div>
                    <div className="wr-grid-value" style={{ fontWeight: '600' }}>
                      {activeWR.quantity.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">Issue Date</div>
                    <div className="wr-grid-value">{activeWR.date || '30 May 2026'}</div>
                  </div>
                </div>

                <div className="wr-details-grid" style={{ marginTop: '14px', borderTop: '1px solid var(--surface2)', paddingTop: '14px' }}>
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">Validity</div>
                    <div className="wr-grid-value">30 Nov 2026</div>
                  </div>
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">Warehouse</div>
                    <div className="wr-grid-value">Wai FPO · Zone A-3</div>
                  </div>
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">Collateral Status</div>
                    <div className="wr-grid-value">
                      <span 
                        className="status-dot-text"
                        style={{
                          '--blue': activeWR.collateralStatus === 'None' ? 'var(--blue)' :
                                   activeWR.collateralStatus === 'Applied' ? 'var(--amber)' : 'var(--green)'
                        }}
                      >
                        {activeWR.collateralStatus === 'None' ? 'Available for loan' :
                         activeWR.collateralStatus === 'Applied' ? 'Under Review' : `Disbursed (₹${activeWR.loanAmount.toLocaleString()})`}
                      </span>
                    </div>
                  </div>
                  <div className="wr-grid-item">
                    <div className="wr-grid-label">eNAM Status</div>
                    <div className="wr-grid-value">
                      <span className="status-dot-text submitted">Submitted</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-footer" style={{ borderTop: '1px solid var(--border)', justifyContent: 'flex-start' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => alert(`Simulating PDF generation for receipt ${activeWR.id}... Document download started.`)}
                >
                  Download WR PDF
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowWithdrawForm(true)}
                >
                  Partial Withdrawal
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleFullWithdrawal}
                >
                  Full Withdrawal
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>
              No active negotiable Warehouse Receipts on record for this farmer ID.
            </div>
          )}

          {/* PARTIAL WITHDRAWAL PANEL */}
          {activeWR && showWithdrawForm && (
            <form onSubmit={handleWithdrawSubmit} className="withdrawal-card">
              <div className="withdrawal-title">
                Partial Withdrawal — {activeWR.id}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Withdrawal Quantity (kg)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={withdrawQuantity}
                    onChange={(e) => setWithdrawQuantity(e.target.value)}
                    max={activeWR.quantity}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Digital Token (from SMS/App)</label>
                  <input 
                    type="text"
                    id="token-input"
                    className="form-input"
                    placeholder="6-digit OTP token"
                    value={digitalToken}
                    onChange={(e) => setDigitalToken(e.target.value)}
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Remaining After Withdrawal</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={remainingText}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Withdrawal Reason</label>
                  <select 
                    className="form-select"
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                  >
                    <option value="Sale to trader">Sale to trader</option>
                    <option value="Processing & milling">Processing & milling</option>
                    <option value="Self consumption">Self consumption</option>
                    <option value="Quality upgrade (re-drying)">Quality upgrade (re-drying)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn btn-blue">
                  Authorize Partial Withdrawal & Amend WR
                </button>
              </div>
            </form>
          )}

          {/* DEPOSIT & WITHDRAWAL HISTORY */}
          <div className="card">
            <div className="card-header">
              <div className="section-title">Deposit & Withdrawal History</div>
              <button 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => alert('Exporting deposit and withdrawal histories log as CSV... Download started.')}
              >
                Export
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Commodity</th>
                    <th>Quantity</th>
                    <th>Grade</th>
                    <th>Warehouse</th>
                    <th>WR / Token</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getHistoryList().map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{item.date}</td>
                      <td>
                        <span className={`badge ${item.type === 'Deposit' ? 'badge-green' : 'badge-amber'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td>{item.commodity}</td>
                      <td style={{ fontWeight: '500' }}>{item.quantity.toLocaleString()} kg</td>
                      <td>{item.grade}</td>
                      <td>{item.warehouse}</td>
                      <td style={{ fontWeight: '600' }}>{item.wrToken}</td>
                      <td>
                        <span className={`badge ${item.status === 'Active' ? 'badge-blue' : 'badge-gray'}`}>
                          {item.status}
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

    </div>
  );
}

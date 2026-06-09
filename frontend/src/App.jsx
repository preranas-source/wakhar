import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Intake from './pages/Intake';
import Inventory from './pages/Inventory';
import Dispatch from './pages/Dispatch';
import Grading from './pages/Grading';
import Receipts from './pages/Receipts';
import Market from './pages/Market';
import Transfers from './pages/Transfers';
import StockCount from './pages/StockCount';
import FarmerPortal from './pages/FarmerPortal';
import AggregatorView from './pages/AggregatorView';
import Warehouses from './pages/Warehouses';
import Reports from './pages/Reports';
import Integrations from './pages/Integrations';
import './App.css';

// --- SEED SEED DATA ---
const initialFarmers = [
  { id: 'FM-00412', name: 'Suresh Patil', phone: '+91 98765 43210', aadhaar: '4532-8901-4821', village: 'Wai' },
  { id: 'FM-00389', name: 'Anita Shinde', phone: '+91-99230-44556', aadhaar: '7891-2345-6789', village: 'Phaltan' },
  { id: 'FM-00301', name: 'Ramesh Jadhav', phone: '+91-94210-77889', aadhaar: '3210-6789-0123', village: 'Wai' },
  { id: 'FM-00451', name: 'Priya More', phone: '+91-91300-22334', aadhaar: '6789-0123-4567', village: 'Baramati' },
  { id: 'FM-00218', name: 'Vijay Kale', phone: '+91-95610-88990', aadhaar: '9012-3456-7890', village: 'Phaltan' }
];

const initialIntakes = [
  { id: 'LOT-2026-091', farmerId: 'FM-00412', farmerName: 'Suresh Patil', commodity: 'Rice', variety: 'Basmati', quantity: 900, bags: 18, moisture: 12.4, grade: 'Grade A', gradeClass: 'badge-green', warehouse: 'Wai FPO', zone: 'Zone A — Rack 3', status: 'Available', date: '30 May 2026', remarks: '' },
  { id: 'LOT-2026-090', farmerId: 'FM-00389', farmerName: 'Anita Shinde', commodity: 'Wheat', variety: 'Lokwan', quantity: 1200, bags: 24, moisture: 13.1, grade: 'Grade A', gradeClass: 'badge-green', warehouse: 'Phaltan FPO', zone: 'Zone B — Rack 1', status: 'Reserved', date: '30 May 2026', remarks: '' },
  { id: 'LOT-2026-089', farmerId: 'FM-00301', farmerName: 'Ramesh Jadhav', commodity: 'Soybean', variety: 'JS-335', quantity: 600, bags: 12, moisture: 18.2, grade: 'Grade B', gradeClass: 'badge-amber', warehouse: 'Wai FPO', zone: 'Zone A — Rack 4', status: 'QC Pending', date: '29 May 2026', remarks: 'Aeration required' },
  { id: 'LOT-2026-088', farmerId: 'FM-00451', farmerName: 'Priya More', commodity: 'Onion', variety: 'Nasik Red', quantity: 800, bags: 40, moisture: 10.8, grade: 'Grade A', gradeClass: 'badge-green', warehouse: 'Baramati FPO', zone: 'Zone C — Rack 2', status: 'Available', date: '29 May 2026', remarks: '' },
  { id: 'LOT-2026-087', farmerId: 'FM-00218', farmerName: 'Vijay Kale', commodity: 'Rice', variety: 'HMT', quantity: 450, bags: 9, moisture: 21.5, grade: 'Rejected', gradeClass: 'badge-red', warehouse: 'Wai FPO', zone: 'Zone A — Rack 3', status: 'Returned', date: '28 May 2026', remarks: 'Returned due to critical moisture' }
];

const initialDispatches = [
  {
    id: 'DN-0082',
    lotId: 'LOT-2026-089',
    commodity: 'Soybean (JS-335)',
    quantity: '12 MT',
    destination: 'Satara Aggregator',
    vehicle: 'MH-11-AB-4421',
    status: 'In Transit',
    timeline: [
      { title: 'Dispatch Note Created', sub: 'Today, 9:15 AM', done: true },
      { title: 'Weigh Bridge Gate-out weight certified', sub: 'Today, 10:00 AM', done: true },
      { title: 'NIC e-Way Bill generated & synchronized', sub: 'Today, 10:12 AM', done: true },
      { title: 'Delivery e-POD check in-transit', sub: 'Estimated delivery 6:00 PM', active: true }
    ]
  },
  {
    id: 'DN-0081',
    lotId: 'LOT-2026-090',
    commodity: 'Wheat (Lokwan)',
    quantity: '8 MT',
    destination: 'Phaltan FPO Warehouse',
    vehicle: 'MH-12-PQ-9080',
    status: 'Delivered',
    timeline: [
      { title: 'Dispatch Note Created', sub: 'Yesterday, 8:00 AM', done: true },
      { title: 'Weigh Bridge Gate-out weight certified', sub: 'Yesterday, 8:45 AM', done: true },
      { title: 'NIC e-Way Bill generated & synchronized', sub: 'Yesterday, 9:00 AM', done: true },
      { title: 'Delivery e-POD completed & signed', sub: 'Yesterday, 4:30 PM', done: true }
    ]
  }
];

const initialReceipts = [
  { id: 'WR-2026-0347', lotId: 'LOT-2026-091', farmerId: 'FM-00412', farmerName: 'Suresh Patil', commodity: 'Rice', variety: 'Basmati', quantity: 900, bags: 18, moisture: 12.4, grade: 'Grade A', value: 56250, collateralStatus: 'None', loanAmount: 0, date: '30 May 2026', validity: '30 Aug 2026' },
  { id: 'WR-2026-0346', lotId: 'LOT-2026-090', farmerId: 'FM-00389', farmerName: 'Anita Shinde', commodity: 'Wheat', variety: 'Lokwan', quantity: 1200, bags: 24, moisture: 13.1, grade: 'Grade A', value: 27360, collateralStatus: 'Disbursed', pledgeBank: 'NABARD', loanAmount: 19150, date: '30 May 2026', validity: '30 Aug 2026' },
  { id: 'WR-2026-0340', lotId: 'LOT-2026-088', farmerId: 'FM-00451', farmerName: 'Priya More', commodity: 'Onion', variety: 'Nasik Red', quantity: 800, bags: 40, moisture: 10.8, grade: 'Grade A', value: 14800, collateralStatus: 'Disbursed', pledgeBank: 'NABARD', loanAmount: 10360, date: '29 May 2026', validity: '15 Aug 2026' },
  { id: 'WR-2026-0332', lotId: 'LOT-2026-089', farmerId: 'FM-00301', farmerName: 'Ramesh Jadhav', commodity: 'Groundnut', variety: 'TG-37', quantity: 1500, bags: 30, moisture: 11.5, grade: 'Grade A', value: 102000, collateralStatus: 'None', loanAmount: 0, date: '5 Jun 2026', validity: '5 Sep 2026' }
];

const initialActivities = [
  { type: 'intake', text: 'Intake completed — Farmer <strong>Suresh Patil</strong> deposited 18 bags (900 kg) Rice Grade A at Wai FPO', time: 'Today, 10:42 AM · WR-2026-0347' },
  { type: 'dispatch', text: 'Dispatch Note <strong>DN-0082</strong> created — 12 MT Soybean dispatched to Satara Aggregator via Vehicle MH-11-AB-4421', time: 'Today, 9:15 AM' },
  { type: 'qc', text: 'Quality alert — Lot <strong>LOT-2026-089</strong> moisture 18.2% exceeds threshold (14%). Flagged for re-drying.', time: 'Yesterday, 2:10 PM' },
  { type: 'market', text: 'Purchase Order <strong>PO-2026-112</strong> accepted from Raigad Mart — 50 MT Wheat Grade A, ₹22,000/MT', time: 'Yesterday, 4:30 PM' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState({ name: 'Rajesh Bhosale', role: 'FPO Manager', initials: 'RB', view: 'dashboard' });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('wakhar_language') || 'en';
  });

  // Databases states synced from LocalStorage
  const [intakes, setIntakes] = useState(() => {
    const local = localStorage.getItem('wakhar_intakes');
    return local ? JSON.parse(local) : initialIntakes;
  });

  const [dispatches, setDispatches] = useState(() => {
    const local = localStorage.getItem('wakhar_dispatches');
    return local ? JSON.parse(local) : initialDispatches;
  });

  const [receipts, setReceipts] = useState(() => {
    const local = localStorage.getItem('wakhar_receipts');
    return local ? JSON.parse(local) : initialReceipts;
  });

  const [activities, setActivities] = useState(() => {
    const local = localStorage.getItem('wakhar_activities');
    return local ? JSON.parse(local) : initialActivities;
  });

  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Sync back to localstorage
  useEffect(() => {
    localStorage.setItem('wakhar_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('wakhar_intakes', JSON.stringify(intakes));
  }, [intakes]);

  useEffect(() => {
    localStorage.setItem('wakhar_dispatches', JSON.stringify(dispatches));
  }, [dispatches]);

  useEffect(() => {
    localStorage.setItem('wakhar_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('wakhar_activities', JSON.stringify(activities));
  }, [activities]);

  // Alert warnings
  const highMoistureLots = intakes.filter(lot => lot.moisture > 14 && lot.status !== 'Returned');

  // handlers
  const handleAddIntake = (newLot) => {
    setIntakes(prev => [newLot, ...prev]);
    
    // Add log
    const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
    const intakeLog = {
      type: 'intake',
      text: `Gate-In recorded — Lot <strong>${newLot.id}</strong> (${newLot.quantity} kg ${newLot.commodity}) deposited by <strong>${newLot.farmerName}</strong> at ${newLot.warehouse}`,
      time: logTime
    };

    setActivities(prev => [intakeLog, ...prev]);

    // If not returned, create warehouse receipt
    if (newLot.status !== 'Returned') {
      const cropRates = { Rice: 62.5, Wheat: 22.8, Soybean: 47.2, Onion: 18.5, Groundnut: 68 };
      const baseRate = cropRates[newLot.commodity] || 20;
      const valuation = Math.round((newLot.quantity * baseRate * 1000) / 1000); // Compute standard valuation

      const validityDate = new Date();
      validityDate.setMonth(validityDate.getMonth() + 3);
      const validityStr = validityDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      const wrId = `WR-2026-0${348 + receipts.length}`;
      const newWR = {
        id: wrId,
        lotId: newLot.id,
        farmerId: newLot.farmerId,
        farmerName: newLot.farmerName,
        commodity: newLot.commodity,
        variety: newLot.variety,
        quantity: newLot.quantity,
        bags: newLot.bags,
        moisture: newLot.moisture,
        grade: newLot.grade,
        value: valuation,
        collateralStatus: 'None',
        loanAmount: 0,
        date: newLot.date,
        validity: validityStr
      };

      setReceipts(prev => [newWR, ...prev]);
      
      // Append e-WR notification log
      setActivities(prev => [
        {
          type: 'market',
          text: `Negotiable e-WR <strong>${wrId}</strong> generated for Lot <strong>${newLot.id}</strong>. Face Valuation: ₹${valuation.toLocaleString()}`,
          time: logTime
        },
        ...prev
      ]);
    }
  };

  const handleUpdateGrade = (lotId, grade, gradeClass, moisture, status) => {
    setIntakes(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return { ...lot, grade, gradeClass, moisture, status };
      }
      return lot;
    }));

    // Update log
    const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
    setActivities(prev => [
      {
        type: 'qc',
        text: `Lab Certified — Lot <strong>${lotId}</strong> quality grade updated to <strong>${grade}</strong> (Moisture: ${moisture}%)`,
        time: logTime
      },
      ...prev
    ]);

    // If became returned, delete WR if exists
    if (status === 'Returned') {
      setReceipts(prev => prev.filter(wr => wr.lotId !== lotId));
    } else {
      // update receipts
      setReceipts(prev => prev.map(wr => {
        if (wr.lotId === lotId) {
          const cropRates = { Rice: 62.5, Wheat: 22.8, Soybean: 47.2, Onion: 18.5, Groundnut: 68 };
          const lotVal = intakes.find(l => l.id === lotId);
          const baseRate = cropRates[lotVal?.commodity] || 20;
          const valuation = Math.round((lotVal?.quantity * baseRate * 1000) / 1000);
          return { ...wr, grade, moisture, value: valuation };
        }
        return wr;
      }));
    }
  };

  const handleDispatchLot = (lotId) => {
    setIntakes(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return { ...lot, status: 'Reserved' };
      }
      return lot;
    }));

    // Add log
    const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
    setActivities(prev => [
      {
        type: 'dispatch',
        text: `Logistics — Lot <strong>${lotId}</strong> reserved & queued for Outbound Weighbridge gate-out.`,
        time: logTime
      },
      ...prev
    ]);
  };

  const handleReserveLot = (lotId) => {
    setIntakes(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return { ...lot, status: 'Reserved' };
      }
      return lot;
    }));
  };

  const handleAddDispatch = (newDispatch, lotId) => {
    setDispatches(prev => [newDispatch, ...prev]);
    
    // Lock lot status as Reserved
    setIntakes(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return { ...lot, status: 'Reserved' };
      }
      return lot;
    }));

    const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
    setActivities(prev => [
      {
        type: 'dispatch',
        text: `Dispatch Gatepass <strong>${newDispatch.id}</strong> issued for vehicle <strong>${newDispatch.vehicle}</strong> carrying ${newDispatch.commodity}`,
        time: logTime
      },
      ...prev
    ]);
  };

  const handleApplyCollateral = (receiptId, bank, amount) => {
    setReceipts(prev => prev.map(wr => {
      if (wr.id === receiptId) {
        return { ...wr, collateralStatus: 'Applied', pledgeBank: bank, loanAmount: amount };
      }
      return wr;
    }));

    const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
    setActivities(prev => [
      {
        type: 'market',
        text: `Financial Lien — Requested collateral credit loan of ₹${amount.toLocaleString()} against e-WR <strong>${receiptId}</strong> from ${bank}`,
        time: logTime
      },
      ...prev
    ]);

    // Simulate approval delay
    setTimeout(() => {
      setReceipts(currentReceipts => currentReceipts.map(wr => {
        if (wr.id === receiptId) {
          // Trigger approved state
          return { ...wr, collateralStatus: 'Disbursed' };
        }
        return wr;
      }));

      setActivities(prev => [
        {
          type: 'market',
          text: `💰 Lien Disbursed — NABARD approved pledge loan of ₹${amount.toLocaleString()} for e-WR <strong>${receiptId}</strong>. Account funded.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today'
        },
        ...prev
      ]);
    }, 4000);
  };

  return (
    <div className="app-container">
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        alertsCount={highMoistureLots.length}
        onShowAlertsModal={() => setShowAlertsModal(true)}
        intakesCount={intakes.filter(i => i.status === 'QC Pending').length}
        dispatchesCount={dispatches.filter(d => d.status === 'In Transit').length}
        language={language}
        setLanguage={setLanguage}
      >
        {activeTab === 'dashboard' && (
          <Dashboard 
            intakes={intakes} 
            dispatches={dispatches} 
            receipts={receipts}
            setActiveTab={setActiveTab}
            activities={activities}
            language={language}
          />
        )}

        {activeTab === 'intake' && (
          <Intake 
            intakes={intakes} 
            onAddIntake={handleAddIntake}
            farmersList={initialFarmers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            language={language}
          />
        )}

        {activeTab === 'intake-new' && (
          <Intake 
            intakes={intakes} 
            onAddIntake={handleAddIntake}
            farmersList={initialFarmers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isWizardOverride={true}
            language={language}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory 
            intakes={intakes} 
            onDispatchLot={handleDispatchLot}
            searchQuery={searchQuery}
            language={language}
          />
        )}

        {activeTab === 'dispatch' && (
          <Dispatch 
            dispatches={dispatches} 
            intakes={intakes}
            onAddDispatch={handleAddDispatch}
            searchQuery={searchQuery}
            language={language}
          />
        )}

        {activeTab === 'grading' && (
          <Grading 
            intakes={intakes} 
            onUpdateGrade={handleUpdateGrade}
            searchQuery={searchQuery}
            language={language}
            onAddActivity={(type, text) => {
              const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
              setActivities(prev => [
                { type, text, time: logTime },
                ...prev
              ]);
            }}
          />
        )}

        {activeTab === 'receipts' && (
          <Receipts 
            receipts={receipts} 
            intakes={intakes}
            onApplyCollateral={handleApplyCollateral}
            searchQuery={searchQuery}
            language={language}
          />
        )}

        {activeTab === 'market' && (
          <Market 
            intakes={intakes} 
            onReserveLot={handleReserveLot}
            searchQuery={searchQuery}
            language={language}
          />
        )}

        {activeTab === 'transfers' && (
          <Transfers 
            intakes={intakes} 
            language={language}
            onAddActivity={(type, text) => {
              const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
              setActivities(prev => [
                { type, text, time: logTime },
                ...prev
              ]);
            }}
          />
        )}

        {activeTab === 'stockcount' && (
          <StockCount 
            intakes={intakes}
            language={language}
          />
        )}

        {activeTab === 'farmer' && (
          <FarmerPortal 
            intakes={intakes} 
            receipts={receipts}
            farmersList={initialFarmers}
            onApplyCollateral={handleApplyCollateral}
            language={language}
            onAmendReceipt={(receiptId, newQty, bags, val) => {
              setReceipts(prev => prev.map(wr => {
                if (wr.id === receiptId) {
                  return { ...wr, quantity: newQty, bags: bags, value: val };
                }
                return wr;
              }));
              // Also find matching lot in intakes and amend its quantity and bags
              const targetWR = receipts.find(wr => wr.id === receiptId);
              if (targetWR) {
                setIntakes(prev => prev.map(lot => {
                  if (lot.id === targetWR.lotId) {
                    return { ...lot, quantity: newQty, bags: bags };
                  }
                  return lot;
                }));
              }
            }}
            onAddActivity={(type, text) => {
              const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
              setActivities(prev => [
                { type, text, time: logTime },
                ...prev
              ]);
            }}
          />
        )}

        {activeTab === 'aggregator' && (
          <AggregatorView 
            intakes={intakes} 
            onReserveLot={handleReserveLot}
            onAddDispatch={handleAddDispatch}
            language={language}
            onAddActivity={(type, text) => {
              const logTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
              setActivities(prev => [
                { type, text, time: logTime },
                ...prev
              ]);
            }}
          />
        )}

        {activeTab === 'warehouses' && (
          <Warehouses 
            intakes={intakes} 
            language={language}
          />
        )}

        {activeTab === 'reports' && (
          <Reports 
            intakes={intakes} 
            receipts={receipts} 
            activities={activities}
            language={language}
          />
        )}

        {activeTab === 'integrations' && (
          <Integrations language={language} />
        )}
      </Layout>

      {/* Notifications / Alerts overlay popup */}
      {showAlertsModal && (
        <div className="modal-overlay" onClick={() => setShowAlertsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="modal-title">System Alert logs</div>
              <button className="modal-close" onClick={() => setShowAlertsModal(false)}>×</button>
            </div>
            <div className="card-body">
              {highMoistureLots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
                  All stored commodity moisture parameters conform with optimal levels.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginBottom: '8px' }}>
                    The following lots require processing to prevent spoilages:
                  </div>
                  {highMoistureLots.map(lot => (
                    <div 
                      key={lot.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--amber-light)',
                        border: '1px solid rgba(181,98,10,0.2)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    >
                      <div>
                        <strong>{lot.id}</strong> ({lot.commodity})<br/>
                        <span style={{ fontSize: '11.5px', color: 'var(--text3)' }}>Location: {lot.warehouse} ({lot.zone})</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>{lot.moisture}% moisture</span>
                        <div 
                          style={{ fontSize: '11px', color: 'var(--green)', cursor: 'pointer', textDecoration: 'underline', marginTop: '2px' }}
                          onClick={() => {
                            setActiveTab('grading');
                            setShowAlertsModal(false);
                          }}
                        >
                          Send to Lab &rarr;
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-footer">
              <button className="btn btn-primary" onClick={() => setShowAlertsModal(false)}>
                Acknowledge All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

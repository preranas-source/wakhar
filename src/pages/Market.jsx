import { useState } from 'react';

export default function Market({ intakes = [], onReserveLot }) {
  const [poFilter, setPoFilter] = useState('All');
  
  // 1. Mock Purchase Orders Database (matching the top card)
  const [pos, setPos] = useState([
    { id: 'PO-2026-112', buyerName: 'Raigad Mart', buyerCity: 'Mumbai', commodity: 'Wheat - Grade A', qty: 50, price: 22000, total: '₹11.0L', warehouse: 'Phaltan FPO', status: 'Accepted', payment: 'Pending' },
    { id: 'PO-2026-111', buyerName: 'Raigad Mart', buyerCity: 'Mumbai', commodity: 'Rice - Grade A', qty: 30, price: 28000, total: '₹8.4L', warehouse: 'Wai FPO', status: 'In Transit', payment: 'Pending' },
    { id: 'PO-2026-108', buyerName: 'Savali Traders', buyerCity: 'Pune', commodity: 'Soybean - Grade A', qty: 20, price: 38500, total: '₹7.7L', warehouse: 'Wai FPO', status: 'Delivered', payment: 'Paid' },
    { id: 'PO-2026-104', buyerName: 'Kokan Exports', buyerCity: 'Ratnagiri', commodity: 'Groundnut - Grade A', qty: 15, price: 52000, total: '₹7.8L', warehouse: 'Wai FPO', status: 'Delivered', payment: 'Partial' }
  ]);

  // 2. Payments tracking database
  const payments = [
    { poId: 'PO-2026-111', invId: 'INV-2026-0088', buyer: 'Raigad Mart', amount: '₹8.4L', due: '15 Jun', paymentStatus: 'Awaiting', paymentClass: 'badge-gray', releaseStatus: 'Held', releaseClass: 'badge-gray' },
    { poId: 'PO-2026-104', invId: 'INV-2026-0081', buyer: 'Kokan Exports', amount: '₹3.9L', due: '10 Jun', paymentStatus: 'Partial ₹2L', paymentClass: 'badge-amber', releaseStatus: 'Partial', releaseClass: 'badge-amber' },
    { poId: 'PO-2026-108', invId: 'INV-2026-0075', buyer: 'Savali Traders', amount: '₹7.7L', due: '1 Jun', paymentStatus: 'Paid (Razorpay)', paymentClass: 'badge-green', releaseStatus: 'Released', releaseClass: 'badge-green' }
  ];

  // Helper for Agmarknet prices based on commodity
  const getAgmarknetPrice = (commodity) => {
    if (commodity === 'Rice') return '₹27,600/MT';
    if (commodity === 'Groundnut') return '₹51,800/MT';
    if (commodity === 'Soybean') return '₹38,200/MT';
    if (commodity === 'Wheat') return '₹22,800/MT';
    return '₹18,500/MT'; // Onion / default
  };

  // Filtered POs
  const filteredPOs = pos.filter(po => {
    if (poFilter === 'All') return true;
    if (poFilter === 'Open') return po.status === 'Accepted';
    if (poFilter === 'In Transit') return po.status === 'In Transit';
    if (poFilter === 'Fulfilled') return po.status === 'Delivered';
    return true;
  });

  // Handle Raise PO click - dynamic link
  const handleRaisePO = (lot) => {
    onReserveLot(lot.id);

    const priceRate = lot.commodity === 'Rice' ? 27600 : (lot.commodity === 'Groundnut' ? 51800 : 38200);
    const tonnage = lot.quantity / 1000;
    const valuationVal = tonnage * priceRate;
    const valuationLakhs = (valuationVal / 100000).toFixed(1);

    const newPoId = `PO-2026-0${113 + pos.length}`;
    const newPO = {
      id: newPoId,
      buyerName: 'Raigad Mart',
      buyerCity: 'Mumbai',
      commodity: `${lot.commodity} - ${lot.grade}`,
      qty: tonnage,
      price: priceRate,
      total: `₹${valuationLakhs}L`,
      warehouse: lot.warehouse,
      status: 'Accepted',
      payment: 'Pending'
    };

    setPos(prev => [newPO, ...prev]);
    alert(`Institutional PO ${newPoId} raised successfully for Available Lot ${lot.id}! System allocated stock and shifted status to Reserved.`);
  };

  const formatLotId = (id) => {
    const parts = id.split('-');
    if (parts.length === 3) {
      return (
        <>
          {parts[0]}-<br/>
          {parts[1]}-<br/>
          {parts[2]}
        </>
      );
    }
    return id;
  };

  return (
    <div className="page active" id="page-market" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title Header block */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>Market Linkage</div>
          <div style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '6px' }}>
            Raigad Mart · eNAM · Purchase orders · Payments
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ background: '#1E4D36', borderColor: '#1E4D36' }}
          onClick={() => alert('eNAM batch listing initialized for pending QC-Approved warehouse inventory.')}
        >
          + List on eNAM
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">OPEN POS</div>
          <div className="stat-value">8</div>
          <div className="stat-sub">₹18.4L value</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">FULFILLED THIS MONTH</div>
          <div className="stat-value">14</div>
          <div className="stat-sub" style={{ color: 'var(--green)', fontWeight: '600' }}>+3 vs last month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PAYMENTS PENDING</div>
          <div className="stat-value">₹4.2L</div>
          <div className="stat-sub">3 Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ENAM ACTIVE LOTS</div>
          <div className="stat-value">6</div>
          <div className="stat-sub">Available for bid</div>
        </div>
      </div>

      {/* Purchase Orders Table Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-title">Purchase orders</div>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${poFilter === 'All' ? 'active' : ''}`}
              onClick={() => setPoFilter('All')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${poFilter === 'Open' ? 'active' : ''}`}
              onClick={() => setPoFilter('Open')}
            >
              Open
            </button>
            <button 
              className={`filter-tab ${poFilter === 'In Transit' ? 'active' : ''}`}
              onClick={() => setPoFilter('In Transit')}
            >
              In Transit
            </button>
            <button 
              className={`filter-tab ${poFilter === 'Fulfilled' ? 'active' : ''}`}
              onClick={() => setPoFilter('Fulfilled')}
            >
              Fulfilled
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>PO NO.</th>
                <th>Buyer</th>
                <th>Commodity</th>
                <th>Qty (MT)</th>
                <th>Price/MT</th>
                <th>Total</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>
                    No purchase orders found for this tab filter.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => (
                  <tr key={po.id}>
                    <td><strong>{po.id}</strong></td>
                    <td>
                      <strong>{po.buyerName}</strong><br/>
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{po.buyerCity}</span>
                    </td>
                    <td>{po.commodity}</td>
                    <td style={{ fontWeight: '500' }}>{po.qty}</td>
                    <td>₹{po.price.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: '600' }}>{po.total}</td>
                    <td>{po.warehouse}</td>
                    <td>
                      <span className={`badge ${
                        po.status === 'Accepted' ? 'badge-amber' :
                        po.status === 'In Transit' ? 'badge-amber' :
                        'badge-green'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        po.payment === 'Pending' ? 'badge-gray' :
                        po.payment === 'Partial' ? 'badge-amber' :
                        'badge-green'
                      }`}>
                        {po.payment}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Browse Inventory (Left) and Payment Invoicing (Right) */}
      <div className="market-split-layout">
        
        {/* Left: Available Stock */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">Available Stock for Market (Browse)</div>
            <button 
              className="btn btn-outline" 
              style={{ padding: '4px 10px', fontSize: '11.5px', background: '#fff' }}
              onClick={() => alert('Redirecting to full trading portfolio...')}
            >
              + List on eNAM
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Lot</th>
                  <th>Commodity</th>
                  <th>Grade</th>
                  <th>Qty</th>
                  <th>Warehouse</th>
                  <th>Agmarknet Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {intakes.filter(lot => lot.status === 'Available').length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>
                      No available stock listed. Intake some inventory.
                    </td>
                  </tr>
                ) : (
                  intakes.filter(lot => lot.status === 'Available').map(lot => (
                    <tr key={lot.id}>
                      <td style={{ whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                        <strong>{formatLotId(lot.id)}</strong>
                      </td>
                      <td>{lot.commodity} {lot.variety ? `· ${lot.variety}` : ''}</td>
                      <td>
                        <span className="badge badge-green">A</span>
                      </td>
                      <td style={{ fontWeight: '500' }}>{lot.quantity.toLocaleString()} kg</td>
                      <td>{lot.warehouse}</td>
                      <td style={{ color: 'var(--text2)', fontWeight: '500' }}>
                        {getAgmarknetPrice(lot.commodity)}
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '12px', background: '#2D6A4F', borderColor: '#2D6A4F' }}
                          onClick={() => handleRaisePO(lot)}
                        >
                          Raise PO
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Payment Invoicing */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">Payment Tracking</div>
            <span style={{ fontSize: '12.5px', color: 'var(--amber)', fontWeight: '600' }}>
              • ₹4.2L pending
            </span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>PO / Invoice</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Payment</th>
                  <th>WR Release</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, pidx) => (
                  <tr key={pidx}>
                    <td>
                      <strong>{p.poId}</strong><br/>
                      <span style={{ fontSize: '10.5px', color: 'var(--text3)' }}>{p.invId}</span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{p.buyer}</td>
                    <td style={{ fontWeight: '600' }}>{p.amount}</td>
                    <td>{p.due}</td>
                    <td>
                      {p.paymentStatus.includes('Razorpay') ? (
                        <span className="badge badge-no-dot badge-green">{p.paymentStatus}</span>
                      ) : (
                        <span className={`badge ${p.paymentClass}`}>{p.paymentStatus}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.releaseClass}`}>{p.releaseStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

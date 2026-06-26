import { useState } from 'react';
import { apiSim } from '@wakhar/shared';
import toast from 'react-hot-toast';

export default function Market({ 
  intakes = [],
  pos = [],
  dbCommodities = [],
  dbWarehouses = [],
  currentUser,
  onReserveLot,
  onCreatePO,
  onPayPO,
  searchQuery, 
  activeTab = 'market',
  role 
}) {
  const [poFilter, setPoFilter] = useState('All');
  const [newPoCommodity, setNewPoCommodity] = useState('Rice');
  const [newPoQty, setNewPoQty] = useState('20');
  const [newPoWarehouse, setNewPoWarehouse] = useState('Wai FPO');
  const [newPoPrice, setNewPoPrice] = useState('28000');

  // Format real pos into UI format
  const formattedPOs = pos.map(po => {
    const qtyMT = parseFloat(po.quantity_kg) / 1000.0;
    const priceMT = parseFloat(po.price_per_mt);
    const valuationVal = qtyMT * priceMT;
    const valuationLakhs = (valuationVal / 100000).toFixed(1);
    
    const commName = dbCommodities?.find(c => c.id === po.commodity_id)?.name || 'Commodity';
    const whName = dbWarehouses?.find(w => w.id === po.warehouse_id)?.name || 'Warehouse';
    
    let uiStatus = 'Pending';
    if (po.status === 'accepted') uiStatus = 'Accepted';
    if (po.status === 'in_transit') uiStatus = 'In Transit';
    if (po.status === 'delivered' || po.status === 'fulfilled') uiStatus = 'Delivered';
    if (po.status === 'cancelled') uiStatus = 'Cancelled';

    let uiPayment = 'Pending';
    if (po.payment_status === 'confirmed') uiPayment = 'Paid';
    if (po.payment_status === 'failed') uiPayment = 'Failed';

    return {
      dbId: po.id,
      id: po.po_code,
      buyerName: po.buyer_id === currentUser?.id ? (currentUser.full_name || 'Buyer') : 'Raigad Mart',
      commodity: `${commName} - ${po.grade}`,
      qty: qtyMT,
      price: priceMT,
      total: `₹${valuationLakhs}L`,
      totalVal: valuationVal,
      warehouse: whName,
      status: uiStatus,
      payment: uiPayment
    };
  }).reverse(); // Latest first

  // Derive payments list from formatted POs
  const paymentsList = formattedPOs
    .filter(po => po.payment === 'Pending' || po.payment === 'Paid')
    .map(po => {
      const isPaid = po.payment === 'Paid';
      return {
        poDbId: po.dbId,
        poId: po.id,
        invId: `INV-2026-${po.id.split('-').pop() || '000'}`,
        buyer: po.buyerName,
        amount: po.total,
        amountVal: po.totalVal,
        due: 'Due Upon Delivery',
        paymentStatus: isPaid ? 'Paid (Razorpay)' : 'Awaiting',
        paymentClass: isPaid ? 'badge-green' : 'badge-gray',
        releaseStatus: isPaid ? 'Released' : 'Held',
        releaseClass: isPaid ? 'badge-green' : 'badge-gray'
      };
    });

  const handlePayRazorpay = (payment) => {
    toast.success(`Initializing Razorpay checkout for invoice ${payment.invId} (Amount: ${payment.amount})...`);
    apiSim.verifyRazorpayPayment(payment.invId, payment.amountVal).then(() => {
      if (onPayPO) {
        onPayPO(payment.poDbId);
      }
      toast.success(`Razorpay payment of ${payment.amount} successfully captured!\ne-WR Negotiable Lien has been Released automatically.`);
    });
  };

  // Helper for Agmarknet prices based on commodity
  const getAgmarknetPrice = (commodity) => {
    if (commodity === 'Rice') return '₹27,600/MT';
    if (commodity === 'Groundnut') return '₹51,800/MT';
    if (commodity === 'Soybean') return '₹38,200/MT';
    if (commodity === 'Wheat') return '₹22,800/MT';
    return '₹18,500/MT';
  };

  // Filtered POs
  const filteredPOs = formattedPOs.filter(po => {
    if (poFilter === 'All') return true;
    if (poFilter === 'Open') return po.status === 'Accepted';
    if (poFilter === 'In Transit') return po.status === 'In Transit';
    if (poFilter === 'Fulfilled') return po.status === 'Delivered';
    return true;
  });

  // Handle Raise PO click from Marketplace
  const handleRaisePO = (lot) => {
    if (onReserveLot) onReserveLot(lot.id);

    const priceRate = lot.commodity === 'Rice' ? 27600 : (lot.commodity === 'Groundnut' ? 51800 : 38200);
    const tonnage = lot.quantity / 1000;
    const newPoId = `PO-2026-0${113 + pos.length}`;
    
    if (onCreatePO) {
      onCreatePO({
        id: newPoId,
        commodity: lot.commodity,
        qty: tonnage,
        price: priceRate,
        warehouse: lot.warehouse
      });
    }

    toast.success(`Institutional PO ${newPoId} raised successfully for Available Lot ${lot.id}! Stock reserved for dispatch.`);
  };

  // Handle Create PO from Form
  const handleCreatePOFormSubmit = (e) => {
    e.preventDefault();
    const qtyMT = Number(newPoQty);
    const priceMT = Number(newPoPrice);
    if (qtyMT <= 0 || priceMT <= 0) {
      toast.error('Please enter valid quantities.');
      return;
    }

    const newPoId = `PO-2026-0${113 + pos.length}`;

    if (onCreatePO) {
      onCreatePO({
        id: newPoId,
        commodity: newPoCommodity,
        qty: qtyMT,
        price: priceMT,
        warehouse: newPoWarehouse
      });
    }

    toast.success(`Purchase Order ${newPoId} created successfully! Awaiting FPO dispatch approval.`);
    
    // Reset form
    setNewPoQty('20');
    setNewPoPrice('28000');
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
    <div className="page active" id="page-market">
      
      {/* 1. AVAILABLE STOCK MARKETPLACE VIEW */}
      {activeTab === 'market' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Available Stock Marketplace</div>
            <div style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '4px' }}>
              Browse real-time FPO warehouse lot inventories and raise institutional purchase orders
            </div>
          </div>

          {/* Available Stock Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title">Listed e-WR Crop Inventory (Mandi Rates Linked)</div>
              <button 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '12px', background: '#fff' }}
                onClick={() => toast.success('eNAM Mandi benchmark rates synchronized successfully.')}
              >
                Sync Mandi Rates (eNAM)
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Lot ID</th>
                    <th>Commodity / Variety</th>
                    <th>AGMARK Grade</th>
                    <th>Net Weight</th>
                    <th>Moisture %</th>
                    <th>Warehouse Hub Location</th>
                    <th>Mandi Price Benchmark</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {intakes.filter(lot => lot.status === 'Available').length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                        No warehouse lots listed in the marketplace currently.
                      </td>
                    </tr>
                  ) : (
                    intakes.filter(lot => lot.status === 'Available').map(lot => (
                      <tr key={lot.id}>
                        <td><strong>{formatLotId(lot.id)}</strong></td>
                        <td>
                          <strong>{lot.commodity}</strong>
                          <div className="td-secondary">{lot.variety}</div>
                        </td>
                        <td>
                          <span className="badge badge-green">Grade A</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{lot.quantity.toLocaleString()} kg</td>
                        <td>{lot.moisture}%</td>
                        <td>{lot.warehouse} · {lot.zone}</td>
                        <td style={{ color: 'var(--blue)', fontWeight: '600' }}>
                          {getAgmarknetPrice(lot.commodity)}
                        </td>
                        <td>
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--green)', borderColor: 'var(--green)' }}
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
        </div>
      )}

      {/* 2. PURCHASE ORDERS TRACKING VIEW */}
      {activeTab === 'purchase-orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Purchase Orders</div>
            <div style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '4px' }}>
              Create custom PO requisitions and track fulfillment statuses & settlement invoices
            </div>
          </div>

          {/* Metric cards */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">Total Open POs</div>
              <div className="stat-value">{formattedPOs.filter(p => p.status === 'Accepted').length}</div>
              <div className="stat-sub">Awaiting dispatch</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Fulfilled</div>
              <div className="stat-value">{formattedPOs.filter(p => p.status === 'Delivered').length}</div>
              <div className="stat-sub">Received at destination</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Payments Awaiting Release</div>
              <div className="stat-value" style={{ color: 'var(--amber)' }}>₹8.4 Lakhs</div>
              <div className="stat-sub">e-WR release on holds</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">e-WR Released</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>₹7.7 Lakhs</div>
              <div className="stat-sub">Lien released on payment</div>
            </div>
          </div>

          <div className="transfers-split-layout">
            
            {/* Left: Create PO Form */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">Create Purchase Order</div>
              </div>
              <form onSubmit={handleCreatePOFormSubmit} style={{ padding: '20px' }}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Commodity *</label>
                    <select 
                      className="form-select"
                      value={newPoCommodity}
                      onChange={(e) => {
                        setNewPoCommodity(e.target.value);
                        const rates = { Rice: 28000, Wheat: 22000, Soybean: 38200, Groundnut: 52000 };
                        setNewPoPrice(rates[e.target.value] ? rates[e.target.value].toString() : '20000');
                      }}
                    >
                      <option value="Rice">Rice</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Soybean">Soybean</option>
                      <option value="Groundnut">Groundnut</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Order Volume (Metric Tons - MT)</label>
                    <input 
                      type="number"
                      className="form-input"
                      value={newPoQty}
                      onChange={(e) => setNewPoQty(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Source FPO Warehouse</label>
                    <select 
                      className="form-select"
                      value={newPoWarehouse}
                      onChange={(e) => setNewPoWarehouse(e.target.value)}
                    >
                      <option value="Wai FPO">Wai FPO Warehouse</option>
                      <option value="Phaltan FPO">Phaltan FPO Warehouse</option>
                      <option value="Baramati FPO">Baramati FPO Warehouse</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Bid Price (₹/MT)</label>
                    <input 
                      type="number"
                      className="form-input"
                      value={newPoPrice}
                      onChange={(e) => setNewPoPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ background: '#1E4D36', borderColor: '#1E4D36' }}>
                    Generate Purchase Order
                  </button>
                </div>
              </form>
            </div>

            {/* Right: PO List */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-title">Purchase Order Registry</div>
                <select 
                  value={poFilter} 
                  onChange={(e) => setPoFilter(e.target.value)}
                  className="form-select"
                  style={{ width: '120px', padding: '4px 8px', fontSize: '12px', background: '#fff' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open (Accepted)</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Fulfilled">Fulfilled</option>
                </select>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>PO No.</th>
                      <th>FPO Warehouse</th>
                      <th>Commodity</th>
                      <th>Qty (MT)</th>
                      <th>Total Value</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPOs.map(po => (
                      <tr key={po.id}>
                        <td><strong>{po.id}</strong></td>
                        <td>{po.warehouse}</td>
                        <td>{po.commodity}</td>
                        <td style={{ fontWeight: '500' }}>{po.qty} MT</td>
                        <td style={{ fontWeight: '600' }}>{po.total}</td>
                        <td>
                          <span className={`badge ${
                            po.status === 'Pending' ? 'badge-gray' :
                            po.status === 'Accepted' ? 'badge-blue' :
                            po.status === 'In Transit' ? 'badge-amber' :
                            'badge-green'
                          }`}>{po.status}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            po.payment === 'Pending' ? 'badge-gray' :
                            po.payment === 'Partial' ? 'badge-amber' :
                            'badge-green'
                          }`}>{po.payment}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Payment Invoice & e-WR Release tracking grid */}
          <div className="card">
            <div className="card-header">
              <div className="section-title">DBT Settlement & e-WR Release Log</div>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Linked PO</th>
                    <th>Total Settlement</th>
                    <th>Due Date</th>
                    <th>DBT Settlement Status</th>
                    <th>e-WR Release Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map(p => (
                    <tr key={p.invId}>
                      <td><strong>{p.invId}</strong></td>
                      <td>{p.poId}</td>
                      <td style={{ fontWeight: '600' }}>{p.amount}</td>
                      <td>{p.due}</td>
                      <td>
                        <span className={`badge ${p.paymentClass}`}>{p.paymentStatus}</span>
                      </td>
                      <td>
                        <span className={`badge ${p.releaseClass}`}>{p.releaseStatus}</span>
                      </td>
                      <td>
                        {p.releaseStatus === 'Held' ? (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--green)', borderColor: 'var(--green)' }}
                            onClick={() => handlePayRazorpay(p)}
                          >
                            💳 Pay via Razorpay
                          </button>
                        ) : p.releaseStatus === 'Partial' ? (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--amber)', borderColor: 'var(--amber)' }}
                            onClick={() => handlePayRazorpay(p)}
                          >
                            💳 Pay Balance
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

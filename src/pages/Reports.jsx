import { useState } from 'react';

export default function Reports({ intakes = [], receipts = [], activities = [] }) {
  const [selectedReport, setSelectedReport] = useState(null);

  // 1. Report structures and details
  const reportsList = [
    {
      id: 'stock-in-hand',
      title: 'Stock-in-hand report',
      subtext: 'By commodity, grade, warehouse, FPO',
      icon: '📦',
      getData: () => intakes.filter(lot => lot.status !== 'Returned'),
      getCSV: () => {
        const header = 'Lot ID,Commodity,Variety,Quantity (kg),Bags,Warehouse,Status,Grade\n';
        const rows = intakes.filter(lot => lot.status !== 'Returned').map(lot => 
          `"${lot.id}","${lot.commodity}","${lot.variety}","${lot.quantity}","${lot.bags}","${lot.warehouse}","${lot.status}","${lot.grade}"`
        ).join('\n');
        return header + rows;
      }
    },
    {
      id: 'inflow-outflow',
      title: 'Inflow / Outflow trends',
      subtext: 'Daily, weekly, seasonal analysis',
      icon: '📊',
      getData: () => activities,
      getCSV: () => {
        const header = 'Timestamp,Operation Type,Description\n';
        const rows = activities.map(act => 
          `"${act.time}","${act.type}","${act.text.replace(/<\/?[^>]+(>|$)/g, "")}"`
        ).join('\n');
        return header + rows;
      }
    },
    {
      id: 'farmer-deposits',
      title: 'Farmer deposit history',
      subtext: 'Deposit, withdrawal, outstanding balance',
      icon: '🧑‍🌾',
      getData: () => {
        // Group deposits by farmer name
        const groups = intakes.reduce((acc, lot) => {
          const fid = lot.farmerId || 'Unknown';
          if (!acc[fid]) {
            acc[fid] = { id: fid, name: lot.farmerName, count: 0, weight: 0, activeWRs: 0 };
          }
          acc[fid].count += 1;
          if (lot.status !== 'Returned') {
            acc[fid].weight += Number(lot.quantity || 0);
          }
          return acc;
        }, {});

        receipts.forEach(wr => {
          const fid = wr.farmerId;
          if (groups[fid] && wr.quantity > 0) {
            groups[fid].activeWRs += 1;
          }
        });

        return Object.values(groups);
      },
      getCSV: () => {
        const data = reportsList.find(r => r.id === 'farmer-deposits').getData();
        const header = 'Farmer ID,Farmer Name,Lots Deposited,Consolidated Weight (kg),Active Warehouse Receipts\n';
        const rows = data.map(f => 
          `"${f.id}","${f.name}","${f.count}","${f.weight}","${f.activeWRs}"`
        ).join('\n');
        return header + rows;
      }
    },
    {
      id: 'quality-analytics',
      title: 'Quality analytics',
      subtext: 'Moisture trends, rejection rates by crop',
      icon: '🧪',
      getData: () => {
        // Aggregate moisture parameters by crop commodity
        const crops = intakes.reduce((acc, lot) => {
          const c = lot.commodity || 'Others';
          if (!acc[c]) {
            acc[c] = { name: c, totalMoisture: 0, count: 0, gradeA: 0, gradeB: 0, rejected: 0 };
          }
          acc[c].totalMoisture += Number(lot.moisture || 0);
          acc[c].count += 1;
          if (lot.grade === 'Grade A') acc[c].gradeA += 1;
          else if (lot.grade === 'Grade B') acc[c].gradeB += 1;
          else if (lot.status === 'Returned' || lot.grade === 'Rejected') acc[c].rejected += 1;
          return acc;
        }, {});

        return Object.values(crops);
      },
      getCSV: () => {
        const data = reportsList.find(r => r.id === 'quality-analytics').getData();
        const header = 'Commodity,Average Moisture (%),Grade A Lots,Grade B Lots,Rejected Lots\n';
        const rows = data.map(c => 
          `"${c.name}","${(c.totalMoisture / c.count).toFixed(1)}%","${c.gradeA}","${c.gradeB}","${c.rejected}"`
        ).join('\n');
        return header + rows;
      }
    },
    {
      id: 'fpo-revenue',
      title: 'FPO revenue report',
      subtext: 'Handling, grading & storage fee income',
      icon: '💰',
      getData: () => {
        // Compute FPO specific earnings based on stock sizes
        const fpos = {
          'Wai FPO': { name: 'Wai FPO', storage: 12400, handling: 3200, grading: 1500 },
          'Phaltan FPO': { name: 'Phaltan FPO', storage: 21500, handling: 5400, grading: 2800 },
          'Baramati FPO': { name: 'Baramati FPO', storage: 9800, handling: 2500, grading: 1200 }
        };

        // Dynamically add weights from current lot sizes to storage fees
        intakes.forEach(lot => {
          const whName = lot.warehouse || 'Wai FPO';
          const matchedKey = Object.keys(fpos).find(k => whName.includes(k));
          if (matchedKey) {
            fpos[matchedKey].storage += Math.round(Number(lot.quantity || 0) * 2.5); // ₹2.5 / kg storage charge
            fpos[matchedKey].handling += Math.round(Number(lot.quantity || 0) * 0.5); // ₹0.5 / kg handling charge
            fpos[matchedKey].grading += 250; // ₹250 flat lab fee
          }
        });

        return Object.values(fpos);
      },
      getCSV: () => {
        const data = reportsList.find(r => r.id === 'fpo-revenue').getData();
        const header = 'FPO Warehouse,Storage Fee Income (₹),Handling Fee Income (₹),Grading Fee Income (₹),Total FPO Income (₹)\n';
        const rows = data.map(f => 
          `"${f.name}","₹${f.storage}","₹${f.handling}","₹${f.grading}","₹${f.storage + f.handling + f.grading}"`
        ).join('\n');
        return header + rows;
      }
    },
    {
      id: 'market-linkage',
      title: 'Market linkage report',
      subtext: 'POs raised, fulfilled, pending, cancelled',
      icon: '🛒',
      getData: () => [
        { id: 'PO-2026-112', buyer: 'Raigad Mart - Mumbai', commodity: 'Wheat', qty: '50 MT', value: 1100000, status: 'Fulfilled' },
        { id: 'PO-2026-113', buyer: 'Vashi Traders', commodity: 'Soybean', qty: '12 MT', value: 566400, status: 'Fulfilled' },
        { id: 'PO-2026-114', buyer: 'Pune Retail Hub', commodity: 'Rice (Basmati)', qty: '20 MT', value: 1250000, status: 'Pending' },
        { id: 'PO-2026-115', buyer: 'Satara Distr', commodity: 'Onion', qty: '8 MT', value: 148000, status: 'Cancelled' }
      ],
      getCSV: () => {
        const data = reportsList.find(r => r.id === 'market-linkage').getData();
        const header = 'Purchase Order ID,Buyer Partner,Commodity,Qty Ordered,Total Value (₹),Status\n';
        const rows = data.map(p => 
          `"${p.id}","${p.buyer}","${p.commodity}","${p.qty}","₹${p.value}","${p.status}"`
        ).join('\n');
        return header + rows;
      }
    }
  ];

  // CSV Exporter helper
  const handleExportCSV = (report) => {
    const csvContent = report.getCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${report.id}_report.csv`);
    a.click();
  };

  const activeReport = reportsList.find(r => r.id === selectedReport);

  return (
    <div className="page active" id="page-reports">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="section-title" style={{ fontSize: '20px' }}>Reports & Analytics</div>
          <div className="section-sub" style={{ color: 'var(--text3)', fontSize: '12.5px', marginTop: '6px' }}>
            Reports & Analytics
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
            Stock, revenue, quality, market linkage
          </div>
        </div>
      </div>

      {/* REPORTS DASHBOARD GRID */}
      <div className="reports-grid">
        {reportsList.map(report => (
          <div className="report-card" key={report.id}>
            <div className="report-card-header">
              <span className="report-card-icon">{report.icon}</span>
              <div className="report-card-title">{report.title}</div>
            </div>
            <div className="report-card-subtext">{report.subtext}</div>
            <div className="report-card-actions">
              <button 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '12px', background: '#fff' }}
                onClick={() => setSelectedReport(report.id)}
              >
                View
              </button>
              <button 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '12px', background: '#fff' }}
                onClick={() => handleExportCSV(report)}
              >
                Export
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL PREVIEW MODAL */}
      {activeReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{activeReport.icon}</span>
                <span>{activeReport.title}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>×</button>
            </div>
            
            <div className="card-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <div className="table-responsive">
                
                {/* 1. STOCK IN HAND */}
                {selectedReport === 'stock-in-hand' && (
                  <table>
                    <thead>
                      <tr>
                        <th>Lot ID</th>
                        <th>Commodity</th>
                        <th>Variety</th>
                        <th>Quantity</th>
                        <th>Bags</th>
                        <th>Warehouse</th>
                        <th>Grade</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReport.getData().map(lot => (
                        <tr key={lot.id}>
                          <td><strong>{lot.id}</strong></td>
                          <td>{lot.commodity}</td>
                          <td>{lot.variety}</td>
                          <td style={{ fontWeight: '500' }}>{lot.quantity.toLocaleString()} kg</td>
                          <td>{lot.bags}</td>
                          <td>{lot.warehouse}</td>
                          <td>
                            <span className={`badge ${lot.gradeClass || 'badge-green'}`}>{lot.grade}</span>
                          </td>
                          <td>
                            <span className={`badge ${lot.status === 'Available' ? 'badge-teal' : 'badge-blue'}`}>
                              {lot.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 2. INFLOW / OUTFLOW TRENDS */}
                {selectedReport === 'inflow-outflow' && (
                  <table>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Type</th>
                        <th>Description Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReport.getData().map((act, index) => (
                        <tr key={index}>
                          <td><strong>{act.time}</strong></td>
                          <td>
                            <span className={`badge ${
                              act.type === 'intake' ? 'badge-green' : 
                              act.type === 'dispatch' ? 'badge-amber' : 
                              act.type === 'qc' ? 'badge-red' : 'badge-blue'
                            }`}>{act.type.toUpperCase()}</span>
                          </td>
                          <td dangerouslySetInnerHTML={{ __html: act.text }}></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 3. FARMER DEPOSITS */}
                {selectedReport === 'farmer-deposits' && (
                  <table>
                    <thead>
                      <tr>
                        <th>Farmer ID</th>
                        <th>Farmer Name</th>
                        <th>Lots Deposited</th>
                        <th>Outstanding Weight</th>
                        <th>Active e-WRs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReport.getData().map(f => (
                        <tr key={f.id}>
                          <td><strong>{f.id}</strong></td>
                          <td style={{ fontWeight: '500' }}>{f.name}</td>
                          <td>{f.count} lots</td>
                          <td style={{ fontWeight: '500' }}>{f.weight.toLocaleString()} kg</td>
                          <td>
                            <span className={`badge ${f.activeWRs > 0 ? 'badge-blue' : 'badge-gray'}`}>
                              {f.activeWRs} active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 4. QUALITY ANALYTICS */}
                {selectedReport === 'quality-analytics' && (
                  <table>
                    <thead>
                      <tr>
                        <th>Commodity</th>
                        <th>Average Moisture (%)</th>
                        <th>Grade A Lots</th>
                        <th>Grade B Lots</th>
                        <th>Rejected Lots</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReport.getData().map(c => (
                        <tr key={c.name}>
                          <td><strong>{c.name}</strong></td>
                          <td style={{ fontWeight: '600', color: 'var(--blue)' }}>
                            {(c.totalMoisture / c.count).toFixed(1)}%
                          </td>
                          <td>{c.gradeA} lots</td>
                          <td>{c.gradeB} lots</td>
                          <td>
                            <span className={`badge ${c.rejected > 0 ? 'badge-red' : 'badge-gray'}`}>
                              {c.rejected} lots
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 5. FPO REVENUE */}
                {selectedReport === 'fpo-revenue' && (
                  <table>
                    <thead>
                      <tr>
                        <th>FPO Warehouse</th>
                        <th>Storage Fees</th>
                        <th>Handling Fees</th>
                        <th>Grading Fees</th>
                        <th>Total Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReport.getData().map(f => {
                        const totalFee = f.storage + f.handling + f.grading;
                        return (
                          <tr key={f.name}>
                            <td><strong>{f.name}</strong></td>
                            <td>₹{f.storage.toLocaleString()}</td>
                            <td>₹{f.handling.toLocaleString()}</td>
                            <td>₹{f.grading.toLocaleString()}</td>
                            <td style={{ fontWeight: '600', color: 'var(--green)' }}>
                              ₹{totalFee.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* 6. MARKET LINKAGE */}
                {selectedReport === 'market-linkage' && (
                  <table>
                    <thead>
                      <tr>
                        <th>PO Ref</th>
                        <th>Buyer Partner</th>
                        <th>Commodity</th>
                        <th>Volume</th>
                        <th>Contract Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReport.getData().map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.id}</strong></td>
                          <td style={{ fontWeight: '500' }}>{p.buyer}</td>
                          <td>{p.commodity}</td>
                          <td>{p.qty}</td>
                          <td style={{ fontWeight: '500' }}>₹{p.value.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${
                              p.status === 'Fulfilled' ? 'badge-green' : 
                              p.status === 'Pending' ? 'badge-blue' : 'badge-amber'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            </div>

            <div className="form-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setSelectedReport(null)}>
                Close Preview
              </button>
              <button className="btn btn-primary" onClick={() => handleExportCSV(activeReport)}>
                📥 Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

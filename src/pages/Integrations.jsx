import { useState, useEffect } from 'react';
import { getTranslation } from '../utils/localization';

export default function Integrations({ language = 'en' }) {
  const t = (key) => getTranslation(key, language);

  const [services, setServices] = useState([
    { id: 'wb', name: 'Weigh Bridge Serial Scales Integration', desc: 'Read weighscale truck weight over serial COM / USB port instantly.', enabled: true, status: 'Active (COM4)' },
    { id: 'ewb', name: 'NIC e-Way Bill API Gateway', desc: 'Auto-verify and synchronise transport passes with national NIC portal.', enabled: true, status: 'Active' },
    { id: 'fb', name: 'Fleetbase Fleet Tracking API', desc: 'Sync truck vehicle positions with live dashboard maps.', enabled: true, status: 'Active' },
    { id: 'sms', name: 'Farmer SMS Notification Gateway', desc: 'Broadcast gatepass receipt and payment confirmations to farmers via text.', enabled: true, status: 'Active' }
  ]);

  const [logs, setLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadLogs = () => {
    const rawLogs = localStorage.getItem('wakhar_api_logs');
    setLogs(rawLogs ? JSON.parse(rawLogs) : []);
  };

  useEffect(() => {
    loadLogs();

    // Listen to live log updates
    const handleLogAdded = () => {
      loadLogs();
    };
    window.addEventListener('wakhar_api_log_added', handleLogAdded);
    return () => {
      window.removeEventListener('wakhar_api_log_added', handleLogAdded);
    };
  }, []);

  const handleToggle = (id) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const nextEnabled = !s.enabled;
        return {
          ...s,
          enabled: nextEnabled,
          status: nextEnabled ? 'Active' : 'Disconnected'
        };
      }
      return s;
    }));
  };

  const handleClearLogs = () => {
    localStorage.setItem('wakhar_api_logs', '[]');
    setLogs([]);
    setExpandedLogId(null);
  };

  const toggleExpandLog = (id) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  return (
    <div className="page active" id="page-integrations" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title" style={{ fontSize: '18px' }}>Third-party Gateways & IoT Connectors</div>
          <div className="section-sub">Configure weighing bridges, e-Way bills, GPS hardware tracking, and text gateways</div>
        </div>
        <button className="btn btn-outline" style={{ background: '#fff' }} onClick={handleClearLogs}>
          Clear Transaction Logs
        </button>
      </div>

      {/* Services grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {services.map(s => (
          <div 
            key={s.id} 
            className="card" 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '16px 20px',
              gap: '20px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 'bold' }}>{s.name}</span>
                <span className={`badge ${s.enabled ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{s.desc}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label 
                style={{ 
                  position: 'relative', 
                  display: 'inline-block', 
                  width: '42px', 
                  height: '22px',
                  cursor: 'pointer'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={s.enabled}
                  onChange={() => handleToggle(s.id)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: s.enabled ? 'var(--green)' : '#ccc',
                    borderRadius: '22px',
                    transition: '0.2s',
                  }}
                >
                  <span 
                    style={{
                      position: 'absolute',
                      height: '16px',
                      width: '16px',
                      left: s.enabled ? '22px' : '4px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.2s',
                    }}
                  />
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* API Logs Terminal Panel */}
      <div className="card" style={{ background: '#1c1a14', color: '#eae6df', border: '1px solid #2e2a22', overflow: 'hidden' }}>
        <div className="card-header" style={{ borderBottom: '1px solid #2e2a22', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#25221b' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--green-mid)', fontFamily: 'monospace' }}>
            🛰️ Live API Gateway Transaction Console (Logs: {logs.length})
          </div>
          <span style={{ fontSize: '11px', color: '#a09887', fontFamily: 'monospace' }}>
            Updates in real-time on operations
          </span>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#807765' }}>
              No API requests logged yet. Perform an Intake, Dispatch, or Collateral Loan to inspect JSON payloads.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {logs.map(log => {
                const isExpanded = expandedLogId === log.id;
                const isSuccess = log.responseStatus < 300;
                
                return (
                  <div key={log.id} style={{ borderBottom: '1px solid #2e2a22' }}>
                    
                    {/* Log Row */}
                    <div 
                      onClick={() => toggleExpandLog(log.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '12px 20px', 
                        cursor: 'pointer',
                        background: isExpanded ? '#25221b' : 'transparent',
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#201d17'; }}
                      onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: '#8a8070' }}>[{log.timestamp}]</span>
                        <span style={{ 
                          color: log.method === 'POST' ? '#3a86c8' : '#e2b83c', 
                          fontWeight: 'bold',
                          width: '45px'
                        }}>
                          {log.method}
                        </span>
                        <span style={{ color: '#eae6df' }}>{log.endpoint}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          color: isSuccess ? '#52b788' : '#ef476f', 
                          fontWeight: 'bold' 
                        }}>
                          {log.responseStatus} {isSuccess ? 'OK' : 'Error'}
                        </span>
                        <span style={{ color: '#8a8070', fontSize: '10px' }}>
                          {isExpanded ? '▲ Hide' : '▼ Inspect'}
                        </span>
                      </div>
                    </div>

                    {/* Inspect Payload Drawer */}
                    {isExpanded && (
                      <div style={{ 
                        background: '#13110d', 
                        padding: '16px 20px', 
                        borderTop: '1px solid #2e2a22',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px'
                      }}>
                        {/* Request */}
                        <div>
                          <div style={{ color: '#8a8070', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Request Payload (JSON)
                          </div>
                          <pre style={{ 
                            background: '#1c1a14', 
                            padding: '12px', 
                            borderRadius: '6px', 
                            border: '1px solid #2e2a22',
                            color: '#a8dadc',
                            overflowX: 'auto',
                            margin: 0,
                            maxHeight: '200px'
                          }}>
                            {log.requestBody}
                          </pre>
                        </div>
                        
                        {/* Response */}
                        <div>
                          <div style={{ color: '#8a8070', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Response Payload (JSON)
                          </div>
                          <pre style={{ 
                            background: '#1c1a14', 
                            padding: '12px', 
                            borderRadius: '6px', 
                            border: '1px solid #2e2a22',
                            color: '#e9c46a',
                            overflowX: 'auto',
                            margin: 0,
                            maxHeight: '200px'
                          }}>
                            {log.responseBody}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

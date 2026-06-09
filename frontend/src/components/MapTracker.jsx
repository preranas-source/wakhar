import { useEffect, useState } from 'react';

export default function MapTracker() {
  // Simulating coordinates traversing along paths
  // Route 1: Wai FPO (35%, 25%) to Satara Aggregator (55%, 60%)
  // Route 2: Phaltan FPO (70%, 40%) to Satara Aggregator (55%, 60%)
  const [vehicle1, setVehicle1] = useState({ top: 44, left: 41, percent: 50 });
  const [vehicle2, setVehicle2] = useState({ top: 62, left: 50, percent: 50 });

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicle1((prev) => {
        const nextPercent = prev.percent >= 100 ? 0 : prev.percent + 2;
        // Linear interpolation between (35, 25) and (55, 60)
        const t = nextPercent / 100;
        const top = 35 + (55 - 35) * t;
        const left = 25 + (60 - 25) * t;
        return { top, left, percent: nextPercent };
      });

      setVehicle2((prev) => {
        const nextPercent = prev.percent >= 100 ? 0 : prev.percent + 3;
        // Linear interpolation between (70, 40) and (55, 60)
        const t = nextPercent / 100;
        const top = 70 + (55 - 70) * t;
        const left = 40 + (60 - 40) * t;
        return { top, left, percent: nextPercent };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="map-box" style={{ height: '260px' }}>
      {/* SVG Path lines between nodes */}
      <svg 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {/* Wai to Satara path */}
        <line 
          x1="25%" y1="35%" 
          x2="60%" y2="55%" 
          stroke="var(--green)" 
          strokeWidth="2" 
          strokeDasharray="4 4"
          opacity="0.4"
        />
        {/* Phaltan to Satara path */}
        <line 
          x1="40%" y1="70%" 
          x2="60%" y2="55%" 
          stroke="var(--green)" 
          strokeWidth="2" 
          strokeDasharray="4 4"
          opacity="0.4"
        />
      </svg>

      {/* Pins */}
      <div className="map-pin" style={{ top: '35%', left: '25%' }}>
        <div className="map-label">Wai FPO Warehouse</div>
      </div>
      <div className="map-pin" style={{ top: '55%', left: '60%' }}>
        <div className="map-label">Satara Aggregator</div>
      </div>
      <div className="map-pin" style={{ top: '70%', left: '40%' }}>
        <div className="map-label">Phaltan FPO Warehouse</div>
      </div>

      {/* Moving Vehicles */}
      <div 
        className="map-vehicle" 
        style={{ 
          top: `${vehicle1.top}%`, 
          left: `${vehicle1.left}%`,
          backgroundColor: 'var(--amber)'
        }}
        title="Vehicle MH-11-AB-4421 (Soybean)"
      />
      <div 
        className="map-vehicle" 
        style={{ 
          top: `${vehicle2.top}%`, 
          left: `${vehicle2.left}%`,
          backgroundColor: 'var(--blue)'
        }}
        title="Vehicle MH-12-PQ-9080 (Wheat)"
      />

      <div 
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '10px',
          fontSize: '11px',
          color: 'var(--green)',
          fontWeight: '600',
          background: 'rgba(255,255,255,0.92)',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)'
        }}
      >
        🟢 Warehouses &nbsp;&nbsp; 🟡 🔵 Active Vehicles
      </div>
    </div>
  );
}

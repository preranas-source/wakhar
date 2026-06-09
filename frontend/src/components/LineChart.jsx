

export default function LineChart({ 
  data = [400, 600, 850, 1100, 950, 1842], 
  labels = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], 
  color = '#2D6A4F', 
  fillColor = 'rgba(82, 183, 136, 0.15)',
  suffix = ' MT'
}) {
  const chartHeight = 160;
  const chartWidth = 360;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const maxVal = Math.max(...data) * 1.1; // 10% headroom
  const minVal = 0;
  const range = maxVal - minVal;

  const getX = (index) => {
    return padding.left + (index * (chartWidth - padding.left - padding.right)) / (data.length - 1);
  };

  const getY = (value) => {
    return chartHeight - padding.bottom - ((value - minVal) / range) * (chartHeight - padding.top - padding.bottom);
  };

  // Generate SVG path coordinate strings
  let pathD = '';
  let areaD = '';

  data.forEach((val, i) => {
    const x = getX(i);
    const y = getY(val);
    if (i === 0) {
      pathD += `M ${x} ${y}`;
      areaD += `M ${x} ${chartHeight - padding.bottom} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
    if (i === data.length - 1) {
      areaD += ` L ${x} ${chartHeight - padding.bottom} Z`;
    }
  });

  // Calculate ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => Math.round(minVal + (range / (yTicks - 1)) * i));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {/* Horizontal Gridlines & Y Ticks */}
        {yTickValues.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={i}>
              <line 
                x1={padding.left} 
                y1={y} 
                x2={chartWidth - padding.right} 
                y2={y} 
                stroke="#EDE9E0" 
                strokeWidth="1" 
              />
              <text 
                x={padding.left - 8} 
                y={y + 4} 
                fontSize="10" 
                fill="#8A8070" 
                textAnchor="end"
                fontFamily="var(--font-sans)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* X Ticks & Labels */}
        {labels.map((label, i) => {
          const x = getX(i);
          return (
            <g key={i}>
              <text 
                x={x} 
                y={chartHeight - 8} 
                fontSize="10" 
                fill="#8A8070" 
                textAnchor="middle"
                fontFamily="var(--font-sans)"
              >
                {label}
              </text>
              <line
                x1={x}
                y1={chartHeight - padding.bottom}
                x2={x}
                y2={chartHeight - padding.bottom + 4}
                stroke="#C8C0AE"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Area under curve */}
        {data.length > 0 && (
          <path d={areaD} fill={fillColor} />
        )}

        {/* Line curve */}
        {data.length > 0 && (
          <path 
            d={pathD} 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {data.map((val, i) => {
          const x = getX(i);
          const y = getY(val);
          return (
            <g key={i} className="chart-node" style={{ cursor: 'pointer' }}>
              <circle 
                cx={x} 
                cy={y} 
                r="4" 
                fill={color} 
                stroke="#fff" 
                strokeWidth="1.5" 
              />
              <title>{`${labels[i]}: ${val}${suffix}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

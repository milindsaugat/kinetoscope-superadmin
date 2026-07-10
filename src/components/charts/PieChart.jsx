/* ============================================================
   Component: PieChart.jsx
   Description: Investment status pie/donut chart (Active/Pending/Closed)
   ============================================================ */

import { useState } from 'react';

export default function PieChart({ data, size = 200, strokeWidth = 28 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  // Calculate segment offsets
  let accumulated = 0;
  const segments = data.map((item, i) => {
    const percent = item.percentage / 100;
    const dashArray = circumference * percent;
    const dashOffset = circumference * (1 - accumulated / 100);
    accumulated += item.percentage;
    return {
      ...item,
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className="kfpl-donut-wrap">
      <svg width={size} height={size} className="kfpl-donut">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(208, 215, 226, 0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={hoveredIndex === i ? strokeWidth + 6 : strokeWidth}
            strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
            strokeDashoffset={seg.dashOffset}
            className="kfpl-donut-segment"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              transition: 'stroke-width 0.25s ease, opacity 0.25s ease',
              opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.5 : 1,
              filter: hoveredIndex === i ? `drop-shadow(0 0 8px ${seg.color}55)` : 'none',
            }}
          />
        ))}
      </svg>
      <div className="kfpl-donut-center">
        <span className="kfpl-donut-center-value">
          {hoveredIndex !== null ? segments[hoveredIndex].count : totalCount}
        </span>
        <span className="kfpl-donut-center-label">
          {hoveredIndex !== null ? segments[hoveredIndex].status : 'Total'}
        </span>
      </div>
    </div>
  );
}

/* ============ END: PieChart.jsx ============ */

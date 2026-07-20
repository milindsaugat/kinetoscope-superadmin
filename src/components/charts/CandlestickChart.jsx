/* ============================================================
   Component: CandlestickChart.jsx
   Description: OHLC candlestick chart for investment performance
   ============================================================ */

import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const BULL_COLOR = '#2E7D32';
const BEAR_COLOR = '#C62828';
const BULL_COLOR_LIGHT = 'rgba(46, 125, 50, 0.15)';
const BEAR_COLOR_LIGHT = 'rgba(198, 40, 40, 0.15)';

export default function CandlestickChart({ data, height = 300 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const padding = { top: 24, right: 16, bottom: 50, left: 16 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = (chartHeight - padding.top - padding.bottom) * 0.7; // 70% for candles
  const volumeH = (chartHeight - padding.top - padding.bottom) * 0.2; // 20% for volume
  const volumeTop = padding.top + plotH + 12;

  const allPrices = data.flatMap(d => [d.high, d.low]);
  const maxPrice = Math.max(...allPrices) * 1.05;
  const minPrice = Math.min(...allPrices) * 0.95;
  const priceRange = maxPrice - minPrice;

  const maxVolume = Math.max(...data.map(d => d.volume));

  const candleWidth = plotW / data.length * 0.55;
  const getX = (i) => padding.left + (i + 0.5) * (plotW / data.length);
  const getY = (val) => padding.top + plotH - ((val - minPrice) / priceRange) * plotH;

  // Grid lines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = minPrice + (priceRange / gridCount) * i;
    return { y: getY(val), val };
  });

  return (
    <div className="kfpl-candle-chart-wrap" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: `${height}px` }}
      >
        <defs>
          <linearGradient id="candleBullGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
          <linearGradient id="candleBearGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF5350" />
            <stop offset="100%" stopColor="#C62828" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g>
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={g.y}
                x2={chartWidth - padding.right}
                y2={g.y}
                stroke="rgba(208, 215, 226, 0.2)"
                strokeDasharray="3 3"
              />
              <text
                x={chartWidth - padding.right + 4}
                y={g.y + 3}
                style={{
                  fontSize: '9px',
                  fill: '#8892A4',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {g.val.toFixed(1)}
              </text>
            </g>
          ))}
        </g>

        {/* Volume separator line */}
        <line
          x1={padding.left}
          y1={volumeTop - 6}
          x2={chartWidth - padding.right}
          y2={volumeTop - 6}
          stroke="rgba(208, 215, 226, 0.3)"
          strokeDasharray="2 2"
        />

        {/* Candles */}
        {data.map((d, i) => {
          const isBull = d.close >= d.open;
          const x = getX(i);
          const bodyTop = getY(Math.max(d.open, d.close));
          const bodyBottom = getY(Math.min(d.open, d.close));
          const bodyH = Math.max(bodyBottom - bodyTop, 2);
          const wickTop = getY(d.high);
          const wickBottom = getY(d.low);
          const isHovered = hoveredIndex === i;
          const color = isBull ? BULL_COLOR : BEAR_COLOR;
          const gradId = isBull ? 'url(#candleBullGrad)' : 'url(#candleBearGrad)';

          // Volume bar
          const volH = (d.volume / maxVolume) * volumeH;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hover highlight */}
              {isHovered && (
                <rect
                  x={x - plotW / data.length / 2}
                  y={padding.top}
                  width={plotW / data.length}
                  height={chartHeight - padding.top - padding.bottom}
                  fill={isBull ? BULL_COLOR_LIGHT : BEAR_COLOR_LIGHT}
                  rx={4}
                />
              )}

              {/* Wick (high-low line) */}
              <line
                x1={x}
                y1={wickTop}
                x2={x}
                y2={wickBottom}
                stroke={color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                style={{ transition: 'stroke-width 0.2s ease' }}
              />

              {/* Candle body */}
              <rect
                x={x - (isHovered ? candleWidth / 2 + 2 : candleWidth / 2)}
                y={bodyTop}
                width={isHovered ? candleWidth + 4 : candleWidth}
                height={bodyH}
                rx={2}
                fill={gradId}
                stroke={color}
                strokeWidth={0.5}
                style={{
                  transition: 'all 0.2s ease',
                  filter: isHovered ? `drop-shadow(0 2px 6px ${color}44)` : 'none',
                }}
              />

              {/* Volume bar */}
              <rect
                x={x - candleWidth / 2}
                y={volumeTop + volumeH - volH}
                width={candleWidth}
                height={volH}
                rx={2}
                fill={color}
                opacity={isHovered ? 0.6 : 0.2}
                style={{ transition: 'opacity 0.2s ease' }}
              />

              {/* X-axis label */}
              <text
                x={x}
                y={chartHeight - 6}
                textAnchor="middle"
                style={{
                  fontSize: '10px',
                  fill: isHovered ? '#1A1A2E' : '#8892A4',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: isHovered ? 600 : 400,
                  transition: 'fill 0.2s ease',
                }}
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (() => {
        const d = data[hoveredIndex];
        const isBull = d.close >= d.open;
        return (
          <div
            className="kfpl-chart-tooltip kfpl-candle-tooltip"
            style={{
              left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
              top: '4px',
              transform: 'translateX(-50%)',
              borderLeft: `3px solid ${isBull ? BULL_COLOR : BEAR_COLOR}`,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.month} 2025</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px', fontSize: '11px' }}>
              <span style={{ opacity: 0.7 }}>Open</span><span>{d.open.toFixed(1)} Cr</span>
              <span style={{ opacity: 0.7 }}>High</span><span>{d.high.toFixed(1)} Cr</span>
              <span style={{ opacity: 0.7 }}>Low</span><span>{d.low.toFixed(1)} Cr</span>
              <span style={{ opacity: 0.7 }}>Close</span><span style={{ color: isBull ? '#4CAF50' : '#EF5350', fontWeight: 600 }}>{d.close.toFixed(1)} Cr</span>
              <span style={{ opacity: 0.7 }}>Volume</span><span>{formatCurrency(d.volume)}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ============ END: CandlestickChart.jsx ============ */

/* ============================================================
   Component: KpiCard.jsx
   Description: Dashboard KPI card with icon, value, trend, sparkline
   ============================================================ */

import { useEffect, useState } from 'react';

// Helper to parse values
const parseValueString = (valStr) => {
  if (valStr === undefined || valStr === null) return null;
  const str = String(valStr).trim();
  
  // 1. Extract suffix (Cr, L, % or standard suffix)
  let suffixMatch = str.match(/(.*?)\s*(Cr|L|%)$/);
  let mainPart = str;
  let extractedSuffix = '';
  if (suffixMatch) {
    mainPart = suffixMatch[1].trim();
    extractedSuffix = suffixMatch[2];
  }

  // 2. Extract prefix and numerical value
  let numMatch = mainPart.match(/^([^0-9\.\-]*)([\d,\.\-]+)(.*)$/);
  if (!numMatch) return null;

  let prefix = numMatch[1] || '';
  let numberStr = numMatch[2] || '';
  let extraSuffix = numMatch[3] || '';

  // Clean commas to parse float
  let cleanNumberStr = numberStr.replace(/,/g, '');
  let numberVal = parseFloat(cleanNumberStr);
  if (isNaN(numberVal)) return null;

  // Detect decimal places
  let decimals = 0;
  let dotIndex = numberStr.indexOf('.');
  if (dotIndex !== -1) {
    decimals = numberStr.length - dotIndex - 1;
  }

  return {
    prefix,
    numberVal,
    decimals,
    suffix: (extraSuffix + extractedSuffix).trim()
  };
};

// Helper to format values
const formatOdometerValue = (val, decimals, prefix) => {
  let formatted = val.toFixed(decimals);
  let parts = formatted.split('.');
  let integerPart = parseFloat(parts[0]);
  let formattedInteger = isNaN(integerPart) ? parts[0] : integerPart.toLocaleString('en-IN');
  
  if (parts[0] === '-0') {
    formattedInteger = '-0';
  }

  let result = prefix + formattedInteger;
  if (parts[1]) {
    result += '.' + parts[1];
  }
  return result;
};

// Vertical Odometer component
const OdometerValue = ({ numericStr, visible }) => {
  if (!numericStr) return null;
  
  return (
    <span className="kfpl-odometer-wrapper">
      {numericStr.split('').map((char, index) => {
        const isDigit = /\d/.test(char);
        if (!isDigit) {
          return (
            <span key={index} className="kfpl-odometer-char">
              {char}
            </span>
          );
        }

        const digitVal = visible ? parseInt(char, 10) : 0;

        return (
          <span key={index} className="kfpl-odometer-digit-container">
            <span
              className="kfpl-odometer-digit-reel"
              style={{
                transform: `translateY(-${digitVal * 10}%)`,
                transitionDelay: `${index * 40}ms`
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default function KpiCard({ title, value, suffix, trend, trendDirection, icon, iconColor, variant, pulse, delay = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const parsedInfo = parseValueString(value);
  const displaySuffix = parsedInfo ? (parsedInfo.suffix || suffix) : suffix;
  const finalNumericStr = parsedInfo ? formatOdometerValue(parsedInfo.numberVal, parsedInfo.decimals, parsedInfo.prefix) : '';

  return (
    <div
      className={`kfpl-card kfpl-kpi-card ${visible ? 'visible' : ''} ${variant === 'gold' ? 'kfpl-card--gold' : ''} ${pulse ? 'kfpl-kpi-pulse' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {/* Subtle sparkline background decoration */}
      <div className="kfpl-kpi-sparkline-bg" aria-hidden="true">
        <svg viewBox="0 0 120 40" preserveAspectRatio="none">
          <path
            d="M0,35 Q15,30 25,25 T50,20 T75,15 T100,22 T120,10"
            fill="none"
            stroke={variant === 'gold' ? 'rgba(201,168,76,0.12)' : 'rgba(13,27,42,0.06)'}
            strokeWidth="1.5"
          />
          <path
            d="M0,35 Q15,30 25,25 T50,20 T75,15 T100,22 T120,10 L120,40 L0,40 Z"
            fill={variant === 'gold' ? 'rgba(201,168,76,0.04)' : 'rgba(13,27,42,0.02)'}
          />
        </svg>
      </div>

      <div className="kfpl-kpi-info">
        <span className="kfpl-kpi-label">{title}</span>
        <span className="kfpl-kpi-value">
          {parsedInfo ? (
            <OdometerValue numericStr={finalNumericStr} visible={visible} />
          ) : (
            value
          )}
          {displaySuffix && <span className="kfpl-kpi-suffix">{displaySuffix}</span>}
        </span>
        {trend && (
          <span className={`kfpl-kpi-trend ${trendDirection}`}>
            {trendDirection === 'up' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            )}
            {trend}
          </span>
        )}
      </div>
      <div className={`kfpl-kpi-icon ${iconColor || 'navy'}`}>
        {icon}
      </div>
    </div>
  );
}

/* ============ END: KpiCard.jsx ============ */

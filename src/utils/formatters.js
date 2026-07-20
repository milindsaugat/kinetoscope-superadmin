/* ============================================================
   Utils: formatters.js (super-admin)
   Description: Formatting helpers for Currency, Numbers, Tiers, etc.
   ============================================================ */

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-IN');
}

export function getCategoryFromAmount(amount) {
  if (amount > 30000000) return 'platinum';
  if (amount > 10000000) return 'diamond';
  if (amount > 2500000) return 'gold';
  return 'silver';
}

export function formatClientID(rawId) {
  if (!rawId || rawId === '—') return 'KFPL-CL-1001';
  const str = String(rawId).trim();
  if (str.toUpperCase().startsWith('KFPL-CL-')) return str.toUpperCase();

  const digits = str.match(/\d+/);
  if (digits) {
    let val = parseInt(digits[0], 10);
    if (val < 1000) val += 1000;
    return `KFPL-CL-${val}`;
  }
  return 'KFPL-CL-1001';
}

export function formatAgentID(rawId) {
  if (!rawId || rawId === '—') return 'KFPL-AG-1001';
  const str = String(rawId).trim();
  if (str.toUpperCase().startsWith('KFPL-AG-')) return str.toUpperCase();

  const digits = str.match(/\d+/);
  if (digits) {
    let val = parseInt(digits[0], 10);
    if (val < 1000) val += 1000;
    return `KFPL-AG-${val}`;
  }
  return 'KFPL-AG-1001';
}

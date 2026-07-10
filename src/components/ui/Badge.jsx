/* ============================================================
   Component: Badge.jsx
   Description: Status badge with color variants
   ============================================================ */

export default function Badge({ status, children }) {
  const statusClass = status ? `kfpl-badge--${status.toLowerCase()}` : '';
  return (
    <span className={`kfpl-badge ${statusClass}`}>
      {children || status}
    </span>
  );
}

/* ============ END: Badge.jsx ============ */

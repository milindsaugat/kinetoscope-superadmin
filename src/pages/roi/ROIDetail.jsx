/* ============================================================
   Page: ROIDetail.jsx
   Description: Single ROI record detail
   ============================================================ */

import { useParams, useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import { investors, formatCurrency } from '../../data/mockData';

export default function ROIDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find ROI record across all investors
  let roiRecord = null;
  let investor = null;
  for (const inv of investors) {
    const roi = inv.roiHistory.find(r => r.id === Number(id));
    if (roi) { roiRecord = roi; investor = inv; break; }
  }

  if (!roiRecord || !investor) {
    return (
      <div className="kfpl-page">
        <div className="kfpl-empty">
          <div className="kfpl-empty-title">ROI record not found</div>
          <button className="kfpl-btn kfpl-btn--primary mt-4" onClick={() => navigate('/roi')}>Back to ROI List</button>
        </div>
      </div>
    );
  }

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">ROI Detail</h2>
          <p className="kfpl-page-subtitle">{investor.name} — {roiRecord.month}</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/roi')}>← Back</button>
        </div>
      </div>

      <div className="kfpl-detail-grid">
        <div className="kfpl-detail-info-card">
          <div className="kfpl-detail-info-title">ROI Information</div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Investor</span><span className="kfpl-detail-info-value">{investor.name}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Client ID</span><span className="kfpl-detail-info-value">{investor.clientId}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Month</span><span className="kfpl-detail-info-value">{roiRecord.month}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">ROI %</span><span className="kfpl-detail-info-value">{investor.roiPercentage}%</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Amount</span><span className="kfpl-detail-info-value" style={{ color: 'var(--color-gold-dark)', fontWeight: 700 }}>{formatCurrency(roiRecord.amount)}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Status</span><span className="kfpl-detail-info-value"><Badge status={roiRecord.status}>{roiRecord.status}</Badge></span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Paid At</span><span className="kfpl-detail-info-value">{roiRecord.paidAt || '—'}</span></div>
        </div>

        <div className="kfpl-detail-info-card">
          <div className="kfpl-detail-info-title">Investor Portfolio Summary</div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Total Investment</span><span className="kfpl-detail-info-value">{formatCurrency(investor.totalInvestment)}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Category</span><span className="kfpl-detail-info-value"><Badge status={investor.category}>{investor.category}</Badge></span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Active Investments</span><span className="kfpl-detail-info-value">{investor.investments.length}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Total ROI Payments</span><span className="kfpl-detail-info-value">{investor.roiHistory.length}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Paid</span><span className="kfpl-detail-info-value">{investor.roiHistory.filter(r => r.status === 'paid').length}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Pending</span><span className="kfpl-detail-info-value">{investor.roiHistory.filter(r => r.status === 'pending').length}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ============ END: ROIDetail.jsx ============ */

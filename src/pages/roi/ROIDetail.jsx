/* ============================================================
   Page: ROIDetail.jsx
   Description: Single ROI record detail fetched dynamically from API
   ============================================================ */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { apiRequest } from '../../config/apiHelper';

export default function ROIDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roiRecord, setRoiRecord] = useState(null);
  const [investor, setInvestor] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRoiDetail = async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`/api/super-admin/roi/payouts?status=All&recipientType=All`).catch(() => null);
        const list = res?.payouts || res?.data?.payouts || res?.data || (Array.isArray(res) ? res : []);
        
        if (Array.isArray(list)) {
          const match = list.find(r => String(r._id || r.id) === String(id));
          if (match && isMounted) {
            setRoiRecord({
              id: match._id || match.id,
              month: match.month || match.payoutMonth || '—',
              amount: match.amount || 0,
              status: (match.status || 'pending').toLowerCase(),
              paidAt: match.paidAt || match.processedDate || '—'
            });
            setInvestor({
              name: match.recipientName || match.clientName || 'Client',
              clientId: match.recipientId || match.clientCode || '—',
              roiPercentage: match.roiRate || match.roiPercentage || 0,
              totalInvestment: match.investmentAmount || match.totalInvestment || 0,
              category: match.tier || 'Silver',
              investmentsCount: 1,
              totalRoiPayments: list.filter(l => l.recipientId === match.recipientId).length,
              paidCount: list.filter(l => l.recipientId === match.recipientId && String(l.status).toLowerCase() === 'paid').length,
              pendingCount: list.filter(l => l.recipientId === match.recipientId && String(l.status).toLowerCase() === 'pending').length
            });
          }
        }
      } catch (err) {
        console.error('Failed to load ROI detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRoiDetail();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="kfpl-page">
        <div className="kfpl-empty">
          <div className="kfpl-empty-title">Loading ROI detail...</div>
        </div>
      </div>
    );
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
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Status</span><span className="kfpl-detail-info-value"><Badge status={roiRecord.status}>{roiRecord.status.toUpperCase()}</Badge></span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Paid At</span><span className="kfpl-detail-info-value">{roiRecord.paidAt || '—'}</span></div>
        </div>

        <div className="kfpl-detail-info-card">
          <div className="kfpl-detail-info-title">Investor Portfolio Summary</div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Total Investment</span><span className="kfpl-detail-info-value">{formatCurrency(investor.totalInvestment)}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Category</span><span className="kfpl-detail-info-value"><Badge status={investor.category}>{investor.category}</Badge></span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Active Investments</span><span className="kfpl-detail-info-value">{investor.investmentsCount}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Total ROI Payments</span><span className="kfpl-detail-info-value">{investor.totalRoiPayments}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Paid</span><span className="kfpl-detail-info-value">{investor.paidCount}</span></div>
          <div className="kfpl-detail-info-row"><span className="kfpl-detail-info-label">Pending</span><span className="kfpl-detail-info-value">{investor.pendingCount}</span></div>
        </div>
      </div>
    </div>
  );
}

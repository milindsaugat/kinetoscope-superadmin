/* ============================================================
   Page: ApprovalHistory.jsx
   Description: History log of past approvals/rejections
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { approvalHistory, formatCurrency } from '../../data/mockData';
import { apiRequest } from '../../config/apiHelper';

export default function ApprovalHistory() {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/api/super-admin/transactions/history?search=`);
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (data.history || data.logs || []);
      
      const mapped = list.map((item, idx) => ({
        id: item.id || item._id || idx,
        type: item.type || 'deposit',
        investorName: item.investorName || (item.clientId && typeof item.clientId === 'object' ? item.clientId.name : '') || '—',
        clientId: item.investorCode || (item.clientId && typeof item.clientId === 'object' ? item.clientId.clientCode : item.clientId) || '—',
        amount: Number(item.amount || 0),
        date: item.date || item.createdAt || '—',
        status: (item.status || 'approved').toLowerCase(),
        adminNote: item.adminNote || item.remarks || item.rejectionReason || '',
        actionAt: item.actionAt || item.updatedAt || '—'
      }));
      setHistoryData(mapped);
    } catch (err) {
      console.error('Failed to load approval history:', err);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const columns = [
    {
      header: 'Investor',
      accessor: 'investorName',
      render: (row) => (
        <div>
          <div className="kfpl-table-cell-primary">{row.investorName}</div>
          <div className="kfpl-table-cell-secondary">{row.clientId}</div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => <Badge status={row.type === 'deposit' ? 'active' : 'pending'}>{row.type}</Badge>,
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span>,
    },
    { header: 'Date', accessor: 'date' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Admin Note',
      accessor: 'adminNote',
      render: (row) => <span className="text-sm text-muted">{row.adminNote || '—'}</span>,
    },
    { header: 'Action Time', accessor: 'actionAt' },
  ];

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Approval History</h2>
          <p className="kfpl-page-subtitle">Complete log of past approved and rejected requests</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/approvals')}>← Back to Queue</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          Loading approval history...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={historyData}
          searchPlaceholder="Search by investor name..."
        />
      )}
    </div>
  );
}

/* ============ END: ApprovalHistory.jsx ============ */

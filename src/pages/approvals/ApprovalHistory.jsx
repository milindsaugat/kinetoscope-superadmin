/* ============================================================
   Page: ApprovalHistory.jsx
   Description: History log of past approvals/rejections
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { approvalHistory, formatCurrency } from '../../data/mockData';

export default function ApprovalHistory() {
  const navigate = useNavigate();

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

      <DataTable
        columns={columns}
        data={approvalHistory}
        searchPlaceholder="Search by investor name..."
      />
    </div>
  );
}

/* ============ END: ApprovalHistory.jsx ============ */

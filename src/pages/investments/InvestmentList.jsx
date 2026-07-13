/* ============================================================
   Page: InvestmentList.jsx
   Description: All investments across all clients
   ============================================================ */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { investors, formatCurrency } from '../../data/mockData';
import { apiRequest } from '../../config/apiHelper';
import { useToast } from '../../components/ui/Toast';

function formatDateDMY(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}/${mon}/${yr}`;
}

function getEndDateDMY(dateStr, periodMonths) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = parseInt(periodMonths, 10) || 24; // Default to 24 months
  d.setMonth(d.getMonth() + months);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}/${mon}/${yr}`;
}

function getEndDateYYYYMMDD(dateStr, periodMonths) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = parseInt(periodMonths, 10) || 24;
  d.setMonth(d.getMonth() + months);
  const yr = d.getFullYear();
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mon}-${day}`;
}

export default function InvestmentList() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [extendingInvestment, setExtendingInvestment] = useState(null);
  const [extensionEndDate, setExtensionEndDate] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete investment state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInvestmentId, setDeleteInvestmentId] = useState(null);

  // Clear all investments state
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const handleDeleteInvestmentClick = (id) => {
    setDeleteInvestmentId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteInvestment = async () => {
    if (!deleteInvestmentId) return;
    try {
      await apiRequest(`/api/super-admin/investments/${deleteInvestmentId}`, {
        method: 'DELETE'
      });
      addToast('Investment deleted successfully.', 'success', 'Deleted');
      setShowDeleteModal(false);
      setDeleteInvestmentId(null);
      setRenderTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete investment:', err);
      addToast(err.message || 'Failed to delete investment.', 'error', 'Error');
    }
  };

  const handleClearAllInvestments = async () => {
    try {
      await apiRequest('/api/super-admin/investments', {
        method: 'DELETE'
      });
      addToast('All investments cleared successfully.', 'success', 'Data Cleared');
      setShowClearAllModal(false);
      setRenderTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to clear investments:', err);
      addToast(err.message || 'Failed to clear investments.', 'error', 'Error');
    }
  };

  useEffect(() => {
    const fetchInvestments = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('/api/super-admin/investments');
        const list = Array.isArray(data)
          ? data
          : (data.investments || data.data?.investments || (data.data && Array.isArray(data.data) ? data.data : []));
        setInvestments(list);
      } catch (err) {
        console.error('Failed to fetch investments from API', err);
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [renderTrigger]);

  const handleExtendContractToDate = async (investmentId, newEndDateStr) => {
    if (!newEndDateStr) return;
    
    try {
      // Call the backend PATCH API for contract extension
      await apiRequest(`/api/super-admin/investments/${investmentId}/extend`, {
        method: 'PATCH',
        body: JSON.stringify({ newEndDate: new Date(newEndDateStr).toISOString() })
      });

      addToast('Contract successfully extended!', 'success', 'Contract Extended');
      // Refresh the investments list from the API
      setRenderTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to extend contract via API:', err);
      
      // Fallback: update local state if API fails
      const selectedEndDate = new Date(newEndDateStr);
      let investment = investments.find(i => (i._id || i.id) === investmentId);
      if (!investment) {
        investment = mockInvestments.find(i => (i._id || i.id) === investmentId);
      }
      
      if (investment) {
        const startDate = new Date(investment.investmentDate || investment.date || investment.createdAt);
        const yearsDiff = selectedEndDate.getFullYear() - startDate.getFullYear();
        const monthsDiff = selectedEndDate.getMonth() - startDate.getMonth();
        const calculatedMonths = Math.max(1, (yearsDiff * 12) + monthsDiff);

        setInvestments(prev => prev.map(inv => {
          if ((inv._id || inv.id) === investmentId) {
            return { ...inv, contractPeriod: calculatedMonths, durationMonths: calculatedMonths };
          }
          return inv;
        }));

        addToast(`Contract extended locally. New duration: ${calculatedMonths} Months.`, 'warning', 'Local Update');
      } else {
        addToast(err.message || 'Failed to extend contract.', 'danger', 'Error');
      }
    }
  };

  // Filter out mock data from both local fallback and backend database seeded objects
  const cleanInvestments = useMemo(() => {
    const mockNames = ['John Doe', 'Sunil Verma', 'Kavita Reddy', 'Amit Joshi', 'Meera Iyer', 'Suresh Patel'];
    return investments.filter(inv => {
      const clientName = inv.clientName || 
                         inv.investorName || 
                         (inv.clientId && typeof inv.clientId === 'object' ? (inv.clientId.profile?.fullName || inv.clientId.userId?.name) : '') || 
                         '';
      return !mockNames.includes(clientName);
    });
  }, [investments]);

  const rawDisplayData = cleanInvestments;

  const uniqueSegments = useMemo(() => {
    return Array.from(new Set(rawDisplayData.map(inv => inv.segment))).filter(Boolean);
  }, [rawDisplayData]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(rawDisplayData.map(inv => inv.status || 'Active'))).filter(Boolean);
  }, [rawDisplayData]);

  const filteredDisplayData = useMemo(() => {
    return rawDisplayData.filter(inv => {
      if (segmentFilter !== 'all' && inv.segment !== segmentFilter) return false;
      if (statusFilter !== 'all' && (inv.status || 'Active') !== statusFilter) return false;
      return true;
    });
  }, [rawDisplayData, segmentFilter, statusFilter]);

  const columns = [
    {
      header: 'Client',
      accessor: 'clientId',
      render: (row) => {
        const clientObj = row.clientId && typeof row.clientId === 'object' ? row.clientId : null;
        const clientName = row.clientName || 
                           row.investorName || 
                           clientObj?.profile?.fullName || 
                           clientObj?.userId?.name || 
                           (typeof row.clientId === 'string' && !/^[0-9a-fA-F]{24}$/.test(row.clientId) ? row.clientId : '') || 
                           'N/A';
        const clientCode = row.clientCode || 
                           clientObj?.clientCode || 
                           clientObj?.profile?.clientCode || 
                           clientObj?.userId?.clientCode || 
                           '';
        return (
          <div>
            <div className="kfpl-table-cell-primary">{clientName}</div>
            {clientCode && <div className="kfpl-table-cell-secondary">{clientCode}</div>}
          </div>
        );
      },
    },
    { 
      header: 'Segment', 
      accessor: 'segment', 
      render: (row) => {
        const segmentText = row.segment || 
                            (Array.isArray(row.segmentAllocation) && row.segmentAllocation.length > 0
                              ? row.segmentAllocation.map(s => s.segmentName).join(', ')
                              : '—');
        return <span className="font-medium">{segmentText}</span>;
      } 
    },
    { header: 'Amount', accessor: 'investmentAmount', render: (row) => <span className="font-semibold">{formatCurrency(row.investmentAmount || row.amount || 0)}</span> },
    { header: 'ROI %', accessor: 'roiPercentage', render: (row) => `${row.roiPercentage || row.roi || 0}%` },
    { header: 'Risk %', accessor: 'riskPercentage', render: (row) => `${row.riskPercentage || row.risk || 0}%` },
    { header: 'Contract Start', accessor: 'investmentDate', render: (row) => formatDateDMY(row.investmentDate || row.date || row.createdAt) },
    {
      header: 'End Date',
      render: (row) => {
        const period = row.contractPeriod || row.durationMonths || 24;
        const startDate = row.investmentDate || row.date || row.createdAt;
        // If API returns contractEndDate, use that directly
        if (row.contractEndDate) {
          return (
            <div>
              <div>{formatDateDMY(row.contractEndDate)}</div>
              <div className="kfpl-table-cell-secondary">{period} Months</div>
            </div>
          );
        }
        return (
          <div>
            <div>{getEndDateDMY(startDate, period)}</div>
            <div className="kfpl-table-cell-secondary">{period} Months</div>
          </div>
        );
      }
    },
    { header: 'Status', accessor: 'status', render: (row) => <Badge status={row.status || 'active'}>{row.status || 'active'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
            style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold-dark)', fontWeight: 600, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={(e) => {
              e.stopPropagation();
              setExtendingInvestment(row);
              const currentEndDate = row.contractEndDate 
                ? new Date(row.contractEndDate).toISOString().split('T')[0]
                : getEndDateYYYYMMDD(row.investmentDate || row.date || row.createdAt, row.contractPeriod || 24);
              setExtensionEndDate(currentEndDate);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Extend
          </button>
          <button
            className="kfpl-btn kfpl-btn--danger kfpl-btn--sm"
            style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-danger)' }}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteInvestmentClick(row._id || row.id);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="12" height="12">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Investments</h2>
          <p className="kfpl-page-subtitle">All investments across all clients & agents</p>
        </div>
        <div className="kfpl-page-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={segmentFilter}
            onChange={e => setSegmentFilter(e.target.value)}
            className="kfpl-select"
            style={{ width: '160px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <option value="all">All Segments</option>
            {uniqueSegments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="kfpl-select"
            style={{ width: '140px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={() => navigate('/investments/assign')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Assign Investment
          </button>

          <button 
            className="kfpl-btn kfpl-btn--danger kfpl-btn--sm" 
            onClick={() => setShowClearAllModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Clear All Investments
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredDisplayData}
        onRowClick={(row) => row.investorId ? navigate(`/investors/${row.investorId}`) : null}
        searchPlaceholder="Search by investor, segment..."
      />

      {extendingInvestment && createPortal(
        <div
          className="kfpl-modal-overlay"
          onClick={() => setExtendingInvestment(null)}
        >
          <div
            className="kfpl-modal"
            style={{ maxWidth: '440px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="kfpl-modal-header">
              <h3 className="kfpl-modal-title">Extend Contract</h3>
              <button className="kfpl-modal-close" onClick={() => setExtendingInvestment(null)} aria-label="Close modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="kfpl-modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                Extend contract for <strong>{extendingInvestment.investorName}</strong>'s investment in <strong>{extendingInvestment.segment}</strong>.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Contract Start Date:</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                  {formatDateDMY(extendingInvestment.investmentDate || extendingInvestment.date)}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Current End Date:</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                  {extendingInvestment.contractEndDate 
                    ? formatDateDMY(extendingInvestment.contractEndDate) 
                    : getEndDateDMY(extendingInvestment.investmentDate || extendingInvestment.date || extendingInvestment.createdAt, extendingInvestment.contractPeriod || 24)
                  } ({extendingInvestment.contractPeriod || extendingInvestment.durationMonths || 24} Months)
                </div>
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Select New End Date <span className="required">*</span></label>
                <input
                  type="date"
                  className="kfpl-input"
                  value={extensionEndDate}
                  onChange={(e) => setExtensionEndDate(e.target.value)}
                  min={getEndDateYYYYMMDD(extendingInvestment.investmentDate || extendingInvestment.date, 0)}
                  required
                />
              </div>
            </div>
            <div className="kfpl-modal-footer">
              <button
                className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                onClick={() => setExtendingInvestment(null)}
              >Cancel</button>
              <button
                className="kfpl-btn kfpl-btn--primary kfpl-btn--sm"
                onClick={() => {
                  handleExtendContractToDate(extendingInvestment._id || extendingInvestment.id, extensionEndDate);
                  setExtendingInvestment(null);
                }}
              >Confirm Extension</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDeleteModal && createPortal(
        <div
          className="kfpl-modal-overlay"
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteInvestmentId(null);
          }}
        >
          <div
            className="kfpl-modal"
            style={{ maxWidth: '440px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="kfpl-modal-header">
              <h3 className="kfpl-modal-title">Delete Investment</h3>
              <button className="kfpl-modal-close" onClick={() => {
                setShowDeleteModal(false);
                setDeleteInvestmentId(null);
              }} aria-label="Close modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="kfpl-modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#EF4444' }}>Danger: Permanent Deletion</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    Are you sure you want to delete this investment? This action will permanently remove the investment and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="kfpl-modal-footer">
              <button
                className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInvestmentId(null);
                }}
              >Cancel</button>
              <button
                className="kfpl-btn kfpl-btn--danger kfpl-btn--sm"
                onClick={confirmDeleteInvestment}
              >Confirm Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showClearAllModal && createPortal(
        <div
          className="kfpl-modal-overlay"
          onClick={() => setShowClearAllModal(false)}
        >
          <div
            className="kfpl-modal"
            style={{ maxWidth: '440px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="kfpl-modal-header">
              <h3 className="kfpl-modal-title">Confirm Data Deletion</h3>
              <button className="kfpl-modal-close" onClick={() => setShowClearAllModal(false)} aria-label="Close modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="kfpl-modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#EF4444' }}>Danger: Permanent Deletion</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    You are about to delete **all client and agent investments** from the system. This action is irreversible and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="kfpl-modal-footer">
              <button
                className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                onClick={() => setShowClearAllModal(false)}
              >Cancel</button>
              <button
                className="kfpl-btn kfpl-btn--danger kfpl-btn--sm"
                onClick={handleClearAllInvestments}
              >Yes, Clear All Data</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ============ END: InvestmentList.jsx ============ */

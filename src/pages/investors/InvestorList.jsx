/* ============================================================
   Page: InvestorList.jsx
   Description: Paginated, searchable table of all investors.
                Fetches client list from backend API on mount.
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency, getCategoryFromAmount, investors } from '../../data/mockData';
import { apiRequest } from '../../config/apiHelper';
import { useToast } from '../../components/ui/Toast';

export default function InvestorList() {
  const navigate = useNavigate();
  const [agentFilter, setAgentFilter] = useState('all');
  const [residencyFilter, setResidencyFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const formatClientID = (rawId) => {
    if (!rawId || rawId === '—') return '—';
    if (rawId.startsWith('KFPL-CL-')) return rawId;
    const digits = rawId.match(/\d+/);
    if (digits) {
      let val = parseInt(digits[0], 10);
      if (val < 1000) {
        val = 1000 + val;
      }
      return `KFPL-CL-${val}`;
    }
    return 'KFPL-CL-1001';
  };

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const handleDeleteClientClick = (id) => {
    setDeleteClientId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteClient = async () => {
    if (!deleteClientId) return;
    try {
      await apiRequest(`/api/super-admin/clients/${deleteClientId}`, {
        method: 'DELETE'
      });
      addToast('Client deleted successfully.', 'success', 'Deleted');
      setShowDeleteModal(false);
      setDeleteClientId(null);
      setRenderTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete client:', err);
      addToast(err.message || 'Failed to delete client.', 'error', 'Error');
    }
  };

  const handleClearAllClients = async () => {
    try {
      await apiRequest('/api/super-admin/clients/clear', {
        method: 'DELETE'
      });
      addToast('All client profiles cleared successfully.', 'success', 'Data Cleared');
      setShowClearAllModal(false);
      setRenderTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to clear clients:', err);
      addToast(err.message || 'Failed to clear clients.', 'error', 'Error');
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const [res, agentsRes] = await Promise.all([
          apiRequest('/api/super-admin/clients'),
          apiRequest('/api/super-admin/agents').catch(() => null)
        ]);

        let dbAgents = [];
        if (agentsRes) {
          const rawA = agentsRes.data || agentsRes;
          dbAgents = Array.isArray(rawA) ? rawA : (rawA.agents || rawA.list || []);
        }

        const list = res.data?.clients || res.data || res.clients || [];
        if (Array.isArray(list)) {
          console.log('Fetched raw clients:', list);
          
          const cleanRawList = list.filter(c => {
            if (!c || typeof c !== 'object') return false;
            const profile = c.profile || {};
            const header = c.header || {};
            const user = (c.userId && typeof c.userId === 'object' ? c.userId : null) || 
                         (c.user && typeof c.user === 'object' ? c.user : null) || {};
            const name = profile.fullName || user.name || user.fullName || c.fullName || header.clientName || c.name || profile.name || '';
            const email = profile.email || user.email || c.email || '';
            return name.trim() !== '' || email.trim() !== '';
          });


          const normalized = cleanRawList.map((c, index) => {
            const profile = c.profile || {};
            const header = c.header || {};
            const summary = c.summaryCards || {};
            const user = (c.userId && typeof c.userId === 'object' ? c.userId : null) || 
                         (c.user && typeof c.user === 'object' ? c.user : null) || 
                         (profile.userId && typeof profile.userId === 'object' ? profile.userId : null) ||
                         (profile.user && typeof profile.user === 'object' ? profile.user : null) || {};
            
            const padIndex = String(index + 1).padStart(3, '0');
            const fallbackCode = `C-${padIndex}`;

            const userId = c._id || user._id || profile.userId || c.id;

            let agentIdVal = '';
            let agentNameVal = c.assignedAgentName || header.assignedAgentName || profile.assignedAgentName || '';
            const rawAgent = c.assignedAgent || 
                             profile.assignedAgent || 
                             user.assignedAgent || 
                             (c.userId && typeof c.userId === 'object' && c.userId.assignedAgent) || 
                             (c.user && typeof c.user === 'object' && c.user.assignedAgent) || 
                             null;

            if (rawAgent && typeof rawAgent === 'object') {
              agentIdVal = rawAgent._id || rawAgent.id || '';
              const agUser = rawAgent.user || {};
              const agProfile = rawAgent.profile || {};
              agentNameVal = agentNameVal || agProfile.fullName || agUser.name || rawAgent.fullName || rawAgent.name || '';
            } else if (rawAgent) {
              agentIdVal = String(rawAgent);
            }

            // Lookup agent name if not populated but agent ID is present
            if (agentIdVal && (!agentNameVal || agentNameVal === 'Direct Client (No Agent)')) {
              const matchedAgent = dbAgents.find(a => (a._id || a.id) === agentIdVal);
              if (matchedAgent) {
                const agUser = matchedAgent.user || {};
                const agProfile = matchedAgent.profile || {};
                agentNameVal = agProfile.fullName || agUser.name || matchedAgent.fullName || matchedAgent.name || '';
              }
            }

            return {
              _id: userId,
              clientCode: formatClientID(user.clientCode || c.clientCode || header.clientCode || profile.clientCode || c.clientId || profile.clientId || fallbackCode),
              fullName: profile.fullName || user.name || user.fullName || c.fullName || header.clientName || c.name || profile.name || '',
              email: profile.email || user.email || c.email || '',
              phone: profile.phone || c.phone || '',
              dob: profile.dob || c.dob || '',
              joinDate: c.joinDate || profile.joinDate || c.createdAt || profile.createdAt || '',
              contractStartDate: c.contractStartDate || profile.contractStartDate || c.joinDate || profile.joinDate || '',
              contractEndDate: c.contractEndDate || profile.contractEndDate || '',
              extendContractDate: c.extendContractDate || profile.extendContractDate || c.contractExtendedDate || profile.contractExtendedDate || '',
              totalInvestment: c.totalInvestment || summary.totalInvestment || profile.totalPortfolioValue || 0,
              monthlyRoi: c.monthlyRoi || summary.monthlyRoi || profile.monthlyRoi || c.roiPercentage || profile.roiPercentage || 1.2,
              tier: c.tier || header.tier || profile.tier || c.category || profile.category || 'silver',
              status: c.status || header.status || profile.status || 'active',
              assignedAgent: agentIdVal,
              assignedAgentName: agentNameVal,
              agentCommissionMonthly: c.agentCommissionMonthly || profile.agentCommissionMonthly || '',
              residencyStatus: c.residencyStatus || profile.residencyStatus || c.citizenship || profile.citizenship || '',
              riskProfile: c.riskProfile || header.riskProfile || profile.riskProfile || 'Conservative',
            };
          });
          
          normalized.sort((a, b) => {
            return a.clientCode.localeCompare(b.clientCode, undefined, { numeric: true, sensitivity: 'base' });
          });

          setClients(normalized);
        } else {
          setClients([]);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        addToast(err.message || 'Failed to fetch clients.', 'error', 'Error');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [renderTrigger]);

  const getPerkTier = (amount) => {
    return getCategoryFromAmount(amount);
  };

  // Formats date to DD/MM/YYYY
  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || '—';
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${mon}/${d.getFullYear()}`;
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const hasAgent = !!(c.assignedAgent && c.assignedAgent !== 'Direct Client (No Agent)');
    if (agentFilter === 'with-agent' && !hasAgent) return false;
    if (agentFilter === 'non-agent' && hasAgent) return false;

    if (residencyFilter !== 'all') {
      const isInt = residencyFilter === 'international';
      const actualInt = (c.residencyStatus || '').toLowerCase().includes('international');
      if (isInt !== actualInt) return false;
    }

    if (tierFilter !== 'all') {
      const clientTier = (c.tier || 'silver').toLowerCase();
      if (clientTier !== tierFilter.toLowerCase()) return false;
    }

    return true;
  });

  const columns = [
    {
      header: 'Client ID',
      render: (row) => <span>{row.clientCode || '—'}</span>,
    },
    {
      header: 'Join Date',
      render: (row) => <span>{formatDateDMY(row.joinDate)}</span>,
    },
    {
      header: 'Contract Start Date',
      render: (row) => <span>{formatDateDMY(row.contractStartDate)}</span>,
    },
    {
      header: 'Contract End Date',
      render: (row) => <span>{formatDateDMY(row.contractEndDate)}</span>,
    },
    {
      header: 'Contract Extended Date',
      render: (row) => <span>{formatDateDMY(row.extendContractDate)}</span>,
    },
    {
      header: 'Client Name',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.fullName || '—'}</span>,
    },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'Total Investment',
      render: (row) => <span className="font-semibold">{formatCurrency(row.totalInvestment || 0)}</span>,
    },
    {
      header: 'Monthly ROI % Allocated',
      render: (row) => `${row.monthlyRoi || 1.2}%`,
    },
    {
      header: 'Perks',
      render: (row) => {
        const perk = row.tier || 'silver';
        return <Badge status={perk}>{perk.toUpperCase()}</Badge>;
      },
    },
    {
      header: 'Agent',
      render: (row) => {
        if (row.assignedAgentName) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (row.assignedAgent) navigate(`/agents/${row.assignedAgent}`);
              }}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontWeight: 600, color: 'var(--color-gold-dark)',
                textDecoration: 'underline', textUnderlineOffset: '3px',
                cursor: 'pointer', fontSize: '0.875rem',
              }}
            >
              {row.assignedAgentName}
            </button>
          );
        }
        return <Badge status="inactive">Non Agent Client</Badge>;
      }
    },
    {
      header: 'Agent Commission',
      render: (row) => {
        if (!row.assignedAgentName) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
        return (
          <span className="font-semibold" style={{ color: 'var(--color-success)' }}>
            {row.agentCommissionMonthly || '—'}% monthly
          </span>
        );
      }
    },
    {
      header: 'Risk Profile',
      render: (row) => {
        const risk = row.riskProfile || 'Conservative';
        const statusMap = {
          'Conservative': 'active',
          'Moderate': 'gold',
          'Aggressive': 'rejected'
        };
        return <Badge status={statusMap[risk] || 'active'}>{risk}</Badge>;
      }
    },
    {
      header: 'Status',
      render: (row) => {
        const status = (row.status || 'active').toLowerCase();
        return <Badge status={status}>{status}</Badge>;
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          className="kfpl-btn kfpl-btn--danger kfpl-btn--sm"
          style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-danger)' }}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClientClick(row._id || row.id);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="12" height="12">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Delete
        </button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="kfpl-page">
        <div className="kfpl-page-header">
          <div className="kfpl-page-header-left">
            <h2 className="kfpl-page-title">Clients</h2>
            <p className="kfpl-page-subtitle">Loading client data from server...</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Clients</h2>
          <p className="kfpl-page-subtitle">Manage all client profiles — clients are brought in by agents</p>
        </div>
        <div className="kfpl-page-header-actions">
          {/* Residency Filter Dropdown */}
          <select
            className="kfpl-select"
            value={residencyFilter}
            onChange={(e) => setResidencyFilter(e.target.value)}
            style={{ width: '150px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginRight: '8px' }}
          >
            <option value="all">All Residency</option>
            <option value="national">National</option>
            <option value="international">International</option>
          </select>

          {/* Tier Filter Dropdown */}
          <select
            className="kfpl-select"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            style={{ width: '140px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginRight: '8px' }}
          >
            <option value="all">All Tiers</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="diamond">Diamond</option>
            <option value="platinum">Platinum</option>
          </select>

          {/* Agent Filter Dropdown */}
          <select
            className="kfpl-select"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            style={{ width: '160px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginRight: '8px' }}
          >
            <option value="all">All Clients</option>
            <option value="with-agent">With Agent</option>
            <option value="non-agent">Non Agent Client</option>
          </select>

          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={() => navigate('/investors/add')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Client
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
            Clear All Clients
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredClients}
        onRowClick={(row) => navigate(`/investors/${row._id || row.id}`)}
        searchPlaceholder="Search clients by name, email, ID..."
      />
      {showDeleteModal && createPortal(
        <div
          className="kfpl-modal-overlay"
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteClientId(null);
          }}
        >
          <div
            className="kfpl-modal"
            style={{ maxWidth: '440px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="kfpl-modal-header">
              <h3 className="kfpl-modal-title">Delete Client</h3>
              <button className="kfpl-modal-close" onClick={() => {
                setShowDeleteModal(false);
                setDeleteClientId(null);
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
                    Are you sure you want to delete this client? This action will permanently remove the client and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="kfpl-modal-footer">
              <button
                className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteClientId(null);
                }}
              >Cancel</button>
              <button
                className="kfpl-btn kfpl-btn--danger kfpl-btn--sm"
                onClick={confirmDeleteClient}
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#EF4444' }}>Danger: Permanent Deletion</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    You are about to delete **all client profiles** from the system. This action is irreversible and cannot be undone.
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
                onClick={handleClearAllClients}
              >Yes, Clear All Data</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ============ END: InvestorList.jsx ============ */

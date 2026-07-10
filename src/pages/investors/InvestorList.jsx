/* ============================================================
   Page: InvestorList.jsx
   Description: Paginated, searchable table of all investors.
                Fetches client list from backend API on mount.
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency, getCategoryFromAmount, investors } from '../../data/mockData';
import { apiRequest } from '../../config/apiHelper';

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

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/api/super-admin/clients');
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
            const rawAgent = c.assignedAgent || profile.assignedAgent || null;
            if (rawAgent && typeof rawAgent === 'object') {
              agentIdVal = rawAgent._id || rawAgent.id || '';
              const agUser = rawAgent.user || {};
              const agProfile = rawAgent.profile || {};
              agentNameVal = agentNameVal || agProfile.fullName || agUser.name || rawAgent.fullName || rawAgent.name || '';
            } else if (rawAgent) {
              agentIdVal = String(rawAgent);
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
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

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
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredClients}
        onRowClick={(row) => navigate(`/investors/${row._id || row.id}`)}
        searchPlaceholder="Search clients by name, email, ID..."
      />
    </div>
  );
}

/* ============ END: InvestorList.jsx ============ */

/* ============================================================
   Page: AgentList.jsx
   Description: Paginated table of all agents
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency, agents } from '../../data/mockData';
import { apiRequest } from '../../config/apiHelper';

export default function AgentList() {
  const navigate = useNavigate();
  const [residencyFilter, setResidencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatAgentID = (rawId) => {
    if (!rawId || rawId === '—') return '—';
    if (rawId.startsWith('KFPL-AG-') || rawId.startsWith('KFPL-AGT-')) {
      return rawId.replace('KFPL-AGT-', 'KFPL-AG-');
    }
    const digits = rawId.match(/\d+/);
    if (digits) {
      let val = parseInt(digits[0], 10);
      if (val < 1000) {
        val = 1000 + val;
      }
      return `KFPL-AG-${val}`;
    }
    return 'KFPL-AG-1001';
  };

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('/api/super-admin/agents');
        
        const extractAgents = (res) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (res.data.agents && Array.isArray(res.data.agents)) return res.data.agents;
          }
          if (res.agents && Array.isArray(res.agents)) return res.agents;
          return [];
        };

        const raw = extractAgents(data);
        if (Array.isArray(raw)) {
          const normalized = raw
            .filter(a => a && typeof a === 'object')
            .map(a => {
              const user = a.user || {};
              const profile = a.profile || {};
              return {
                ...a,
                id: user._id || profile.userId || a._id || a.id,
                name: profile.fullName || user.name || '—',
                email: profile.email || user.email || '—',
                phone: profile.phone || '—',
                agentId: formatAgentID(user.clientCode || profile.agentId || '—'),
                joinDate: user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('en-IN') 
                  : (profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '—'),
                totalClients: a.clientsCount ?? a.totalClients ?? 0,
                totalInvestment: a.totalInvestment ?? 0,
                status: profile.status || (user.isActive ? 'active' : 'inactive') || 'active',
              };
            });
          
          normalized.sort((a, b) => {
            return a.agentId.localeCompare(b.agentId, undefined, { numeric: true, sensitivity: 'base' });
          });

          setAgentsList(normalized);
        } else {
          setAgentsList([]);
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        setAgentsList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agentsList.filter(agt => {
    if (residencyFilter !== 'all') {
      const isInt = residencyFilter === 'international';
      const actualInt = (agt.citizenship || agt.residencyStatus) === 'International';
      if (isInt !== actualInt) return false;
    }
    if (statusFilter !== 'all') {
      if (agt.status !== statusFilter) return false;
    }
    return true;
  });

  const columns = [
    { header: 'Agent ID', accessor: 'agentId' },
    { header: 'Join Date', accessor: 'joinDate' },
    {
      header: 'Agent Name',
      accessor: 'name',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>,
    },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'Clients',
      accessor: 'totalClients',
      render: (row) => {
        if (row.totalClients > 0) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent navigation to agent details page
                navigate(`/agents/${row.id}/clients`, { state: { agentName: row.name, agentId: row.agentId } });
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--color-gold-dark)',
                textDecoration: 'underline',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {row.totalClients}
            </button>
          );
        }
        return <span>0</span>;
      }
    },
    {
      header: 'Total Investment',
      accessor: 'totalInvestment',
      render: (row) => <span className="font-semibold">{formatCurrency(row.totalInvestment)}</span>,
    },
    {
      header: 'Commission Paid',
      accessor: 'commissionPaidTotal',
      render: (row) => {
        const totalPaid = row.commissionHistory
          ? row.commissionHistory
              .filter(c => c.status === 'paid')
              .reduce((sum, c) => sum + c.amount, 0)
          : (row.commissionPaidTotal || 0);
        return <span className="font-semibold">{formatCurrency(totalPaid)}</span>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
  ];

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Agents</h2>
          <p className="kfpl-page-subtitle">Agents invest and bring clients — manage profiles & commissions</p>
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

          {/* Status Filter Dropdown */}
          <select
            className="kfpl-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginRight: '8px' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={() => navigate('/agents/add')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Agent
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading agents...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredAgents}
          onRowClick={(row) => navigate(`/agents/${row.id}`)}
          searchPlaceholder="Search agents by name, ID..."
        />
      )}
    </div>
  );
}

/* ============ END: AgentList.jsx ============ */

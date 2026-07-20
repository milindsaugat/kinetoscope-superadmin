/* ============================================================
   Page: AgentClientsView.jsx
   Description: Lists clients pre-filtered by specific agent
   ============================================================ */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency, getCategoryFromAmount } from '../../utils/formatters';
import { apiRequest } from '../../config/apiHelper';

export default function AgentClientsView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [agent, setAgent] = useState(null);
  const [clientsList, setClientsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const [agentData, clientsData] = await Promise.all([
          apiRequest(`/api/super-admin/agents/${id}`).catch(err => {
            console.error('Failed to load agent detail:', err);
            return null;
          }),
          apiRequest(`/api/super-admin/agents/${id}/clients`).catch(err => {
            console.error('Failed to load agent clients list:', err);
            return null;
          })
        ]);

        if (agentData) {
          const extractAgentDetail = (res) => {
            if (!res) return null;
            if (res.agent) return res.agent;
            if (res.data) {
              if (res.data.agent) return res.data.agent;
              return res.data;
            }
            return res;
          };
          setAgent(extractAgentDetail(agentData));
        }

        if (clientsData) {
          const extractClients = (res) => {
            if (!res) return [];
            if (Array.isArray(res)) return res;
            if (res.data) {
              if (Array.isArray(res.data)) return res.data;
              if (res.data.clients && Array.isArray(res.data.clients)) return res.data.clients;
            }
            if (res.clients && Array.isArray(res.clients)) return res.clients;
            return [];
          };
          setClientsList(extractClients(clientsData));
        }
      } catch (err) {
        console.error('Failed to load agent clients view:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [id]);

  const agentName = agent?.name || agent?.fullName || location.state?.agentName || 'Agent';

  const getPerkTier = (amount) => {
    return getCategoryFromAmount(amount);
  };

  // Calculate contract end date (joinDate + longest contract period, default 24 months)
  const getContractEndDate = (row) => {
    if (row.contractEndDate) return row.contractEndDate;
    if (row.joinDate) {
      const d = new Date(row.joinDate);
      d.setMonth(d.getMonth() + 24);
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${mon}/${d.getFullYear()}`;
    }
    return '—';
  };

  // Same columns as InvestorList (Manage Clients) — minus Agent column
  const columns = [
    { header: 'Client ID', accessor: 'clientId' },
    { header: 'Join Date', accessor: 'joinDate' },
    {
      header: 'Contract End',
      render: (row) => <span>{getContractEndDate(row)}</span>,
    },
    {
      header: 'Client Name',
      accessor: 'name',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>,
    },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'Total Investment',
      accessor: 'totalInvestment',
      render: (row) => <span className="font-semibold">{formatCurrency(row.totalInvestment)}</span>,
    },
    {
      header: 'ROI % Allocated',
      accessor: 'monthlyRoi',
      render: (row) => `${row.monthlyRoi || row.roiPercentage || 1.2}%`,
    },
    {
      header: 'Perks',
      accessor: 'totalInvestment',
      render: (row) => {
        const perk = getPerkTier(row.totalInvestment);
        return <Badge status={perk}>{perk.toUpperCase()}</Badge>;
      },
    },
    {
      header: 'Agent Commission',
      render: () => {
        if (!agent) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
        return (
          <span className="font-semibold" style={{ color: 'var(--color-success)' }}>
            Slab-Based
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
        return <Badge status={statusMap[risk]}>{risk}</Badge>;
      }
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
          <div className="kfpl-header-breadcrumb" style={{ cursor: 'pointer', marginBottom: '8px' }} onClick={() => navigate('/agents')}>
            <span>Agents</span> / {agentName} / Clients
          </div>
          <h2 className="kfpl-page-title">Clients of {agentName}</h2>
          <p className="kfpl-page-subtitle">Clients brought to the platform by {agentName}</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/agents')}>
            Back to Agents
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading agent clients...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={clientsList}
          onRowClick={(row) => navigate(`/investors/${row.id}`)}
          searchPlaceholder="Search clients by name, email, ID..."
        />
      )}
    </div>
  );
}

/* ============ END: AgentClientsView.jsx ============ */

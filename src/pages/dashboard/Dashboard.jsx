/* ============================================================
   Page: Dashboard.jsx
   Description: Premium KPI dashboard — Platform Command Centre
   PRD Section 3: 6 KPIs, 4 charts, candlestick, quick actions,
   activity feed, top investors, agent performance
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import KpiCard from '../../components/ui/KpiCard';
import DonutChart from '../../components/charts/DonutChart';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';
import AreaChart from '../../components/charts/AreaChart';
import Badge from '../../components/ui/Badge';
import {
  dashboardStats, monthlyROIData, segmentDistribution,
  recentActivity, topInvestors, topAgents,
  agentContributionData, investmentStatusData,
  monthlyInvestmentData,
  formatCurrency, formatNumber,
} from '../../data/mockData';

// ── KPI Icons (SVG) ───────────────────────
const kpiIcons = {
  investors: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  investment: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  roi: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  agents: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  pending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  active: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
};

// ── Quick Action Icons ───────────────────────
const quickActionItems = [
  { label: 'Add Client', subtitle: 'Onboard new client', route: '/clients/add', color: '#0E7490', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
  { label: 'Approvals', subtitle: `${dashboardStats.pendingApprovals} pending`, route: '/approvals', color: '#C62828', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { label: 'Add Agent', subtitle: 'Register agent', route: '/agents/add', color: '#1565C0', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { label: 'Assign Investment', subtitle: 'Map to client', route: '/investments/assign', color: '#10B981', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { label: 'Mark ROI Paid', subtitle: 'Process returns', route: '/roi', color: '#2E7D32', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: 'Post Update', subtitle: 'Status updates', route: '/investment-status', color: '#7B1FA2', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
];

// ── Activity Icons ───────────────────────
const activityIcons = {
  success: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  gold: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  danger: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
};

const SEGMENT_COLORS = ['#10B981', '#1565C0', '#2E7D32', '#E65100', '#7B1FA2', '#00838F'];

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = dashboardStats;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="kfpl-page" id="dashboard-page">

      {/* ═══════════════ WELCOME BANNER ═══════════════ */}
      <div className="kfpl-welcome-banner">
        <div className="kfpl-welcome-content">
          <div className="kfpl-welcome-text">
            <h1 className="kfpl-welcome-title">
              Welcome back, <span className="kfpl-welcome-name">Super Admin</span>
            </h1>
            <p className="kfpl-welcome-subtitle">
              {dateStr} — Here's your platform overview.
            </p>
          </div>
          <div className="kfpl-welcome-stats">
            <div className="kfpl-stat-pill kfpl-stat-pill--dark">
              <span className="kfpl-stat-pill-value" style={{ color: 'var(--color-gold)' }}>{formatNumber(stats.activeInvestments)}</span>
              <span className="kfpl-stat-pill-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Active Investments</span>
            </div>
            <div className="kfpl-stat-pill kfpl-stat-pill--dark">
              <span className="kfpl-stat-pill-value" style={{ color: '#4CAF50' }}>{stats.pendingApprovals}</span>
              <span className="kfpl-stat-pill-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Pending</span>
            </div>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="kfpl-welcome-deco" aria-hidden="true">
          <div className="kfpl-welcome-circle kfpl-welcome-circle--1" />
          <div className="kfpl-welcome-circle kfpl-welcome-circle--2" />
          <div className="kfpl-welcome-circle kfpl-welcome-circle--3" />
        </div>
      </div>

      {/* ═══════════════ 6 KPI CARDS ═══════════════ */}
      <div className="kfpl-dashboard-kpis">
        <KpiCard
          title="Total Investors"
          value={formatNumber(stats.totalInvestors)}
          trend={`+${stats.investorChange}% this month`}
          trendDirection="up"
          icon={kpiIcons.investors}
          iconColor="navy"
          delay={0}
        />
        <KpiCard
          title="Total Investment"
          value={formatCurrency(stats.totalInvestment)}
          trend={`+${stats.investmentChange}% growth`}
          trendDirection="up"
          icon={kpiIcons.investment}
          iconColor="gold"
          variant="gold"
          delay={80}
        />
        <KpiCard
          title="ROI Paid"
          value={formatCurrency(stats.totalROIPaid)}
          trend={`+${stats.roiChange}% vs last month`}
          trendDirection="up"
          icon={kpiIcons.roi}
          iconColor="success"
          delay={160}
        />
        <KpiCard
          title="Total Agents"
          value={formatNumber(stats.totalAgents)}
          trend={`+${stats.agentChange}% new`}
          trendDirection="up"
          icon={kpiIcons.agents}
          iconColor="info"
          delay={240}
        />
        <KpiCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          trend="Requires attention"
          trendDirection="down"
          icon={kpiIcons.pending}
          iconColor="danger"
          pulse={true}
          delay={320}
        />
        <KpiCard
          title="Active Investments"
          value={formatNumber(stats.activeInvestments)}
          trend="Live records"
          trendDirection="up"
          icon={kpiIcons.active}
          iconColor="navy"
          delay={400}
        />
      </div>

      {/* ═══════════════ CHARTS 2×2 GRID ═══════════════ */}
      <div className="kfpl-dashboard-charts-grid">
        {/* C-01: Investment by Segment — Donut */}
        <div className="kfpl-chart-card kfpl-chart-card--glass">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Investment by Segment</div>
              <div className="kfpl-chart-subtitle">Distribution across 6 segments</div>
            </div>
            <Badge status="active">Live</Badge>
          </div>
          <div className="kfpl-chart-body">
            <DonutChart data={segmentDistribution} size={200} strokeWidth={30} />
          </div>
          <div className="kfpl-chart-legend">
            {segmentDistribution.map((seg, i) => (
              <div className="kfpl-legend-item" key={seg.segment}>
                <span className="kfpl-legend-dot" style={{ background: SEGMENT_COLORS[i] }} />
                <span>{seg.segment}</span>
                <span className="kfpl-legend-value">{seg.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* C-02: Monthly ROI Trend — Line */}
        <div className="kfpl-chart-card kfpl-chart-card--glass">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Monthly ROI Trend</div>
              <div className="kfpl-chart-subtitle">Total ROI paid per month — FY 2025</div>
            </div>
            <Badge status="gold">FY 2025</Badge>
          </div>
          <div className="kfpl-chart-body">
            <LineChart data={monthlyROIData} height={220} color="#10B981" />
          </div>
        </div>

        {/* C-03: Agent Contribution — Bar */}
        <div className="kfpl-chart-card kfpl-chart-card--glass">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Agent Contribution</div>
              <div className="kfpl-chart-subtitle">Top 10 agents by investment brought in</div>
            </div>
            <Badge status="active">Ranked</Badge>
          </div>
          <div className="kfpl-chart-body">
            <BarChart data={agentContributionData} height={280} />
          </div>
        </div>

        {/* C-04: Investment Status — Pie */}
        <div className="kfpl-chart-card kfpl-chart-card--glass">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Investment Status</div>
              <div className="kfpl-chart-subtitle">Active vs Pending vs Closed split</div>
            </div>
            <Badge status="gold">312 Total</Badge>
          </div>
          <div className="kfpl-chart-body">
            <PieChart data={investmentStatusData} size={200} strokeWidth={28} />
          </div>
          <div className="kfpl-chart-legend">
            {investmentStatusData.map(seg => (
              <div className="kfpl-legend-item" key={seg.status}>
                <span className="kfpl-legend-dot" style={{ background: seg.color }} />
                <span>{seg.status}</span>
                <span className="kfpl-legend-value">{seg.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ INVESTMENT FLOW CHARTS ROW ═══════════════ */}
      <div className="kfpl-dashboard-full-row">
        {/* Monthly Investment Bar Chart */}
        <div className="kfpl-chart-card kfpl-chart-card--glass kfpl-chart-card--wide">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Monthly Investment Inflow</div>
              <div className="kfpl-chart-subtitle">Total investments received per month — FY 2025</div>
            </div>
            <Badge status="gold">₹ Crores</Badge>
          </div>
          <div className="kfpl-chart-body">
            <div className="kfpl-vbar-chart">
              {monthlyInvestmentData.map((d, i) => {
                const maxVal = Math.max(...monthlyInvestmentData.map(x => x.investments));
                const pct = (d.investments / maxVal) * 100;
                return (
                  <div className="kfpl-vbar-col" key={i}>
                    <div className="kfpl-vbar-value">{formatCurrency(d.investments)}</div>
                    <div className="kfpl-vbar-track">
                      <div className="kfpl-vbar-fill" style={{ height: `${pct}%` }} />
                    </div>
                    <div className="kfpl-vbar-label">{d.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Area Chart */}
        <div className="kfpl-chart-card kfpl-chart-card--glass kfpl-chart-card--wide">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Investment vs Withdrawal Flow</div>
              <div className="kfpl-chart-subtitle">Monthly inflows and outflows — FY 2025</div>
            </div>
            <Badge status="active">Cash Flow</Badge>
          </div>
          <div className="kfpl-chart-body">
            <AreaChart data={monthlyInvestmentData} height={240} />
          </div>
        </div>
      </div>

      {/* ═══════════════ QUICK ACTIONS ═══════════════ */}
      <div className="kfpl-quick-actions-section">
        <div className="kfpl-section-header">
          <h3 className="kfpl-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Quick Actions
          </h3>
          <span className="kfpl-section-subtitle">One-click access to common tasks</span>
        </div>
        <div className="kfpl-quick-actions-grid">
          {quickActionItems.map((action, i) => (
            <button
              key={i}
              className="kfpl-quick-action-btn"
              onClick={() => navigate(action.route)}
              style={{ '--action-color': action.color }}
            >
              <div className="kfpl-quick-action-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="kfpl-quick-action-icon-wrap" style={{ background: `${action.color}12`, color: action.color }}>
                {action.icon}
              </div>
              <div className="kfpl-quick-action-text">
                <span className="kfpl-quick-action-label">{action.label}</span>
                <span className="kfpl-quick-action-sublabel">{action.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ BOTTOM WIDGETS ═══════════════ */}
      <div className="kfpl-dashboard-widgets">
        {/* Recent Activity */}
        <div className="kfpl-chart-card">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Recent Activity</div>
              <div className="kfpl-chart-subtitle">Last 10 platform actions</div>
            </div>
            <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/approvals')}>View All</button>
          </div>
          <div className="kfpl-chart-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div className="kfpl-activity-feed">
              {recentActivity.map(item => (
                <div className="kfpl-activity-item" key={item.id}>
                  <div className={`kfpl-activity-icon-wrap ${item.type}`}>
                    {activityIcons[item.type] || activityIcons.info}
                  </div>
                  <div className="kfpl-activity-content">
                    <div className="kfpl-activity-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                    <div className="kfpl-activity-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Investors */}
        <div className="kfpl-chart-card">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Top Investors</div>
              <div className="kfpl-chart-subtitle">Ranked by total investment</div>
            </div>
            <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/investors')}>View All</button>
          </div>
          <div className="kfpl-chart-body">
            <div className="kfpl-widget-list">
              {topInvestors.map((inv, i) => (
                <div className="kfpl-widget-item" key={inv.id}>
                  <div className={`kfpl-widget-rank ${i < 3 ? 'gold' : 'silver'}`}>
                    #{i + 1}
                  </div>
                  <div className="kfpl-widget-item-info">
                    <div className="kfpl-widget-item-name">{inv.name}</div>
                    <div className="kfpl-widget-item-sub">{inv.clientId} • <Badge status={inv.category}>{inv.category}</Badge></div>
                  </div>
                  <div className="kfpl-widget-item-value">
                    {formatCurrency(inv.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="kfpl-chart-card">
          <div className="kfpl-chart-header">
            <div>
              <div className="kfpl-chart-title">Agent Performance</div>
              <div className="kfpl-chart-subtitle">By client investment brought in</div>
            </div>
            <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/agents')}>View All</button>
          </div>
          <div className="kfpl-chart-body">
            <div className="kfpl-widget-list">
              {topAgents.map((agent, i) => (
                <div className="kfpl-widget-item" key={agent.id}>
                  <div className={`kfpl-widget-rank ${i < 3 ? 'gold' : 'silver'}`}>
                    #{i + 1}
                  </div>
                  <div className="kfpl-widget-item-info">
                    <div className="kfpl-widget-item-name">{agent.name}</div>
                    <div className="kfpl-widget-item-sub">{agent.agentId} • {agent.clients} clients</div>
                  </div>
                  <div className="kfpl-widget-item-value">
                    {formatCurrency(agent.totalInvestment)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ END: Dashboard.jsx ============ */

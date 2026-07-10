/* ============================================================
   Component: App.jsx
   Description: Root app with all routes for Super Admin Portal
   ============================================================ */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import MainLayout from './components/layout/MainLayout';

// ── Auth Pages ───────────────────────
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// ── Dashboard ───────────────────────
import Dashboard from './pages/dashboard/Dashboard';

// ── Investor Pages ───────────────────────
import InvestorList from './pages/investors/InvestorList';
import AddInvestor from './pages/investors/AddInvestor';
import EditInvestor from './pages/investors/EditInvestor';
import InvestorDetail from './pages/investors/InvestorDetail';

// ── Investment Pages ───────────────────────
import InvestmentList from './pages/investments/InvestmentList';
import AssignInvestment from './pages/investments/AssignInvestment';
import InvestmentStatus from './pages/investments/InvestmentStatus';

// ── ROI Pages ───────────────────────
import ROIList from './pages/roi/ROIList';
import ROIDetail from './pages/roi/ROIDetail';

// ── Portfolio Pages ───────────────────────
import PortfolioManagement from './pages/portfolio/PortfolioManagement';

// ── Agent Pages ───────────────────────
import AgentList from './pages/agents/AgentList';
import AddAgent from './pages/agents/AddAgent';
import EditAgent from './pages/agents/EditAgent';
import AgentDetail from './pages/agents/AgentDetail';
import AgentClientsView from './pages/agents/AgentClientsView';

// ── Approval Pages ───────────────────────
import ApprovalsQueue from './pages/approvals/ApprovalsQueue';
import ApprovalHistory from './pages/approvals/ApprovalHistory';

// ── Perks ───────────────────────
import PerkManagement from './pages/perks/PerkManagement';

// ── Email Notifications ───────────────────────
import EmailNotifications from './pages/email/EmailNotifications';

// ── Settings ───────────────────────
import Settings from './pages/settings/Settings';
import CommissionConfig from './pages/settings/CommissionConfig';
import RewardConfig from './pages/settings/RewardConfig';

// ── Portals ────────────────────────
import ClientPortalMock from './pages/portals/ClientPortalMock';
import AgentPortalMock from './pages/portals/AgentPortalMock';

// ── Service Requests ───────────────────────
import ServiceRequestsPage from './pages/service-requests/ServiceRequestsPage';

// ── News & Media ───────────────────────
import NewsMediaList from './pages/news-media/NewsMediaList';
import NewsMediaForm from './pages/news-media/NewsMediaForm';

// ── 404 ───────────────────────
import NotFound from './pages/NotFound';

// ── Protected Route Wrapper ───────────────────────
function ProtectedRoute({ children }) {
  const auth = localStorage.getItem('kfpl_auth');
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes inside MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Manage Investors Profile */}
            <Route path="investors" element={<InvestorList />} />
            <Route path="investors/add" element={<AddInvestor />} />
            <Route path="investors/:id" element={<InvestorDetail />} />
            <Route path="investors/:id/edit" element={<EditInvestor />} />

            {/* Manage Investments */}
            <Route path="investments" element={<InvestmentList />} />
            <Route path="investments/assign" element={<AssignInvestment />} />

            {/* Return on Investment */}
            <Route path="roi" element={<ROIList />} />
            <Route path="roi/:id" element={<ROIDetail />} />

            {/* Status of Investment */}
            <Route path="investment-status" element={<InvestmentStatus />} />

            {/* Portfolio Management */}
            <Route path="portfolio" element={<PortfolioManagement />} />

            {/* Manage Agents */}
            <Route path="agents" element={<AgentList />} />
            <Route path="agents/add" element={<AddAgent />} />
            <Route path="agents/:id" element={<AgentDetail />} />
            <Route path="agents/:id/edit" element={<EditAgent />} />
            <Route path="agents/:id/clients" element={<AgentClientsView />} />

            {/* Approval for Deposit & Withdrawal */}
            <Route path="approvals" element={<ApprovalsQueue />} />
            <Route path="approvals/history" element={<ApprovalHistory />} />

            {/* Investors Perks & Recognition */}
            <Route path="perks" element={<PerkManagement />} />

            {/* Email Notifications */}
            <Route path="email-notifications" element={<EmailNotifications />} />

            {/* Service Requests */}
            <Route path="service-requests" element={<ServiceRequestsPage />} />

            {/* News & Media */}
            <Route path="news-media" element={<NewsMediaList />} />
            <Route path="news-media/add" element={<NewsMediaForm />} />
            <Route path="news-media/:id/edit" element={<NewsMediaForm />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="settings/commission-slabs" element={<CommissionConfig />} />
            <Route path="settings/rewards" element={<RewardConfig />} />

            {/* Portals */}
            <Route path="portals/client" element={<ClientPortalMock />} />
            <Route path="portals/agent" element={<AgentPortalMock />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

/* ============ END: App.jsx ============ */

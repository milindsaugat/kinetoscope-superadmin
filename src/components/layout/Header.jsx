/* ============================================================
   Component: Header.jsx
   Description: Professional top bar with breadcrumb, admin profile,
                and interactive Universal Search, Onboarding Notifications,
                and Latest Service Requests dropdowns.
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../config/apiUrl';
import { apiRequest } from '../../config/apiHelper';
import { getAuthToken, clearAuthData, getAuthUser } from '../../utils/authStorage';

// ── Route to Title & Breadcrumb Map ───────────────────────
const routeConfig = {
  '/dashboard': { title: 'Dashboard', breadcrumb: 'Overview' },
  '/investors': { title: 'Manage Clients', breadcrumb: 'Client & Agent' },
  '/investors/add': { title: 'Add New Client', breadcrumb: 'Client & Agent / Clients' },
  '/agents': { title: 'Manage Agents', breadcrumb: 'Client & Agent' },
  '/agents/add': { title: 'Add New Agent', breadcrumb: 'Client & Agent / Agents' },
  '/investments': { title: 'Manage Investments', breadcrumb: 'Investment Management' },
  '/investments/assign': { title: 'Assign Investment', breadcrumb: 'Investment Management' },
  '/roi': { title: 'Complete Transaction Details', breadcrumb: 'Investment Management' },
  '/investment-status': { title: 'Investment Status', breadcrumb: 'Investment Management' },
  '/portfolio': { title: 'Portfolio Management', breadcrumb: 'Investment Management' },
  '/perks': { title: 'Perks & Recognition', breadcrumb: 'Investment Management' },
  '/approvals': { title: 'Deposit & Withdrawal Approvals', breadcrumb: 'Operations' },
  '/approvals/history': { title: 'Approval History', breadcrumb: 'Operations / Approvals' },
  '/email-notifications': { title: 'Email Notifications', breadcrumb: 'Operations' },
  '/faq': { title: 'FAQ Control Board', breadcrumb: 'Operations' },
  '/settings': { title: 'Settings', breadcrumb: 'Operations' },
};

function getPageConfig(pathname) {
  if (routeConfig[pathname]) return routeConfig[pathname];
  if (pathname.match(/^\/investors\/\d+\/edit/)) return { title: 'Edit Client', breadcrumb: 'Client & Agent / Clients' };
  if (pathname.match(/^\/investors\/\d+/)) return { title: 'Client Details', breadcrumb: 'Client & Agent / Clients' };
  if (pathname.match(/^\/roi\/\d+/)) return { title: 'ROI Details', breadcrumb: 'Investment Management / ROI' };
  if (pathname.match(/^\/agents\/\d+\/edit/)) return { title: 'Edit Agent', breadcrumb: 'Client & Agent / Agents' };
  if (pathname.match(/^\/agents\/\d+/)) return { title: 'Agent Details', breadcrumb: 'Client & Agent / Agents' };
  return { title: 'Super Admin', breadcrumb: '' };
}

export default function Header({ isCollapsed, onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const config = getPageConfig(location.pathname);

  // Dropdown visibility states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showRequestDropdown, setShowRequestDropdown] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [clientsList, setClientsList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [faqsList, setFaqsList] = useState([]);
  const [searchResults, setSearchResults] = useState({ clients: [], agents: [], faqs: [] });

  // Notifications states (onboarded clients & agents)
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Service requests state
  const [requestsList, setRequestsList] = useState([]);
  const [hasUnreadRequests, setHasUnreadRequests] = useState(false);

  // Refs for click-away detection
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const requestRef = useRef(null);

  // Read logged-in admin info
  const adminInfo = getAuthUser();
  const adminName = adminInfo?.name || 'Super Admin';
  const adminEmail = adminInfo?.email || 'admin@kfpl.com';
  const adminRole = adminInfo?.role || 'super-admin';
  const roleLabel = adminRole === 'sub-admin' ? 'Sub Admin' : 'Administrator';

  useEffect(() => {
    document.documentElement.classList.remove('dark-theme');
    localStorage.removeItem('kfpl_theme');
  }, []);

  // Fetch initial data for notifications & requests on mount
  const fetchHeaderData = async () => {
    try {
      // Determine sub-admin permissions to guard API calls
      const perms = adminInfo?.permissions;
      const isSuperAdminUser = adminRole !== 'sub-admin';
      const canViewClients = isSuperAdminUser || !!perms?.manageClients?.view;
      const canViewAgents = isSuperAdminUser || !!perms?.manageAgents?.view;
      const canViewRequests = isSuperAdminUser || !!perms?.serviceRequests?.view;

      // 1. Fetch Clients, Agents, and Service Requests concurrently using Promise.all
      const [clientsData, agentsData, requestsData] = await Promise.all([
        canViewClients ? apiRequest('/api/super-admin/clients').catch(() => []) : Promise.resolve([]),
        canViewAgents ? apiRequest('/api/super-admin/agents').catch(() => []) : Promise.resolve([]),
        canViewRequests ? apiRequest('/api/super-admin/service-requests').catch(() => []) : Promise.resolve([])
      ]);
      
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

      const clients = extractClients(clientsData);
      const agents = extractAgents(agentsData);

      setClientsList(clients);
      setAgentsList(agents);

      // Create a list of notification events sorted by date
      const notifyList = [];
      clients.forEach(c => {
        if (c.createdAt || c.id) {
          notifyList.push({
            id: 'c-' + c.id,
            type: 'client',
            name: c.fullName || c.name || 'New Client',
            email: c.email,
            date: c.createdAt ? new Date(c.createdAt) : new Date(),
            link: `/investors/${c.id}`
          });
        }
      });

      agents.forEach(a => {
        if (a.createdAt || a.id) {
          notifyList.push({
            id: 'a-' + a.id,
            type: 'agent',
            name: a.name || a.fullName || 'New Agent',
            email: a.email,
            date: a.createdAt ? new Date(a.createdAt) : new Date(),
            link: `/agents/${a.id}`
          });
        }
      });

      // Sort notification list: latest first
      notifyList.sort((a, b) => b.date - a.date);

      // Read read status from localStorage
      let readIds = [];
      let lastReadTime = 0;
      try {
        const storedReadIds = localStorage.getItem('kfpl_read_notifications');
        readIds = storedReadIds ? JSON.parse(storedReadIds) : [];
        const storedLastRead = localStorage.getItem('kfpl_notifications_last_read');
        lastReadTime = storedLastRead ? parseInt(storedLastRead, 10) : 0;
      } catch (e) {
        console.error('Error loading notification read state:', e);
      }

      const formattedNotifications = notifyList.slice(0, 15).map(n => {
        const itemTime = n.date ? n.date.getTime() : 0;
        const isRead = readIds.includes(n.id) || (lastReadTime > 0 && itemTime <= lastReadTime);
        return { ...n, isRead };
      });

      setNotifications(formattedNotifications);
      setUnreadNotifications(formattedNotifications.filter(n => !n.isRead).length);

      // 2. Process Service Requests for the chat bubble
      let reqs = [];
      if (Array.isArray(requestsData)) {
        reqs = requestsData;
      } else if (requestsData) {
        reqs = requestsData.data?.requests || requestsData.requests || requestsData.serviceRequests || (Array.isArray(requestsData.data) ? requestsData.data : []) || [];
      }
      
      // Sort: latest requests first and slice 5
      const sortedReqs = [...reqs].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
      setRequestsList(sortedReqs.slice(0, 5));

      const openCount = reqs.filter(r => (r.status || '').toUpperCase() === 'OPEN' || r.status === 'Open').length;
      let lastReadReqTime = 0;
      let isRequestsViewed = false;
      try {
        const storedLastRead = localStorage.getItem('kfpl_service_requests_last_read');
        lastReadReqTime = storedLastRead ? parseInt(storedLastRead, 10) : 0;
        isRequestsViewed = localStorage.getItem('kfpl_requests_viewed') === 'true';
      } catch (e) {}

      const newestReqTime = sortedReqs.length > 0 && sortedReqs[0].createdAt ? new Date(sortedReqs[0].createdAt).getTime() : 0;

      if (openCount > 0 && !isRequestsViewed && (lastReadReqTime === 0 || newestReqTime > lastReadReqTime)) {
        setHasUnreadRequests(true);
      } else {
        setHasUnreadRequests(false);
      }

      // 3. Load FAQs from localStorage
      try {
        const storedFaqs = localStorage.getItem('kfpl_faqs');
        setFaqsList(storedFaqs ? JSON.parse(storedFaqs) : []);
      } catch {
        setFaqsList([]);
      }

    } catch (e) {
      console.error('Error fetching header metrics', e);
    }
  };

  const markServiceRequestsAsRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem('kfpl_service_requests_last_read', now.toString());
      localStorage.setItem('kfpl_requests_viewed', 'true');
    } catch (e) {
      console.error('Failed to save service request read state:', e);
    }
    setHasUnreadRequests(false);
    window.dispatchEvent(new Event('serviceRequestsUpdated'));
  };

  const markAllNotificationsAsRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem('kfpl_notifications_last_read', now.toString());
      const allIds = notifications.map(n => n.id);
      let readIds = [];
      try {
        const stored = localStorage.getItem('kfpl_read_notifications');
        readIds = stored ? JSON.parse(stored) : [];
      } catch (e) {}
      const updatedRead = Array.from(new Set([...readIds, ...allIds]));
      localStorage.setItem('kfpl_read_notifications', JSON.stringify(updatedRead));
    } catch (e) {
      console.error('Failed to save read notification state:', e);
    }
    setUnreadNotifications(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markNotificationAsRead = (id) => {
    try {
      let readIds = [];
      try {
        const stored = localStorage.getItem('kfpl_read_notifications');
        readIds = stored ? JSON.parse(stored) : [];
      } catch (e) {}
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem('kfpl_read_notifications', JSON.stringify(readIds));
      }
    } catch (e) {
      console.error('Failed to save read state:', e);
    }
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      const unreadCount = updated.filter(n => !n.isRead).length;
      setUnreadNotifications(unreadCount);
      return updated;
    });
  };

  useEffect(() => {
    fetchHeaderData();
    // Listen for custom trigger updates to refresh count
    window.addEventListener('serviceRequestsUpdated', fetchHeaderData);
    return () => window.removeEventListener('serviceRequestsUpdated', fetchHeaderData);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
      if (requestRef.current && !requestRef.current.contains(event.target)) {
        setShowRequestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Universal Search Handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ clients: [], agents: [], faqs: [] });
      return;
    }
    const query = searchQuery.toLowerCase();

    const matchedClients = clientsList.filter(c => 
      (c.fullName || c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query)
    ).slice(0, 5);

    const matchedAgents = agentsList.filter(a => 
      (a.name || a.fullName || '').toLowerCase().includes(query) ||
      (a.email || '').toLowerCase().includes(query) ||
      (a.phone || '').toLowerCase().includes(query) ||
      (a.agentId || a.code || '').toLowerCase().includes(query)
    ).slice(0, 5);

    const matchedFaqs = faqsList.filter(f => 
      (f.question || '').toLowerCase().includes(query) ||
      (f.answer || '').toLowerCase().includes(query)
    ).slice(0, 5);

    setSearchResults({
      clients: matchedClients,
      agents: matchedAgents,
      faqs: matchedFaqs
    });
  }, [searchQuery, clientsList, agentsList, faqsList]);

  const handleLogout = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Failed to log out from server', err);
      }
    }
    clearAuthData();
    navigate('/login');
  };

  return (
    <header className={`kfpl-header ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <style>{`
        /* Header Dropdown Custom Styling */
        .kfpl-header-dropdown-card {
          position: absolute;
          top: 50px;
          right: 0;
          width: 380px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05), 0 0 1px rgba(0,0,0,0.15);
          border: 1px solid #e2e8f0;
          z-index: 1000;
          animation: slideDownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .kfpl-header-dropdown-header {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .kfpl-header-dropdown-title {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--color-navy);
        }

        .kfpl-header-dropdown-body {
          max-height: 320px;
          overflow-y: auto;
        }

        .kfpl-dropdown-list-item {
          padding: 12px 16px;
          display: flex;
          gap: 12px;
          align-items: center;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid #f1f5f9;
        }

        .kfpl-dropdown-list-item:hover {
          background: #f8fafc;
        }

        .kfpl-dropdown-list-item:last-child {
          border-bottom: none;
        }

        @keyframes slideDownIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="kfpl-header-left">
        <button className="kfpl-header-hamburger" onClick={onMenuClick} aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="kfpl-header-title-wrap">
          <h1 className="kfpl-header-title">{config.title}</h1>
          {config.breadcrumb && (
            <div className="kfpl-header-breadcrumb">
              <span>Home</span> / {config.breadcrumb}
            </div>
          )}
        </div>
      </div>

      <div className="kfpl-header-right">
        {/* 1. Global Search (Universal Search) */}
        <div className="kfpl-dropdown-container" ref={searchRef} style={{ position: 'relative' }}>
          <button 
            className={`kfpl-header-icon-btn ${showSearchDropdown ? 'active' : ''}`} 
            onClick={() => {
              setShowSearchDropdown(!showSearchDropdown);
              setShowNotificationDropdown(false);
              setShowRequestDropdown(false);
              setShowProfileDropdown(false);
            }}
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {showSearchDropdown && (
            <div className="kfpl-header-dropdown-card" style={{ width: '420px' }}>
              <div className="kfpl-header-dropdown-header" style={{ padding: '10px 14px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Clients, Agents, FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="kfpl-input"
                    style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem', width: '100%', borderRadius: '8px' }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="kfpl-header-dropdown-body" style={{ maxHeight: '360px' }}>
                {!searchQuery.trim() ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>Universal Search Console</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Type client name, email, agent code, or FAQ keyword to find records instantly.</p>
                  </div>
                ) : (
                  <>
                    {/* Clients Section */}
                    {searchResults.clients.length > 0 && (
                      <div>
                        <div style={{ background: '#f8fafc', padding: '6px 14px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Clients</div>
                        {searchResults.clients.map(c => (
                          <div 
                            key={c.id} 
                            className="kfpl-dropdown-list-item"
                            onClick={() => { navigate(`/investors/${c.id}`); setShowSearchDropdown(false); }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-emerald)' }}></span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-navy)' }}>{c.fullName || c.name}</span>
                              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>{c.email} • {c.phone}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agents Section */}
                    {searchResults.agents.length > 0 && (
                      <div>
                        <div style={{ background: '#f8fafc', padding: '6px 14px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Agents</div>
                        {searchResults.agents.map(a => (
                          <div 
                            key={a.id} 
                            className="kfpl-dropdown-list-item"
                            onClick={() => { navigate(`/agents/${a.id}`); setShowSearchDropdown(false); }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-gold)' }}></span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-navy)' }}>{a.name || a.fullName}</span>
                              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Code: {a.code || a.agentId} • {a.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FAQs Section */}
                    {searchResults.faqs.length > 0 && (
                      <div>
                        <div style={{ background: '#f8fafc', padding: '6px 14px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>FAQs</div>
                        {searchResults.faqs.map(f => (
                          <div 
                            key={f.id} 
                            className="kfpl-dropdown-list-item"
                            onClick={() => { navigate('/faq'); setShowSearchDropdown(false); }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }}></span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-navy)' }}>{f.question}</span>
                              <span style={{ fontSize: '0.725rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{f.answer}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No matches */}
                    {searchResults.clients.length === 0 && searchResults.agents.length === 0 && searchResults.faqs.length === 0 && (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                        No matches found for "{searchQuery}"
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Notifications (Bell Icon - Client / Agent onboard info) */}
        <div className="kfpl-dropdown-container" ref={notificationRef} style={{ position: 'relative' }}>
          <button 
            className={`kfpl-header-icon-btn ${showNotificationDropdown ? 'active' : ''}`} 
            onClick={() => {
              const nextState = !showNotificationDropdown;
              setShowNotificationDropdown(nextState);
              setShowSearchDropdown(false);
              setShowRequestDropdown(false);
              setShowProfileDropdown(false);
              if (nextState) {
                markAllNotificationsAsRead();
              }
            }}
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadNotifications > 0 && (
              <span className="kfpl-header-notification-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 800, color: '#fff', background: '#e11d48', width: '15px', height: '15px', top: '-2px', right: '-2px', borderRadius: '50%', position: 'absolute' }}>
                {unreadNotifications}
              </span>
            )}
          </button>

          {showNotificationDropdown && (
            <div className="kfpl-header-dropdown-card">
              <div className="kfpl-header-dropdown-header">
                <span className="kfpl-header-dropdown-title">Onboarding Alerts</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--color-emerald)', fontWeight: 700 }}>New Registrations</span>
                  {notifications.some(n => !n.isRead) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAllNotificationsAsRead(); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.725rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              <div className="kfpl-header-dropdown-body">
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                    No recent registration logs found.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className="kfpl-dropdown-list-item"
                      style={{
                        background: n.isRead ? 'transparent' : 'rgba(239, 68, 68, 0.04)',
                        position: 'relative'
                      }}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        navigate(n.link);
                        setShowNotificationDropdown(false);
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: n.type === 'client' ? '#e0f2fe' : '#fef3c7',
                        color: n.type === 'client' ? '#0284c7' : '#d97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem', fontWeight: 800, flexShrink: 0
                      }}>
                        {n.type === 'client' ? 'C' : 'A'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.825rem', color: 'var(--color-navy)', fontWeight: 700 }}>
                            New {n.type === 'client' ? 'Client' : 'Agent'} Onboarded
                          </span>
                          {!n.isRead && (
                            <span style={{ fontSize: '0.625rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>New</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>{n.name}</span>
                        <span style={{ fontSize: '0.675rem', color: '#94a3b8', marginTop: '2px' }}>{n.email}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Messages / Service Requests (Chat Icon - Latest 5 Service Requests) */}
        <div className="kfpl-dropdown-container" ref={requestRef} style={{ position: 'relative' }}>
          <button 
            className={`kfpl-header-icon-btn ${showRequestDropdown ? 'active' : ''}`} 
            onClick={() => {
              const nextState = !showRequestDropdown;
              setShowRequestDropdown(nextState);
              setShowSearchDropdown(false);
              setShowNotificationDropdown(false);
              setShowProfileDropdown(false);
              if (nextState) {
                markServiceRequestsAsRead();
              }
            }}
            aria-label="Service Requests"
            title="Recent Service Requests"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {hasUnreadRequests && (
              <span className="kfpl-header-notification-dot" style={{ background: '#f59e0b' }}></span>
            )}
          </button>

          {showRequestDropdown && (
            <div className="kfpl-header-dropdown-card">
              <div className="kfpl-header-dropdown-header">
                <span className="kfpl-header-dropdown-title">Recent Service Requests</span>
                <span 
                  onClick={() => { markServiceRequestsAsRead(); navigate('/service-requests'); setShowRequestDropdown(false); }} 
                  style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: '0.725rem', color: 'var(--color-gold-dark)', fontWeight: 700 }}
                >
                  View All
                </span>
              </div>
              <div className="kfpl-header-dropdown-body">
                {requestsList.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>
                    No service requests found.
                  </div>
                ) : (
                  requestsList.map(r => {
                    const st = (r.status || '').toUpperCase();
                    const labelColor = (st === 'OPEN' || st === 'PENDING') ? '#ef4444' : (st === 'IN PROGRESS' || st === 'IN_PROGRESS') ? '#f59e0b' : '#10b981';
                    const raiser = r.createdBy?.name || r.createdBy?.email || r.clientName || r.clientEmail || r.agentName || 'User';
                    return (
                      <div 
                        key={r.id || r._id} 
                        className="kfpl-dropdown-list-item"
                        onClick={() => { markServiceRequestsAsRead(); navigate('/service-requests'); setShowRequestDropdown(false); }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              {r.subject || r.title || r.category || r.type || 'Service Query'}
                            </span>
                            <span style={{
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: labelColor + '20',
                              color: labelColor,
                              textTransform: 'uppercase'
                            }}>
                              {r.status || 'OPEN'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                            Raised by: {raiser}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="kfpl-header-divider"></div>

        {/* Admin Profile with Dropdown */}
        <div className="kfpl-dropdown-container" ref={profileRef} style={{ position: 'relative' }}>
          <div className="kfpl-header-profile" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <div className="kfpl-header-avatar">{adminName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
            <div className="kfpl-header-profile-info">
              <span className="kfpl-header-profile-name">{adminName}</span>
              <span className="kfpl-header-profile-role">{roleLabel}</span>
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              width="14"
              height="14"
              style={{
                color: 'var(--color-text-muted)',
                transform: showProfileDropdown ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {showProfileDropdown && (
            <div className="kfpl-header-profile-dropdown">
              <div className="kfpl-dropdown-profile-header">
                <span className="kfpl-dropdown-profile-name">{adminName}</span>
                <span className="kfpl-dropdown-profile-email">{adminEmail}</span>
              </div>
              <div className="kfpl-dropdown-divider"></div>
              <div className="kfpl-dropdown-item" onClick={() => { setShowProfileDropdown(false); navigate('/settings'); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
              </div>
              <div className="kfpl-dropdown-item kfpl-dropdown-logout-btn" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

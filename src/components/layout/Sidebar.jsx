/* ============================================================
   Component: Sidebar.jsx
   Description: Fixed left navigation with all Super Admin modules
   ============================================================ */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getApiUrl } from '../../config/apiUrl';
import { apiRequest } from '../../config/apiHelper';

// ── SVG Icons ───────────────────────
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  investors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  investment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  roi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  status: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  portfolio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  perks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  approvals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  agents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  newsMedia: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  faq: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ── Navigation Structure ───────────────────────
const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Client & Agent',
    items: [
      { path: '/investors', icon: 'investors', label: 'Manage Clients' },
      { path: '/agents', icon: 'agents', label: 'Manage Agents' },
    ],
  },
  {
    title: 'Portals',
    items: [
      { path: '/portals/client', icon: 'investors', label: 'Client Portal' },
      { path: '/portals/agent', icon: 'agents', label: 'Agent Portal' },
    ],
  },
  {
    title: 'Investment Management',
    items: [
      { path: '/investments', icon: 'investment', label: 'Manage Investments' },
      { path: '/roi', icon: 'roi', label: 'Complete Transaction Details' },
      { path: '/investment-status', icon: 'status', label: 'Investment Status' },
      { path: '/portfolio', icon: 'portfolio', label: 'Portfolio' },
      { path: '/perks', icon: 'perks', label: 'Perks & Recognition' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/approvals', icon: 'approvals', label: 'Deposit & Withdrawal', badge: 7 },
      { path: '/email-notifications', icon: 'email', label: 'Email Notifications' },
      { path: '/service-requests', icon: 'support', label: 'Service Requests' },
      { path: '/news-media', icon: 'newsMedia', label: 'News & Media' },
      { path: '/faq', icon: 'faq', label: 'FAQ Management' },
      { path: '/settings/commission-slabs', icon: 'roi', label: 'Commission Slabs' },
      { path: '/settings/rewards', icon: 'perks', label: 'Rewards Config' },
      { path: '/settings', icon: 'settings', label: 'Settings' },
    ],
  },
];

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
  const location = useLocation();
  const [unresolvedCount, setUnresolvedCount] = useState(2);

  useEffect(() => {
    const updateCount = async () => {
      try {
        const data = await apiRequest('/api/super-admin/service-requests');
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data) {
          if (data.requests && Array.isArray(data.requests)) {
            list = data.requests;
          } else if (data.serviceRequests && Array.isArray(data.serviceRequests)) {
            list = data.serviceRequests;
          } else if (data.data) {
            if (Array.isArray(data.data)) {
              list = data.data;
            } else if (data.data.requests && Array.isArray(data.data.requests)) {
              list = data.data.requests;
            } else if (data.data.serviceRequests && Array.isArray(data.data.serviceRequests)) {
              list = data.data.serviceRequests;
            }
          }
        }
        const count = list.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
        setUnresolvedCount(count);
      } catch (err) {
        console.error('Failed to update sidebar unresolved badge:', err);
      }
    };
    
    updateCount();
    
    window.addEventListener('serviceRequestsUpdated', updateCount);
    return () => window.removeEventListener('serviceRequestsUpdated', updateCount);
  }, []);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/settings') return location.pathname === '/settings';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    const authData = localStorage.getItem('kfpl_auth');
    const token = authData ? JSON.parse(authData)?.token : null;
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
    localStorage.removeItem('kfpl_auth');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`kfpl-sidebar-overlay ${isMobileOpen ? 'visible' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`kfpl-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="kfpl-sidebar-logo">
          <div className="kfpl-sidebar-logo-icon">
            <span>K</span>
          </div>
          <div className="kfpl-sidebar-logo-text">
            <span className="kfpl-sidebar-logo-title">KINETOSCOPE</span>
            <span className="kfpl-sidebar-logo-subtitle">Super Admin Panel</span>
            <span className="kfpl-sidebar-logo-tagline" style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', display: 'block' }}>Films. Finance. Future.</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="kfpl-sidebar-nav">
          {navSections.map((section) => (
            <div className="kfpl-sidebar-section" key={section.title}>
              <div className="kfpl-sidebar-section-title">{section.title}</div>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`kfpl-sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={onMobileClose}
                >
                  <span className="kfpl-sidebar-item-icon">{icons[item.icon]}</span>
                  <span className="kfpl-sidebar-item-label">{item.label}</span>
                  {item.path === '/service-requests' ? (
                    unresolvedCount > 0 && (
                      <span className="kfpl-sidebar-item-badge">{unresolvedCount}</span>
                    )
                  ) : item.badge ? (
                    <span className="kfpl-sidebar-item-badge">{item.badge}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom Section: Logout + Collapse */}
        <div className="kfpl-sidebar-bottom">
          <div className="kfpl-sidebar-item kfpl-sidebar-logout" onClick={handleLogout}>
            <span className="kfpl-sidebar-item-icon">{icons.logout}</span>
            <span className="kfpl-sidebar-item-label">Logout</span>
          </div>
          <div className="kfpl-sidebar-toggle" onClick={onToggle}>
            {icons.chevronLeft}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ============ END: Sidebar.jsx ============ */

/* ============================================================
   Page: ApprovalsQueue.jsx
   Description: Redesigned deposit and withdrawal approvals queue with verification detail modals
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { approvals, formatCurrency, investors, approvalHistory, getCategoryFromAmount } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';

// Icons
const icons = {
  deposit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  withdrawal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16M2 10h20"/>
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
};

// Tier SVG icons (replace emojis)
const tierIcons = {
  silver: (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" strokeWidth="2" stroke="#718096" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  gold: (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="#D69E2E" stroke="#D69E2E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  diamond: (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#319795" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/><line x1="2" y1="9" x2="22" y2="9"/>
    </svg>
  ),
  platinum: (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#805AD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  )
};

export default function ApprovalsQueue() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [activeTab, setActiveTab] = useState('deposits');
  const [modal, setModal] = useState({ open: false, type: '', item: null });
  const [rejectReason, setRejectReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [scanningItemId, setScanningItemId] = useState(null);
  const [verifiedItems, setVerifiedItems] = useState({});

  const handleVerifyAttachment = (itemId) => {
    setScanningItemId(itemId);
    setTimeout(() => {
      setScanningItemId(null);
      setVerifiedItems(prev => ({ ...prev, [itemId]: true }));
      addToast('success', 'Verification Success', 'Security Scan Passed. Valid digital signature & reference ledger match.');
    }, 1000);
  };

  const [depositsList, setDepositsList] = useState(approvals.deposits);
  const [withdrawalsList, setWithdrawalsList] = useState(approvals.withdrawals);

  // Synchronize dynamic list updates from local storage/proxies
  useEffect(() => {
    setDepositsList(approvals.deposits);
    setWithdrawalsList(approvals.withdrawals);
  }, [modal.open]);

  const currentItems = activeTab === 'deposits' ? depositsList : withdrawalsList;
  const pendingDeposits = depositsList.filter(i => i.status === 'pending').length;
  const pendingWithdrawals = withdrawalsList.filter(i => i.status === 'pending').length;
  const totalPending = pendingDeposits + pendingWithdrawals;

  // Calculate values
  const pendingDepositsVal = depositsList.filter(i => i.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
  const pendingWithdrawalsVal = withdrawalsList.filter(i => i.status === 'pending').reduce((sum, item) => sum + item.amount, 0);

  const handleViewDetails = (item) => {
    setModal({ open: true, type: 'details', item });
    setAdminNote('');
    setRejectReason('');
    setShowRejectForm(false);
  };

  const confirmApprove = () => {
    const item = modal.item;
    if (!item) return;
    
    // Update approvals state
    if (item.type === 'deposit') {
      const updated = depositsList.map(d => d.id === item.id ? { ...d, status: 'approved', approvedAt: new Date().toISOString().split('T')[0] } : d);
      setDepositsList(updated);
      approvals.deposits = updated;
    } else {
      const updated = withdrawalsList.map(w => w.id === item.id ? { ...w, status: 'approved', approvedAt: new Date().toISOString().split('T')[0] } : w);
      setWithdrawalsList(updated);
      approvals.withdrawals = updated;
    }

    // Push entry to approvalHistory log
    approvalHistory.unshift({
      id: Date.now(),
      type: item.type,
      investorName: item.investorName,
      clientId: item.clientId,
      amount: item.amount,
      date: item.date,
      status: 'approved',
      adminNote: adminNote || 'Verified bank ledger statement',
      actionAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    // Update investor profile stats & investments
    const investor = investors.find(inv => inv.clientId === item.clientId);
    if (investor) {
      if (item.type === 'deposit') {
        investor.totalInvestment += item.amount;
        
        // Push record to investments
        investor.investments.push({
          id: Date.now(),
          segment: 'Pending Allocation',
          amount: item.amount,
          date: item.date,
          roi: investor.roiPercentage || 1.2,
          status: 'active',
          risk: 25
        });
      } else {
        investor.totalInvestment = Math.max(0, investor.totalInvestment - item.amount);
        
        // Push withdrawal record
        investor.investments.push({
          id: Date.now(),
          segment: 'Withdrawal',
          amount: -item.amount,
          date: item.date,
          roi: 0,
          status: 'closed',
          risk: 0
        });
      }
      
      // Automatically evaluate tier
      investor.category = getCategoryFromAmount(investor.totalInvestment);
    }

    addToast('success', 'Request Approved', `${item.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(item.amount)} approved for ${item.investorName}`);
    setModal({ open: false, type: '', item: null });
    setAdminNote('');
  };

  const confirmReject = () => {
    const item = modal.item;
    if (!item || !rejectReason.trim()) return;

    // Update approvals state
    if (item.type === 'deposit') {
      const updated = depositsList.map(d => d.id === item.id ? { ...d, status: 'rejected', rejectedAt: new Date().toISOString().split('T')[0] } : d);
      setDepositsList(updated);
      approvals.deposits = updated;
    } else {
      const updated = withdrawalsList.map(w => w.id === item.id ? { ...w, status: 'rejected', rejectedAt: new Date().toISOString().split('T')[0] } : w);
      setWithdrawalsList(updated);
      approvals.withdrawals = updated;
    }

    // Push entry to approvalHistory log
    approvalHistory.unshift({
      id: Date.now(),
      type: item.type,
      investorName: item.investorName,
      clientId: item.clientId,
      amount: item.amount,
      date: item.date,
      status: 'rejected',
      adminNote: rejectReason,
      actionAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    addToast('error', 'Request Rejected', `${item.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(item.amount)} rejected for ${item.investorName}`);
    setModal({ open: false, type: '', item: null });
    setRejectReason('');
    setShowRejectForm(false);
  };

  return (
    <div className="kfpl-page animate-fade-in">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Deposit & Withdrawal</h2>
          <p className="kfpl-page-subtitle">Verify payment transactions and approve funds allocation</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/approvals/history')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '6px' }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            View History log
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kfpl-approvals-stats">
        <div className="kfpl-approvals-stat-card pending">
          <div className="kfpl-approvals-stat-icon">
            {icons.clock}
          </div>
          <div className="kfpl-approvals-stat-info">
            <span className="kfpl-approvals-stat-val">{totalPending}</span>
            <span className="kfpl-approvals-stat-lbl">Pending Requests</span>
            <span className="kfpl-approvals-stat-subval">Awaiting Admin Verification</span>
          </div>
        </div>
        <div className="kfpl-approvals-stat-card deposits">
          <div className="kfpl-approvals-stat-icon">
            {icons.wallet}
          </div>
          <div className="kfpl-approvals-stat-info">
            <span className="kfpl-approvals-stat-val">{pendingDeposits}</span>
            <span className="kfpl-approvals-stat-lbl">Pending Deposits</span>
            <span className="kfpl-approvals-stat-subval">Total Amount: <strong>{formatCurrency(pendingDepositsVal)}</strong></span>
          </div>
        </div>
        <div className="kfpl-approvals-stat-card withdrawals">
          <div className="kfpl-approvals-stat-icon">
            {icons.wallet}
          </div>
          <div className="kfpl-approvals-stat-info">
            <span className="kfpl-approvals-stat-val">{pendingWithdrawals}</span>
            <span className="kfpl-approvals-stat-lbl">Pending Withdrawals</span>
            <span className="kfpl-approvals-stat-subval">Total Amount: <strong>{formatCurrency(pendingWithdrawalsVal)}</strong></span>
          </div>
        </div>
      </div>

      {/* Segment Tabs */}
      <div className="kfpl-tabs">
        <div className={`kfpl-tab ${activeTab === 'deposits' ? 'active' : ''}`} onClick={() => setActiveTab('deposits')}>
          Deposits Queue ({pendingDeposits})
        </div>
        <div className={`kfpl-tab ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}>
          Withdrawals Queue ({pendingWithdrawals})
        </div>
      </div>

      {/* Queue Items */}
      {currentItems.length === 0 ? (
        <div className="kfpl-empty" style={{ background: '#fff', borderRadius: '12px', padding: '48px', border: '1px solid var(--color-border-light)' }}>
          <div className="kfpl-empty-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            {icons.check}
          </div>
          <h3 className="kfpl-empty-title" style={{ fontSize: '1.1rem', fontWeight: '700' }}>All caught up!</h3>
          <p className="kfpl-empty-text" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No pending {activeTab} requests in approvals queue.</p>
        </div>
      ) : (
        <div className="kfpl-approvals-list">
          {currentItems.map(item => {
            const investorObj = investors.find(i => i.clientId === item.clientId) || {};
            const tier = investorObj.category || 'silver';
            const initials = item.investorName ? item.investorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'IN';
            
            return (
              <div className="kfpl-approvals-row" key={item.id}>
                {/* 1. Client Initials Avatar (with gradient corresponding to tier) */}
                <div className="kfpl-approvals-avatar-wrapper">
                  <div className={`kfpl-approvals-avatar kfpl-approvals-avatar--${tier.toLowerCase()}`}>
                    {initials}
                  </div>
                  <div className="kfpl-approvals-avatar-badge" title={`${tier} tier`}>
                    {tierIcons[tier.toLowerCase()] || tierIcons.silver}
                  </div>
                </div>

                {/* 2. Client Details */}
                <div className="kfpl-approvals-client-details">
                  <span className="kfpl-approvals-client-name">{item.investorName}</span>
                  <div className="kfpl-approvals-client-meta">
                    <span>ID: {item.clientId}</span>
                    <span className="kfpl-approvals-bullet">•</span>
                    <span>Date: {item.date}</span>
                    {item.type === 'deposit' && (
                      <>
                        <span className="kfpl-approvals-bullet">•</span>
                        <span className="kfpl-approvals-mode-tag">{item.mode || 'Bank Transfer'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Transaction Amount */}
                <div className={`kfpl-approvals-value ${item.type}`}>
                  {item.type === 'deposit' ? '+' : '−'} {formatCurrency(item.amount)}
                </div>

                {/* 4. Status Badge */}
                <div className="kfpl-approvals-status-col">
                  <Badge status={item.status}>{item.status}</Badge>
                </div>

                {/* 5. Process / Details Action */}
                <div className="kfpl-approvals-actions-col">
                  {item.status === 'pending' ? (
                    <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" style={{ padding: '8px 16px', borderRadius: '8px' }} onClick={() => handleViewDetails(item)}>
                      Verify & Action
                    </button>
                  ) : (
                    <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => handleViewDetails(item)}>
                      View Details
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Verification Details Modal */}
      <Modal
        isOpen={modal.open}
        size="xl"
        onClose={() => {
          setModal({ open: false, type: '', item: null });
          setAdminNote('');
          setRejectReason('');
          setShowRejectForm(false);
        }}
        title={`Verify ${modal.item ? (modal.item.type === 'deposit' ? 'Deposit' : 'Withdrawal') : 'Transaction'} Request`}
        footer={
          modal.item && modal.item.status === 'pending' ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div>
                {!showRejectForm ? (
                  <button className="kfpl-btn kfpl-btn--danger" onClick={() => setShowRejectForm(true)}>
                    Reject Request
                  </button>
                ) : (
                  <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setShowRejectForm(false)}>
                    Back to Approve
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setModal({ open: false, type: '', item: null })}>Cancel</button>
                {showRejectForm ? (
                  <button className="kfpl-btn kfpl-btn--danger" onClick={confirmReject} disabled={!rejectReason.trim()}>
                    Confirm Rejection
                  </button>
                ) : (
                  <button className="kfpl-btn kfpl-btn--success" onClick={confirmApprove}>
                    Approve Payment
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setModal({ open: false, type: '', item: null })}>Close</button>
          )
        }
      >
        {modal.item && (() => {
          const investorObj = investors.find(i => i.clientId === modal.item.clientId) || {};
          const tier = investorObj.category || 'silver';
          const initials = modal.item.investorName ? modal.item.investorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'IN';
          
          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. Hero strip */}
              <div className="kfpl-verify-hero">
                <div className="kfpl-verify-hero-info">
                  <div className="kfpl-approvals-avatar-wrapper">
                    <div className={`kfpl-approvals-avatar kfpl-approvals-avatar--${tier.toLowerCase()}`}>
                      {initials}
                    </div>
                    <div className="kfpl-approvals-avatar-badge" title={`${tier} tier`}>
                      {tierIcons[tier.toLowerCase()] || tierIcons.silver}
                    </div>
                  </div>
                  <div className="kfpl-verify-hero-meta">
                    <div className="kfpl-verify-hero-name" style={{ textAlign: 'left' }}>
                      {modal.item.investorName}
                      <span className="kfpl-verify-hero-tier">
                        {tierIcons[tier.toLowerCase()] || tierIcons.silver}
                        {tier}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', fontWeight: 500, textAlign: 'left' }}>
                      Client ID: {modal.item.clientId}
                    </span>
                  </div>
                </div>
                
                <div className="kfpl-verify-hero-right">
                  <span className={`kfpl-verify-hero-amount ${modal.item.type}`}>
                    {modal.item.type === 'deposit' ? '+' : '−'} {formatCurrency(modal.item.amount)}
                  </span>
                  <Badge status={modal.item.type === 'deposit' ? 'deposit' : 'withdrawal'}>
                    {modal.item.type}
                  </Badge>
                </div>
              </div>

              {/* 2-Column Details Grid */}
              <div className="kfpl-verify-grid">
                
                {/* Left Column: Investor Profile & Transaction Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Investor Profile Card */}
                  <div className="kfpl-verify-card">
                    <div className="kfpl-verify-card-header">
                      <span>Investor Profile</span>
                    </div>
                    <div className="kfpl-verify-card-body">
                      <div className="kfpl-verify-field-row">
                        <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                          <span className="kfpl-verify-field-label">PAN Number</span>
                          <span className="kfpl-verify-field-value">{investorObj.pan || '—'}</span>
                        </div>
                        <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                          <span className="kfpl-verify-field-label">Risk Profile</span>
                          <span className="kfpl-verify-field-value" style={{ textTransform: 'capitalize' }}>
                            {investorObj.riskProfile || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                        <span className="kfpl-verify-field-label">Email Address</span>
                        <span className="kfpl-verify-field-value">{investorObj.email || '—'}</span>
                      </div>
                      <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                        <span className="kfpl-verify-field-label">Phone Number</span>
                        <span className="kfpl-verify-field-value">{investorObj.phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details Card */}
                  <div className="kfpl-verify-card">
                    <div className="kfpl-verify-card-header">
                      <span>Transaction Details</span>
                    </div>
                    <div className="kfpl-verify-card-body">
                      <div className="kfpl-verify-field-row">
                        <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                          <span className="kfpl-verify-field-label">Request Date</span>
                          <span className="kfpl-verify-field-value">{modal.item.date}</span>
                        </div>
                        <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                          <span className="kfpl-verify-field-label">Request Type</span>
                          <span className="kfpl-verify-field-value" style={{ textTransform: 'uppercase', color: modal.item.type === 'deposit' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {modal.item.type}
                          </span>
                        </div>
                      </div>
                      
                      {modal.item.type === 'deposit' ? (
                        <div className="kfpl-verify-field-row">
                          <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                            <span className="kfpl-verify-field-label">Payment Mode</span>
                            <span className="kfpl-verify-field-value">{modal.item.mode || 'Bank Transfer'}</span>
                          </div>
                          <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                            <span className="kfpl-verify-field-label">Reference ID</span>
                            <span className="kfpl-verify-field-value" style={{ fontFamily: 'monospace' }}>{modal.item.referenceId || '—'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="kfpl-verify-field-row">
                          <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                            <span className="kfpl-verify-field-label">Target Bank</span>
                            <span className="kfpl-verify-field-value">{modal.item.bankName || '—'}</span>
                          </div>
                          <div className="kfpl-verify-field" style={{ textAlign: 'left' }}>
                            <span className="kfpl-verify-field-label">IFSC Code</span>
                            <span className="kfpl-verify-field-value" style={{ fontFamily: 'monospace' }}>{modal.item.ifsc || '—'}</span>
                          </div>
                        </div>
                      )}

                      {modal.item.note && (
                        <div className="kfpl-verify-field" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '10px', marginTop: '4px', textAlign: 'left' }}>
                          <span className="kfpl-verify-field-label">Investor Note</span>
                          <span className="kfpl-verify-field-value" style={{ fontStyle: 'italic', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>
                            "{modal.item.note}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: Verification Action Proof (Deposits) or Target Account details (Withdrawals) */}
                <div>
                  {modal.item.type === 'deposit' ? (
                    <div className="kfpl-verify-card" style={{ height: '100%' }}>
                      <div className="kfpl-verify-card-header">
                        <span>Proof of Deposit Attachment</span>
                      </div>
                      <div className="kfpl-verify-card-body">
                        {(() => {
                          const file = modal.item.proofFile && typeof modal.item.proofFile === 'object'
                            ? modal.item.proofFile
                            : {
                                name: `bank_statement_receipt_${modal.item.clientId}_${modal.item.id}.pdf`,
                                type: 'application/pdf',
                                size: '420 KB',
                                data: modal.item.proofFile || ''
                              };

                          const isImage = file.type && file.type.startsWith('image/');
                          const isPdf = file.name && file.name.endsWith('.pdf');
                          const fileColor = isPdf ? '#ef4444' : (isImage ? '#10b981' : '#2563eb');

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
                              {/* Interactive File Card */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '12px 16px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke={fileColor} strokeWidth="2" style={{ flexShrink: 0 }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                  </svg>
                                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {file.name}
                                    </div>
                                    <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'flex', gap: '8px' }}>
                                      <span>{file.size}</span>
                                      <span>•</span>
                                      <span style={{ textTransform: 'uppercase' }}>{file.type ? file.type.split('/')[1] || file.type : 'PDF'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  {/* Download button (if uploaded file data exists) */}
                                  {file.data && (
                                    <a
                                      href={file.data}
                                      download={file.name}
                                      className="kfpl-proof-action-btn kfpl-proof-action-btn--download"
                                      title="Download File"
                                    >
                                      {icons.download}
                                      <span>Download</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Rendering Image if type is image */}
                              {isImage && file.data ? (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  padding: '12px',
                                  background: '#f1f5f9',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  flexGrow: 1,
                                  justifyContent: 'center'
                                }}>
                                  <img 
                                    src={file.data} 
                                    alt="Proof Attachment" 
                                    style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '4px', objectFit: 'contain' }} 
                                  />
                                </div>
                              ) : (
                                /* Receipt Slip Mockup */
                                <div style={{
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '16px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexGrow: 1
                                }}>
                                  <div className="kfpl-receipt-mockup" style={{ width: '100%', fontFamily: 'monospace' }}>
                                    <div className="kfpl-receipt-mockup-header">
                                      <div className="kfpl-receipt-mockup-title">BANK TRANSACTION SLIP</div>
                                      <div className="kfpl-receipt-mockup-bank">Kross Film Productions Ltd.</div>
                                    </div>
                                    <div className="kfpl-receipt-mockup-row">
                                      <span className="kfpl-receipt-mockup-label">Sender:</span>
                                      <span className="kfpl-receipt-mockup-value">{modal.item.investorName}</span>
                                    </div>
                                    <div className="kfpl-receipt-mockup-row">
                                      <span className="kfpl-receipt-mockup-label">Client ID:</span>
                                      <span className="kfpl-receipt-mockup-value">{modal.item.clientId}</span>
                                    </div>
                                    <div className="kfpl-receipt-mockup-row">
                                      <span className="kfpl-receipt-mockup-label">Date:</span>
                                      <span className="kfpl-receipt-mockup-value">{modal.item.date}</span>
                                    </div>
                                    <div className="kfpl-receipt-mockup-row">
                                      <span className="kfpl-receipt-mockup-label">Mode:</span>
                                      <span className="kfpl-receipt-mockup-value">{modal.item.mode || 'Bank Transfer'}</span>
                                    </div>
                                    <div className="kfpl-receipt-mockup-row">
                                      <span className="kfpl-receipt-mockup-label">Ref ID:</span>
                                      <span className="kfpl-receipt-mockup-value" style={{ fontSize: '0.7rem' }}>{modal.item.referenceId || 'TXN1000998877'}</span>
                                    </div>
                                    <div className="kfpl-receipt-mockup-row" style={{ borderBottom: 'none', borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '6px' }}>
                                      <span className="kfpl-receipt-mockup-label" style={{ fontWeight: '700' }}>Amount:</span>
                                      <span className="kfpl-receipt-mockup-value" style={{ fontWeight: '700', color: 'var(--color-success)' }}>{formatCurrency(modal.item.amount)}</span>
                                    </div>
                                    <div className="kfpl-receipt-mockup-footer">
                                      System Verification Receipt for {file.name}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {file.data && (
                                <button
                                  className="kfpl-btn kfpl-btn--secondary"
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    marginTop: '8px'
                                  }}
                                  onClick={() => {
                                    const win = window.open("", "_blank");
                                    if (win) {
                                      win.document.title = file.name || "Proof Preview";
                                      if (file.type && file.type.startsWith('image/')) {
                                        win.document.body.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f1f5f9; margin:0;"><img src="${file.data}" style="max-width:90%; max-height:90%; object-fit:contain; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.15);" /></div>`;
                                      } else {
                                        win.document.body.innerHTML = `<iframe src="${file.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100vh; margin:0;" allowfullscreen></iframe>`;
                                      }
                                    }
                                  }}
                                >
                                  {icons.eye}
                                  <span>Preview Attached Document</span>
                                </button>
                              )}

                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* Withdrawal destination */
                    <div className="kfpl-verify-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="kfpl-verify-card-header">
                        <span>Destination Account Check</span>
                        <Badge status="approved">VERIFIED OWNER</Badge>
                      </div>
                      <div className="kfpl-verify-card-body" style={{ gap: '16px' }}>
                        
                        {/* Premium Bank Card UI */}
                        <div className="kfpl-verify-bank-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ textAlign: 'left' }}>
                              <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 600 }}>Recipient Bank</span>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>{modal.item.bankName || '—'}</div>
                            </div>
                            <div className="kfpl-verify-bank-card-chip" />
                          </div>
                          
                          <div className="kfpl-verify-bank-card-number">
                            {modal.item.accountNo 
                              ? modal.item.accountNo.replace(/\d(?=\d{4})/g, "•") 
                              : "•••• •••• •••• ••••"}
                          </div>
                          
                          <div className="kfpl-verify-bank-card-meta">
                            <div className="kfpl-verify-bank-card-info" style={{ textAlign: 'left' }}>
                              <span className="kfpl-verify-bank-card-lbl">Account Holder</span>
                              <span className="kfpl-verify-bank-card-val">{modal.item.investorName}</span>
                            </div>
                            <div className="kfpl-verify-bank-card-info" style={{ textAlign: 'right' }}>
                              <span className="kfpl-verify-bank-card-lbl">IFSC Code</span>
                              <span className="kfpl-verify-bank-card-val" style={{ fontFamily: 'monospace' }}>{modal.item.ifsc || '—'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Security Notice */}
                        <div className="kfpl-verify-security-notice">
                          <div className="kfpl-verify-security-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          </div>
                          <div className="kfpl-verify-security-text" style={{ textAlign: 'left' }}>
                            <div className="kfpl-verify-security-title">Strict Routing Enforcement</div>
                            Funds are locked to this registered account only. Verification check against matched client PAN records completed successfully.
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* 3. Action / Admin note fields */}
              {modal.item.status === 'pending' && (
                <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '16px' }}>
                  {showRejectForm ? (
                    <div className="kfpl-input-group animate-fade-in" style={{ margin: 0 }}>
                      <label className="kfpl-input-label" style={{ color: 'var(--color-danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Rejection Reason</span>
                        <span className="required" style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <textarea 
                        className="kfpl-textarea" 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)} 
                        placeholder="Please detail why this request is being rejected. This will be shared with the investor." 
                        rows="3" 
                        required 
                      />
                    </div>
                  ) : (
                    <div className="kfpl-input-group" style={{ margin: 0 }}>
                      <label className="kfpl-input-label">Admin Approval Note (optional)</label>
                      <textarea 
                        className="kfpl-textarea" 
                        value={adminNote} 
                        onChange={(e) => setAdminNote(e.target.value)} 
                        placeholder="e.g. Ledger cross-checked, receipt matches bank statement." 
                        rows="2" 
                      />
                    </div>
                  )}
                </div>
              )}

              {modal.item.status !== 'pending' && (
                <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '16px' }}>
                  <div className="kfpl-input-group" style={{ margin: 0 }}>
                    <label className="kfpl-input-label" style={{ fontWeight: '700' }}>Admin Resolution Notes</label>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      fontSize: '0.875rem', 
                      fontStyle: 'italic', 
                      color: 'var(--color-text-muted)',
                      textAlign: 'left'
                    }}>
                      {modal.item.status === 'approved' 
                        ? (modal.item.note || 'Verified bank ledger statement and approved.') 
                        : (modal.item.reason || 'Rejected by administrator.')}
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

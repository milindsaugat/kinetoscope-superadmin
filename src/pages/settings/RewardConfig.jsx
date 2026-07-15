/* ============================================================
   Page: RewardConfig.jsx
   Description: Configuration dashboard for Agent Reward Catalog & Claim Requests
   ============================================================ */

import { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { apiRequest } from '../../config/apiHelper';

export default function RewardConfig() {
  const addToast = useToast();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'claims'
  const [rewards, setRewards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [previewMedia, setPreviewMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // File Upload states for multipart/form-data
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [form, setForm] = useState({ 
    id: '', 
    targetDescription: '', 
    targetType: 'Clients Count', 
    targetValue: '', 
    targetDays: '', 
    targetMonths: '', 
    rewardDescription: '', 
    imageUrl: '',
    videoUrl: '',
    isActive: true 
  });

  // Claim Requests states
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [raiserMap, setRaiserMap] = useState({ clients: new Map(), agents: new Map() });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStatus, setClaimStatus] = useState('Open');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [notifyAgent, setNotifyAgent] = useState(true);
  const [savingClaim, setSavingClaim] = useState(false);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/super-admin/rewards');
      const rawRewards = res.data?.rewards || res.rewards || res.data || [];
      const mapped = rawRewards.map(r => ({
        id: r._id || r.id,
        targetDescription: r.targetMilestoneDescription || '',
        targetType: r.targetMetricType || 'Clients Count',
        targetValue: r.targetThresholdValue || '',
        targetDays: r.targetLimitDays || '',
        targetMonths: r.targetLimitMonths || '',
        rewardDescription: r.rewardDescription || '',
        imageUrl: r.rewardImage || '',
        videoUrl: r.rewardVideo || '',
        isActive: r.isActive !== undefined ? r.isActive : true
      }));
      setRewards(mapped);
    } catch (err) {
      console.error('Failed to load rewards:', err);
      addToast(err.message || 'Failed to load rewards from database', 'danger', 'Error');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaiserMap = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        apiRequest('/api/super-admin/clients').catch(() => null),
        apiRequest('/api/super-admin/agents').catch(() => null)
      ]);

      const cList = cRes?.data?.clients || cRes?.clients || cRes?.data || [];
      const aList = aRes?.data?.agents || aRes?.agents || aRes?.data || [];

      const clientsMap = new Map();
      cList.forEach(c => {
        const id = c._id || c.id;
        const profile = c.profile || {};
        const user = c.userId || c.user || {};
        const name = profile.fullName || user.name || user.fullName || c.fullName || c.name || '';
        if (name) {
          if (id) clientsMap.set(id, name);
          const uId = typeof c.userId === 'string' ? c.userId : (user._id || user.id);
          if (uId) clientsMap.set(uId, name);
        }
      });

      const agentsMap = new Map();
      aList.forEach(a => {
        const id = a._id || a.id;
        const profile = a.profile || {};
        const user = a.userId || a.user || {};
        const name = profile.fullName || user.name || user.fullName || a.fullName || a.name || '';
        if (name) {
          if (id) agentsMap.set(id, name);
          const uId = typeof a.userId === 'string' ? a.userId : (user._id || user.id);
          if (uId) agentsMap.set(uId, name);
        }
      });

      setRaiserMap({ clients: clientsMap, agents: agentsMap });
    } catch (err) {
      console.error('Failed to load raiser details for lookup:', err);
    }
  };

  const fetchClaims = async () => {
    setClaimsLoading(true);
    try {
      const res = await apiRequest('/api/super-admin/service-requests');
      const rawReqs = res.data?.serviceRequests || res.data?.requests || res.serviceRequests || res.requests || res.data || [];
      if (Array.isArray(rawReqs)) {
        const filtered = rawReqs.filter(req => req.category === 'Reward Issue' || (req.subject && req.subject.startsWith('[REWARD_CLAIM]')));
        setClaims(filtered);
      }
    } catch (err) {
      console.error('Failed to load claim requests:', err);
      addToast(err.message || 'Failed to fetch claim requests', 'danger', 'Error');
    } finally {
      setClaimsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchRaiserMap();
  }, []);

  const handleOpenAdd = () => {
    setForm({ 
      id: '', 
      targetDescription: '', 
      targetType: 'Clients Count', 
      targetValue: '', 
      targetDays: '', 
      targetMonths: '', 
      rewardDescription: '', 
      imageUrl: '',
      videoUrl: '',
      isActive: true 
    });
    setImageFile(null);
    setVideoFile(null);
    setModalType('add');
    setShowModal(true);
  };

  const handleOpenEdit = (rew) => {
    setForm({ 
      id: rew.id,
      targetDescription: rew.targetDescription || '',
      targetType: rew.targetType || 'Clients Count',
      targetValue: rew.targetValue || '',
      targetDays: rew.targetDays || '',
      targetMonths: rew.targetMonths || '',
      rewardDescription: rew.rewardDescription || '',
      imageUrl: rew.imageUrl || '',
      videoUrl: rew.videoUrl || '',
      isActive: rew.isActive !== undefined ? rew.isActive : true
    });
    setImageFile(null);
    setVideoFile(null);
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reward definition?')) {
      try {
        await apiRequest(`/api/super-admin/rewards/${id}`, {
          method: 'DELETE'
        });
        addToast('Reward definition deleted successfully', 'success', 'Reward Deleted');
        fetchRewards();
      } catch (err) {
        console.error('Failed to delete reward:', err);
        addToast(err.message || 'Failed to delete reward', 'danger', 'Error');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    const targetReward = rewards.find(r => r.id === id);
    if (!targetReward) return;

    const nextActive = !targetReward.isActive;

    try {
      await apiRequest(`/api/super-admin/rewards/${id}`, {
        method: 'PATCH',
        body: { isActive: nextActive }
      });
      addToast(`Reward status toggled to ${nextActive ? 'Active' : 'Inactive'}`, 'info', 'Status Updated');
      fetchRewards();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      addToast(err.message || 'Failed to toggle status', 'danger', 'Error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({
        ...prev,
        imageUrl: ev.target.result
      }));
      addToast('Reward image selected successfully', 'success', 'Image Selected');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({
        ...prev,
        videoUrl: ev.target.result
      }));
      addToast('Reward video selected successfully', 'success', 'Video Selected');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.targetDescription.trim()) {
      alert('Target Description is required.');
      return;
    }
    const val = parseFloat(form.targetValue);
    if (isNaN(val) || val <= 0) {
      alert('Target Value must be a valid positive number.');
      return;
    }
    if (!form.rewardDescription.trim()) {
      alert('Reward Description is required.');
      return;
    }

    const days = parseInt(form.targetDays) || '';
    const months = parseInt(form.targetMonths) || '';

    try {
      const formData = new FormData();
      formData.append('targetMetricType', form.targetType);
      formData.append('targetThresholdValue', String(val));
      formData.append('targetLimitDays', String(days));
      formData.append('targetLimitMonths', String(months));
      formData.append('targetMilestoneDescription', form.targetDescription);
      formData.append('rewardDescription', form.rewardDescription);
      formData.append('isActive', String(form.isActive));

      if (imageFile) {
        formData.append('rewardImage', imageFile);
      }
      if (videoFile) {
        formData.append('rewardVideo', videoFile);
      }

      if (modalType === 'add') {
        await apiRequest('/api/super-admin/rewards', {
          method: 'POST',
          body: formData
        });
        addToast('New reward added successfully', 'success', 'Reward Created');
      } else {
        await apiRequest(`/api/super-admin/rewards/${form.id}`, {
          method: 'PATCH',
          body: formData
        });
        addToast('Reward updated successfully', 'success', 'Reward Updated');
      }
      setShowModal(false);
      fetchRewards();
    } catch (err) {
      console.error('Failed to save reward:', err);
      addToast(err.message || 'Failed to save reward', 'danger', 'Error');
    }
  };

  const handleOpenClaimModal = (claim) => {
    setSelectedClaim(claim);
    setClaimStatus(claim.status || 'Open');
    setClaimRemarks(claim.adminRemarks || claim.remarks || '');
    setNotifyAgent(true);
    setShowClaimModal(true);
  };

  const handleSaveClaimStatus = async () => {
    try {
      setSavingClaim(true);
      await apiRequest(`/api/super-admin/service-requests/${selectedClaim._id || selectedClaim.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: claimStatus,
          adminRemarks: claimRemarks,
          notifyUser: notifyAgent
        })
      });
      addToast('Claim request status updated successfully', 'success', 'Status Updated');
      setShowClaimModal(false);
      fetchClaims();
    } catch (err) {
      console.error('Failed to update claim:', err);
      addToast(err.message || 'Failed to update claim status', 'danger', 'Error');
    } finally {
      setSavingClaim(false);
    }
  };

  const resolveRaiserName = (req) => {
    if (!req) return 'N/A';
    const creator = req.createdBy;
    if (creator && typeof creator === 'object') {
      const name = creator.name || creator.fullName || creator.profile?.fullName || creator.profile?.name;
      if (name) return name;
      if (creator.email) return creator.email;
    }
    const raiser = req.raiserId;
    if (raiser && typeof raiser === 'object') {
      const name = raiser.fullName || raiser.name || raiser.profile?.fullName || raiser.profile?.name || raiser.user?.name || raiser.user?.fullName;
      if (name) return name;
      if (raiser.email) return raiser.email;
    }
    const raiserIdStr = typeof req.raiserId === 'object' ? (req.raiserId?._id || req.raiserId?.id) : req.raiserId;
    const creatorIdStr = typeof req.createdBy === 'object' ? (req.createdBy?._id || req.createdBy?.id) : req.createdBy;
    const lookupId = creatorIdStr || raiserIdStr;
    if (lookupId) {
      const lookupName = raiserMap.clients.get(lookupId) || raiserMap.agents.get(lookupId);
      if (lookupName) return lookupName;
    }
    return req.raisedBy || 'N/A';
  };

  const formatTargetValue = (type, val) => {
    if (type === 'Clients Count') return `${val} Clients`;
    const num = parseFloat(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    const map = {
      'Open': 'pending', // orange
      'In Progress': 'gold', // gold
      'Resolved': 'active', // green
      'Closed': 'inactive' // grey
    };
    return map[status] || 'inactive';
  };

  return (
    <div className="kfpl-page animate-fade-slide-up">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Agent Reward Configurations</h2>
          <p className="kfpl-page-subtitle">Configure performance-linked milestones, catalog rewards, and manage claims</p>
        </div>
        <div className="kfpl-page-header-actions">
          {activeTab === 'catalog' ? (
            <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={handleOpenAdd}>
              + Define New Reward
            </button>
          ) : (
            <button className="kfpl-btn kfpl-btn--secondary kfpl-btn--sm" onClick={fetchClaims}>
              🔄 Refresh Claims
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="kfpl-tabs">
        <button
          className={`kfpl-tab ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          Reward Catalog
        </button>
        <button
          className={`kfpl-tab ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => { setActiveTab('claims'); fetchClaims(); }}
        >
          Claim Requests
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="kfpl-card animate-fade-slide-up">
          <div className="kfpl-table-scroll">
            <table className="kfpl-table">
              <thead>
                <tr>
                  <th>Target Metric</th>
                  <th>Target Threshold</th>
                  <th>Target Duration</th>
                  <th>Target Description</th>
                  <th>Reward Media</th>
                  <th>Reward Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>Loading rewards from database...</td>
                  </tr>
                ) : rewards.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>No rewards configured.</td>
                  </tr>
                ) : (
                  rewards.map(rew => (
                    <tr key={rew.id}>
                      <td>
                        <Badge status={rew.targetType === 'Clients Count' ? 'gold' : 'platinum'}>
                          {rew.targetType}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatTargetValue(rew.targetType, rew.targetValue)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {rew.targetDays ? <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{rew.targetDays} Days</span> : null}
                          {rew.targetMonths ? <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{rew.targetMonths} Months</span> : null}
                          {!rew.targetDays && !rew.targetMonths ? <span style={{ color: 'var(--color-text-muted)' }}>—</span> : null}
                        </div>
                      </td>
                      <td className="wrap" style={{ fontSize: '0.875rem' }}>{rew.targetDescription}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {rew.imageUrl ? (
                            <div 
                              className="kfpl-media-card" 
                              style={{ width: '42px', height: '42px', margin: 0, position: 'relative' }}
                              onClick={() => setPreviewMedia({ name: `${rew.rewardDescription} (Image)`, type: 'image/png', dataUrl: rew.imageUrl })}
                              title="Click to view image"
                            >
                              <img src={rew.imageUrl} alt="Reward Image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div className="kfpl-media-card-overlay">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', color: '#fff' }}>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                              </div>
                            </div>
                          ) : null}

                          {rew.videoUrl ? (
                            <div 
                              className="kfpl-media-card" 
                              style={{ width: '42px', height: '42px', margin: 0, position: 'relative' }}
                              onClick={() => setPreviewMedia({ name: `${rew.rewardDescription} (Video)`, type: 'video/mp4', dataUrl: rew.videoUrl })}
                              title="Click to play video"
                            >
                              <div className="kfpl-media-card-placeholder" style={{ background: 'var(--color-surface-alt)' }}>
                                <span className="kfpl-media-card-ext" style={{ fontSize: '0.5rem', padding: '1px 3px' }}>VID</span>
                              </div>
                              <div className="kfpl-media-card-overlay">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', color: '#fff' }}>
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                              </div>
                            </div>
                          ) : null}

                          {!rew.imageUrl && !rew.videoUrl ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>No Media</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="wrap" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)' }}>{rew.rewardDescription}</td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(rew.id)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', outline: 'none' }}
                          title="Click to toggle status"
                        >
                          <Badge status={rew.isActive ? 'active' : 'inactive'}>
                            {rew.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ padding: '4px 8px' }} onClick={() => handleOpenEdit(rew)}>
                            Edit
                          </button>
                          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ padding: '4px 8px', color: 'var(--color-danger)' }} onClick={() => handleDelete(rew.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Claims Requests Tab */
        <div className="kfpl-card animate-fade-slide-up">
          <div className="kfpl-table-scroll">
            <table className="kfpl-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Agent Name</th>
                  <th>Milestone Reward</th>
                  <th>Claim Details</th>
                  <th>Date Claimed</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claimsLoading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>Loading reward claim requests...</td>
                  </tr>
                ) : claims.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>No reward claims received.</td>
                  </tr>
                ) : (
                  claims.map(claim => {
                    const reqIdStr = claim._id || claim.id;
                    const displayId = reqIdStr ? 'SR-' + reqIdStr.substring(reqIdStr.length - 6).toUpperCase() : 'N/A';
                    const agentName = resolveRaiserName(claim);
                    const rewardTitle = claim.subject ? claim.subject.replace('[REWARD_CLAIM] ', '') : 'Milestone Reward';
                    const claimDate = claim.createdAt || claim.date;

                    return (
                      <tr key={claim._id || claim.id}>
                        <td style={{ fontWeight: 600 }}>{displayId}</td>
                        <td className="kfpl-table-cell-primary">{agentName}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{rewardTitle}</td>
                        <td>
                          <div style={{ maxWidth: '300px', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-muted)' }} title={claim.description}>
                            {claim.description}
                          </div>
                        </td>
                        <td>{claimDate ? new Date(claimDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                        <td>
                          <Badge status={getStatusBadge(claim.status)}>{claim.status || 'Open'}</Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => handleOpenClaimModal(claim)}>
                            Review Request
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Define / Edit Reward Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === 'add' ? 'Define New Performance Reward' : 'Edit Reward Definition'}
        footer={
          <>
            <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="kfpl-btn kfpl-btn--primary" onClick={handleSave}>Save Reward</button>
          </>
        }
      >
        <div className="kfpl-form" style={{ gap: '16px' }}>
          <div className="kfpl-form-row">
            <div className="kfpl-input-group" style={{ flex: 1 }}>
              <label className="kfpl-input-label">Target Metric Type <span className="required">*</span></label>
              <select
                className="kfpl-select"
                value={form.targetType}
                onChange={(e) => setForm(prev => ({ ...prev, targetType: e.target.value }))}
              >
                <option value="Clients Count">Clients Count</option>
                <option value="Investment Volume (₹)">Investment Volume (₹)</option>
              </select>
            </div>
            <div className="kfpl-input-group" style={{ flex: 1 }}>
              <label className="kfpl-input-label">Target Threshold Value <span className="required">*</span></label>
              <input
                type="number"
                className="kfpl-input"
                value={form.targetValue}
                onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                placeholder={form.targetType === 'Clients Count' ? 'e.g. 10' : 'e.g. 5000000'}
              />
            </div>
          </div>

          <div className="kfpl-form-row">
            <div className="kfpl-input-group" style={{ flex: 1 }}>
              <label className="kfpl-input-label">Target Limit (Days)</label>
              <input
                type="number"
                className="kfpl-input"
                value={form.targetDays}
                onChange={(e) => setForm(prev => ({ ...prev, targetDays: e.target.value }))}
                placeholder="e.g. 45"
              />
            </div>
            <div className="kfpl-input-group" style={{ flex: 1 }}>
              <label className="kfpl-input-label">Target Limit (Months)</label>
              <input
                type="number"
                className="kfpl-input"
                value={form.targetMonths}
                onChange={(e) => setForm(prev => ({ ...prev, targetMonths: e.target.value }))}
                placeholder="e.g. 3"
              />
            </div>
          </div>

          <div className="kfpl-input-group">
            <label className="kfpl-input-label">Target Milestone Description <span className="required">*</span></label>
            <input
              type="text"
              className="kfpl-input"
              value={form.targetDescription}
              onChange={(e) => setForm(prev => ({ ...prev, targetDescription: e.target.value }))}
              placeholder="e.g. Onboard 10 clients with active investments"
            />
          </div>

          <div className="kfpl-input-group">
            <label className="kfpl-input-label">Reward Description <span className="required">*</span></label>
            <textarea
              className="kfpl-textarea"
              value={form.rewardDescription}
              onChange={(e) => setForm(prev => ({ ...prev, rewardDescription: e.target.value }))}
              placeholder="e.g. Holiday package to Bali + ₹1L cash prize..."
              rows="3"
            />
          </div>

          <div className="kfpl-input-group">
            <label className="kfpl-input-label">Reward Media Uploads</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
              {/* Image Upload Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Reward Image</span>
                <input
                  type="file"
                  id="reward-image-file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="reward-image-file" className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ display: 'inline-flex', cursor: 'pointer', width: 'fit-content' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Upload Image
                </label>

                {form.imageUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                    <img src={form.imageUrl} alt="Image Preview" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Image Ready</span>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                        style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left', width: 'fit-content' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Upload Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Reward Video</span>
                <input
                  type="file"
                  id="reward-video-file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="reward-video-file" className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ display: 'inline-flex', cursor: 'pointer', width: 'fit-content' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  Upload Video
                </label>

                {form.videoUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-border-light)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800 }}>VID</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Video Ready</span>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, videoUrl: '' }))}
                        style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left', width: 'fit-content' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Is Active</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Whether this reward milestone is open for agents to achieve</div>
            </div>
            <div className="kfpl-toggle" onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}>
              <div className={`kfpl-toggle-track ${form.isActive ? 'active' : ''}`}>
                <div className="kfpl-toggle-thumb"></div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Review Claim Modal */}
      {selectedClaim && (
        <Modal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          title={`Review Reward Claim request`}
          footer={
            <>
              <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setShowClaimModal(false)} disabled={savingClaim}>Close</button>
              <button className="kfpl-btn kfpl-btn--primary" onClick={handleSaveClaimStatus} disabled={savingClaim}>
                {savingClaim ? 'Updating...' : 'Update Request'}
              </button>
            </>
          }
        >
          <div className="kfpl-form" style={{ gap: '16px' }}>
            <div>
              <label className="kfpl-input-label" style={{ fontWeight: 700, color: 'var(--color-navy)' }}>Agent Name</label>
              <div style={{ padding: '8px 12px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontWeight: 600 }}>
                {resolveRaiserName(selectedClaim)}
              </div>
            </div>

            <div>
              <label className="kfpl-input-label" style={{ fontWeight: 700, color: 'var(--color-navy)' }}>Milestone / Reward Title</label>
              <div style={{ padding: '8px 12px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontWeight: 600, color: 'var(--color-success)' }}>
                {selectedClaim.subject ? selectedClaim.subject.replace('[REWARD_CLAIM] ', '') : 'N/A'}
              </div>
            </div>

            <div>
              <label className="kfpl-input-label" style={{ fontWeight: 700, color: 'var(--color-navy)' }}>Claim details & Delivery info</label>
              <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
                {selectedClaim.description}
              </div>
            </div>

            <div className="kfpl-form-row" style={{ gap: '16px' }}>
              <div className="kfpl-input-group" style={{ flex: 1 }}>
                <label className="kfpl-input-label">Update Status</label>
                <select 
                  className="kfpl-select" 
                  value={claimStatus} 
                  onChange={(e) => setClaimStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved (Fulfill Claim)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="kfpl-input-label">Admin Remarks & Notes</label>
              <textarea 
                className="kfpl-textarea" 
                placeholder="Enter courier tracking ID, shipment date, or notes..." 
                value={claimRemarks}
                onChange={(e) => setClaimRemarks(e.target.value)}
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <input 
                type="checkbox" 
                id="notify-agent-checkbox"
                checked={notifyAgent} 
                onChange={(e) => setNotifyAgent(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="notify-agent-checkbox" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                Notify Agent via Portal Notification
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Media Preview Modal */}
      <Modal
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        title={previewMedia?.name || 'Reward Media Preview'}
        size="lg"
        footer={
          <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setPreviewMedia(null)}>Close</button>
        }
      >
        {previewMedia && (
          <div className="kfpl-media-preview-container">
            {previewMedia.type?.startsWith('video/') ? (
              <video
                src={previewMedia.dataUrl}
                controls
                autoPlay
                className="kfpl-media-preview-content"
                style={{ outline: 'none' }}
              />
            ) : (
              <img
                src={previewMedia.dataUrl}
                alt="Reward Large Preview"
                className="kfpl-media-preview-content"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

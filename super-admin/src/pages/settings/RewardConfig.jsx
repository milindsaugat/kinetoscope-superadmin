/* ============================================================
   Page: RewardConfig.jsx
   Description: Configuration dashboard for Agent Reward Catalog
   ============================================================ */

import { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

const DEFAULT_REWARDS = [
  { 
    id: 'rew-1', 
    targetDescription: 'Recruit 10 Active Clients', 
    targetType: 'Clients Count', 
    targetValue: 10, 
    targetDays: 45, 
    targetMonths: 3, 
    rewardDescription: 'Free annual holiday package to Bali + Elite Partner Badge', 
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23ECFDF5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2310B981" font-family="sans-serif" font-weight="bold" font-size="18">BALI TRIP PACK</text></svg>',
    videoUrl: '',
    isActive: true 
  },
  { 
    id: 'rew-2', 
    targetDescription: 'Reach ₹50 Lakhs Business Volume', 
    targetType: 'Investment Volume', 
    targetValue: 5000000, 
    targetDays: 90, 
    targetMonths: 6, 
    rewardDescription: '₹1 Lakh cash bonus + Golden Trophy at annual meet', 
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23FFFBEB"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23F59E0B" font-family="sans-serif" font-weight="bold" font-size="18">GOLDEN TROPHY</text></svg>',
    videoUrl: '',
    isActive: true 
  },
  { 
    id: 'rew-3', 
    targetDescription: 'Reach ₹1 Crore Business Volume', 
    targetType: 'Investment Volume', 
    targetValue: 10000000, 
    targetDays: 180, 
    targetMonths: 12, 
    rewardDescription: '₹2.5 Lakhs cash bonus + Diamond Ring & VIP Board seat', 
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23EFF6FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%233B82F6" font-family="sans-serif" font-weight="bold" font-size="18">DIAMOND VIP SEAT</text></svg>',
    videoUrl: '',
    isActive: true 
  }
];

export default function RewardConfig() {
  const addToast = useToast();

  const [rewards, setRewards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [previewMedia, setPreviewMedia] = useState(null);

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

  // Load from localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem('kfpl_reward_catalog');
    if (data) {
      setRewards(JSON.parse(data));
    } else {
      setRewards(DEFAULT_REWARDS);
      localStorage.setItem('kfpl_reward_catalog', JSON.stringify(DEFAULT_REWARDS));
    }
  }, []);

  const saveRewards = (updatedList) => {
    setRewards(updatedList);
    localStorage.setItem('kfpl_reward_catalog', JSON.stringify(updatedList));
  };

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
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this reward definition?')) {
      const updated = rewards.filter(r => r.id !== id);
      saveRewards(updated);
      addToast('Reward definition deleted successfully', 'success', 'Reward Deleted');
    }
  };

  const handleToggleStatus = (id) => {
    const updated = rewards.map(r => {
      if (r.id === id) {
        const nextActive = !r.isActive;
        addToast(`Reward status toggled to ${nextActive ? 'Active' : 'Inactive'}`, 'info', 'Status Updated');
        return { ...r, isActive: nextActive };
      }
      return r;
    });
    saveRewards(updated);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({
        ...prev,
        imageUrl: ev.target.result
      }));
      addToast('Reward image uploaded successfully', 'success', 'Image Uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({
        ...prev,
        videoUrl: ev.target.result
      }));
      addToast('Reward video uploaded successfully', 'success', 'Video Uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
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

    let updated;
    if (modalType === 'add') {
      const newRew = {
        ...form,
        id: 'rew-' + Date.now(),
        targetValue: val,
        targetDays: days,
        targetMonths: months
      };
      updated = [...rewards, newRew];
      addToast('New reward added successfully', 'success', 'Reward Created');
    } else {
      updated = rewards.map(r => {
        if (r.id === form.id) {
          return { ...form, targetValue: val, targetDays: days, targetMonths: months };
        }
        return r;
      });
      addToast('Reward updated successfully', 'success', 'Reward Updated');
    }

    saveRewards(updated);
    setShowModal(false);
  };

  const formatTargetValue = (type, val) => {
    if (type === 'Clients Count') return `${val} Clients`;
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="kfpl-page animate-fade-slide-up">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Agent Reward Catalog</h2>
          <p className="kfpl-page-subtitle">Configure performance-linked milestones, rewards, and eligibility definitions for agents</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={handleOpenAdd}>
            + Define New Reward
          </button>
        </div>
      </div>

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
              {rewards.length === 0 ? (
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

      {/* Reward Form Modal */}
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
                <option value="Investment Volume">Investment Volume (₹)</option>
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

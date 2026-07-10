/* ============================================================
   Page: InvestmentStatus.jsx
   Description: Project-wise segment-wise status updates with full CRUD,
                segment management, and media upload capabilities.
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { INVESTMENT_SEGMENTS, formatCurrency } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';
import { apiRequest } from '../../config/apiHelper';

// ── Default status updates ──────────────────
const DEFAULT_STATUS_UPDATES = [
  {
    id: 1,
    segment: 'Film Making',
    project: 'Project Astra',
    status: 'In Production',
    progress: 65,
    lastUpdate: '2025-04-10',
    note: 'Post-production phase begins next week',
    media: [
      {
        id: 'mock-1',
        name: 'astra_poster.png',
        type: 'image/png',
        size: 154200,
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%230b3020"/><circle cx="150" cy="150" r="80" fill="%2310b981"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23061d13" font-family="sans-serif" font-weight="bold" font-size="24">PROJECT ASTRA</text></svg>',
        uploadedAt: '2025-04-10T12:00:00.000Z'
      },
      {
        id: 'mock-2',
        name: 'distribution_agreement.pdf',
        type: 'application/pdf',
        size: 2458000,
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmoKICA8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gL1Jlc291cmNlcyA8PCA+PiA+PiBlbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDEzNCAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKMjI4CiUlRU9GCg==',
        uploadedAt: '2025-04-10T12:05:00.000Z'
      }
    ]
  },
  { id: 2, segment: 'Distribution', project: 'Meridian Release', status: 'Active', progress: 80, lastUpdate: '2025-04-08', note: 'Distribution across 3 states confirmed', media: [] },
  { id: 3, segment: 'Music', project: 'Rhythm Series', status: 'Recording', progress: 40, lastUpdate: '2025-04-05', note: '4 tracks completed, 6 remaining', media: [] },
  { id: 4, segment: 'Trading & Syndication', project: 'Content Deal Q2', status: 'Negotiation', progress: 30, lastUpdate: '2025-04-12', note: 'Final terms under discussion', media: [] },
  { id: 5, segment: 'Content IP Bank', project: 'Archive Digitization', status: 'Ongoing', progress: 55, lastUpdate: '2025-04-09', note: '550 titles digitized so far', media: [] },
  { id: 6, segment: 'Film Exhibition', project: 'Screen Network', status: 'Planning', progress: 15, lastUpdate: '2025-04-11', note: '3 new screen locations identified', media: [] },
];

const SEGMENT_COLORS = {
  'Film Making': '#10B981', Distribution: '#1565C0', Music: '#7C3AED',
  'Trading & Syndication': '#F59E0B', 'Content IP Bank': '#0F766E', 'Film Exhibition': '#0891B2',
};

const LS_KEY = 'kfpl_investment_status';
const LS_CUSTOM_SEGMENTS_KEY = 'kfpl_custom_segments';
const LS_HISTORY_KEY = 'kfpl_investment_status_history';

const DEFAULT_SEGMENTS_CONFIG = [
  { name: 'Film Making', statuses: ['Planning', 'In Production', 'Active', 'Ongoing', 'Completed'], isDefault: true },
  { name: 'Distribution', statuses: ['Planning', 'Active', 'Ongoing', 'Negotiation', 'Completed'], isDefault: true },
  { name: 'Music', statuses: ['Planning', 'Recording', 'Active', 'Ongoing', 'Completed', 'Released'], isDefault: true },
  { name: 'Trading & Syndication', statuses: ['Planning', 'Negotiation', 'Active', 'Ongoing', 'Completed'], isDefault: true },
  { name: 'Content IP Bank', statuses: ['Planning', 'Ongoing', 'Active', 'Completed'], isDefault: true },
  { name: 'Film Exhibition', statuses: ['Planning', 'Ongoing', 'Active', 'Completed'], isDefault: true },
];

export default function InvestmentStatus() {
  const addToast = useToast();
  const fileInputRef = useRef(null);

  // ── State ──────────────────────────────
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [segmentsConfig, setSegmentsConfig] = useState(DEFAULT_SEGMENTS_CONFIG);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [editId, setEditId] = useState(null);
  const [updateNote, setUpdateNote] = useState('');
  const [isSegmentWidePost, setIsSegmentWidePost] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showHistoryLogModal, setShowHistoryLogModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historySegmentFilter, setHistorySegmentFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    isSegmentWide: false,
    project: '',
    segment: '',
    status: 'Planning',
    progress: 0,
    note: '',
  });
  const [newSegmentName, setNewSegmentName] = useState('');

  // ── Fetch from APIs ────────────────────────
  const loadDashboardData = async () => {
    try {
      const data = await apiRequest('/api/super-admin/projects');
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.projects && Array.isArray(data.projects)) {
        list = data.projects;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data.data?.projects && Array.isArray(data.data.projects)) {
        list = data.data.projects;
      }

      const mapped = list
        .filter(p => p.name !== '__KFPL_DUMMY__')
        .map(p => ({
          id: p._id || p.id,
          project: p.name || '',
          segment: p.segment || '',
          status: p.status || 'Planning',
          progress: p.milestoneProgress !== undefined ? p.milestoneProgress : (p.progress !== undefined ? p.progress : 0),
          lastUpdate: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : '—',
          note: p.currentUpdate || p.update || p.summary || '',
          media: (p.mediaFiles || []).map((url, idx) => ({
            id: url,
            name: url.split('/').pop() || `File ${idx + 1}`,
            type: url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image/png' : 'application/pdf',
            size: 0,
            dataUrl: url,
            uploadedAt: new Date().toISOString()
          }))
        }));
      setStatusUpdates(mapped);
    } catch (err) {
      console.error('Failed to load investment status from API', err);
    }
  };

  const loadSegments = async () => {
    try {
      const data = await apiRequest('/api/super-admin/segments');
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.segments && Array.isArray(data.segments)) {
        list = data.segments;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data.data?.segments && Array.isArray(data.data.segments)) {
        list = data.data.segments;
      }

      if (list && list.length > 0) {
        const mapped = list.map(s => ({
          id: s._id || s.id,
          name: s.name || '',
          statuses: s.statuses && s.statuses.length > 0 ? s.statuses : ['Planning', 'Active', 'Ongoing', 'Completed'],
          isDefault: s.isDefault !== undefined ? s.isDefault : true
        }));

        // Merge with default segments, ensuring backend custom ones are appended
        const merged = [...DEFAULT_SEGMENTS_CONFIG];
        mapped.forEach(m => {
          const idx = merged.findIndex(d => d.name.toLowerCase() === m.name.toLowerCase());
          if (idx > -1) {
            merged[idx] = m;
          } else {
            merged.push(m);
          }
        });
        setSegmentsConfig(merged);
      } else {
        setSegmentsConfig(DEFAULT_SEGMENTS_CONFIG);
      }
    } catch (err) {
      console.error('Failed to load segments from API, using defaults:', err);
      setSegmentsConfig(DEFAULT_SEGMENTS_CONFIG);
    }
  };

  const loadHistory = async () => {
    try {
      const segFilter = historySegmentFilter === 'all' ? 'All Segments' : historySegmentFilter;
      const searchFilter = historySearch.trim();
      const query = `segment=${encodeURIComponent(segFilter)}&search=${encodeURIComponent(searchFilter)}`;
      const data = await apiRequest(`/api/super-admin/projects/updates/history?${query}`);

      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.history && Array.isArray(data.history)) {
        list = data.history;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data.data?.history && Array.isArray(data.data.history)) {
        list = data.data.history;
      }

      const mapped = list.map(h => ({
        id: h._id || h.id,
        type: h.type || 'project',
        segment: h.segment || '',
        project: h.project || h.projectName || '',
        status: h.status || '',
        progress: h.progress || 0,
        note: h.notes || h.note || '',
        date: h.date || (h.createdAt ? new Date(h.createdAt).toISOString().split('T')[0] : '—'),
        media: (h.attachments || h.media || []).map((url, idx) => ({
          id: url,
          name: url.split('/').pop() || `File ${idx + 1}`,
          url: url,
          dataUrl: url
        }))
      }));
      setHistoryLogs(mapped);
    } catch (err) {
      console.error('Failed to load history logs:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
    loadSegments();
  }, []);

  // Update history load on filter changes
  useEffect(() => {
    if (showHistoryLogModal) {
      loadHistory();
    }
  }, [historySegmentFilter, historySearch, showHistoryLogModal]);

  // ── All available segments ─────────────────
  const allSegments = segmentsConfig.map(s => s.name);

  // Derive customSegments list from segmentsConfig
  const customSegments = segmentsConfig
    .filter(c => !c.isDefault)
    .map(c => c.name);

  // ── CRUD Handlers ─────────────────────────
  const resetForm = () => {
    setFormData({ isSegmentWide: false, project: '', segment: '', status: 'Planning', progress: 0, note: '' });
  };

  const openAddModal = () => {
    resetForm();
    setEditingItem(null);
    setShowAddModal(true);
  };

  const openEditModal = async (item) => {
    setEditingItem(item);
    setShowAddModal(true);
    
    // Set initial values from the list first
    setFormData({
      isSegmentWide: !!item.isSegmentWide,
      project: item.project || '',
      segment: item.segment,
      status: item.status,
      progress: item.progress,
      note: item.note || '',
    });

    // If it's a specific project, fetch fresh full details from GET /api/super-admin/projects/:id
    if (item.id && !item.isSegmentWide) {
      try {
        const details = await apiRequest(`/api/super-admin/projects/${item.id}`);
        const p = details?.project || details?.data?.project || details?.data || details;
        if (p) {
          setFormData({
            isSegmentWide: false,
            project: p.name || item.project || '',
            segment: p.segment || item.segment || '',
            status: p.status || item.status || 'Planning',
            progress: p.milestoneProgress !== undefined ? p.milestoneProgress : (p.progress || item.progress || 0),
            note: p.summary || p.notes || p.currentUpdate || item.note || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch project details from API:', err);
      }
    }
  };

  const handleSaveProject = async () => {
    if (!formData.project.trim() || !formData.segment) {
      addToast('Please fill in project name and segment', 'error', 'Validation Error');
      return;
    }

    try {
      const payload = {
        name: formData.project,
        segment: formData.segment,
        status: formData.status,
        portfolioValue: '₹0 Cr',
        monthlyRoi: '1%',
        riskLevel: 'Medium',
        health: 'On Track',
        summary: formData.note || ''
      };

      if (editingItem) {
        await apiRequest(`/api/super-admin/projects/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        addToast(`${formData.project} updated successfully`, 'success', 'Updated');
      } else {
        await apiRequest('/api/super-admin/projects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        addToast(`${formData.project} added successfully`, 'success', 'Added');
      }

      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      loadDashboardData();
    } catch (err) {
      console.error('Failed to save project:', err);
      addToast(err.message || 'Failed to save project.', 'error', 'Error');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await apiRequest(`/api/super-admin/projects/${id}`, {
        method: 'DELETE'
      });
      addToast('Project deleted', 'success', 'Deleted');
      setDeleteConfirm(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to delete project:', err);
      addToast(err.message || 'Failed to delete project.', 'error', 'Error');
      setDeleteConfirm(null);
    }
  };

  const handlePostUpdate = async (item) => {
    const noteToPost = updateNote.trim() || item.note;
    const attachmentsList = (item.media || []).map(m => m.dataUrl || m.url || m.id).filter(Boolean);

    try {
      await apiRequest(`/api/super-admin/projects/${item.id}/updates`, {
        method: 'POST',
        body: JSON.stringify({
          status: item.status,
          progress: parseInt(item.progress) || 0,
          notes: noteToPost,
          attachments: attachmentsList,
          applySegmentWide: isSegmentWidePost
        })
      });

      addToast(`Status update posted for ${isSegmentWidePost ? item.segment : item.project}`, 'success', 'Update Posted');
      setEditId(null);
      setUpdateNote('');
      setIsSegmentWidePost(false);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to post status update:', err);
      addToast(err.message || 'Failed to post status update.', 'error', 'Error');
    }
  };

  // ── Segment Management ─────────────────────
  const handleAddSegment = async () => {
    if (!newSegmentName.trim()) {
      addToast('Please enter a segment name', 'error', 'Validation Error');
      return;
    }
    if (allSegments.some(s => s.toLowerCase() === newSegmentName.trim().toLowerCase())) {
      addToast('Segment already exists', 'error', 'Duplicate');
      return;
    }

    try {
      await apiRequest('/api/super-admin/segments', {
        method: 'POST',
        body: JSON.stringify({
          name: newSegmentName.trim(),
          statuses: ['Planning', 'Active', 'Ongoing', 'Completed']
        })
      });
      addToast(`Segment "${newSegmentName.trim()}" added`, 'success', 'Segment Added');
      setNewSegmentName('');
      loadSegments();
    } catch (err) {
      console.error('Failed to add segment:', err);
      addToast(err.message || 'Failed to add segment.', 'error', 'Error');
    }
  };

  const handleRemoveSegment = async (seg) => {
    const target = segmentsConfig.find(s => s.name === seg);
    if (!target) return;

    try {
      await apiRequest(`/api/super-admin/segments/${target.id}`, {
        method: 'DELETE'
      });
      addToast(`Segment "${seg}" removed`, 'success', 'Segment Removed');
      loadSegments();
    } catch (err) {
      console.error('Failed to remove segment:', err);
      addToast(err.message || 'Failed to remove segment.', 'error', 'Error');
    }
  };

  // ── Media Upload ──────────────────────────
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!uploadTarget || files.length === 0) return;

    const file = files[0];
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const extractUrl = (res) => {
      if (typeof res === 'string') return res;
      if (!res) return '';
      const url = res.url || 
                  res.secure_url || 
                  res.fileUrl || 
                  res.dataUrl || 
                  res.data?.url || 
                  res.data?.secure_url || 
                  res.data?.fileUrl ||
                  '';
      if (url) return url;
      
      const proj = res.project || res.data?.project;
      if (proj && Array.isArray(proj.mediaFiles) && proj.mediaFiles.length > 0) {
        return proj.mediaFiles[proj.mediaFiles.length - 1];
      }
      if (Array.isArray(res.mediaFiles) && res.mediaFiles.length > 0) {
        return res.mediaFiles[res.mediaFiles.length - 1];
      }
      return '';
    };

    try {
      addToast('Uploading attachment...', 'info', 'Uploading');
      
      let uploadResult = null;
      let fileUrl = '';
      
      try {
        // Try the updates attachment route first
        uploadResult = await apiRequest(`/api/super-admin/projects/${uploadTarget}/updates/attachments`, {
          method: 'POST',
          body: uploadFormData
        });
        fileUrl = extractUrl(uploadResult);
      } catch (primaryErr) {
        console.warn('Primary updates attachment upload failed, trying media route fallback:', primaryErr);
        
        // Fallback to the working media route
        uploadResult = await apiRequest(`/api/super-admin/projects/${uploadTarget}/media`, {
          method: 'POST',
          body: uploadFormData
        });
        fileUrl = extractUrl(uploadResult);
      }

      if (fileUrl) {
        const mediaItem = {
          id: fileUrl,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: fileUrl,
          uploadedAt: new Date().toISOString()
        };

        setStatusUpdates(prev => prev.map(item => {
          if (item.id === uploadTarget) {
            return { ...item, media: [...(item.media || []), mediaItem] };
          }
          return item;
        }));
        addToast('File uploaded successfully!', 'success', 'Upload Complete');
      } else {
        throw new Error('No URL returned from backend upload');
      }
    } catch (err) {
      console.error('Failed to upload media:', err);
      addToast(err.message || 'Failed to upload attachment.', 'error', 'Error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadTarget(null);
    }
  };

  const handleRemoveMedia = (itemId, mediaId) => {
    // Simply filter locally since it's associated with draft notes
    setStatusUpdates(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, media: (item.media || []).filter(m => m.id !== mediaId) };
      }
      return item;
    }));
    addToast('Media removed', 'success', 'Removed');
  };

  const filteredUpdates = statusUpdates.filter(item => {
    const proj = item.isSegmentWide ? `${item.segment} Segment Update` : (item.project || '');
    const seg = item.segment || '';
    return proj.toLowerCase().includes(searchTerm.toLowerCase()) ||
           seg.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="kfpl-page animate-fade-slide-up">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: 'none' }} onChange={handleMediaUpload} />

      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Investment Status</h2>
          <p className="kfpl-page-subtitle">Project-wise segment-wise investment status updates</p>
        </div>
        <div className="kfpl-page-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => setShowHistoryLogModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            View Update History
          </button>
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => setShowSegmentModal(true)}>
            + Add Segment
          </button>
          <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={openAddModal}>
            + Add Project
          </button>
        </div>
      </div>

      {/* Search Filter Row */}
      <div className="kfpl-search-filter-row" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="kfpl-input"
            placeholder="Search updates by project or segment name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--color-text-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredUpdates.length === 0 ? (
          <div className="kfpl-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No updates found.
          </div>
        ) : filteredUpdates.map(item => {
          const accent = SEGMENT_COLORS[item.segment] || '#10B981';
          return (
            <div
              className="kfpl-status-card animate-fade-slide-up"
              key={item.id}
              style={{ '--accent-color': accent, '--accent-color-dark': accent }}
            >
              {/* Header block with title, segment, and action buttons */}
              <div className="kfpl-status-card-header">
                <div className="kfpl-status-card-title-group">
                  <div className="kfpl-status-card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 className="kfpl-status-card-title">
                      {item.isSegmentWide ? `${item.segment} Segment Update` : item.project}
                    </h3>
                    <Badge status={['Active', 'Ongoing', 'In Production'].includes(item.status) ? 'active' : 'pending'}>{item.status}</Badge>
                    {item.isSegmentWide && (
                      <Badge status="info">Segment Wide</Badge>
                    )}
                  </div>
                  
                  {/* Meta tag pills */}
                  <div className="kfpl-status-card-meta-row">
                    <span className="kfpl-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, color: accent }}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{item.segment}</span>
                    </span>
                    <span className="kfpl-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, color: 'var(--color-text-muted)' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Updated: {item.lastUpdate}</span>
                    </span>
                    {(item.media || []).length > 0 && (
                      <span className="kfpl-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, color: 'var(--color-text-muted)' }}>
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{item.media.length} File(s)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions button list */}
                <div className="kfpl-status-card-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="kfpl-status-card-btn"
                    onClick={() => { setEditId(editId === item.id ? null : item.id); setUpdateNote(''); setIsSegmentWidePost(false); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {editId === item.id ? 'Cancel' : 'Post Update'}
                  </button>
                  <button
                    className="kfpl-status-card-btn"
                    onClick={() => openEditModal(item)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="kfpl-status-card-btn danger"
                    onClick={() => setDeleteConfirm(item)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                  <button
                    className="kfpl-status-card-btn"
                    onClick={() => {
                      setUploadTarget(item.id);
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Upload
                  </button>
                </div>
              </div>

              {/* Card Body grid */}
              <div className="kfpl-status-card-grid">
                {/* Left Column: Note bubble */}
                <div className="kfpl-status-bubble" style={{ '--accent-color': accent }}>
                  <div className="kfpl-status-bubble-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Latest Project Status
                  </div>
                  <p className="kfpl-status-bubble-content">
                    "{item.note || 'No updates have been posted for this segment cycle.'}"
                  </p>
                </div>

                {/* Right Column: Progress tracker and Attached files */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Progress Tracker */}
                  <div className="kfpl-status-progress-block" style={{ '--accent-color': accent }}>
                    <div className="kfpl-status-progress-header">
                      <span className="kfpl-status-progress-label">Milestone Completion</span>
                      <span className="kfpl-status-progress-value">{item.progress}%</span>
                    </div>
                    <div className="kfpl-status-progress-bar">
                      <div className="kfpl-status-progress-bar-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>

                  {/* Media gallery grid */}
                  {(item.media || []).length > 0 && (
                    <div className="kfpl-media-section">
                      <div className="kfpl-media-section-header">Attached Files ({item.media.length})</div>
                      <div className="kfpl-media-grid">
                        {item.media.map(m => (
                          <div
                            key={m.id}
                            className="kfpl-media-card"
                            style={{ '--accent-color': accent }}
                            onClick={() => setPreviewMedia(m)}
                          >
                            <button
                              className="kfpl-media-card-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMedia(item.id, m.id);
                              }}
                              aria-label="Remove media"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                            
                            {m.type?.startsWith('image/') ? (
                              <>
                                <img src={m.dataUrl} alt={m.name} />
                                <div className="kfpl-media-card-overlay">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                </div>
                              </>
                            ) : m.type?.startsWith('video/') ? (
                              <>
                                <div className="kfpl-media-card-placeholder">
                                  <span className="kfpl-media-card-ext">Video</span>
                                  <span className="kfpl-media-card-name">{m.name}</span>
                                </div>
                                <div className="kfpl-media-card-overlay">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                  </svg>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="kfpl-media-card-placeholder">
                                  <span className="kfpl-media-card-ext">{m.name?.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                                  <span className="kfpl-media-card-name">{m.name}</span>
                                </div>
                                <div className="kfpl-media-card-overlay">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline note edit container */}
              {editId === item.id && (
                <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)', animation: 'fadeIn 0.2s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isSegmentWidePost}
                      onChange={(e) => setIsSegmentWidePost(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Apply update segment-wide (this update will represent the entire <strong>{item.segment}</strong> segment)</span>
                  </label>
                  <div className="kfpl-input-group" style={{ marginBottom: '12px' }}>
                    <label className="kfpl-input-label">Post New Status Note</label>
                    <textarea
                      className="kfpl-textarea"
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      placeholder="Write a status update for this project..."
                      rows="3"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="kfpl-btn kfpl-btn--primary kfpl-btn--sm"
                      onClick={() => handlePostUpdate(item)}
                      disabled={!updateNote.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Publish Update
                    </button>
                    <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => setEditId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══════ Add / Edit Project Modal ═══════ */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingItem(null); resetForm(); }}
        title={editingItem ? (formData.isSegmentWide ? 'Edit Segment Update' : 'Edit Project') : (formData.isSegmentWide ? 'Add Segment Update' : 'Add New Project')}
        footer={
          <>
            <button className="kfpl-btn kfpl-btn--ghost" onClick={() => { setShowAddModal(false); setEditingItem(null); resetForm(); }}>Cancel</button>
            <button className="kfpl-btn kfpl-btn--primary" onClick={handleSaveProject}>{editingItem ? 'Update' : (formData.isSegmentWide ? 'Add Update' : 'Add Project')}</button>
          </>
        }
      >
        <div className="kfpl-form" style={{ gap: '16px' }}>
          <div className="kfpl-input-group">
            <label className="kfpl-input-label">Update Scope</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="updateScope"
                  checked={!formData.isSegmentWide}
                  onChange={() => setFormData({ ...formData, isSegmentWide: false })}
                />
                Specific Project
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="updateScope"
                  checked={formData.isSegmentWide}
                  onChange={() => setFormData({ ...formData, isSegmentWide: true })}
                />
                Segment-Wide Update
              </label>
            </div>
          </div>
          
          {!formData.isSegmentWide && (
            <div className="kfpl-input-group animate-fade-slide-up">
              <label className="kfpl-input-label">Project Name <span className="required">*</span></label>
              <input type="text" className="kfpl-input" value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })} placeholder="Enter project name" />
            </div>
          )}

          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Segment <span className="required">*</span></label>
              <select
                className="kfpl-select"
                value={formData.segment}
                onChange={e => {
                  const selectedSeg = e.target.value;
                  const segConfig = segmentsConfig.find(s => s.name === selectedSeg);
                  const defaultStatus = segConfig && segConfig.statuses.length > 0 ? segConfig.statuses[0] : '';
                  setFormData({ ...formData, segment: selectedSeg, status: defaultStatus });
                }}
              >
                <option value="">Select segment</option>
                {allSegments.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Status</label>
              <select
                className="kfpl-select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                disabled={!formData.segment}
              >
                <option value="">Select status</option>
                {((segmentsConfig.find(s => s.name === formData.segment)?.statuses) || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {formData.status && !((segmentsConfig.find(s => s.name === formData.segment)?.statuses) || []).includes(formData.status) && (
                  <option value={formData.status}>{formData.status} (Current)</option>
                )}
              </select>
            </div>
          </div>
          <div className="kfpl-input-group">
            <label className="kfpl-input-label">Progress (%)</label>
            <input type="number" className="kfpl-input" min="0" max="100" value={formData.progress} onChange={e => setFormData({ ...formData, progress: e.target.value })} />
          </div>
          <div className="kfpl-input-group">
            <label className="kfpl-input-label">Notes</label>
            <textarea className="kfpl-textarea" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Brief description or status note..." rows="3" />
          </div>
        </div>
      </Modal>

      {/* ═══════ Add Segment Modal ═══════ */}
      <Modal
        isOpen={showSegmentModal}
        onClose={() => { setShowSegmentModal(false); setNewSegmentName(''); }}
        title="Manage Segments"
        size="sm"
        footer={
          <button className="kfpl-btn kfpl-btn--ghost" onClick={() => { setShowSegmentModal(false); setNewSegmentName(''); }}>Close</button>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <div className="kfpl-input-group" style={{ marginBottom: '12px' }}>
            <label className="kfpl-input-label">New Segment Name</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" className="kfpl-input" value={newSegmentName} onChange={e => setNewSegmentName(e.target.value)} placeholder="e.g. OTT Platform" style={{ flex: 1 }} />
              <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={handleAddSegment}>Add</button>
            </div>
          </div>

          {/* Existing segments */}
          <div>
            <label className="kfpl-input-label" style={{ marginBottom: '8px', display: 'block' }}>Default Segments</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {INVESTMENT_SEGMENTS.map(s => (
                <span key={s.name} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {s.name}
                </span>
              ))}
            </div>

            {customSegments.length > 0 && (
              <>
                <label className="kfpl-input-label" style={{ marginBottom: '8px', display: 'block' }}>Custom Segments</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {customSegments.map(seg => (
                    <span key={seg} style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                      background: 'var(--color-gold-surface)', border: '1px solid var(--color-gold)',
                      color: 'var(--color-gold-dark)', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {seg}
                      <button
                        style={{
                          background: 'none', border: 'none', color: 'var(--color-danger)',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', padding: 0, marginLeft: '2px'
                        }}
                        onClick={() => handleRemoveSegment(seg)}
                        aria-label={`Remove segment ${seg}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ width: 10, height: 10 }}>
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* ═══════ Delete Confirmation Modal ═══════ */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button className="kfpl-btn kfpl-btn--primary" style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => handleDeleteProject(deleteConfirm.id)}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete <strong>{deleteConfirm?.project}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* ═══════ Media Preview Modal ═══════ */}
      <Modal
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        title={previewMedia?.name || 'File Preview'}
        size={previewMedia?.type?.startsWith('image/') || previewMedia?.type?.startsWith('video/') ? 'lg' : 'md'}
        footer={
          <>
            <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setPreviewMedia(null)}>Close</button>
            {previewMedia?.dataUrl && (
              <a
                href={previewMedia.dataUrl}
                download={previewMedia.name}
                className="kfpl-btn kfpl-btn--primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download File
              </a>
            )}
          </>
        }
      >
        {previewMedia && (
          <div className="kfpl-media-preview-container">
            {previewMedia.type?.startsWith('image/') ? (
              <img
                src={previewMedia.dataUrl}
                alt={previewMedia.name}
                className="kfpl-media-preview-content"
              />
            ) : previewMedia.type?.startsWith('video/') ? (
              <video
                src={previewMedia.dataUrl}
                controls
                autoPlay
                className="kfpl-media-preview-content"
                style={{ outline: 'none' }}
              />
            ) : (
              <div className="kfpl-media-preview-doc">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="kfpl-media-preview-doc-icon">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div className="kfpl-media-preview-info">
                  <span className="kfpl-media-preview-filename">{previewMedia.name}</span>
                  <span className="kfpl-media-preview-filesize">
                    File Type: {previewMedia.type || 'Unknown'} • Size: {(previewMedia.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════ History Log Modal ═══════ */}
      <Modal
        isOpen={showHistoryLogModal}
        onClose={() => setShowHistoryLogModal(false)}
        title="Investment Status Update History"
        size="lg"
        footer={
          <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setShowHistoryLogModal(false)}>Close</button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="kfpl-input"
              placeholder="Search history by project or note..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              className="kfpl-select"
              value={historySegmentFilter}
              onChange={e => setHistorySegmentFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="all">All Segments</option>
              {allSegments.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* List of historical records */}
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {historyLogs
              .filter(log => {
                const matchesSearch =
                  (log.project || '').toLowerCase().includes(historySearch.toLowerCase()) ||
                  (log.note || '').toLowerCase().includes(historySearch.toLowerCase());
                const matchesSegment =
                  historySegmentFilter === 'all' || log.segment === historySegmentFilter;
                return matchesSearch && matchesSegment;
              })
              .length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
                No update history found matching your filters.
              </div>
            ) : historyLogs
                .filter(log => {
                  const matchesSearch =
                    (log.project || '').toLowerCase().includes(historySearch.toLowerCase()) ||
                    (log.note || '').toLowerCase().includes(historySearch.toLowerCase());
                  const matchesSegment =
                    historySegmentFilter === 'all' || log.segment === historySegmentFilter;
                  return matchesSearch && matchesSegment;
                })
                .map(log => {
                  const accent = SEGMENT_COLORS[log.segment] || '#10B981';
                  return (
                    <div key={log.id} style={{
                      border: '1px solid var(--color-border-light)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="kfpl-badge" style={{ background: `${accent}15`, color: accent, borderColor: `${accent}30` }}>{log.segment}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                            {log.type === 'segment' || !log.project ? 'Segment-Wide Update' : log.project}
                          </strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{log.date}</span>
                      </div>
                      
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic' }}>
                        "{log.note || 'No notes posted.'}"
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-light)', paddingTop: '6px', marginTop: '2px' }}>
                        <span>Status: <strong>{log.status}</strong> • Progress: <strong>{log.progress}%</strong></span>
                        {(log.media || []).length > 0 && (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            {log.media.length} File(s)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ============ END: InvestmentStatus.jsx ============ */

/* ============================================================
   Page: PortfolioManagement.jsx
   Description: Super-admin portfolio CRUD — add/edit/delete projects,
                manage segments, and attach project media.
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import { INVESTMENT_SEGMENTS, formatCurrency } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';

// ── Default project data ────────────────────────
const DEFAULT_PROJECTS = [
  { id: 1, name: 'Project Astra', segment: 'Film Making', status: 'In Production', value: '₹2.5 Cr', milestone: 65, summary: 'Flagship feature slate moving through production with cast-led marketing upside.', risk: 'Medium', horizon: 'Q4 2025', roi: '1.25%', health: 'On Track', media: [], totalDividendPool: 1000000, dividendsDistributed: 270000 },
  { id: 2, name: 'Rhythm Series', segment: 'Music', status: 'Recording', value: '₹1.8 Cr', milestone: 40, summary: 'Music catalogue and album pipeline with recurring streaming revenue potential.', risk: 'Low', horizon: 'Released catalogue', roi: '0.83%', health: 'On Track', media: [], totalDividendPool: 500000, dividendsDistributed: 50000 },
  { id: 3, name: 'Meridian Release', segment: 'Distribution', status: 'Active', value: '₹3.2 Cr', milestone: 80, summary: 'Distribution portfolio across domestic and digital channels.', risk: 'Medium', horizon: '18 month cycle', roi: '1.0%', health: 'Performing', media: [], totalDividendPool: 0, dividendsDistributed: 0 },
  { id: 4, name: 'Archive Digitization', segment: 'Content IP Bank', status: 'Ongoing', value: '₹1.4 Cr', milestone: 55, summary: 'Curated content IP vault focused on long-term licensing.', risk: 'Low', horizon: '24 month cycle', roi: '1.17%', health: 'Building', media: [], totalDividendPool: 0, dividendsDistributed: 0 },
  { id: 5, name: 'Content Deal Q2', segment: 'Trading & Syndication', status: 'Negotiation', value: '₹2.1 Cr', milestone: 30, summary: 'Trade and syndication desk for packaging content deal flow.', risk: 'Medium', horizon: '12 month cycle', roi: '1.08%', health: 'Active', media: [], totalDividendPool: 0, dividendsDistributed: 0 },
  { id: 6, name: 'Screen Network', segment: 'Film Exhibition', status: 'Planning', value: '₹4.0 Cr', milestone: 15, summary: 'Cinema exhibition rollout across priority micro-markets.', risk: 'Medium High', horizon: 'Planning phase', roi: '0.92%', health: 'Planned', media: [], totalDividendPool: 0, dividendsDistributed: 0 },
];

const SEGMENT_ABBR = {
  'Film Making': 'FM', Distribution: 'DS', Music: 'MS',
  'Trading & Syndication': 'TS', 'Content IP Bank': 'IP', 'Film Exhibition': 'EX',
};

const SEGMENT_COLORS = {
  'Film Making': '#10B981', Distribution: '#1565C0', Music: '#7C3AED',
  'Trading & Syndication': '#F59E0B', 'Content IP Bank': '#0F766E', 'Film Exhibition': '#0891B2',
};

const LS_KEY = 'kfpl_portfolio_projects';

export default function PortfolioManagement() {
  const addToast = useToast();
  const fileInputRef = useRef(null);

  // ── State ──────────────────────────
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [drawerProject, setDrawerProject] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [activePage, setActivePage] = useState('projects'); // 'projects' or 'dividends'
  const [dividends, setDividends] = useState([]);
  const [investorList, setInvestorList] = useState([]);

  // Segment & Statuses configurations state
  const [segmentsConfig, setSegmentsConfig] = useState([]);
  const [showSegmentsManagerModal, setShowSegmentsManagerModal] = useState(false);
  const [editingSegmentIndex, setEditingSegmentIndex] = useState(null);
  const [segmentFormName, setSegmentFormName] = useState('');
  const [segmentFormStatuses, setSegmentFormStatuses] = useState([]);
  const [newStatusText, setNewStatusText] = useState('');
  const [deleteSegConfirmIdx, setDeleteSegConfirmIdx] = useState(null);
  const [customSegmentText, setCustomSegmentText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '', segment: '', status: '', value: '', milestone: 0,
    summary: '', risk: 'Medium', horizon: '', roi: '', health: 'On Track', bannerImg: '',
  });

  // ── Load from localStorage ────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        let migrated = false;
        parsed = parsed.map(p => {
          const rawRoi = p.roi || '';
          const numRoi = parseFloat(rawRoi.replace(/[^0-9.]/g, ''));
          // If the ROI value is stored as annual (typically > 3), migrate to monthly format
          if (!isNaN(numRoi) && numRoi > 3) {
            p.roi = `${(numRoi / 12).toFixed(2)}%`;
            migrated = true;
          }
          if (p.totalDividendPool === undefined) {
            if (p.id === 1) {
              p.totalDividendPool = 1000000;
              p.dividendsDistributed = 270000;
            } else if (p.id === 2) {
              p.totalDividendPool = 500000;
              p.dividendsDistributed = 50000;
            } else {
              p.totalDividendPool = 0;
              p.dividendsDistributed = 0;
            }
            migrated = true;
          }
          return p;
        });
        if (migrated) {
          localStorage.setItem(LS_KEY, JSON.stringify(parsed));
        }
        setProjects(parsed);
      } catch (e) {
        console.error('Error parsing projects:', e);
        setProjects(DEFAULT_PROJECTS);
      }
    } else {
      setProjects(DEFAULT_PROJECTS);
      localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_PROJECTS));
    }

    // Load and migrate investors
    const storedInvestors = localStorage.getItem('kfpl_investors');
    if (storedInvestors) {
      try {
        let parsed = JSON.parse(storedInvestors);
        let updated = false;
        parsed = parsed.map(inv => {
          if (inv.investments) {
            inv.investments = inv.investments.map(subInv => {
              if (!subInv.projectId) {
                if (subInv.segment === 'Film Making') {
                  subInv.projectId = 1;
                  subInv.projectName = 'Project Astra';
                  updated = true;
                } else if (subInv.segment === 'Music') {
                  subInv.projectId = 2;
                  subInv.projectName = 'Rhythm Series';
                  updated = true;
                } else if (subInv.segment === 'Distribution') {
                  subInv.projectId = 3;
                  subInv.projectName = 'Meridian Release';
                  updated = true;
                } else if (subInv.segment === 'Content IP Bank') {
                  subInv.projectId = 4;
                  subInv.projectName = 'Archive Digitization';
                  updated = true;
                } else if (subInv.segment === 'Trading & Syndication') {
                  subInv.projectId = 5;
                  subInv.projectName = 'Content Deal Q2';
                  updated = true;
                } else if (subInv.segment === 'Film Exhibition') {
                  subInv.projectId = 6;
                  subInv.projectName = 'Screen Network';
                  updated = true;
                }
              }
              return subInv;
            });
          }
          return inv;
        });
        if (updated) {
          localStorage.setItem('kfpl_investors', JSON.stringify(parsed));
        }
        setInvestorList(parsed);
      } catch (e) {
        console.error('Error migrating investors:', e);
      }
    }

    // Load dividends
    const storedDivs = localStorage.getItem('kfpl_project_dividends');
    if (storedDivs) {
      try {
        setDividends(JSON.parse(storedDivs));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultDivs = [
        {
          id: 1,
          projectId: 1,
          projectName: 'Project Astra',
          segment: 'Film Making',
          clientId: 'KFPL-1001',
          clientName: 'Rajesh Kumar',
          amount: 150000,
          creditDate: '2025-04-15T00:00:00.000Z',
          adminNote: 'Annual performance bonus for exceptional project returns.'
        },
        {
          id: 2,
          projectId: 1,
          projectName: 'Project Astra',
          segment: 'Film Making',
          clientId: 'KFPL-1002',
          clientName: 'Priya Sharma',
          amount: 120000,
          creditDate: '2025-04-15T00:00:00.000Z',
          adminNote: 'Annual performance bonus for exceptional project returns.'
        },
        {
          id: 3,
          projectId: 2,
          projectName: 'Rhythm Series',
          segment: 'Music',
          clientId: 'KFPL-1004',
          clientName: 'Suresh Patel',
          amount: 50000,
          creditDate: '2025-05-10T00:00:00.000Z',
          adminNote: 'Streaming milestone bonus for Rhythm catalogue.'
        }
      ];
      setDividends(defaultDivs);
      localStorage.setItem('kfpl_project_dividends', JSON.stringify(defaultDivs));
    }

    // Load segments and statuses configuration
    const storedConfig = localStorage.getItem('kfpl_portfolio_segments_config');
    let config = [];
    if (storedConfig) {
      config = JSON.parse(storedConfig);
    } else {
      config = [
        { name: 'Film Making', statuses: ['Planning', 'In Production', 'Active', 'Ongoing', 'Completed'] },
        { name: 'Distribution', statuses: ['Planning', 'Active', 'Ongoing', 'Negotiation', 'Completed'] },
        { name: 'Music', statuses: ['Planning', 'Recording', 'Active', 'Ongoing', 'Completed', 'Released'] },
        { name: 'Trading & Syndication', statuses: ['Planning', 'Negotiation', 'Active', 'Ongoing', 'Completed'] },
        { name: 'Content IP Bank', statuses: ['Planning', 'Ongoing', 'Active', 'Completed'] },
        { name: 'Film Exhibition', statuses: ['Planning', 'Ongoing', 'Active', 'Completed'] },
      ];
      localStorage.setItem('kfpl_portfolio_segments_config', JSON.stringify(config));
    }

    // Migrate any legacy custom segments
    const storedSegs = localStorage.getItem('kfpl_custom_segments');
    if (storedSegs) {
      try {
        const parsedCustom = JSON.parse(storedSegs);
        let migrated = false;
        parsedCustom.forEach(segName => {
          if (segName && !config.some(c => c.name.toLowerCase() === segName.toLowerCase())) {
            config.push({
              name: segName,
              statuses: ['Planning', 'Active', 'Ongoing', 'Completed']
            });
            migrated = true;
          }
        });
        if (migrated) {
          localStorage.setItem('kfpl_portfolio_segments_config', JSON.stringify(config));
        }
      } catch (e) {
        console.error('Error migrating custom segments:', e);
      }
    }
    setSegmentsConfig(config);
  }, []);

  const persist = (updated) => {
    setProjects(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  // ── Segment list (from config + projects fallback) ──
  const segmentNames = [...new Set([
    ...segmentsConfig.map(s => s.name),
    ...projects.map(p => p.segment)
  ])].filter(Boolean);

  // ── CRUD handlers ─────────────────────────
  const resetForm = () => {
    setFormData({ name: '', segment: '', status: '', value: '', milestone: 0, summary: '', risk: 'Medium', horizon: '', roi: '', health: 'On Track', bannerImg: '' });
    setCustomSegmentText('');
  };

  const openAddModal = () => {
    resetForm();
    setEditingProject(null);
    setShowAddModal(true);
  };

  const openEditModal = (project) => {
    setFormData({
      name: project.name,
      segment: project.segment,
      status: project.status,
      value: project.value,
      milestone: project.milestone,
      summary: project.summary,
      risk: project.risk || 'Medium',
      horizon: project.horizon || '',
      roi: project.roi || '',
      health: project.health || 'On Track',
      bannerImg: project.bannerImg || '',
    });
    setEditingProject(project);
    setShowAddModal(true);
  };

  const handleSaveProject = () => {
    let finalSegment = formData.segment;

    if (formData.segment === '__NEW__') {
      const segText = customSegmentText.trim();
      if (!segText) {
        addToast('Please enter a custom segment name', 'error', 'Validation Error');
        return;
      }
      finalSegment = segText;
      if (!segmentsConfig.some(s => s.name.toLowerCase() === segText.toLowerCase())) {
        const defaultStatuses = ['Planning', 'Active', 'Ongoing', 'Completed'];
        const updatedConfig = [
          ...segmentsConfig,
          { name: segText, statuses: defaultStatuses }
        ];
        setSegmentsConfig(updatedConfig);
        localStorage.setItem('kfpl_portfolio_segments_config', JSON.stringify(updatedConfig));

        // Sync to legacy custom segments key for cross-page compatibility
        const defaultSegmentNames = ['Film Making', 'Distribution', 'Music', 'Trading & Syndication', 'Content IP Bank', 'Film Exhibition'];
        const customSegNames = updatedConfig
          .map(c => c.name)
          .filter(n => !defaultSegmentNames.includes(n));
        localStorage.setItem('kfpl_custom_segments', JSON.stringify(customSegNames));
      }
    }

    if (!formData.name.trim() || !finalSegment) {
      addToast('Please fill in project name and segment', 'error', 'Validation Error');
      return;
    }

    const payload = {
      ...formData,
      segment: finalSegment
    };

    if (editingProject) {
      // Update
      const updated = projects.map(p =>
        p.id === editingProject.id ? { ...p, ...payload } : p
      );
      persist(updated);
      addToast(`${formData.name} updated successfully`, 'success', 'Project Updated');
    } else {
      // Create
      const newProject = {
        ...payload,
        id: Date.now(),
        milestone: parseInt(formData.milestone) || 0,
        media: [],
      };
      const updated = [...projects, newProject];
      persist(updated);
      addToast(`${formData.name} added successfully`, 'success', 'Project Created');
    }

    setShowAddModal(false);
    setEditingProject(null);
    resetForm();
  };

  // ── Segment & Status Configuration Manager Handlers ──
  const openSegmentsManager = () => {
    setEditingSegmentIndex(null);
    setSegmentFormName('');
    setSegmentFormStatuses([]);
    setNewStatusText('');
    setDeleteSegConfirmIdx(null);
    setShowSegmentsManagerModal(true);
  };

  const handleEditSegment = (index) => {
    setEditingSegmentIndex(index);
    setSegmentFormName(segmentsConfig[index].name);
    setSegmentFormStatuses([...segmentsConfig[index].statuses]);
    setNewStatusText('');
    setDeleteSegConfirmIdx(null);
  };

  const handleAddStatusTag = () => {
    const status = newStatusText.trim();
    if (!status) return;
    if (segmentFormStatuses.some(s => s.toLowerCase() === status.toLowerCase())) {
      addToast('Status already exists in this segment', 'error', 'Duplicate');
      return;
    }
    setSegmentFormStatuses([...segmentFormStatuses, status]);
    setNewStatusText('');
  };

  const handleRemoveStatusTag = (statusToRemove) => {
    setSegmentFormStatuses(segmentFormStatuses.filter(s => s !== statusToRemove));
  };

  const handleSaveSegmentConfig = () => {
    const name = segmentFormName.trim();
    if (!name) {
      addToast('Please enter a segment name', 'error', 'Validation Error');
      return;
    }

    if (segmentFormStatuses.length === 0) {
      addToast('Please add at least one status option', 'error', 'Validation Error');
      return;
    }

    let updatedConfig = [...segmentsConfig];

    if (editingSegmentIndex !== null) {
      const duplicate = segmentsConfig.some((s, idx) => idx !== editingSegmentIndex && s.name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        addToast('A segment with this name already exists', 'error', 'Duplicate Name');
        return;
      }

      const oldName = segmentsConfig[editingSegmentIndex].name;
      updatedConfig[editingSegmentIndex] = {
        name,
        statuses: segmentFormStatuses
      };

      // Rename segment in projects if renamed
      if (oldName !== name) {
        const updatedProjects = projects.map(p => 
          p.segment === oldName ? { ...p, segment: name } : p
        );
        persist(updatedProjects);
      }

      addToast(`Segment "${name}" updated successfully`, 'success', 'Segment Updated');
    } else {
      const duplicate = segmentsConfig.some(s => s.name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        addToast('A segment with this name already exists', 'error', 'Duplicate Name');
        return;
      }

      updatedConfig.push({
        name,
        statuses: segmentFormStatuses
      });
      addToast(`Segment "${name}" created successfully`, 'success', 'Segment Created');
    }

    setSegmentsConfig(updatedConfig);
    localStorage.setItem('kfpl_portfolio_segments_config', JSON.stringify(updatedConfig));

    // Sync to legacy custom segments key
    const defaultSegmentNames = ['Film Making', 'Distribution', 'Music', 'Trading & Syndication', 'Content IP Bank', 'Film Exhibition'];
    const customSegNames = updatedConfig
      .map(c => c.name)
      .filter(n => !defaultSegmentNames.includes(n));
    localStorage.setItem('kfpl_custom_segments', JSON.stringify(customSegNames));

    // Reset form
    setEditingSegmentIndex(null);
    setSegmentFormName('');
    setSegmentFormStatuses([]);
    setNewStatusText('');
  };

  const confirmDeleteSegment = () => {
    if (deleteSegConfirmIdx === null) return;
    const segmentToDelete = segmentsConfig[deleteSegConfirmIdx].name;
    const updatedConfig = segmentsConfig.filter((_, idx) => idx !== deleteSegConfirmIdx);

    setSegmentsConfig(updatedConfig);
    localStorage.setItem('kfpl_portfolio_segments_config', JSON.stringify(updatedConfig));

    // Sync to legacy custom segments key
    const defaultSegmentNames = ['Film Making', 'Distribution', 'Music', 'Trading & Syndication', 'Content IP Bank', 'Film Exhibition'];
    const customSegNames = updatedConfig
      .map(c => c.name)
      .filter(n => !defaultSegmentNames.includes(n));
    localStorage.setItem('kfpl_custom_segments', JSON.stringify(customSegNames));

    addToast(`Segment "${segmentToDelete}" deleted`, 'success', 'Segment Deleted');
    
    if (editingSegmentIndex === deleteSegConfirmIdx) {
      setEditingSegmentIndex(null);
      setSegmentFormName('');
      setSegmentFormStatuses([]);
      setNewStatusText('');
    }
    setDeleteSegConfirmIdx(null);
  };

  const handleDeleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    persist(updated);
    addToast('Project deleted', 'success', 'Deleted');
    setDeleteConfirm(null);
  };

  // ── Media upload ──────────────────────────
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!uploadTarget || files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const mediaItem = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: ev.target.result,
          uploadedAt: new Date().toISOString(),
        };
        const updated = projects.map(p => {
          if (p.id === uploadTarget) {
            return { ...p, media: [...(p.media || []), mediaItem] };
          }
          return p;
        });
        persist(updated);
        // Update drawer if open
        const updatedProject = updated.find(p => p.id === uploadTarget);
        if (drawerProject && drawerProject.id === uploadTarget) {
          setDrawerProject(updatedProject);
        }
      };
      reader.readAsDataURL(file);
    });

    addToast(`${files.length} file(s) uploaded`, 'success', 'Upload Complete');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadTarget(null);
  };

  const handleRemoveMedia = (projectId, mediaId) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, media: (p.media || []).filter(m => m.id !== mediaId) };
      }
      return p;
    });
    persist(updated);
    const updatedProject = updated.find(p => p.id === projectId);
    if (drawerProject && drawerProject.id === projectId) {
      setDrawerProject(updatedProject);
    }
    addToast('Media removed', 'success', 'Removed');
  };

  // ── Filtering ─────────────────────────────
  const filteredProjects = activeTab === 'All'
    ? projects
    : projects.filter(p => p.segment === activeTab);

  // ── Computed stats ────────────────────────
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => !['Completed', 'Planned'].includes(p.status)).length;
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((s, p) => s + (parseInt(p.milestone) || 0), 0) / totalProjects)
    : 0;

  // ── Lock body scroll when drawer is open ──
  useEffect(() => {
    if (!drawerProject) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, [drawerProject]);

  // ── Drawer Portal ─────────────────────────
  const projectInvestors = drawerProject
    ? investorList.filter(inv =>
        (inv.investments || []).some(subInv => String(subInv.projectId) === String(drawerProject.id))
      )
    : [];

  const drawer = drawerProject && createPortal(
    <>
      <div className="kfpl-portfolio-drawer-overlay" onClick={() => setDrawerProject(null)} />
      <aside className="kfpl-portfolio-drawer" style={{ '--portfolio-accent': SEGMENT_COLORS[drawerProject.segment] || 'var(--color-gold)' }}>
        {/* Header */}
        <div className="kfpl-drawer-header kfpl-portfolio-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{drawerProject.name}</h2>
            <span className="kfpl-portfolio-segment" style={{ marginTop: 0 }}>{drawerProject.segment}</span>
          </div>
          <button className="kfpl-modal-close" onClick={() => setDrawerProject(null)} aria-label="Close project details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="kfpl-drawer-body kfpl-portfolio-drawer-body">
          <div className="kfpl-portfolio-drawer-visual" style={{
            backgroundImage: drawerProject.bannerImg ? `linear-gradient(rgba(6, 29, 19, 0.5), rgba(6, 29, 19, 0.8)), url(${drawerProject.bannerImg})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            <span>{SEGMENT_ABBR[drawerProject.segment] || drawerProject.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{drawerProject.value || '—'}</strong>
              <small>Portfolio value</small>
            </div>
          </div>

          <p className="kfpl-portfolio-drawer-summary">{drawerProject.summary}</p>

          {/* KPIs */}
          <div className="kfpl-portfolio-drawer-kpis">
            <div>
              <span>Status</span>
              <strong>{drawerProject.status}</strong>
            </div>
            <div>
              <span>Monthly ROI</span>
              <strong>{drawerProject.roi || '—'}</strong>
            </div>
            <div>
              <span>Risk</span>
              <strong>{drawerProject.risk || '—'}</strong>
            </div>
            <div>
              <span>Horizon</span>
              <strong>{drawerProject.horizon || '—'}</strong>
            </div>
            <div>
              <span>Segment</span>
              <strong>{drawerProject.segment}</strong>
            </div>
            <div>
              <span>Health</span>
              <strong>{drawerProject.health || '—'}</strong>
            </div>
          </div>

          {/* Progress */}
          <div className="kfpl-portfolio-drawer-section">
            <h3>Milestone Progress</h3>
            <div className="kfpl-portfolio-progress-row">
              <span>{drawerProject.health || 'On Track'}</span>
              <strong>{drawerProject.milestone}%</strong>
            </div>
            <div className="kfpl-progress kfpl-portfolio-drawer-progress">
              <div className="kfpl-progress-fill" style={{ width: `${drawerProject.milestone}%` }} />
            </div>
          </div>

          {/* Media Section */}
          <div className="kfpl-portfolio-drawer-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Project Media & Files</h3>
              <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => {
                setUploadTarget(drawerProject.id);
                setTimeout(() => fileInputRef.current?.click(), 50);
              }}>+ Upload</button>
            </div>
            {(drawerProject.media || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                No files uploaded yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(drawerProject.media || []).map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                    background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)',
                  }}>
                    {m.type?.startsWith('image/') ? (
                      <img src={m.dataUrl} alt={m.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        {m.name?.split('.').pop()?.toUpperCase() || 'FILE'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{(m.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button
                      className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                      style={{
                        color: 'var(--color-danger)', padding: '4px 8px', minWidth: 'auto',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      onClick={() => handleRemoveMedia(drawerProject.id, m.id)}
                      aria-label={`Remove media ${m.name}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 11, height: 11 }}>
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dividend Management Section */}
          <div className="kfpl-portfolio-drawer-section" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>Dividend Management</h3>
            
            {/* Pool Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Pool</div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-gold)' }}>{formatCurrency(drawerProject.totalDividendPool || 0)}</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Distributed</div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-success)' }}>{formatCurrency(drawerProject.dividendsDistributed || 0)}</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Remaining</div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {formatCurrency((drawerProject.totalDividendPool || 0) - (drawerProject.dividendsDistributed || 0))}
                </strong>
              </div>
            </div>

            {/* Set Pool Input */}
            <div className="kfpl-input-group" style={{ marginBottom: '16px' }}>
              <label className="kfpl-input-label" style={{ fontSize: '0.75rem' }}>Configure / Increase Dividend Pool (₹)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  className="kfpl-input kfpl-input--sm"
                  placeholder="Enter pool amount"
                  id="div-pool-input"
                  style={{ flex: 1, height: '36px', fontSize: '0.8125rem' }}
                />
                <button
                  type="button"
                  className="kfpl-btn kfpl-btn--primary kfpl-btn--sm"
                  style={{ height: '36px', minWidth: '80px' }}
                  onClick={() => {
                    const input = document.getElementById('div-pool-input');
                    const amt = parseFloat(input?.value);
                    if (isNaN(amt) || amt <= 0) {
                      addToast('Please enter a valid positive pool amount', 'error', 'Error');
                      return;
                    }
                    const updatedProjects = projects.map(p => {
                      if (p.id === drawerProject.id) {
                        return { ...p, totalDividendPool: amt };
                      }
                      return p;
                    });
                    persist(updatedProjects);
                    setDrawerProject({ ...drawerProject, totalDividendPool: amt });
                    addToast(`Dividend pool set to ${formatCurrency(amt)} for ${drawerProject.name}`, 'success', 'Success');
                    if (input) input.value = '';
                  }}
                >
                  Set Pool
                </button>
              </div>
            </div>

            {/* Allotment Form (only if pool is set) */}
            {drawerProject.totalDividendPool > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                  Allot Dividend to Investor
                </h4>
                {projectInvestors.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontStyle: 'italic', textAlign: 'center', padding: '8px' }}>
                    No active investors found for this project.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="kfpl-input-group">
                      <label className="kfpl-input-label" style={{ fontSize: '0.7rem' }}>Select Client</label>
                      <select id="div-client-select" className="kfpl-select" style={{ height: '36px', fontSize: '0.8125rem', padding: '0 10px' }}>
                        <option value="">Choose investor...</option>
                        {projectInvestors.map(inv => {
                          const projectInvestments = (inv.investments || []).filter(subInv => String(subInv.projectId) === String(drawerProject.id));
                          const totalProjectAmt = projectInvestments.reduce((sum, subInv) => sum + (subInv.amount || 0), 0);
                          return (
                            <option key={inv.id} value={inv.clientId}>
                              {inv.name} ({inv.clientId} — Invested: {formatCurrency(totalProjectAmt)})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="kfpl-input-group">
                        <label className="kfpl-input-label" style={{ fontSize: '0.7rem' }}>Amount (₹)</label>
                        <input id="div-allot-amount" type="number" className="kfpl-input" placeholder="e.g. 50000" style={{ height: '36px', fontSize: '0.8125rem' }} />
                      </div>
                      <div className="kfpl-input-group">
                        <label className="kfpl-input-label" style={{ fontSize: '0.7rem' }}>Remarks / Note</label>
                        <input id="div-allot-note" type="text" className="kfpl-input" placeholder="e.g. Hit bonus" style={{ height: '36px', fontSize: '0.8125rem' }} />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="kfpl-btn kfpl-btn--primary kfpl-btn--sm"
                      style={{ marginTop: '6px' }}
                      onClick={() => {
                        const clientSelect = document.getElementById('div-client-select');
                        const amtInput = document.getElementById('div-allot-amount');
                        const noteInput = document.getElementById('div-allot-note');
                        
                        const selectedClientId = clientSelect?.value;
                        const allotAmt = parseFloat(amtInput?.value);
                        const note = noteInput?.value || '';

                        if (!selectedClientId) {
                          addToast('Please select a client', 'error', 'Error');
                          return;
                        }
                        if (isNaN(allotAmt) || allotAmt <= 0) {
                          addToast('Please enter a valid allotment amount', 'error', 'Error');
                          return;
                        }

                        const remainingPool = (drawerProject.totalDividendPool || 0) - (drawerProject.dividendsDistributed || 0);
                        if (allotAmt > remainingPool) {
                          addToast(`Allotment exceeds remaining pool of ${formatCurrency(remainingPool)}`, 'error', 'Error');
                          return;
                        }

                        const selectedInv = investorList.find(inv => inv.clientId === selectedClientId);

                        const newAllotment = {
                          id: Date.now(),
                          projectId: drawerProject.id,
                          projectName: drawerProject.name,
                          segment: drawerProject.segment,
                          clientId: selectedClientId,
                          clientName: selectedInv?.name || 'Investor',
                          amount: allotAmt,
                          creditDate: new Date().toISOString(),
                          adminNote: note || 'Project dividend distribution'
                        };

                        const storedDivs = localStorage.getItem('kfpl_project_dividends');
                        let parsedDivs = [];
                        if (storedDivs) {
                          try { parsedDivs = JSON.parse(storedDivs); } catch (e) { console.error(e); }
                        }
                        const updatedDivs = [newAllotment, ...parsedDivs];
                        localStorage.setItem('kfpl_project_dividends', JSON.stringify(updatedDivs));
                        setDividends(updatedDivs);

                        const updatedProjects = projects.map(p => {
                          if (p.id === drawerProject.id) {
                            const currentDist = Number(p.dividendsDistributed) || 0;
                            return { ...p, dividendsDistributed: currentDist + allotAmt };
                          }
                          return p;
                        });
                        persist(updatedProjects);
                        
                        setDrawerProject({
                          ...drawerProject,
                          dividendsDistributed: (Number(drawerProject.dividendsDistributed) || 0) + allotAmt
                        });

                        addToast(`Dividend of ${formatCurrency(allotAmt)} allotted successfully to ${selectedInv?.name}`, 'success', 'Allotment Success');
                        
                        if (amtInput) amtInput.value = '';
                        if (noteInput) noteInput.value = '';
                        if (clientSelect) clientSelect.value = '';
                      }}
                    >
                      Allot Dividend
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={() => { setDrawerProject(null); openEditModal(drawerProject); }}>
              Edit Project
            </button>
            <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ color: 'var(--color-danger)' }} onClick={() => { setDrawerProject(null); setDeleteConfirm(drawerProject); }}>
              Delete
            </button>
          </div>
        </div>
      </aside>
    </>,
    document.body
  );

  return (
    <div className="kfpl-page animate-fade-slide-up">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: 'none' }} onChange={handleMediaUpload} />

      {/* Header */}
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Portfolio Management</h2>
          <p className="kfpl-page-subtitle">Manage projects, segments, and media across the KFPL portfolio</p>
        </div>
        <div className="kfpl-page-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={openSegmentsManager}>
            Manage Segments
          </button>
          <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={openAddModal}>
            + Add Project
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '24px', gap: '16px' }}>
        <button
          onClick={() => setActivePage('projects')}
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activePage === 'projects' ? '2px solid var(--color-gold)' : '2px solid transparent',
            color: activePage === 'projects' ? 'var(--color-gold)' : 'var(--color-text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          Project Catalog
        </button>
        <button
          onClick={() => setActivePage('dividends')}
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activePage === 'dividends' ? '2px solid var(--color-gold)' : '2px solid transparent',
            color: activePage === 'dividends' ? 'var(--color-gold)' : 'var(--color-text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          Dividend Ledger
        </button>
      </div>

      {activePage === 'projects' ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="kfpl-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Projects</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalProjects}</div>
            </div>
            <div className="kfpl-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Active</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{activeProjects}</div>
            </div>
            <div className="kfpl-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Segments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-gold-dark)' }}>{segmentNames.length}</div>
            </div>
            <div className="kfpl-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Avg. Progress</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{avgProgress}%</div>
            </div>
          </div>

          {/* Segment Tabs */}
          <div className="kfpl-filter-chips" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
            {['All', ...segmentNames].map(tab => {
              const count = tab === 'All' ? projects.length : projects.filter(p => p.segment === tab).length;
              return (
                <span
                  key={tab}
                  className={`kfpl-filter-chip ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab} ({count})
                </span>
              );
            })}
          </div>

          {/* Project Cards Grid */}
          <div className="kfpl-portfolio-grid">
            {filteredProjects.length === 0 ? (
              <div className="kfpl-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>
                No projects found in this segment
              </div>
            ) : filteredProjects.map(project => {
              const accent = SEGMENT_COLORS[project.segment] || '#10B981';
              const initials = SEGMENT_ABBR[project.segment] || project.name.slice(0, 2).toUpperCase();
              return (
                <div className="kfpl-portfolio-card" key={project.id} style={{ '--portfolio-accent': accent, cursor: 'pointer' }}
                  onClick={() => setDrawerProject(project)}
                >
                  <div className="kfpl-portfolio-card-media">
                    <span className="kfpl-portfolio-card-initials">{initials}</span>
                    <span className="kfpl-portfolio-card-status">{project.health || 'On Track'}</span>
                  </div>

                  <div className="kfpl-portfolio-card-body">
                    <div className="kfpl-portfolio-card-topline">
                      <span className="kfpl-portfolio-segment">{project.segment}</span>
                      <strong>{project.value || '—'}</strong>
                    </div>

                    <h2>{project.name}</h2>
                    <p>{project.summary}</p>

                    <div className="kfpl-portfolio-metrics">
                      <div>
                        <span>Status</span>
                        <strong>{project.status}</strong>
                      </div>
                      <div>
                        <span>Monthly ROI</span>
                        <strong>{project.roi || '—'}</strong>
                      </div>
                      <div>
                        <span>Risk</span>
                        <strong>{project.risk || '—'}</strong>
                      </div>
                    </div>

                    <div className="kfpl-portfolio-progress-row">
                      <span>Milestone Progress</span>
                      <strong>{project.milestone}%</strong>
                    </div>
                    <div className="kfpl-progress">
                      <div className="kfpl-progress-fill" style={{ width: `${project.milestone}%` }} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end', position: 'relative', zIndex: 10 }} onClick={e => e.stopPropagation()}>
                      <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => openEditModal(project)}>Edit</button>
                      <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteConfirm(project)}>Delete</button>
                      <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => {
                        setUploadTarget(project.id);
                        setTimeout(() => fileInputRef.current?.click(), 50);
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="animate-fade-slide-up">
          {/* Ledger Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="kfpl-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Pools Configured</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-gold-dark)' }}>
                {formatCurrency(projects.reduce((sum, p) => sum + (Number(p.totalDividendPool) || 0), 0))}
              </div>
            </div>
            <div className="kfpl-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Dividends Distributed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                {formatCurrency(projects.reduce((sum, p) => sum + (Number(p.dividendsDistributed) || 0), 0))}
              </div>
            </div>
            <div className="kfpl-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Remaining Pools Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {formatCurrency(
                  projects.reduce((sum, p) => sum + (Number(p.totalDividendPool) || 0), 0) -
                  projects.reduce((sum, p) => sum + (Number(p.dividendsDistributed) || 0), 0)
                )}
              </div>
            </div>
          </div>

          {/* Ledger Data Table */}
          <div className="kfpl-card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Allotment Ledger</h3>
            </div>
            <DataTable
              columns={[
                {
                  header: 'Project / Segment',
                  accessor: 'projectName',
                  render: (row) => (
                    <div>
                      <div className="kfpl-table-cell-primary">{row.projectName}</div>
                      <div className="kfpl-table-cell-secondary">{row.segment}</div>
                    </div>
                  )
                },
                {
                  header: 'Client Details',
                  accessor: 'clientName',
                  render: (row) => (
                    <div>
                      <div className="kfpl-table-cell-primary">{row.clientName}</div>
                      <div className="kfpl-table-cell-secondary">{row.clientId}</div>
                    </div>
                  )
                },
                {
                  header: 'Allotted Amount',
                  accessor: 'amount',
                  render: (row) => (
                    <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(row.amount || 0)}</strong>
                  )
                },
                {
                  header: 'Date of Allotment',
                  accessor: 'creditDate',
                  render: (row) => (
                    <span>
                      {new Date(row.creditDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )
                },
                {
                  header: 'Remarks / Notes',
                  accessor: 'adminNote',
                  render: (row) => (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{row.adminNote || '—'}</span>
                  )
                }
              ]}
              data={dividends}
              searchPlaceholder="Search by client or project..."
            />
          </div>
        </div>
      )}

      {/* ═══════ Add / Edit Project Modal ═══════ */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingProject(null); resetForm(); }}
        title={editingProject ? 'Edit Project' : 'Add New Project'}
        size="lg"
        footer={
          <>
            <button className="kfpl-btn kfpl-btn--ghost" onClick={() => { setShowAddModal(false); setEditingProject(null); resetForm(); }}>Cancel</button>
            <button className="kfpl-btn kfpl-btn--primary" onClick={handleSaveProject}>{editingProject ? 'Update Project' : 'Add Project'}</button>
          </>
        }
      >
        <div className="kfpl-form" style={{ gap: '16px' }}>
          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Project Name <span className="required">*</span></label>
              <input type="text" className="kfpl-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter project name" />
            </div>
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
                {segmentNames.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__NEW__" style={{ fontStyle: 'italic', fontWeight: 'bold' }}>+ Add New Segment...</option>
              </select>
              {formData.segment === '__NEW__' && (
                <div className="animate-fade-slide-up" style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    className="kfpl-input"
                    placeholder="Enter custom segment name"
                    value={customSegmentText}
                    onChange={e => setCustomSegmentText(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Status</label>
              <select
                className="kfpl-select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                disabled={!formData.segment || formData.segment === '__NEW__'}
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
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Portfolio Value</label>
              <input type="text" className="kfpl-input" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="e.g. ₹2.5 Cr" />
            </div>
          </div>

          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Monthly ROI</label>
              <input type="text" className="kfpl-input" value={formData.roi} onChange={e => setFormData({ ...formData, roi: e.target.value })} placeholder="e.g. 1.25%" />
            </div>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Risk Level</label>
              <select className="kfpl-select" value={formData.risk} onChange={e => setFormData({ ...formData, risk: e.target.value })}>
                {['Low', 'Medium', 'Medium High', 'High'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Milestone Progress (%)</label>
              <input type="number" className="kfpl-input" min="0" max="100" value={formData.milestone} onChange={e => setFormData({ ...formData, milestone: e.target.value })} />
            </div>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Health</label>
              <select className="kfpl-select" value={formData.health} onChange={e => setFormData({ ...formData, health: e.target.value })}>
                {['On Track', 'Active', 'Performing', 'Building', 'Planned', 'At Risk', 'Completed'].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Project Banner Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setFormData({ ...formData, bannerImg: ev.target.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="kfpl-input"
                  style={{ flex: 1 }}
                />
                {formData.bannerImg && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={formData.bannerImg}
                      alt="Banner Preview"
                      style={{ width: 60, height: 40, borderRadius: 4, objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, bannerImg: '' })}
                      style={{
                        position: 'absolute', top: -6, right: -6, background: 'var(--color-danger)',
                        color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '10px', padding: 0
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="kfpl-input-group">
            <label className="kfpl-input-label">Summary</label>
            <textarea className="kfpl-textarea" value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} placeholder="Brief project description..." rows="3" />
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
            <button className="kfpl-btn kfpl-btn--primary" style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => handleDeleteProject(deleteConfirm.id)}>Delete Project</button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* ═══════ Manage Segments & Statuses Modal ═══════ */}
      <Modal
        isOpen={showSegmentsManagerModal}
        onClose={() => setShowSegmentsManagerModal(false)}
        title="Manage Segments & Statuses"
        size="lg"
        footer={
          <button className="kfpl-btn kfpl-btn--ghost" onClick={() => setShowSegmentsManagerModal(false)}>Close</button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Deletion confirmation panel */}
          {deleteSegConfirmIdx !== null && (
            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: '8px',
              animation: 'fadeIn 0.2s'
            }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                Are you sure you want to delete segment <strong>{segmentsConfig[deleteSegConfirmIdx]?.name}</strong>?
                {projects.some(p => p.segment === segmentsConfig[deleteSegConfirmIdx]?.name) && (
                  <span> <br/><strong>Warning:</strong> Existing projects under this segment will remain, but their segment mapping will be unmanaged.</span>
                )}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="kfpl-btn kfpl-btn--sm"
                  style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: '#fff' }}
                  onClick={confirmDeleteSegment}
                >
                  Yes, Delete
                </button>
                <button
                  className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                  onClick={() => setDeleteSegConfirmIdx(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Left Column: Segments List */}
            <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                Existing Segments
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '6px' }}>
                {segmentsConfig.map((seg, idx) => (
                  <div key={seg.name} style={{
                    padding: '12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{seg.name}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                          style={{ padding: '2px 8px', minWidth: 'auto' }}
                          onClick={() => handleEditSegment(idx)}
                        >
                          Edit
                        </button>
                        <button
                          className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                          style={{ padding: '2px 8px', minWidth: 'auto', color: 'var(--color-danger)' }}
                          onClick={() => setDeleteSegConfirmIdx(idx)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {seg.statuses.map(status => (
                        <span key={status} style={{
                          fontSize: '0.6875rem',
                          padding: '2px 6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--color-border-light)',
                          borderRadius: '4px',
                          color: 'var(--color-text-muted)'
                        }}>
                          {status}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Add / Edit Form */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                {editingSegmentIndex !== null ? `Edit Segment: ${segmentsConfig[editingSegmentIndex].name}` : 'Add New Segment'}
              </h4>
              
              <div className="kfpl-form" style={{ gap: '12px' }}>
                <div className="kfpl-input-group">
                  <label className="kfpl-input-label">Segment Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="kfpl-input"
                    placeholder="e.g. Music, Film Making"
                    value={segmentFormName}
                    onChange={e => setSegmentFormName(e.target.value)}
                  />
                </div>

                <div className="kfpl-input-group">
                  <label className="kfpl-input-label">Statuses <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="kfpl-input"
                      placeholder="Add status (e.g. Planning)"
                      value={newStatusText}
                      onChange={e => setNewStatusText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStatusTag();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" onClick={handleAddStatusTag}>
                      Add
                    </button>
                  </div>
                  
                  {/* Status tags container */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    minHeight: '80px',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    alignContent: 'flex-start'
                  }}>
                    {segmentFormStatuses.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No statuses added yet. Type above and click Add.
                      </span>
                    ) : (
                      segmentFormStatuses.map(status => (
                        <span key={status} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '16px',
                          color: '#10B981',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {status}
                          <button
                            type="button"
                            onClick={() => handleRemoveStatusTag(status)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '0 2px',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" className="kfpl-btn kfpl-btn--primary" onClick={handleSaveSegmentConfig}>
                    {editingSegmentIndex !== null ? 'Save Changes' : 'Create Segment'}
                  </button>
                  {editingSegmentIndex !== null && (
                    <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={() => {
                      setEditingSegmentIndex(null);
                      setSegmentFormName('');
                      setSegmentFormStatuses([]);
                      setNewStatusText('');
                    }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </Modal>

      {drawer}
    </div>
  );
}

/* ============ END: PortfolioManagement.jsx ============ */

/* ============================================================
   Page: AssignInvestment.jsx
   Description: Form to assign investment to a client
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { investors, INVESTMENT_SEGMENTS } from '../../data/mockData';
import { getApiUrl } from '../../config/apiUrl';

export default function AssignInvestment() {
  const navigate = useNavigate();
  const addToast = useToast();
  
  const [form, setForm] = useState({
    investorId: '',
    amount: '',
    roi: '',
    contractPeriod: '',
    dateOfJoining: new Date().toISOString().split('T')[0]
  });

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedProjects = localStorage.getItem('kfpl_portfolio_projects');
    if (storedProjects) {
      try {
        let parsed = JSON.parse(storedProjects);
        let migrated = false;
        parsed = parsed.map(p => {
          const rawRoi = p.roi || '';
          const numRoi = parseFloat(rawRoi.replace(/[^0-9.]/g, ''));
          // Migrate annual to monthly in local storage
          if (!isNaN(numRoi) && numRoi > 3) {
            p.roi = `${(numRoi / 12).toFixed(2)}%`;
            migrated = true;
          }
          return p;
        });
        if (migrated) {
          localStorage.setItem('kfpl_portfolio_projects', JSON.stringify(parsed));
        }
        setProjects(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default projects fallback if not exists
      const defaultProjects = [
        { id: 1, name: 'Project Astra', segment: 'Film Making', roi: '1.25%' },
        { id: 2, name: 'Rhythm Series', segment: 'Music', roi: '0.83%' },
        { id: 3, name: 'Meridian Release', segment: 'Distribution', roi: '1.0%' },
        { id: 4, name: 'Archive Digitization', segment: 'Content IP Bank', roi: '1.17%' },
        { id: 5, name: 'Content Deal Q2', segment: 'Trading & Syndication', roi: '1.08%' },
        { id: 6, name: 'Screen Network', segment: 'Film Exhibition', roi: '0.92%' },
      ];
      setProjects(defaultProjects);
    }
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProjectChange = (e) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    if (!pId) return;

    const project = projects.find(p => String(p.id) === String(pId));
    if (project) {
      // 1. Load Monthly ROI directly (no division needed since project ROI is now monthly)
      const rawRoi = project.roi || '';
      const numRoi = parseFloat(rawRoi.replace(/[^0-9.]/g, ''));
      if (!isNaN(numRoi)) {
        const monthly = numRoi.toFixed(2);
        setForm(prev => ({ ...prev, roi: monthly }));
        addToast(`Monthly ROI of ${rawRoi} auto-filled from project`, 'info', 'Auto-Filled ROI');
      }

      // 2. Auto-select segment and set allocation to 100%
      const matchingSeg = INVESTMENT_SEGMENTS.find(s => s.name.toLowerCase() === project.segment.toLowerCase());
      const segId = matchingSeg ? matchingSeg.id : project.segment;

      setSelectedSegments([segId]);
      setAllocations({ [segId]: '100' });
    }
  };

  const handleSegmentToggle = (segId) => {
    if (selectedSegments.includes(segId)) {
      setSelectedSegments(prev => prev.filter(id => id !== segId));
      setAllocations(prev => {
        const copy = { ...prev };
        delete copy[segId];
        return copy;
      });
    } else {
      setSelectedSegments(prev => [...prev, segId]);
      // Default to equal share or just empty
      setAllocations(prev => ({ ...prev, [segId]: '' }));
    }
  };

  const handleAllocationChange = (segId, value) => {
    setAllocations(prev => ({ ...prev, [segId]: value }));
  };

  const totalAllocation = selectedSegments.reduce((sum, segId) => {
    const val = parseFloat(allocations[segId]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (selectedSegments.length === 0) {
      addToast('Please select at least one segment', 'error', 'Validation Error');
      setLoading(false);
      return;
    }

    if (totalAllocation > 100) {
      addToast('Total allocation across segments cannot exceed 100%', 'error', 'Validation Error');
      setLoading(false);
      return;
    }

    const selectedInvestor = investors.find(i => String(i.id) === String(form.investorId));
    const clientId = selectedInvestor?.clientId || '';

    const authData = localStorage.getItem('kfpl_auth');
    const token = authData ? JSON.parse(authData)?.token : null;

    if (!token) {
      addToast('Authentication token not found. Please log in again.', 'error', 'Error');
      setLoading(false);
      return;
    }

    const segmentsPayload = selectedSegments.map(sid => ({
      segmentId: sid,
      segmentName: INVESTMENT_SEGMENTS.find(s => s.id === sid)?.name || sid,
      allocationPercentage: parseFloat(allocations[sid]) || 0
    }));

    try {
      const response = await fetch(getApiUrl('/api/super-admin/investments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId,
          segments: segmentsPayload,
          investmentAmount: Number(form.amount),
          roiPercentage: Number(form.roi),
          dateOfJoining: form.dateOfJoining,
          remarks: `Investment assigned for contract period of ${form.contractPeriod || 12} months`
        })
      });

      if (response.ok) {
        addToast('Investment assigned successfully!', 'success', 'Investment Created');
        setTimeout(() => navigate('/investments'), 500);
      } else {
        const data = await response.json();
        addToast(data.message || data.error || 'Failed to assign investment.', 'error', 'Error');
      }
    } catch (err) {
      // Prototype fallback - save to in-memory/mock and proceed on client side
      console.warn('API error, falling back to client-side mock action:', err);
      
      const selectedInvestor = investors.find(i => String(i.id) === String(form.investorId));
      if (selectedInvestor) {
        const period = Number(form.contractPeriod) || 24;
        const newIdBase = Date.now();
        selectedSegments.forEach((segId, index) => {
          const segName = INVESTMENT_SEGMENTS.find(s => s.id === segId)?.name || segId;
          const percentage = parseFloat(allocations[segId]) || 0;
          const allocatedAmount = Number(form.amount) * (percentage / 100);
          
          selectedInvestor.investments.push({
            id: newIdBase + index,
            segment: segName,
            amount: allocatedAmount,
            roi: Number(form.roi),
            risk: 25, // default mock risk
            date: form.dateOfJoining,
            status: 'Active',
            contractPeriod: period,
            projectId: selectedProjectId ? Number(selectedProjectId) : null,
            projectName: selectedProjectId ? (projects.find(p => String(p.id) === String(selectedProjectId))?.name || '') : ''
          });
        });
        
        // Also update total investment
        selectedInvestor.totalInvestment += Number(form.amount);
      }

      addToast('Investment assigned successfully (Prototype Mock Mode)!', 'success', 'Investment Created');
      setTimeout(() => navigate('/investments'), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Assign Investment</h2>
          <p className="kfpl-page-subtitle">Assign a new investment project to a client across segments</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/investments')}>Cancel</button>
        </div>
      </div>

      <form className="kfpl-form-card" onSubmit={handleSubmit}>
        <div className="kfpl-form-card-header">
          <div>
            <h3 className="kfpl-form-card-title">Investment Details</h3>
          </div>
        </div>

        <div className="kfpl-form">
          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Select Project (Optional — Auto-fills Segment & ROI)</label>
              <select
                className="kfpl-select"
                name="selectedProjectId"
                value={selectedProjectId}
                onChange={handleProjectChange}
              >
                <option value="">Choose project to link</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.segment} — Monthly ROI: {p.roi})
                  </option>
                ))}
              </select>
            </div>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Select Investor <span className="required">*</span></label>
              <select className="kfpl-select" name="investorId" value={form.investorId} onChange={handleChange} required>
                <option value="">Choose investor</option>
                {investors.filter(i => i.status === 'active').map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.name} ({inv.clientId})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="kfpl-form-row">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Date of Joining / Contract Start <span className="required">*</span></label>
              <input
                type="date"
                className="kfpl-input"
                name="dateOfJoining"
                value={form.dateOfJoining}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="kfpl-form-row-3">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Amount (₹) <span className="required">*</span></label>
              <input className="kfpl-input" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Enter amount" required />
            </div>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Monthly ROI % <span className="required">*</span></label>
              <input className="kfpl-input" name="roi" type="number" step="0.1" value={form.roi} onChange={handleChange} placeholder="e.g. 15" required />
            </div>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Contract Period (months)</label>
              <input className="kfpl-input" name="contractPeriod" type="number" value={form.contractPeriod} onChange={handleChange} placeholder="e.g. 24" />
            </div>
          </div>

          {/* Segment Checkboxes + Allocation Inputs */}
          <div className="kfpl-form-section">
            <div className="kfpl-form-section-title">
              Investment Segment Allocation
              <span style={{ float: 'right', color: totalAllocation > 100 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 700 }}>
                Total Allocation: {totalAllocation}% / 100%
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
              {INVESTMENT_SEGMENTS.map(seg => {
                const isSelected = selectedSegments.includes(seg.id);
                return (
                  <div
                    key={seg.id}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--color-emerald)' : '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: 'var(--color-navy)' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSegmentToggle(seg.id)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-emerald)' }}
                      />
                      {seg.name}
                    </label>

                    {isSelected && (
                      <div className="kfpl-input-group" style={{ margin: 0 }}>
                        <label className="kfpl-input-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Allocation (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="kfpl-input"
                          value={allocations[seg.id] ?? ''}
                          onChange={(e) => handleAllocationChange(seg.id, e.target.value)}
                          placeholder="e.g. 25"
                          style={{ padding: '6px 10px', height: '36px' }}
                          required
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="kfpl-form-actions">
            <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={() => navigate('/investments')} disabled={loading}>Cancel</button>
            <button type="submit" className="kfpl-btn kfpl-btn--primary" disabled={loading || totalAllocation > 100}>
              {loading ? 'Assigning...' : 'Assign Investment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ============ END: AssignInvestment.jsx ============ */

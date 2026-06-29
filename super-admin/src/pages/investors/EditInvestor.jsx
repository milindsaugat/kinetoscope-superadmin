/* ============================================================
   Page: EditInvestor.jsx
   Description: Form to edit an existing investor/client profile.
                Fetches client data from API on mount, submits
                changes via PATCH /api/super-admin/clients/:id.
   ============================================================ */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import Badge from '../../components/ui/Badge';
import FileDropzone from '../../components/ui/FileDropzone';
import { apiRequest } from '../../config/apiHelper';

const COMMISSION_PRESETS = [
  { id: 'slab-1', name: 'Slab 1 (Basic): 1.0% One-Time / 0.50% Monthly', oneTime: 1.0, monthly: 0.50 },
  { id: 'slab-2', name: 'Slab 2 (Standard): 1.5% One-Time / 0.75% Monthly', oneTime: 1.5, monthly: 0.75 },
  { id: 'slab-3', name: 'Slab 3 (Premium): 2.0% One-Time / 1.00% Monthly', oneTime: 2.0, monthly: 1.00 },
  { id: 'slab-4', name: 'Slab 4 (Elite): 2.5% One-Time / 1.25% Monthly', oneTime: 2.5, monthly: 1.25 },
  { id: 'custom', name: 'Custom Rates...', oneTime: '', monthly: '' },
];

export default function EditInvestor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [dbAgents, setDbAgents] = useState([]);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', dob: '', address: '',
    pan: '', bankName: '', accountNo: '', ifsc: '',
    category: '', status: '',
    nomineeName: '', nomineeRelation: '', nomineeContact: '', nomineeEmail: '',
    riskProfile: '',
    citizenship: 'National',
    nomineeCitizenship: 'National',
    commissionSlab: 'slab-2',
    commissionOneTime: '1.5',
    commissionMonthly: '0.75',
    roiPercentage: '',
  });

  // Fetch client data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/super-admin/clients/${id}`);
        const data = res.data || res;
        setClientData(data);

        const profile = data.profile || data;
        const header = data.header || {};

        // Format DOB for date input (YYYY-MM-DD)
        let dobFormatted = '';
        if (profile.dob) {
          const d = new Date(profile.dob);
          if (!isNaN(d.getTime())) {
            dobFormatted = d.toISOString().split('T')[0];
          } else {
            dobFormatted = profile.dob;
          }
        }

        setForm({
          fullName: profile.fullName || profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          dob: dobFormatted,
          address: profile.address || '',
          pan: profile.panNumber || profile.pan || '',
          bankName: profile.bankName || '',
          accountNo: profile.accountNumber || profile.accountNo || '',
          ifsc: profile.ifscCode || profile.ifsc || '',
          category: (header.tier || profile.tier || profile.category || 'silver').toLowerCase(),
          status: (header.status || profile.status || 'active').toLowerCase(),
          nomineeName: profile.nomineeName || '',
          nomineeRelation: profile.nomineeRelation || '',
          nomineeContact: profile.nomineePhone || '',
          nomineeEmail: profile.nomineeEmail || '',
          riskProfile: profile.riskProfile || 'Conservative',
          citizenship: (profile.residencyStatus || profile.citizenship || 'National').includes('International') ? 'International' : 'National',
          nomineeCitizenship: (profile.nomineeResidency || '').includes('International') ? 'International' : 'National',
          commissionSlab: 'slab-2',
          commissionOneTime: '1.5',
          commissionMonthly: '0.75',
          roiPercentage: profile.monthlyRoi || profile.roiPercentage || 1.2,
        });

        // Set assigned agent
        if (profile.assignedAgent) {
          setSelectedAgentId(typeof profile.assignedAgent === 'object' ? profile.assignedAgent._id : profile.assignedAgent);
        }
      } catch (err) {
        console.error('Failed to fetch client for edit:', err);
        addToast(err.message || 'Failed to load client data', 'error', 'Error');
      } finally {
        setLoading(false);
      }
    };

    const fetchAgents = async () => {
      try {
        const res = await apiRequest('/api/super-admin/agents');
        const agents = res.data || res.agents || [];
        if (Array.isArray(agents)) {
          setDbAgents(agents);
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      }
    };

    fetchData();
    fetchAgents();
  }, [id]);

  if (loading) {
    return (
      <div className="kfpl-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading client data...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="kfpl-page">
        <div className="kfpl-empty">
          <div className="kfpl-empty-title">Client not found</div>
          <button className="kfpl-btn kfpl-btn--primary mt-4" onClick={() => navigate('/investors')}>Back to List</button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSlabChange = (e) => {
    const slabId = e.target.value;
    const preset = COMMISSION_PRESETS.find(p => p.id === slabId);
    setForm(prev => ({
      ...prev,
      commissionSlab: slabId,
      commissionOneTime: preset && slabId !== 'custom' ? String(preset.oneTime) : prev.commissionOneTime,
      commissionMonthly: preset && slabId !== 'custom' ? String(preset.monthly) : prev.commissionMonthly,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((form.nomineeRelation || form.nomineeContact) && !form.nomineeName) {
      alert('Nominee Name is required if Nominee Relation or Nominee Contact is provided.');
      return;
    }

    setSaving(true);
    try {
      // Build the PATCH payload
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        address: form.address,
        riskProfile: form.riskProfile,
        residencyStatus: form.citizenship === 'International' ? 'International' : 'National (Domestic)',
        monthlyRoi: parseFloat(form.roiPercentage) || 1.2,
        status: form.status,
        tier: form.category.toUpperCase(),
        panNumber: form.pan,
        bankName: form.bankName,
        accountNumber: form.accountNo,
        ifscCode: form.ifsc,
        nomineeName: form.nomineeName,
        nomineeRelation: form.nomineeRelation,
        nomineePhone: form.nomineeContact,
        nomineeEmail: form.nomineeEmail,
        nomineeResidency: form.nomineeCitizenship === 'International' ? 'International' : 'National (Domestic)',
      };

      // Only include assignedAgent if it's a valid MongoDB ID
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(selectedAgentId);
      if (selectedAgentId && isValidMongoId) {
        payload.assignedAgent = selectedAgentId;
      }

      await apiRequest(`/api/super-admin/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      addToast(`Client "${form.fullName}" updated successfully!`, 'success', 'Client Updated');
      setTimeout(() => navigate(`/investors/${id}`), 500);
    } catch (err) {
      addToast(err.message || 'Failed to update client', 'error', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  const profile = clientData?.profile || clientData || {};
  const header = clientData?.header || {};
  const displayName = header.clientName || profile.fullName || profile.name || '';
  const displayCode = header.clientCode || profile.clientCode || profile.clientId || '';
  const displayTier = (header.tier || profile.tier || profile.category || 'silver').toLowerCase();

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Edit Client Profile</h2>
          <p className="kfpl-page-subtitle">Update details for <strong>{displayName}</strong> — {displayCode}</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate(`/investors/${id}`)}>Cancel</button>
        </div>
      </div>

      <form className="kfpl-form-card" onSubmit={handleSubmit}>
        <div className="kfpl-form-card-header">
          <div>
            <h3 className="kfpl-form-card-title">Personal Information</h3>
            <p className="kfpl-form-card-subtitle">Client ID: {displayCode}</p>
          </div>
          <Badge status={displayTier}>{displayTier.toUpperCase()} Tier</Badge>
        </div>

        <div className="kfpl-form">
          {/* Personal Details */}
          <div className="kfpl-form-section">
            <div className="kfpl-form-section-title">Basic Details</div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Full Name <span className="required">*</span></label>
                <input className="kfpl-input" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter full name" required />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Email Address <span className="required">*</span></label>
                <input className="kfpl-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="investor@email.com" required />
              </div>
            </div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Phone Number <span className="required">*</span></label>
                <input className="kfpl-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Date of Birth</label>
                <input className="kfpl-input" name="dob" type="date" value={form.dob} onChange={handleChange} />
              </div>
            </div>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Address</label>
              <textarea className="kfpl-textarea" name="address" value={form.address} onChange={handleChange} placeholder="Full address" rows="2" />
            </div>
          </div>

          {/* Status & Category */}
          <div className="kfpl-form-section">
            <div className="kfpl-form-section-title">Account Settings</div>
            <div className="kfpl-form-row-3">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Category / Tier</label>
                <select className="kfpl-input" name="category" value={form.category} onChange={handleChange}>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="diamond">Diamond</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Status</label>
                <select className="kfpl-input" name="status" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                  <option value="hold">Hold</option>
                </select>
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Risk Profile</label>
                <select className="kfpl-input" name="riskProfile" value={form.riskProfile} onChange={handleChange}>
                  <option value="Conservative">Conservative</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
            </div>
            <div className="kfpl-form-row" style={{ marginTop: '16px' }}>
              <div className="kfpl-input-group" style={{ flex: 1 }}>
                <label className="kfpl-input-label">Residency / Citizenship</label>
                <select className="kfpl-select" name="citizenship" value={form.citizenship} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <option value="National">National (Domestic)</option>
                  <option value="International">International</option>
                </select>
              </div>
              <div className="kfpl-input-group" style={{ flex: 1 }}>
                <label className="kfpl-input-label">Agent / Source of Client</label>
                <select 
                  className="kfpl-select" 
                  value={selectedAgentId} 
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                >
                  <option value="">Direct Client (No Agent)</option>
                  {dbAgents.map(a => (
                    <option key={a._id || a.id} value={a._id || a.id}>
                      {a.name} ({a.agentId || a.code || 'Agent'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="kfpl-form-row" style={{ marginTop: '16px' }}>
              <div className="kfpl-input-group" style={{ flex: 1 }}>
                <label className="kfpl-input-label">Monthly ROI % <span className="required">*</span></label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="kfpl-input" 
                  name="roiPercentage" 
                  value={form.roiPercentage} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div style={{ flex: 1 }}></div>
            </div>

            {selectedAgentId && (
              <div className="kfpl-form-row-3" style={{ marginTop: '16px' }}>
                <div className="kfpl-input-group">
                  <label className="kfpl-input-label">Agent Commission Slab</label>
                  <select 
                    className="kfpl-select" 
                    name="commissionSlab"
                    value={form.commissionSlab} 
                    onChange={handleSlabChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  >
                    {COMMISSION_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                  </select>
                </div>
                <div className="kfpl-input-group">
                  <label className="kfpl-input-label">One-Time Commission (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="kfpl-input" 
                    name="commissionOneTime" 
                    value={form.commissionOneTime} 
                    onChange={handleChange} 
                    disabled={form.commissionSlab !== 'custom'} 
                    placeholder="e.g. 1.5"
                  />
                </div>
                <div className="kfpl-input-group">
                  <label className="kfpl-input-label">Monthly Commission (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="kfpl-input" 
                    name="commissionMonthly" 
                    value={form.commissionMonthly} 
                    onChange={handleChange} 
                    disabled={form.commissionSlab !== 'custom'} 
                    placeholder="e.g. 0.75"
                  />
                </div>
              </div>
            )}
          </div>

          {/* KYC Document Uploads */}
          <FileDropzone label={form.citizenship === 'International' ? 'Tax ID Upload' : 'PAN Card Upload'} />
          <FileDropzone label={form.citizenship === 'International' ? 'International Passport / National ID Card Upload' : 'Aadhaar Card Upload'} />
          <FileDropzone label="Bank Details Document (Cancelled Cheque / Bank Statement)" />
          <div className="kfpl-form-section">
            <div className="kfpl-form-section-title">KYC & Bank Details</div>
            <div className="kfpl-form-row-3">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">{form.citizenship === 'International' ? 'Tax ID / SSN Number' : 'PAN Number'}</label>
                <input className="kfpl-input" name="pan" value={form.pan} onChange={handleChange} placeholder={form.citizenship === 'International' ? 'Tax ID or SSN' : 'ABCPK1234L'} />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Bank Name</label>
                <input className="kfpl-input" name="bankName" value={form.bankName} onChange={handleChange} placeholder="Bank name" />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Account Number</label>
                <input className="kfpl-input" name="accountNo" value={form.accountNo} onChange={handleChange} placeholder="Account number" />
              </div>
            </div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">{form.citizenship === 'International' ? 'IFSC / SWIFT Code' : 'IFSC Code'}</label>
                <input className="kfpl-input" name="ifsc" value={form.ifsc} onChange={handleChange} placeholder={form.citizenship === 'International' ? 'SWIFT or IFSC code' : 'HDFC0001234'} />
              </div>
              <div></div>
            </div>
          </div>

          {/* Nominee Details */}
          <div className="kfpl-form-section">
            <div className="kfpl-form-section-title">Nominee Details</div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Nominee Name {(form.nomineeRelation || form.nomineeContact) && <span className="required">*</span>}</label>
                <input className="kfpl-input" name="nomineeName" value={form.nomineeName} onChange={handleChange} placeholder="Enter nominee's full name" required={!!(form.nomineeRelation || form.nomineeContact)} />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Nominee Relation</label>
                <select className="kfpl-select" name="nomineeRelation" value={form.nomineeRelation} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <option value="">Select Relation</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="kfpl-form-row-3">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Nominee Contact Number</label>
                <input className="kfpl-input" name="nomineeContact" value={form.nomineeContact} onChange={handleChange} placeholder="Enter contact number" />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Nominee Email Address</label>
                <input className="kfpl-input" name="nomineeEmail" type="email" value={form.nomineeEmail} onChange={handleChange} placeholder="nominee@email.com" />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Nominee Residency / Citizenship</label>
                <select className="kfpl-select" name="nomineeCitizenship" value={form.nomineeCitizenship} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <option value="National">National (Domestic)</option>
                  <option value="International">International</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nominee ID Proof Upload */}
          <FileDropzone label={form.nomineeCitizenship === 'International' ? 'Nominee International Passport / National ID Card Upload' : 'Nominee ID Proof (Aadhaar / Driving License / Passport)'} />

          {/* Agreement Upload */}
          <FileDropzone label="Agreement Document" />

          {/* Actions */}
          <div className="kfpl-form-actions">
            <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={() => navigate(`/investors/${id}`)}>Cancel</button>
            <button type="submit" className="kfpl-btn kfpl-btn--primary" disabled={saving}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16" style={{ marginRight: '6px' }}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2 2h11l5 5v11z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ============ END: EditInvestor.jsx ============ */

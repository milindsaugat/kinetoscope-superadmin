/* ============================================================
   Page: AddInvestor.jsx
   Description: Form to create a new investor profile by calling 
                the /api/super-admin/clients backend API endpoint.
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import FileDropzone from '../../components/ui/FileDropzone';
import { investors, agents } from '../../data/mockData';
import { getApiUrl } from '../../config/apiUrl';

export default function AddInvestor() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', dob: '', address: '',
    pan: '', bankName: '', accountNo: '', ifsc: '',
    aadhaarNumber: '',
    nomineeName: '', nomineeRelation: '', nomineeContact: '', nomineeEmail: '',
    riskProfile: 'Conservative',
    citizenship: 'National',
    nomineeCitizenship: 'National',
    roiPercentage: '1.2',
  });

  // Uploaded Files State
  const [panDocument, setPanDocument] = useState(null);
  const [aadhaarDocument, setAadhaarDocument] = useState(null);
  const [bankProofDocument, setBankProofDocument] = useState(null);
  const [nomineeProofDocument, setNomineeProofDocument] = useState(null);
  const [agreementDocument, setAgreementDocument] = useState(null);

  const [portalEmail, setPortalEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const nextForm = { ...prev, [name]: value };
      if (name === 'email') {
        setPortalEmail(value);
      }
      return nextForm;
    });
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPortalPassword(pass);
    addToast('Secure password generated!', 'info', 'Password Generated');
  };

  const copyCredentials = () => {
    if (!portalEmail || !portalPassword) return;
    const text = `Email: ${portalEmail}\nPassword: ${portalPassword}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          addToast('Credentials copied to clipboard!', 'success', 'Copied');
        })
        .catch(() => {
          fallbackCopyText(text);
        });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      addToast('Credentials copied to clipboard!', 'success', 'Copied');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textarea);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((form.nomineeRelation || form.nomineeContact) && !form.nomineeName) {
      alert('Nominee Name is required if Nominee Relation or Nominee Contact is provided.');
      return;
    }

    setLoading(true);

    try {
      const authData = localStorage.getItem('kfpl_auth');
      let jwtToken = '';
      if (authData) {
        const parsed = JSON.parse(authData);
        jwtToken = parsed.token || '';
      }

      // Construct FormData for multipart upload
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      if (form.dob) formData.append('dob', form.dob);
      if (form.address) formData.append('address', form.address);
      formData.append('riskProfile', form.riskProfile);
      formData.append('residencyStatus', form.citizenship === 'International' ? 'International' : 'National (Domestic)');
      formData.append('monthlyRoi', form.roiPercentage || '1.2');
      if (form.bankName) formData.append('bankName', form.bankName);
      if (form.accountNo) formData.append('accountNumber', form.accountNo);
      if (form.ifsc) formData.append('ifscCode', form.ifsc);
      if (form.pan) formData.append('panNumber', form.pan);
      if (form.aadhaarNumber) formData.append('aadhaarNumber', form.aadhaarNumber);

      if (form.nomineeName) {
        formData.append('nomineeName', form.nomineeName);
        formData.append('nomineeRelation', form.nomineeRelation);
        formData.append('nomineePhone', form.nomineeContact);
        formData.append('nomineeEmail', form.nomineeEmail);
        formData.append('nomineeResidency', form.nomineeCitizenship === 'International' ? 'International' : 'National (Domestic)');
      }

      formData.append('assignedAgent', selectedAgentId || 'Direct Client (No Agent)');
      formData.append('tier', 'SILVER');
      if (portalPassword) formData.append('portalPassword', portalPassword);

      // Append files if selected
      if (panDocument) formData.append('panDocument', panDocument);
      if (aadhaarDocument) formData.append('aadhaarDocument', aadhaarDocument);
      if (bankProofDocument) formData.append('bankProofDocument', bankProofDocument);
      if (nomineeProofDocument) formData.append('nomineeProofDocument', nomineeProofDocument);
      if (agreementDocument) formData.append('agreementDocument', agreementDocument);

      const response = await fetch(getApiUrl('/api/super-admin/clients'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        },
        body: formData
      });

      const resData = await response.json();

      if (response.ok) {
        addToast(`Client "${form.fullName}" registered successfully!`, 'success', 'Client Added');
        
        // Also push to local mock data array so UI is instantly updated
        const newId = investors.length > 0 ? Math.max(...investors.map(i => i.id)) + 1 : 1;
        const clientId = resData.data?.header?.clientCode || `KFPL-${1000 + newId}`;
        const newClient = {
          id: newId,
          name: form.fullName,
          clientId: clientId,
          email: form.email,
          phone: form.phone,
          dob: form.dob,
          address: form.address,
          category: 'silver',
          status: 'active',
          totalInvestment: 0,
          roiPercentage: parseFloat(form.roiPercentage) || 1.2,
          joinDate: new Date().toISOString().split('T')[0],
          kyc: 'Verified',
          pan: form.pan,
          bankName: form.bankName,
          accountNo: form.accountNo,
          ifsc: form.ifsc,
          riskProfile: form.riskProfile,
          citizenship: form.citizenship,
          investments: [],
          roiHistory: [],
          perks: [],
          nominee: {
            name: form.nomineeName,
            relation: form.nomineeRelation,
            contact: form.nomineeContact,
            email: form.nomineeEmail,
            citizenship: form.nomineeCitizenship,
          }
        };
        investors.push(newClient);

        setTimeout(() => navigate('/investors'), 500);
      } else {
        addToast(resData.message || resData.error || 'Failed to onboard client.', 'danger', 'Submission Error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error or server unavailable.', 'danger', 'Submission Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h2 className="kfpl-page-title">Add New Investor</h2>
          <p className="kfpl-page-subtitle">Fill in the details to onboard a new investor</p>
        </div>
        <div className="kfpl-page-header-actions">
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" onClick={() => navigate('/investors')}>Cancel</button>
        </div>
      </div>

      <form className="kfpl-form-card" onSubmit={handleSubmit}>
        <div className="kfpl-form-card-header">
          <div>
            <h3 className="kfpl-form-card-title">Personal Information</h3>
            <p className="kfpl-form-card-subtitle">Client ID will be auto-generated</p>
          </div>
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
            <div className="kfpl-form-row">
              <div className="kfpl-input-group" style={{ flex: 2 }}>
                <label className="kfpl-input-label">Address</label>
                <textarea className="kfpl-textarea" name="address" value={form.address} onChange={handleChange} placeholder="Full address" rows="2" />
              </div>
              <div className="kfpl-input-group" style={{ flex: 1 }}>
                <label className="kfpl-input-label">Risk Profile</label>
                <select className="kfpl-select" name="riskProfile" value={form.riskProfile} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <option value="Conservative">Conservative</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
            </div>
            <div className="kfpl-form-row">
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
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.agentId})</option>
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
          </div>

          {/* KYC & Bank */}
          <div className="kfpl-form-section">
            <div className="kfpl-form-section-title">KYC & Bank Details</div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">
                  {form.citizenship === 'International' ? 'Tax ID / SSN Number' : 'PAN Number'} <span className="required">*</span>
                </label>
                <input 
                  className="kfpl-input" 
                  name="pan" 
                  value={form.pan} 
                  onChange={handleChange} 
                  placeholder={form.citizenship === 'International' ? 'Tax ID or SSN' : 'ABCPK1234L'} 
                  required 
                />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">
                  {form.citizenship === 'International' ? 'Passport / National ID Number' : 'Aadhaar Number'} <span className="required">*</span>
                </label>
                <input 
                  className="kfpl-input" 
                  name="aadhaarNumber" 
                  value={form.aadhaarNumber} 
                  onChange={handleChange} 
                  placeholder={form.citizenship === 'International' ? 'Passport or ID number' : '12-digit Aadhaar number'} 
                  required 
                />
              </div>
            </div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Bank Name <span className="required">*</span></label>
                <input className="kfpl-input" name="bankName" value={form.bankName} onChange={handleChange} placeholder="Bank name" required />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Account Number <span className="required">*</span></label>
                <input className="kfpl-input" name="accountNo" value={form.accountNo} onChange={handleChange} placeholder="Account number" required />
              </div>
            </div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">
                  {form.citizenship === 'International' ? 'IFSC / SWIFT Code' : 'IFSC Code'} <span className="required">*</span>
                </label>
                <input 
                  className="kfpl-input" 
                  name="ifsc" 
                  value={form.ifsc} 
                  onChange={handleChange} 
                  placeholder={form.citizenship === 'International' ? 'SWIFT or IFSC code' : 'HDFC0001234'} 
                  required 
                />
              </div>
              <div style={{ flex: 1 }}></div>
            </div>
          </div>

          {/* KYC Document Uploads */}
          <FileDropzone 
            label={form.citizenship === 'International' ? 'Tax ID Upload' : 'PAN Card Upload'} 
            multiple={false} 
            onFilesChange={(files) => setPanDocument(files[0] || null)} 
          />
          <FileDropzone 
            label={form.citizenship === 'International' ? 'International Passport / National ID Card Upload' : 'Aadhaar Card Upload'} 
            multiple={false} 
            onFilesChange={(files) => setAadhaarDocument(files[0] || null)} 
          />
          <FileDropzone 
            label="Bank Details Document (Cancelled Cheque / Bank Statement)" 
            multiple={false} 
            onFilesChange={(files) => setBankProofDocument(files[0] || null)} 
          />

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
          <FileDropzone 
            label={form.nomineeCitizenship === 'International' ? 'Nominee International Passport / National ID Card Upload' : 'Nominee ID Proof (Aadhaar / Driving License / Passport)'} 
            multiple={false} 
            onFilesChange={(files) => setNomineeProofDocument(files[0] || null)} 
          />

          {/* Agreement Upload */}
          <FileDropzone 
            label="Agreement Document" 
            multiple={false} 
            onFilesChange={(files) => setAgreementDocument(files[0] || null)} 
          />

          {/* Client Portal Credentials Generation */}
          <div className="kfpl-form-section">
            <div className="kfpl-form-section-title">Client Portal Access</div>
            <div className="kfpl-form-row">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Email Address / Login ID</label>
                <input className="kfpl-input" name="portalEmail" value={portalEmail} onChange={(e) => setPortalEmail(e.target.value)} placeholder="investor@email.com" />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Portal Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="kfpl-input" type="text" value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} placeholder="Click Generate or enter secure password" style={{ flex: 1 }} />
                  <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={generatePassword} style={{ whiteSpace: 'nowrap' }}>Generate</button>
                  <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={copyCredentials} disabled={!portalEmail || !portalPassword} style={{ whiteSpace: 'nowrap' }}>Copy</button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="kfpl-form-actions">
            <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={() => navigate('/investors')} disabled={loading}>Cancel</button>
            <button type="submit" className="kfpl-btn kfpl-btn--primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Investor'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ============================================================
   Page: InvestorDetail.jsx
   Description: Investor profile with tabs for investments, ROI, perks.
                All data fetched from backend APIs.
   ============================================================ */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatCurrency } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';
import { apiRequest } from '../../config/apiHelper';

/* ── helpers for downloading statements ─────────────────────── */
function downloadClientROISingleCSV(roi, client) {
  const rows = [
    ['ROI Payout Statement'],
    ['Client Name', client.fullName || client.name],
    ['Client ID', client.clientCode || client.clientId],
    ['Period / Month', roi.payoutMonth || roi.month],
    ['Payout Date', roi.processedDate || new Date(roi.paidAt || roi.date || new Date()).toLocaleDateString('en-IN')],
    ['ROI Amount', `₹${roi.amount}`],
    ['Status', roi.status],
  ];
  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ROI_Statement_${(roi.payoutMonth || roi.month || '').replace(/\s/g, '_')}_${(client.fullName || client.name || '').replace(/\s/g, '_')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadClientROISinglePDF(roi, client, investments) {
  const clientName = client.fullName || client.name || '';
  const clientId = client.clientCode || client.clientId || '';
  const dateStr = roi.processedDate || new Date(roi.paidAt || roi.date || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const invList = investments || [];

  const rowsHtml = invList.map(inv => {
    const monthlyROI = Math.round(((inv.investmentAmount || inv.amount || 0) * (inv.roiPercentage || inv.roi || 1)) / 100);
    return `
      <tr>
        <td style="border: 1px solid #CFDDD5; padding: 10px; font-weight: 500;">${inv.segment}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center;">${inv.investmentDate || inv.allocationDate || inv.date || '—'}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center;">—</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right; font-weight: 600;">₹${(inv.investmentAmount || inv.amount || 0).toLocaleString('en-IN')}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right;">${inv.roiPercentage || inv.roi || 1}%</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right; font-weight: bold; color: #0F766E;">₹${monthlyROI.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <html>
    <head>
      <title>ROI Payout Statement - ${roi.payoutMonth || roi.month} - ${clientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #11221A; background-color: #FFFFFF; padding: 40px; margin: 0; }
        .header { margin-bottom: 30px; border-bottom: 3px solid #0F766E; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 28px; font-weight: 800; color: #061D13; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
        .meta-info { margin-bottom: 30px; background-color: #F3F7F5; border: 1px solid #CFDDD5; border-radius: 12px; padding: 20px; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .meta-item { display: flex; justify-content: space-between; border-bottom: 1px solid #E2ECE7; padding-bottom: 6px; font-size: 14px; }
        .meta-label { font-weight: 600; color: #6D7E75; }
        .meta-val { font-weight: 700; color: #11221A; }
        .section-title { font-size: 18px; font-weight: 700; color: #061D13; margin-top: 40px; margin-bottom: 14px; border-bottom: 1.5px solid #CFDDD5; padding-bottom: 6px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        .table th { background-color: #E5ECE8; border: 1px solid #CFDDD5; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #2E3E36; letter-spacing: 0.5px; }
        .table td { border: 1px solid #CFDDD5; padding: 10px 12px; color: #11221A; }
        .total-row { background-color: #F3F7F5; font-weight: bold; }
        @media print {
          body { padding: 0; }
          .print-btn-bar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar" style="display: flex; justify-content: flex-end; margin-bottom: 20px; gap: 10px;">
        <button onclick="window.print();" style="background: #0F766E; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);">Print / Save PDF</button>
        <button onclick="window.close();" style="background: #e2ece7; color: #2e3e36; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px;">Close Window</button>
      </div>

      <div class="header">
        <div>
          <div class="title">ROI Payout Statement</div>
          <div style="font-size: 12px; color: #6D7E75; margin-top: 4px; font-weight: 500;">KINETOSCOPE CAPITAL PARTNERS LTD</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13px; font-weight: 600; color: #2E3E36;">Date Generated:</div>
          <div style="font-size: 14px; font-weight: 700; color: #11221A;">${new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>
      
      <div class="meta-info">
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Client Name:</span>
            <span class="meta-val">${clientName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Client ID:</span>
            <span class="meta-val">${clientId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Period:</span>
            <span class="meta-val">${roi.payoutMonth || roi.month}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Payout Date:</span>
            <span class="meta-val">${dateStr}</span>
          </div>
          <div class="meta-item" style="grid-column: span 2; border-bottom: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #CFDDD5;">
            <span class="meta-label" style="font-size: 16px; color: #061D13;">Total ROI Received:</span>
            <span class="meta-val" style="font-size: 20px; color: #059669;">₹${roi.amount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      
      <div class="section-title">Active Investments Breakdown</div>
      <table class="table">
        <thead>
          <tr>
            <th>Segment</th>
            <th style="text-align: center;">Start Date</th>
            <th style="text-align: center;">Contract Period</th>
            <th style="text-align: right;">Principal Investment</th>
            <th style="text-align: right;">Allocated Monthly ROI %</th>
            <th style="text-align: right;">Proportional Monthly ROI</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadAllClientROICSV(roiList, client) {
  const clientName = client.fullName || client.name || '';
  const clientId = client.clientCode || client.clientId || '';
  const rows = [
    ['Client ROI Statement History'],
    ['Client Name', clientName],
    ['Client ID', clientId],
    [''],
    ['Month', 'ROI Amount', 'Payment Date', 'Status']
  ];
  roiList.forEach(roi => {
    rows.push([
      roi.payoutMonth || roi.month,
      roi.amount,
      roi.processedDate || roi.paidAt || roi.date || '—',
      roi.status
    ]);
  });
  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ROI_Statement_All_${clientName.replace(/\s/g, '_')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadAllClientROIPDF(roiList, client) {
  const clientName = client.fullName || client.name || '';
  const clientId = client.clientCode || client.clientId || '';
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  const totalReceived = roiList.reduce((sum, r) => sum + r.amount, 0);

  const rowsHtml = roiList.map(roi => {
    const month = roi.payoutMonth || roi.month;
    const status = roi.status || '';
    return `
      <tr>
        <td style="border: 1px solid #CFDDD5; padding: 10px; font-weight: 500;">${month}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right; font-weight: bold; color: ${roi.amount > 0 ? '#059669' : '#11221A'};">₹${roi.amount.toLocaleString('en-IN')}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center;">${roi.processedDate || roi.paidAt || roi.date || '—'}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center; color: ${status.toUpperCase() === 'PAID' ? '#059669' : '#D97706'}; font-weight: 600;">${status.toUpperCase()}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <html>
    <head>
      <title>ROI Statement History - ${clientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #11221A; background-color: #FFFFFF; padding: 40px; margin: 0; }
        .header { margin-bottom: 30px; border-bottom: 3px solid #0F766E; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 28px; font-weight: 800; color: #061D13; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
        .meta-info { margin-bottom: 30px; background-color: #F3F7F5; border: 1px solid #CFDDD5; border-radius: 12px; padding: 20px; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .meta-item { display: flex; justify-content: space-between; border-bottom: 1px solid #E2ECE7; padding-bottom: 6px; font-size: 14px; }
        .meta-label { font-weight: 600; color: #6D7E75; }
        .meta-val { font-weight: 700; color: #11221A; }
        .section-title { font-size: 18px; font-weight: 700; color: #061D13; margin-top: 40px; margin-bottom: 14px; border-bottom: 1.5px solid #CFDDD5; padding-bottom: 6px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        .table th { background-color: #E5ECE8; border: 1px solid #CFDDD5; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #2E3E36; letter-spacing: 0.5px; }
        .table td { border: 1px solid #CFDDD5; padding: 10px 12px; color: #11221A; }
        .total-row { background-color: #F3F7F5; font-weight: bold; }
        @media print {
          body { padding: 0; }
          .print-btn-bar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar" style="display: flex; justify-content: flex-end; margin-bottom: 20px; gap: 10px;">
        <button onclick="window.print();" style="background: #0F766E; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);">Print / Save PDF</button>
        <button onclick="window.close();" style="background: #e2ece7; color: #2e3e36; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px;">Close Window</button>
      </div>

      <div class="header">
        <div>
          <div class="title">ROI Statement History</div>
          <div style="font-size: 12px; color: #6D7E75; margin-top: 4px; font-weight: 500;">KINETOSCOPE CAPITAL PARTNERS LTD</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13px; font-weight: 600; color: #2E3E36;">Date Generated:</div>
          <div style="font-size: 14px; font-weight: 700; color: #11221A;">${new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>
      
      <div class="meta-info">
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Client Name:</span>
            <span class="meta-val">${clientName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Client ID:</span>
            <span class="meta-val">${clientId}</span>
          </div>
          <div class="meta-item" style="grid-column: span 2; border-bottom: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #CFDDD5;">
            <span class="meta-label" style="font-size: 16px; color: #061D13;">Total ROI Received:</span>
            <span class="meta-val" style="font-size: 20px; color: #059669;">₹${totalReceived.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      
      <div class="section-title">ROI Payment Log</div>
      <table class="table">
        <thead>
          <tr>
            <th>Month / Period</th>
            <th style="text-align: right;">ROI Received</th>
            <th style="text-align: center;">Payment Date</th>
            <th style="text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="total-row">
            <td style="text-align: left; font-weight: 800; font-size: 14px; padding: 12px;">Total Summary</td>
            <td style="text-align: right; font-weight: 800; color: #059669; font-size: 14px; padding: 12px;">₹${totalReceived.toLocaleString('en-IN')}</td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ── SVG Icon Definitions ───────────────────────
const tabIcons = {
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  investments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  roi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  perks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
};

const infoIcons = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  fileText: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  landmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z" />
    </svg>
  )
};

const perkIconMap = {
  phone: '📞',
  star: '⭐',
  gift: '🎁',
  ticket: '🎟️',
  chart: '📊',
  film: '🎬',
  popcorn: '🍿',
  money: '💰',
};

const perkDetails = {
  'Priority Support': { desc: 'Direct 24/7 dedicated support helpline and query resolution within 2 hours.', icon: '📞' },
  'Annual Gala Invite': { desc: 'Complimentary premium access and VIP seating at the annual film gala and awards.', icon: '🎟️' },
  'Quarterly Review': { desc: 'One-on-one portfolio review sessions with senior investment strategists.', icon: '📊' },
  'Film Set Visit': { desc: 'Exclusive behind-the-scenes access to active KFPL production sets and meet & greet.', icon: '🎬' },
  'VIP Screening': { desc: 'Private premiere screening invites for upcoming movie and content releases.', icon: '🍿' },
  'Revenue Share Bonus': { desc: 'Additional 1.5% bonus payout on high-performing distribution segments.', icon: '💰' }
};

export default function InvestorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  // ── API Data States ──────────────────────────
  const [clientData, setClientData] = useState(null);
  const [investmentsData, setInvestmentsData] = useState(null);
  const [roiData, setRoiData] = useState(null);
  const [perksData, setPerksData] = useState(null);
  const [docsData, setDocsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Local editable states ────────────────────
  const [localRiskProfile, setLocalRiskProfile] = useState('Conservative');
  const [localStatus, setLocalStatus] = useState('active');
  const [localRoiPercentage, setLocalRoiPercentage] = useState(1.2);
  const [showRoiEditModal, setShowRoiEditModal] = useState(false);
  const [roiEditStep, setRoiEditStep] = useState(1);
  const [roiInputVal, setRoiInputVal] = useState('1.2');
  const [viewingDoc, setViewingDoc] = useState(null);

  const tabs = ['profile', 'investments', 'roi', 'perks', 'documents'];

  // ── Fetch client details on mount (API 2) ────
  useEffect(() => {
    const fetchClientDetails = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/super-admin/clients/${id}`);
        const data = res.data || res;
        setClientData(data);

        // Initialize local editable states from API response
        const profile = data.profile || data;
        setLocalRiskProfile(profile.riskProfile || 'Conservative');
        setLocalStatus((data.header?.status || profile.status || 'active').toLowerCase());
        setLocalRoiPercentage(profile.monthlyRoi || data.summaryCards?.monthlyRoi || 1.2);
        setRoiInputVal(String(profile.monthlyRoi || data.summaryCards?.monthlyRoi || 1.2));
      } catch (err) {
        console.error('Failed to fetch client details:', err);
        addToast(err.message || 'Failed to load client data', 'error', 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchClientDetails();
  }, [id]);

  // ── Fetch tab data on tab change ─────────────
  useEffect(() => {
    if (activeTab === 'investments' && !investmentsData) {
      fetchInvestments();
    } else if (activeTab === 'roi' && !roiData) {
      fetchRoi();
    } else if (activeTab === 'perks' && !perksData) {
      fetchPerks();
    } else if (activeTab === 'documents' && !docsData) {
      fetchDocuments();
    }
  }, [activeTab]);

  // API 3: Investments
  const fetchInvestments = async () => {
    setTabLoading(true);
    try {
      const res = await apiRequest(`/api/super-admin/clients/${id}/investments`);
      setInvestmentsData(res.data || res);
    } catch (err) {
      console.error('Failed to fetch investments:', err);
      setInvestmentsData({ investments: [] });
    } finally {
      setTabLoading(false);
    }
  };

  // API 4: ROI
  const fetchRoi = async () => {
    setTabLoading(true);
    try {
      const res = await apiRequest(`/api/super-admin/clients/${id}/roi`);
      setRoiData(res.data || res);
    } catch (err) {
      console.error('Failed to fetch ROI:', err);
      setRoiData({ roiHistory: [], totalRoiPaid: 0, totalRoiPending: 0 });
    } finally {
      setTabLoading(false);
    }
  };

  // API 5: Perks
  const fetchPerks = async () => {
    setTabLoading(true);
    try {
      const res = await apiRequest(`/api/super-admin/clients/${id}/perks`);
      setPerksData(res.data || res);
    } catch (err) {
      console.error('Failed to fetch perks:', err);
      setPerksData({ perks: [] });
    } finally {
      setTabLoading(false);
    }
  };

  // API 6: Documents
  const fetchDocuments = async () => {
    setTabLoading(true);
    try {
      const res = await apiRequest(`/api/super-admin/clients/${id}/documents`);
      setDocsData(res.data || res);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setDocsData({ documents: [] });
    } finally {
      setTabLoading(false);
    }
  };

  // ── Helper getters from API data ─────────────
  const profile = clientData?.profile || clientData || {};
  const header = clientData?.header || {};
  const summary = clientData?.summaryCards || {};

  const clientName = header.clientName || profile.fullName || profile.name || '';
  const clientCode = header.clientCode || profile.clientCode || profile.clientId || '';
  const tier = (header.tier || profile.tier || profile.category || 'silver').toLowerCase();
  const kycStatus = header.kycStatus || summary.kycStatus || profile.kycStatus || 'Pending';

  // ── API 7: Edit client (PATCH) ───────────────
  const handleConfirmRoiChange = async () => {
    const newRoi = parseFloat(roiInputVal);
    if (isNaN(newRoi) || newRoi < 0) {
      addToast('Please enter a valid ROI rate', 'error', 'Invalid Rate');
      return;
    }
    setActionLoading(true);
    try {
      await apiRequest(`/api/super-admin/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ monthlyRoi: newRoi }),
      });
      setLocalRoiPercentage(newRoi);
      addToast(`Monthly ROI % updated to ${newRoi}%`, 'success', 'ROI Updated');
      setShowRoiEditModal(false);
      setRoiEditStep(1);
    } catch (err) {
      addToast(err.message || 'Failed to update ROI rate', 'error', 'Update Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRiskProfileChange = async (e) => {
    const newRisk = e.target.value;
    const prevRisk = localRiskProfile;
    setLocalRiskProfile(newRisk);
    try {
      await apiRequest(`/api/super-admin/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ riskProfile: newRisk }),
      });
      addToast(`Risk profile updated to ${newRisk}`, 'success', 'Profile Updated');
    } catch (err) {
      setLocalRiskProfile(prevRisk);
      addToast(err.message || 'Failed to update risk profile', 'error', 'Update Failed');
    }
  };

  // ── API 8: Update Portal Status ──────────────
  const handleBlockClient = async () => {
    const newStatus = localStatus === 'suspended' || localStatus === 'blocked' ? 'active' : 'blocked';
    const prevStatus = localStatus;
    setLocalStatus(newStatus);
    try {
      await apiRequest(`/api/super-admin/client-portal/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      addToast(`Client status set to ${newStatus.toUpperCase()}`, 'info', 'Status Changed');
    } catch (err) {
      setLocalStatus(prevStatus);
      addToast(err.message || 'Failed to update status', 'error', 'Update Failed');
    }
  };

  const handleHoldClient = async () => {
    const newStatus = localStatus === 'inactive' || localStatus === 'hold' ? 'active' : 'hold';
    const prevStatus = localStatus;
    setLocalStatus(newStatus);
    try {
      await apiRequest(`/api/super-admin/client-portal/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      addToast(`Client status set to ${newStatus.toUpperCase()}`, 'info', 'Status Changed');
    } catch (err) {
      setLocalStatus(prevStatus);
      addToast(err.message || 'Failed to update status', 'error', 'Update Failed');
    }
  };

  // ── API 9: Delete Client ─────────────────────
  const handleDeleteClient = async () => {
    if (!window.confirm(`Are you sure you want to completely delete client profile "${clientName}"?`)) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/super-admin/clients/${id}`, {
        method: 'DELETE',
      });
      addToast('Client profile deleted successfully!', 'success', 'Client Deleted');
      navigate('/investors');
    } catch (err) {
      addToast(err.message || 'Failed to delete client', 'error', 'Delete Failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Format date helper ───────────────────────
  const formatDate = (raw) => {
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ── Loading state ────────────────────────────
  if (loading) {
    return (
      <div className="kfpl-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading client details...</span>
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

  // ── Tab loading spinner component ────────────
  const TabSpinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        width: '32px', height: '32px', border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Loading...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Computed data for ROI tab ────────────────
  const roiHistory = roiData?.roiHistory || [];
  const totalPaidROI = roiData?.totalRoiPaid || roiHistory.filter(r => (r.status || '').toUpperCase() === 'PAID').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPendingROI = roiData?.totalRoiPending || roiHistory.filter(r => (r.status || '').toUpperCase() === 'PENDING').reduce((sum, r) => sum + (r.amount || 0), 0);

  // ── Computed data for investments tab ────────
  const investmentsList = investmentsData?.investments || [];

  // ── Computed data for perks tab ──────────────
  const perksList = perksData?.perks || [];

  // ── Computed data for documents tab ──────────
  const documentsList = docsData?.documents || [];

  const riskMap = {
    'Conservative': 'active',
    'Moderate': 'gold',
    'Aggressive': 'rejected'
  };

  return (
    <div className="kfpl-page">
      {/* Premium Gradient Header Card */}
      <div className="kfpl-detail-card-header">
        <div className="kfpl-detail-profile">
          <div className="kfpl-detail-avatar">
            {clientName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="kfpl-detail-name" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{clientName}</h2>
            <div className="kfpl-detail-id" style={{ marginTop: '2px' }}>ID: {clientCode}</div>
            <div className="kfpl-detail-meta" style={{ marginTop: '8px' }}>
              <Badge status={tier}>{tier.toUpperCase()} Tier</Badge>
              <Badge status={localStatus}>{localStatus}</Badge>
              <Badge status={riskMap[localRiskProfile]}>{localRiskProfile} Risk</Badge>
            </div>
          </div>
        </div>
        <div className="kfpl-detail-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ color: 'var(--color-white)', borderColor: 'rgba(255, 255, 255, 0.25)', background: 'rgba(255, 255, 255, 0.05)' }} onClick={() => navigate('/investors')}>
            ← Back
          </button>
          <button type="button" className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ color: 'var(--color-white)', borderColor: 'rgba(255, 255, 255, 0.25)', background: localStatus === 'suspended' || localStatus === 'blocked' ? '#EF4444' : 'rgba(255, 255, 255, 0.05)' }} onClick={handleBlockClient} disabled={actionLoading}>
            {localStatus === 'suspended' || localStatus === 'blocked' ? 'Unblock Client' : 'Block Client'}
          </button>
          <button type="button" className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ color: 'var(--color-white)', borderColor: 'rgba(255, 255, 255, 0.25)', background: localStatus === 'inactive' || localStatus === 'hold' ? '#F59E0B' : 'rgba(255, 255, 255, 0.05)' }} onClick={handleHoldClient} disabled={actionLoading}>
            {localStatus === 'inactive' || localStatus === 'hold' ? 'Resume Client' : 'Hold Client'}
          </button>
          <button type="button" className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" style={{ color: '#EF4444', borderColor: '#EF4444', background: 'rgba(239, 68, 68, 0.05)' }} onClick={handleDeleteClient} disabled={actionLoading}>
            Delete Client
          </button>
          <button className="kfpl-btn kfpl-btn--primary kfpl-btn--sm" style={{ background: '#10B981', color: 'var(--color-white)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }} onClick={() => navigate(`/investors/${id}/edit`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* KPI summaries dashboard */}
      <div className="kfpl-detail-kpis-summary">
        <div className="kfpl-detail-kpi-summary-card">
          <span className="kfpl-detail-kpi-summary-label">Total Investment</span>
          <span className="kfpl-detail-kpi-summary-value" style={{ color: '#10B981' }}>{formatCurrency(summary.totalInvestment || profile.totalPortfolioValue || 0)}</span>
        </div>
        <div className="kfpl-detail-kpi-summary-card">
          <span className="kfpl-detail-kpi-summary-label">Active Segments</span>
          <span className="kfpl-detail-kpi-summary-value">{summary.activeInvestments || 0} Segments</span>
        </div>
        <div className="kfpl-detail-kpi-summary-card">
          <span className="kfpl-detail-kpi-summary-label">Monthly ROI %</span>
          <span className="kfpl-detail-kpi-summary-value" style={{ color: '#F59E0B' }}>{localRoiPercentage}% Monthly</span>
        </div>
        <div className="kfpl-detail-kpi-summary-card">
          <span className="kfpl-detail-kpi-summary-label">KYC Verification</span>
          <span className="kfpl-detail-kpi-summary-value">
            <Badge status={kycStatus.toUpperCase() === 'VERIFIED' ? 'active' : 'pending'}>{kycStatus}</Badge>
          </span>
        </div>
      </div>

      {/* Segmented Pill Tab Bar */}
      <div className="kfpl-tabs">
        {tabs.map(tab => (
          <div
            key={tab}
            className={`kfpl-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabIcons[tab]}
            {tab.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="kfpl-detail-grid">
          <div className="kfpl-detail-info-card">
            <div className="kfpl-detail-info-title">Personal Information</div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.user}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Full Name</span>
                <span className="kfpl-detail-info-item-value">{profile.fullName || profile.name || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.mail}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Email Address</span>
                <span className="kfpl-detail-info-item-value">{profile.email || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.phone}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Phone Number</span>
                <span className="kfpl-detail-info-item-value">{profile.phone || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.calendar}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Date of Birth</span>
                <span className="kfpl-detail-info-item-value">{formatDate(profile.dob)}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.mapPin}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Address</span>
                <span className="kfpl-detail-info-item-value">{profile.address || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.calendar}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Join Date</span>
                <span className="kfpl-detail-info-item-value">{formatDate(profile.joinDate || profile.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="kfpl-detail-info-card">
            <div className="kfpl-detail-info-title">KYC & Financial Information</div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.shield}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">KYC Status</span>
                <span className="kfpl-detail-info-item-value">
                  <Badge status={kycStatus.toUpperCase() === 'VERIFIED' ? 'active' : 'pending'}>{kycStatus}</Badge>
                </span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="kfpl-detail-info-item-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <span className="kfpl-detail-info-item-label">Risk Profile</span>
                  <span className="kfpl-detail-info-item-value">{localRiskProfile}</span>
                </div>
                <select
                  value={localRiskProfile}
                  onChange={handleRiskProfileChange}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Conservative">Conservative</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Monthly ROI Rate</span>
                <span className="kfpl-detail-info-item-value" style={{ color: '#10B981', fontWeight: 800 }}>{localRoiPercentage}% Monthly</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.fileText}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">PAN Card Number</span>
                <span className="kfpl-detail-info-item-value">{profile.panNumber || profile.pan || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.landmark}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Bank Name</span>
                <span className="kfpl-detail-info-item-value">{profile.bankName || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.fileText}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Account No.</span>
                <span className="kfpl-detail-info-item-value">{profile.accountNumber || profile.accountNo || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon">{infoIcons.shield}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">IFSC Code</span>
                <span className="kfpl-detail-info-item-value">{profile.ifscCode || profile.ifsc || '—'}</span>
              </div>
            </div>
            <div className="kfpl-detail-info-row-item">
              <div className="kfpl-detail-info-item-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>{infoIcons.wallet}</div>
              <div className="kfpl-detail-info-item-content">
                <span className="kfpl-detail-info-item-label">Total Portfolio Value</span>
                <span className="kfpl-detail-info-item-value" style={{ color: '#10B981', fontWeight: 800 }}>{formatCurrency(summary.totalInvestment || profile.totalPortfolioValue || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investments' && (
        tabLoading && !investmentsData ? <TabSpinner /> : (
          <div className="kfpl-table-container">
            <div className="kfpl-table-toolbar">
              <h3 className="kfpl-form-card-title" style={{ margin: 0 }}>Active Segment Distribution</h3>
            </div>
            <div className="kfpl-table-scroll">
              <table className="kfpl-table">
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Amount</th>
                    <th>ROI Rate</th>
                    <th>Risk Level</th>
                    <th>Allocation Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
                        No investments found for this client.
                      </td>
                    </tr>
                  ) : (
                    investmentsList.map((inv, idx) => (
                      <tr key={inv._id || idx}>
                        <td className="kfpl-table-cell-primary">{inv.segment}</td>
                        <td className="font-semibold" style={{ color: '#10B981' }}>{formatCurrency(inv.investmentAmount || inv.amount || 0)}</td>
                        <td>{inv.roiPercentage || inv.roi || 0}%</td>
                        <td>
                          <Badge status={
                            (inv.riskPercentage || 0) >= 50 ? 'rejected' :
                            (inv.riskPercentage || 0) >= 25 ? 'pending' : 'active'
                          }>
                            {(inv.riskPercentage || 0) >= 50 ? 'High' : (inv.riskPercentage || 0) >= 25 ? 'Medium' : 'Low'}
                          </Badge>
                        </td>
                        <td>{formatDate(inv.allocationDate || inv.investmentDate || inv.date)}</td>
                        <td><Badge status={(inv.status || 'active').toLowerCase()}>{inv.status || 'Active'}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {activeTab === 'roi' && (
        tabLoading && !roiData ? <TabSpinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ROI Stats row */}
            <div className="kfpl-grid-2col" style={{ gap: '20px' }}>
              <div className="kfpl-detail-kpi-summary-card" style={{ borderLeft: '4px solid #10B981' }}>
                <span className="kfpl-detail-kpi-summary-label">Total ROI Paid</span>
                <span className="kfpl-detail-kpi-summary-value" style={{ color: '#10B981' }}>{formatCurrency(totalPaidROI)}</span>
              </div>
              <div className="kfpl-detail-kpi-summary-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                <span className="kfpl-detail-kpi-summary-label">Total ROI Pending</span>
                <span className="kfpl-detail-kpi-summary-value" style={{ color: '#F59E0B' }}>{formatCurrency(totalPendingROI)}</span>
              </div>
            </div>

            <div className="kfpl-table-container">
              <div className="kfpl-table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>ROI Payout Statements</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Export CSV or print PDF statements for client's ROI returns</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    className="kfpl-btn kfpl-btn--primary kfpl-btn--sm"
                    onClick={() => {
                      setRoiInputVal(String(localRoiPercentage));
                      setRoiEditStep(1);
                      setShowRoiEditModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit ROI Rate
                  </button>
                  <button
                    className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                    onClick={() => {
                      downloadAllClientROICSV(roiHistory, { fullName: clientName, clientCode });
                      addToast('All CSV statements downloaded', 'success', 'Download Complete');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    CSV (All)
                  </button>
                  <button
                    className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                    onClick={() => {
                      downloadAllClientROIPDF(roiHistory, { fullName: clientName, clientCode });
                      addToast('All PDF statements generated', 'success', 'Download Complete');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    PDF (All)
                  </button>
                </div>
              </div>

              <div className="kfpl-table-scroll">
                <table className="kfpl-table">
                  <thead>
                    <tr>
                      <th>Payout Month</th>
                      <th>ROI Rate</th>
                      <th>Payout Amount</th>
                      <th>Payout Status</th>
                      <th>Processed Date</th>
                      <th style={{ textAlign: 'center' }}>Download Statement</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
                          No ROI payout records found for this client.
                        </td>
                      </tr>
                    ) : (
                      roiHistory.map((roi, idx) => (
                        <tr key={roi._id || idx}>
                          <td className="kfpl-table-cell-primary">{roi.payoutMonth || roi.month}</td>
                          <td><strong>{roi.roiRate || `${localRoiPercentage}%`}</strong></td>
                          <td className="font-semibold">{formatCurrency(roi.amount)}</td>
                          <td><Badge status={(roi.status || '').toLowerCase()}>{roi.status}</Badge></td>
                          <td>{roi.processedDate || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                                onClick={() => {
                                  downloadClientROISingleCSV(roi, { fullName: clientName, clientCode });
                                  addToast(`Statement CSV downloaded for ${roi.payoutMonth || roi.month}`, 'success', 'Downloaded');
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px' }}
                                title="Download CSV"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
                                </svg>
                                CSV
                              </button>
                              <button
                                className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                                onClick={() => {
                                  downloadClientROISinglePDF(roi, { fullName: clientName, clientCode }, investmentsList);
                                  addToast(`Statement PDF generated for ${roi.payoutMonth || roi.month}`, 'success', 'Downloaded');
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px' }}
                                title="Download PDF"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
                                </svg>
                                PDF
                              </button>
                            </div>
                          </td>
                          <td>
                            {(roi.status || '').toUpperCase() === 'PENDING' && (
                              <button
                                className="kfpl-btn kfpl-btn--success kfpl-btn--sm"
                                style={{ background: '#10B981', borderColor: 'transparent', color: 'var(--color-white)' }}
                                onClick={() => addToast(`ROI payout of ${formatCurrency(roi.amount)} for ${roi.payoutMonth || roi.month} marked as paid`, 'success', 'ROI Paid')}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" style={{ marginRight: '4px' }}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'perks' && (
        tabLoading && !perksData ? <TabSpinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="kfpl-page-header" style={{ marginBottom: '4px' }}>
              <div>
                <h3 className="kfpl-form-card-title" style={{ margin: 0 }}>Assigned Loyalty Perks</h3>
                <p className="kfpl-page-subtitle" style={{ margin: '2px 0 0 0' }}>Client benefits based on their {tier.toUpperCase()} recognition tier</p>
              </div>
            </div>

            {perksList.length === 0 ? (
              <div className="kfpl-detail-info-card">
                <div className="kfpl-empty" style={{ padding: '40px' }}>
                  <div className="kfpl-empty-title">No perks assigned</div>
                  <div className="kfpl-empty-text">Upgrade client recognition tier or assign custom perks.</div>
                </div>
              </div>
            ) : (
              <div className="kfpl-perks-grid">
                {perksList.map((perk, i) => {
                  // Support both API format (object with title/description) and legacy format (string name)
                  const perkTitle = typeof perk === 'string' ? perk : (perk.title || '');
                  const perkDesc = typeof perk === 'string'
                    ? (perkDetails[perk]?.desc || 'Assigned platform benefit and VIP privileges.')
                    : (perk.description || perkDetails[perkTitle]?.desc || 'Assigned platform benefit and VIP privileges.');
                  const perkBadge = typeof perk === 'string' ? tier : (perk.badge || tier);
                  const perkIcon = typeof perk === 'string'
                    ? (perkDetails[perk]?.icon || '⭐')
                    : (perkIconMap[perk.icon] || perkDetails[perkTitle]?.icon || '⭐');

                  return (
                    <div key={i} className="kfpl-perk-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="kfpl-perk-tier-stripe" style={{ background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)' }} />
                      <div className="kfpl-perk-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
                        <div className="kfpl-perk-icon-wrap" style={{ background: 'var(--color-gold-light)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                          <span style={{ fontSize: '1.25rem' }}>{perkIcon}</span>
                        </div>
                        <Badge status={perkBadge}>{(typeof perkBadge === 'string' ? perkBadge : tier).toUpperCase()}</Badge>
                      </div>
                      <div className="kfpl-perk-card-body" style={{ flex: 1, padding: '16px 20px' }}>
                        <h4 className="kfpl-perk-card-title" style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>{perkTitle}</h4>
                        <p className="kfpl-perk-card-desc" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                          {perkDesc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {activeTab === 'documents' && (
        tabLoading && !docsData ? <TabSpinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="kfpl-page-header" style={{ marginBottom: '4px' }}>
              <div>
                <h3 className="kfpl-form-card-title" style={{ margin: 0 }}>Onboarded Documents</h3>
                <p className="kfpl-page-subtitle" style={{ margin: '2px 0 0 0' }}>KYC, financial verification, agreement, and nominee documents</p>
              </div>
            </div>

            <div className="kfpl-detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {documentsList.length === 0 ? (
                // Fallback: show standard document placeholders
                [
                  { key: 'panDocument', name: 'PAN Card Upload', description: 'Proof of PAN Card Identification' },
                  { key: 'aadhaarDocument', name: 'Aadhaar Card Upload', description: 'Proof of Identity and Address' },
                  { key: 'bankProofDocument', name: 'Bank Details Document', description: 'Cancelled Cheque or Bank Statement' },
                  { key: 'nomineeProofDocument', name: 'Nominee ID Proof', description: 'ID Proof for Nominee' },
                  { key: 'agreementDocument', name: 'Agreement Document', description: 'Signed Investment Agreement Contract' }
                ].map((doc, idx) => (
                  <div key={idx} className="kfpl-detail-info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', minHeight: '160px', position: 'relative' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ background: 'var(--color-gold-glow, #fef3c7)', color: 'var(--color-gold-dark, #b38600)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{doc.name}</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>No file uploaded</span>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        {doc.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                documentsList.map((doc, idx) => (
                  <div key={idx} className="kfpl-detail-info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', minHeight: '160px', position: 'relative' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ background: 'var(--color-gold-glow, #fef3c7)', color: 'var(--color-gold-dark, #b38600)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{doc.name}</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>PDF Document • {doc.fileSize || '—'}</span>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        {doc.description || 'Uploaded document'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px', marginTop: '12px' }}>
                      <button 
                        className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" 
                        style={{ flex: 1, fontSize: '0.78rem', padding: '6px 0' }}
                        onClick={() => setViewingDoc({
                          label: doc.name,
                          filename: doc.fileName || `${clientName.replace(/\s/g, '_')}_${doc.key || 'doc'}.pdf`,
                          size: doc.fileSize || '—',
                          investorName: clientName,
                          status: doc.status || 'Uploaded',
                          uploadedAt: doc.uploadedDate || doc.uploaded || formatDate(profile.joinDate || profile.createdAt),
                          url: doc.url,
                          verification: doc.verification || '—',
                        })}
                      >
                        View Document
                      </button>
                      <button 
                        className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm" 
                        style={{ padding: '6px 10px' }}
                        onClick={() => {
                          if (doc.url) {
                            window.open(doc.url, '_blank');
                          } else {
                            addToast('No file URL available for download', 'error', 'Download Failed');
                          }
                          addToast(`${doc.name} download initiated`, 'success', 'Downloaded');
                        }}
                        title="Download File"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}

      {/* ── Document Viewer Modal ─── */}
      {viewingDoc && createPortal(
        <div
          className="kfpl-modal-overlay"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="kfpl-modal"
            style={{ maxWidth: '680px', width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="kfpl-modal-header">
              <h3 className="kfpl-modal-title">{viewingDoc.label}</h3>
              <button className="kfpl-modal-close" onClick={() => setViewingDoc(null)} aria-label="Close modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="kfpl-modal-body" style={{ background: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
              <div style={{
                background: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '12px',
                border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', padding: '24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, var(--color-gold) 0%, #0F766E 100%)' }} />
                
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-dark, #b38600)" strokeWidth="1.5" strokeLinecap="round" width="64" height="64" style={{ marginBottom: '16px', opacity: 0.85 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800 }}>{viewingDoc.label}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>{viewingDoc.filename}</span>
                
                <div style={{
                  width: '100%', background: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Holder:</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{viewingDoc.investorName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Status:</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{viewingDoc.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Verification:</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{viewingDoc.verification || 'Digital Signatures Valid'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Uploaded:</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{viewingDoc.uploadedAt}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', color: '#64748b', fontSize: '0.75rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>Secured PDF Document. Download to view raw scan.</span>
                </div>
              </div>
            </div>
            <div className="kfpl-modal-footer">
              <button
                className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                onClick={() => setViewingDoc(null)}
              >Close</button>
              <button
                className="kfpl-btn kfpl-btn--primary kfpl-btn--sm"
                onClick={() => {
                  if (viewingDoc.url) {
                    window.open(viewingDoc.url, '_blank');
                  } else {
                    addToast('No file URL available', 'error', 'Download Failed');
                  }
                  addToast(`${viewingDoc.label} download initiated`, 'success', 'Downloaded');
                  setViewingDoc(null);
                }}
              >Download Original File</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit ROI Modal Wizard */}
      <Modal
        isOpen={showRoiEditModal}
        onClose={() => {
          setShowRoiEditModal(false);
          setRoiEditStep(1);
        }}
        title={roiEditStep === 1 ? "Confirm Rate Adjustment" : "Edit Monthly ROI Rate"}
        footer={
          roiEditStep === 1 ? (
            <>
              <button 
                className="kfpl-btn kfpl-btn--ghost" 
                onClick={() => setShowRoiEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="kfpl-btn kfpl-btn--primary" 
                onClick={() => setRoiEditStep(2)}
              >
                Yes, Proceed
              </button>
            </>
          ) : (
            <>
              <button 
                className="kfpl-btn kfpl-btn--ghost" 
                onClick={() => setRoiEditStep(1)}
              >
                Back
              </button>
              <button 
                className="kfpl-btn kfpl-btn--primary" 
                onClick={handleConfirmRoiChange}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Confirm Rate'}
              </button>
            </>
          )
        }
      >
        {roiEditStep === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: '1.4' }}>
                Are you sure you want to adjust the Monthly ROI rate for <strong>{clientName}</strong>? 
                This will update their profile and affect all subsequent monthly ROI payouts.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Specify the new Monthly ROI Rate (% p.m.) for <strong>{clientName}</strong> below:
            </p>
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Monthly ROI Percentage (% p.m.) <span className="required">*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="kfpl-input"
                  value={roiInputVal}
                  onChange={(e) => setRoiInputVal(e.target.value)}
                  placeholder="e.g. 1.5"
                  style={{ flex: 1 }}
                  required
                />
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>% p.m.</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============ END: InvestorDetail.jsx ============ */

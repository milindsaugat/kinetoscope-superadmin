/* ============================================================
   Page: InvestmentOverview.jsx
   Description: Investment module with allocation chart, ROI table, calculator, dividend bonus
   ============================================================ */

import { useState, useEffect } from 'react';
import { mockInvestments, mockROIHistory, mockTotalInvested, mockDividendBonus, mockClient } from '../../data/mockData';

const CHART_COLORS = ['#10B981', '#0F766E', '#2563EB', '#F59E0B', '#7C3AED', '#0891B2'];

/* ── helpers for downloading statements ─────────────────────── */
function downloadClientROISingleCSV(roi, client) {
  const rows = [
    ['ROI Payout Statement'],
    ['Client Name', client.name],
    ['Client ID', client.clientId],
    ['Period / Month', roi.month],
    ['Payout Date', new Date(roi.date).toLocaleDateString('en-IN')],
    ['Expected Return', `₹${roi.expected}`],
    ['Received Return', `₹${roi.received}`],
    ['Status', roi.status],
  ];
  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ROI_Statement_${roi.month.replace(/\s/g, '_')}_${client.name.replace(/\s/g, '_')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadClientROISinglePDF(roi, client, investments) {
  const dateStr = new Date(roi.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const activeSegments = investments.filter(inv => {
    const invDate = new Date(inv.date);
    const roiMonthName = roi.month.split(' ')[0];
    const roiYear = parseInt(roi.month.split(' ')[1]);
    const monthsMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const roiMonthIndex = monthsMap[roiMonthName];
    if (roiMonthIndex === undefined) return true;
    const targetDate = new Date(roiYear, roiMonthIndex, 28);
    return invDate <= targetDate;
  });

  const rowsHtml = activeSegments.map(inv => {
    const monthlyROI = Math.round((inv.amount * inv.roiAllocated) / 100);
    return `
      <tr>
        <td style="border: 1px solid #CFDDD5; padding: 10px; font-weight: 500;">${inv.segment}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center;">${new Date(inv.date).toLocaleDateString('en-IN')}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center;">${inv.contractPeriod}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right; font-weight: 600;">₹${inv.amount.toLocaleString('en-IN')}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right;">${inv.roiAllocated}%</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right; font-weight: bold; color: #0F766E;">₹${monthlyROI.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <html>
    <head>
      <title>ROI Payout Statement - ${roi.month} - ${client.name}</title>
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
            <span class="meta-val">${client.name}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Client ID:</span>
            <span class="meta-val">${client.clientId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Period:</span>
            <span class="meta-val">${roi.month}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Payout Date:</span>
            <span class="meta-val">${dateStr}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status:</span>
            <span class="meta-val" style="color: ${roi.status === 'Paid' ? '#059669' : '#D97706'};">${roi.status.toUpperCase()}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Expected Amount:</span>
            <span class="meta-val">₹${roi.expected.toLocaleString('en-IN')}</span>
          </div>
          <div class="meta-item" style="grid-column: span 2; border-bottom: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #CFDDD5;">
            <span class="meta-label" style="font-size: 16px; color: #061D13;">Total ROI Received:</span>
            <span class="meta-val" style="font-size: 20px; color: #059669;">₹${roi.received.toLocaleString('en-IN')}</span>
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
            <th style="text-align: right;">Allocated ROI %</th>
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
  const rows = [
    ['Client ROI Statement History'],
    ['Client Name', client.name],
    ['Client ID', client.clientId],
    [''],
    ['Month', 'Expected ROI', 'Received ROI', 'Payment Date', 'Status']
  ];
  roiList.forEach(roi => {
    rows.push([
      roi.month,
      roi.expected,
      roi.received,
      roi.date,
      roi.status
    ]);
  });
  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ROI_Statement_All_${client.name.replace(/\s/g, '_')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadAllClientROIPDF(roiList, client) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  const totalExpected = roiList.reduce((sum, r) => sum + r.expected, 0);
  const totalReceived = roiList.reduce((sum, r) => sum + r.received, 0);

  const rowsHtml = roiList.map(roi => {
    return `
      <tr>
        <td style="border: 1px solid #CFDDD5; padding: 10px; font-weight: 500;">${roi.month}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right;">₹${roi.expected.toLocaleString('en-IN')}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: right; font-weight: bold; color: ${roi.received > 0 ? '#059669' : '#11221A'};">₹${roi.received.toLocaleString('en-IN')}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center;">${new Date(roi.date).toLocaleDateString('en-IN')}</td>
        <td style="border: 1px solid #CFDDD5; padding: 10px; text-align: center; color: ${roi.status === 'Paid' ? '#059669' : '#D97706'}; font-weight: 600;">${roi.status}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <html>
    <head>
      <title>ROI Statement History - ${client.name}</title>
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
            <span class="meta-val">${client.name}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Client ID:</span>
            <span class="meta-val">${client.clientId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total Expected ROI:</span>
            <span class="meta-val">₹${totalExpected.toLocaleString('en-IN')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total Received ROI:</span>
            <span class="meta-val" style="color: #059669;">₹${totalReceived.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      
      <div class="section-title">ROI Payment Log</div>
      <table class="table">
        <thead>
          <tr>
            <th>Month / Period</th>
            <th style="text-align: right;">Expected ROI</th>
            <th style="text-align: right;">Received ROI</th>
            <th style="text-align: center;">Payment Date</th>
            <th style="text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="total-row">
            <td style="text-align: left; font-weight: 800; font-size: 14px; padding: 12px;">Total Summary</td>
            <td style="text-align: right; font-weight: 800; font-size: 14px; padding: 12px;">₹${totalExpected.toLocaleString('en-IN')}</td>
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

export default function InvestmentOverview() {
  const [roiFilter, setRoiFilter] = useState('All');
  const [calcPrincipal, setCalcPrincipal] = useState(6000000);
  const [calcRate, setCalcRate] = useState(1.2);
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [clientDividends, setClientDividends] = useState([]);

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem('kfpl_project_dividends');
      if (stored) {
        try {
          const allDividends = JSON.parse(stored);
          const myDividends = allDividends.filter(
            div => String(div.clientId).toUpperCase() === String(mockClient.clientId).toUpperCase()
          );
          setClientDividends(myDividends);
        } catch (e) {
          console.error('Error parsing dividends:', e);
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
        localStorage.setItem('kfpl_project_dividends', JSON.stringify(defaultDivs));
        const myDividends = defaultDivs.filter(
          div => String(div.clientId).toUpperCase() === String(mockClient.clientId).toUpperCase()
        );
        setClientDividends(myDividends);
      }
    };

    handleUpdate();
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, [mockClient.clientId]);

  const uniqueSegments = Array.from(new Set(mockInvestments.map(i => i.segment)));
  const uniqueStatuses = Array.from(new Set(mockInvestments.map(i => i.status)));
  const uniqueYears = Array.from(new Set(mockROIHistory.map(r => new Date(r.date).getFullYear().toString()))).sort();

  const filteredInvestments = mockInvestments.filter(inv => {
    if (segmentFilter !== 'all' && inv.segment !== segmentFilter) return false;
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    return true;
  });



  const formatAmount = (num) => {
    if (num >= 10000000) return `\u20B9${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `\u20B9${(num / 100000).toFixed(1)} L`;
    return `\u20B9${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const total = mockInvestments.reduce((sum, investment) => sum + investment.amount, 0);
  const monthlyReturn = Math.round((calcPrincipal * calcRate) / 100);
  const annualReturn = Math.round(monthlyReturn * 12);
  const weightedROI = total
    ? mockInvestments.reduce((sum, investment) => sum + investment.amount * investment.roiAllocated, 0) / total
    : 0;
  const receivedROI = mockROIHistory.reduce((sum, roi) => sum + roi.received, 0);
  const paidMonths = mockROIHistory.filter(roi => roi.status === 'Paid').length;

  let cumulativePercent = 0;
  const segments = mockInvestments.map((investment, index) => {
    const percent = (investment.amount / total) * 100;
    const start = cumulativePercent;
    cumulativePercent += percent;

    return {
      ...investment,
      percent,
      dashArray: `${percent * 2.51327} ${251.327 - percent * 2.51327}`,
      dashOffset: -(start * 2.51327),
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  const filteredROI = mockROIHistory.filter(roi => {
    if (roiFilter !== 'All' && roi.status !== roiFilter) return false;
    if (yearFilter !== 'all') {
      const year = new Date(roi.date).getFullYear().toString();
      if (year !== yearFilter) return false;
    }
    return true;
  });
  const summaryCards = [
    { label: 'Total Invested', value: formatAmount(mockTotalInvested), meta: `${mockInvestments.length} active segments` },
    { label: 'Monthly ROI', value: formatAmount(monthlyReturn), meta: `${calcRate}% annual projection` },
    { label: 'Weighted ROI', value: `${weightedROI.toFixed(1)}%`, meta: 'Allocated across portfolio' },
    { label: 'ROI Received', value: formatAmount(receivedROI), meta: `${paidMonths} payouts completed` },
  ];

  const handleDownloadAllCSV = () => {
    downloadAllClientROICSV(mockROIHistory, mockClient);
  };

  const handleDownloadAllPDF = () => {
    downloadAllClientROIPDF(mockROIHistory, mockClient);
  };

  const handleDownloadSingleCSV = (roi) => {
    downloadClientROISingleCSV(roi, mockClient);
  };

  const handleDownloadSinglePDF = (roi) => {
    downloadClientROISinglePDF(roi, mockClient, mockInvestments);
  };

  return (
    <div className="kfpl-page kfpl-investment-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h1 className="kfpl-page-title">Your Investment</h1>
          <p className="kfpl-page-subtitle">Track your investment allocation, ROI, and bonuses</p>
        </div>
      </div>

      <section className="kfpl-investment-summary" aria-label="Investment summary">
        {summaryCards.map(card => (
          <div key={card.label} className="kfpl-investment-summary-card">
            <span className="kfpl-investment-summary-label">{card.label}</span>
            <strong className="kfpl-investment-summary-value">{card.value}</strong>
            <span className="kfpl-investment-summary-meta">{card.meta}</span>
          </div>
        ))}
      </section>

      <div className="kfpl-investment-analytics">
        <div className="kfpl-chart-card kfpl-investment-card kfpl-investment-allocation-card">
          <div className="kfpl-chart-card-header">
            <div>
              <h3 className="kfpl-chart-card-title">Segment Allocation</h3>
              <p className="kfpl-investment-card-subtitle">Portfolio split by active investment category</p>
            </div>
            <span className="kfpl-investment-total">{formatAmount(total)}</span>
          </div>

          <div className="kfpl-donut-container">
            <div className="kfpl-donut-chart">
              <svg viewBox="0 0 100 100" role="img" aria-label="Investment segment allocation chart">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-surface-alt)" strokeWidth="16" />
                {segments.map((segment, index) => (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="16"
                    strokeDasharray={segment.dashArray}
                    strokeDashoffset={segment.dashOffset}
                    className="kfpl-investment-donut-segment"
                  />
                ))}
              </svg>

              <div className="kfpl-donut-center">
                <div className="kfpl-donut-center-value">{mockInvestments.length}</div>
                <div className="kfpl-donut-center-label">Segments</div>
              </div>
            </div>

            <div className="kfpl-investment-legend">
              {segments.map((segment, index) => (
                <div key={index} className="kfpl-investment-legend-item">
                  <div className="kfpl-chart-legend-dot" style={{ background: segment.color }}></div>
                  <div className="kfpl-investment-legend-copy">
                    <span className="kfpl-chart-legend-label">{segment.segment}</span>
                    <span className="kfpl-investment-legend-amount">{formatAmount(segment.amount)}</span>
                  </div>
                  <span className="kfpl-chart-legend-value">{segment.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="kfpl-calculator kfpl-investment-card">
          <div className="kfpl-investment-card-heading">
            <h3 className="kfpl-chart-card-title">ROI Calculator</h3>
            <p className="kfpl-investment-card-subtitle">Estimate projected returns from any principal amount</p>
          </div>

          <div className="kfpl-form-section kfpl-investment-calculator-fields">
            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Principal Amount (₹)</label>
              <input
                type="number"
                className="kfpl-input"
                value={calcPrincipal}
                onChange={event => setCalcPrincipal(Number(event.target.value))}
              />
            </div>

            <div className="kfpl-input-group">
              <label className="kfpl-input-label">Monthly ROI %</label>
              <input
                type="number"
                className="kfpl-input"
                value={calcRate}
                onChange={event => setCalcRate(Number(event.target.value))}
                step="0.5"
              />
            </div>
          </div>

          <div className="kfpl-calculator-result">
            <div className="kfpl-calculator-result-label">Monthly Returns</div>
            <div className="kfpl-calculator-result-value">{formatAmount(monthlyReturn)}</div>
            <div className="kfpl-calculator-result-label kfpl-calculator-result-note">
              Annual Returns: {formatAmount(annualReturn)}
            </div>
          </div>
        </div>
      </div>

      <div className="kfpl-table-wrapper kfpl-investment-table">
        <div className="kfpl-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="kfpl-table-title">Investment by Segment</h3>
            <p className="kfpl-investment-card-subtitle">Contract status, allocation, and received ROI by category</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={segmentFilter}
              onChange={e => setSegmentFilter(e.target.value)}
              className="kfpl-select"
              style={{ width: '160px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <option value="all">All Segments</option>
              {uniqueSegments.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="kfpl-select"
              style={{ width: '140px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="kfpl-table-container">
          <table className="kfpl-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Contract</th>
                <th>ROI Allocated</th>
                <th>ROI Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map(investment => (
                <tr key={investment.id}>
                  <td className="kfpl-table-cell-primary">{investment.segment}</td>
                  <td className="kfpl-table-cell-mono">{formatAmount(investment.amount)}</td>
                  <td>{formatDate(investment.date)}</td>
                  <td>{investment.contractPeriod}</td>
                  <td><strong>{investment.roiAllocated}%</strong></td>
                  <td className="kfpl-investment-positive">{investment.roiReceived}%</td>
                  <td><span className="kfpl-badge kfpl-badge--active">{investment.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="kfpl-table-wrapper kfpl-investment-table">
        <div className="kfpl-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="kfpl-table-title">Monthly ROI History</h3>
            <p className="kfpl-investment-card-subtitle">Expected versus credited return history</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="kfpl-filter-chips" style={{ marginBottom: 0 }}>
              {['All', 'Paid', 'Pending'].map(filter => (
                <button
                  key={filter}
                  type="button"
                  className={`kfpl-filter-chip ${roiFilter === filter ? 'active' : ''}`}
                  onClick={() => setRoiFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="kfpl-select"
              style={{ width: '120px', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <option value="all">All Years</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            
            <button
              className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
              onClick={handleDownloadAllCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV (All)
            </button>

            <button
              className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
              onClick={handleDownloadAllPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Print Statement (All)
            </button>
          </div>
        </div>

        <div className="kfpl-table-container">
          <table className="kfpl-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Expected</th>
                <th>Received</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Statement</th>
              </tr>
            </thead>
            <tbody>
              {filteredROI.map((roi, index) => (
                <tr key={index}>
                  <td className="kfpl-table-cell-primary">{roi.month}</td>
                  <td className="kfpl-table-cell-mono">{formatAmount(roi.expected)}</td>
                  <td className="kfpl-table-cell-mono">{roi.received > 0 ? formatAmount(roi.received) : '\u2014'}</td>
                  <td>{formatDate(roi.date)}</td>
                  <td><span className={`kfpl-badge kfpl-badge--${roi.status.toLowerCase()}`}>{roi.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                        onClick={() => handleDownloadSingleCSV(roi)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-border)' }}
                        title="Download CSV"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
                        </svg>
                        CSV
                      </button>
                      <button
                        className="kfpl-btn kfpl-btn--ghost kfpl-btn--sm"
                        onClick={() => handleDownloadSinglePDF(roi)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-border)' }}
                        title="Print / PDF"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
                        </svg>
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Dynamic Dividend Earnings Section */}
      <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px 0' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, color: 'var(--color-gold-dark)' }}>
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Dividend & Bonus Earnings
        </h3>
        
        {clientDividends.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.42)', border: '1px dashed var(--color-border)', borderRadius: '12px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No dividends credited yet for your active investments.
          </div>
        ) : (
          clientDividends.map(div => (
            <div className="kfpl-dividend-card" key={div.id}>
              <div className="kfpl-dividend-card-icon" aria-hidden="true" style={{ color: 'var(--color-gold-dark)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="kfpl-dividend-card-content">
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 4px 0' }}>
                  <span>Dividend Bonus Credited</span>
                  <span style={{ color: 'var(--color-success)', fontSize: '1.05rem', fontWeight: 800 }}>+{formatAmount(div.amount)}</span>
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                  Received from <strong>{div.projectName}</strong> ({div.segment})
                </p>
                <p className="kfpl-dividend-card-note" style={{ marginTop: '6px', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  Credited on {new Date(div.creditDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {div.adminNote && ` — ${div.adminNote}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ============ END: InvestmentOverview.jsx ============ */

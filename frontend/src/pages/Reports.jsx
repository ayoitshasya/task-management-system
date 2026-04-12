// Reports.jsx - Date range picker that triggers a PDF download
import React, { useState } from 'react';
import api from '../api/axios';
import '../styles/Reports.css';

const Reports = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');

    if (!from || !to) {
      setError('Please select both From and To dates');
      return;
    }

    if (from > to) {
      setError('"From" date must be before "To" date');
      return;
    }

    setLoading(true);

    try {
      // Request the PDF as a binary blob
      const res = await api.get(`/reports?from=${from}&to=${to}`, {
        responseType: 'blob'
      });

      // Create a temporary URL and click it to trigger browser download
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `task-report-${from}-to-${to}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <h2>Generate Report</h2>
      <p className="subtitle">Select a date range to download a PDF report of tasks.</p>

      <div className="report-form">
        <div className="form-group">
          <label>From Date</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>To Date</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Download PDF Report'}
        </button>
      </div>
    </div>
  );
};

export default Reports;

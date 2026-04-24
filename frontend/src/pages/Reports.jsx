import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Users, Clock, DollarSign, Shield, Calendar } from 'lucide-react';

const fmtMoney = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [labor, setLabor] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/reports/dashboard').then(r => r.json()).catch(() => null),
      apiFetch('/api/reports/labor-costs').then(r => r.json()).catch(() => null),
      apiFetch('/api/reports/attendance').then(r => r.json()).catch(() => null),
    ]).then(([d, l, a]) => {
      setDashboard(d);
      setLabor(l);
      setAttendance(a);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      <div className="page-header"><h2>Reports</h2></div>
      <div className="page-body"><div className="loading-container"><div className="spinner"></div> Loading...</div></div>
    </>
  );

  return (
    <>
      <div className="page-header"><h2>Reports & Analytics</h2></div>
      <div className="page-body">
        {/* Dashboard Stats */}
        {dashboard && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Overview</h3>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card"><div className="stat-icon blue"><Users size={24} /></div><div className="stat-info"><h3>{dashboard.total_employees ?? dashboard.totalEmployees ?? '-'}</h3><p>Total Employees</p></div></div>
              <div className="stat-card"><div className="stat-icon green"><Clock size={24} /></div><div className="stat-info"><h3>{dashboard.todays_shifts ?? dashboard.todaysShifts ?? '-'}</h3><p>Today's Shifts</p></div></div>
              <div className="stat-card"><div className="stat-icon yellow"><Calendar size={24} /></div><div className="stat-info"><h3>{dashboard.pending_requests ?? dashboard.pendingRequests ?? '-'}</h3><p>Pending Requests</p></div></div>
              <div className="stat-card"><div className="stat-icon red"><Shield size={24} /></div><div className="stat-info"><h3>{dashboard.compliance_alerts ?? dashboard.complianceAlerts ?? '-'}</h3><p>Compliance Alerts</p></div></div>
            </div>
          </>
        )}

        <div className="reports-grid">
          {/* Labor Costs */}
          <div className="report-card">
            <div className="report-card-header"><DollarSign size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} /> Labor Costs</div>
            <div className="report-card-body">
              {labor ? (
                typeof labor === 'object' && !Array.isArray(labor) ? (
                  <div>
                    {Object.entries(labor).map(([key, val]) => (
                      <div key={key} className="detail-row">
                        <div className="detail-label">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                        <div className="detail-value" style={{ fontWeight: 600 }}>{typeof val === 'number' ? (key.includes('cost') || key.includes('pay') || key.includes('wage') ? fmtMoney(val) : val) : Array.isArray(val) ? `${val.length} records` : String(val)}</div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(labor) ? (
                  <table>
                    <thead><tr>{labor.length > 0 && Object.keys(labor[0]).slice(0, 5).map(k => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr></thead>
                    <tbody>{labor.slice(0, 10).map((row, i) => (
                      <tr key={i}>{Object.values(row).slice(0, 5).map((v, j) => <td key={j}>{typeof v === 'number' ? (v > 100 ? fmtMoney(v) : v) : String(v ?? '-')}</td>)}</tr>
                    ))}</tbody>
                  </table>
                ) : <p>{String(labor)}</p>
              ) : <p style={{ color: 'var(--text-secondary)' }}>No labor cost data available</p>}
            </div>
          </div>

          {/* Attendance */}
          <div className="report-card">
            <div className="report-card-header"><Clock size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} /> Attendance</div>
            <div className="report-card-body">
              {attendance ? (
                typeof attendance === 'object' && !Array.isArray(attendance) ? (
                  <div>
                    {Object.entries(attendance).map(([key, val]) => (
                      <div key={key} className="detail-row">
                        <div className="detail-label">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                        <div className="detail-value" style={{ fontWeight: 600 }}>{Array.isArray(val) ? `${val.length} records` : String(val ?? '-')}</div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(attendance) ? (
                  <table>
                    <thead><tr>{attendance.length > 0 && Object.keys(attendance[0]).slice(0, 5).map(k => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr></thead>
                    <tbody>{attendance.slice(0, 10).map((row, i) => (
                      <tr key={i}>{Object.values(row).slice(0, 5).map((v, j) => <td key={j}>{String(v ?? '-')}</td>)}</tr>
                    ))}</tbody>
                  </table>
                ) : <p>{String(attendance)}</p>
              ) : <p style={{ color: 'var(--text-secondary)' }}>No attendance data available</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

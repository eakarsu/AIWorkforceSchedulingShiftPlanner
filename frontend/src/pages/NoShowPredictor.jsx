import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { AlertTriangle, Phone, Bell, TrendingDown } from 'lucide-react';

// No-Show Risk Predictor - heuristic-based scoring of upcoming shifts
export default function NoShowPredictor() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [timeClock, setTimeClock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callouts, setCallouts] = useState(new Set());

  useEffect(() => {
    Promise.all([
      apiFetch('/api/shifts').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
      apiFetch('/api/time-clock').then(r => r.json()).catch(() => []),
    ]).then(([s, e, t]) => {
      setShifts(Array.isArray(s) ? s : []);
      setEmployees(Array.isArray(e) ? e : []);
      setTimeClock(Array.isArray(t) ? t : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Compute no-show risk based on past attendance / punctuality patterns
  const scoreShift = (shift) => {
    let risk = 20; // baseline
    const factors = [];
    // Past no-show count
    const empPunches = timeClock.filter(t => t.employee_id === shift.employee_id);
    const past = shifts.filter(s => s.employee_id === shift.employee_id && new Date(s.start_time) < new Date());
    if (past.length > 0) {
      const noShows = past.filter(s => s.status === 'no_show' || s.status === 'cancelled').length;
      const rate = (noShows / past.length) * 100;
      if (rate > 0) { risk += rate * 0.6; factors.push(`${rate.toFixed(0)}% past no-show rate`); }
    } else { factors.push('no history (new employee)'); risk += 15; }
    // Early-morning shift
    const hour = new Date(shift.start_time).getHours();
    if (hour < 6) { risk += 15; factors.push('early-morning shift'); }
    if (hour > 22) { risk += 10; factors.push('late-night shift'); }
    // Weekend
    const dow = new Date(shift.start_time).getDay();
    if (dow === 0 || dow === 6) { risk += 8; factors.push('weekend'); }
    // Recent late clock-ins
    const lateRecent = empPunches.filter(p => p.late === true || p.late_minutes > 5).length;
    if (lateRecent > 2) { risk += 10; factors.push(`${lateRecent} recent late punches`); }
    // Hours-out
    const hoursOut = (new Date(shift.start_time) - new Date()) / 3600000;
    if (hoursOut < 4 && hoursOut > 0) { risk += 5; factors.push('starts very soon'); }
    return { risk: Math.min(100, Math.max(0, risk)), factors };
  };

  const upcoming = shifts
    .filter(s => new Date(s.start_time) > new Date() && s.status !== 'cancelled')
    .map(s => ({ shift: s, ...scoreShift(s) }))
    .sort((a, b) => b.risk - a.risk);

  const highRisk = upcoming.filter(s => s.risk >= 50);

  const empName = (id) => { const e = employees.find(x => x.id == id); return e ? `${e.first_name} ${e.last_name}` : `#${id}`; };

  const sendCallout = async (shiftItem) => {
    try {
      await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: shiftItem.shift.employee_id,
          type: 'shift_reminder',
          title: 'Shift Reminder - Confirm Attendance',
          message: `Your shift on ${new Date(shiftItem.shift.start_time).toLocaleString()} is approaching. Please confirm.`,
          status: 'pending',
        }),
      });
      const next = new Set(callouts); next.add(shiftItem.shift.id); setCallouts(next);
    } catch { alert('Failed to send'); }
  };

  const riskColor = (r) => r >= 70 ? '#dc2626' : r >= 50 ? '#f59e0b' : r >= 30 ? '#3b82f6' : '#10b981';

  return (
    <>
      <div className="page-header"><h2>No-Show Predictor</h2></div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, background: '#fef2f2' }}>
            <div style={{ fontSize: 12, color: '#7f1d1d', fontWeight: 600 }}>HIGH RISK</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>{highRisk.length}</div>
            <div style={{ fontSize: 12, color: '#991b1b' }}>Upcoming shifts</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>TOTAL UPCOMING</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{upcoming.length}</div>
          </div>
          <div className="card" style={{ padding: 16, background: '#fffbeb' }}>
            <div style={{ fontSize: 12, color: '#78350f', fontWeight: 600 }}>AVG RISK</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>{upcoming.length ? (upcoming.reduce((a, b) => a + b.risk, 0) / upcoming.length).toFixed(0) : 0}%</div>
          </div>
          <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
            <div style={{ fontSize: 12, color: '#1e3a8a', fontWeight: 600 }}>CALLOUTS SENT</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>{callouts.size}</div>
          </div>
        </div>

        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Risk</th><th>Employee</th><th>Shift Start</th><th>Risk Factors</th><th>Action</th></tr></thead>
                <tbody>
                  {upcoming.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No upcoming shifts to predict</td></tr> :
                    upcoming.map(item => (
                      <tr key={item.shift.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${item.risk}%`, height: '100%', background: riskColor(item.risk) }} />
                            </div>
                            <span style={{ fontWeight: 700, color: riskColor(item.risk) }}>{item.risk.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td>{empName(item.shift.employee_id)}</td>
                        <td>{new Date(item.shift.start_time).toLocaleString()}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.factors.join(' • ')}</td>
                        <td>
                          {item.risk >= 50 ? (
                            callouts.has(item.shift.id) ? (
                              <span style={{ display: 'flex', gap: 4, color: '#10b981', alignItems: 'center', fontSize: 13 }}><Bell size={14} /> Sent</span>
                            ) : (
                              <button className="btn btn-primary" onClick={() => sendCallout(item)} style={{ padding: '4px 10px', fontSize: 12 }}>
                                <Phone size={12} /> Send Callout
                              </button>
                            )
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>monitor</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

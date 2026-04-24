import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { LogIn, LogOut, X, Clock, Users, Timer } from 'lucide-react';

export default function TimeClock() {
  const [entries, setEntries] = useState([]);
  const [activeEntries, setActiveEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClockIn, setShowClockIn] = useState(false);
  const [clockInForm, setClockInForm] = useState({ employee_id: '', location_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch(`/api/time-clock?date=${filterDate}`).then(r => r.json()),
      apiFetch('/api/time-clock/active').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
      apiFetch('/api/locations').then(r => r.json()),
    ]).then(([e, a, emp, loc]) => {
      setEntries(Array.isArray(e) ? e : []);
      setActiveEntries(Array.isArray(a) ? a : []);
      setEmployees(Array.isArray(emp) ? emp : []);
      setLocations(Array.isArray(loc) ? loc : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterDate]);

  const handleClockIn = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await apiFetch('/api/time-clock/clock-in', { method: 'POST', body: JSON.stringify(clockInForm) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to clock in'); }
      setShowClockIn(false); setClockInForm({ employee_id: '', location_id: '', notes: '' }); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleClockOut = async (id) => {
    try {
      const res = await apiFetch(`/api/time-clock/${id}/clock-out`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to clock out');
      load();
    } catch (err) { alert(err.message); }
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  const formatDuration = (clockIn) => {
    const diff = Date.now() - new Date(clockIn).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const totalHoursToday = entries.reduce((sum, e) => sum + parseFloat(e.total_hours || 0), 0);

  return (
    <>
      <div className="page-header"><h2>Time Clock</h2><button className="btn btn-primary" onClick={() => setShowClockIn(true)}><LogIn size={16} /> Clock In</button></div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#d1fae5', borderRadius: 12, padding: 12 }}><Users size={24} color="#10b981" /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>{activeEntries.length}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Currently Clocked In</div></div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#dbeafe', borderRadius: 12, padding: 12 }}><Clock size={24} color="#3b82f6" /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>{entries.length}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Entries Today</div></div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fef3c7', borderRadius: 12, padding: 12 }}><Timer size={24} color="#f59e0b" /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>{totalHoursToday.toFixed(1)}h</div><div style={{ color: '#6b7280', fontSize: 13 }}>Total Hours Today</div></div>
          </div>
        </div>

        {activeEntries.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Currently Working</div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Location</th><th>Clocked In At</th><th>Duration</th><th>Action</th></tr></thead>
                <tbody>
                  {activeEntries.map(entry => (
                    <tr key={entry.id}>
                      <td style={{ fontWeight: 600 }}>{entry.employee_first_name} {entry.employee_last_name}</td>
                      <td>{entry.location_name || '-'}</td>
                      <td>{formatTime(entry.clock_in)}</td>
                      <td><span className="badge green">{formatDuration(entry.clock_in)}</span></td>
                      <td><button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleClockOut(entry.id)}><LogOut size={12} /> Clock Out</button></td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Time Clock History</span>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db' }} />
          </div>
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Department</th><th>Location</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {entries.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No entries for this date</td></tr> :
                    entries.map(entry => (
                      <tr key={entry.id}>
                        <td style={{ fontWeight: 600 }}>{entry.employee_first_name} {entry.employee_last_name}</td>
                        <td>{entry.department || '-'}</td>
                        <td>{entry.location_name || '-'}</td>
                        <td>{formatTime(entry.clock_in)}</td>
                        <td>{formatTime(entry.clock_out)}</td>
                        <td>{entry.total_hours ? `${entry.total_hours}h` : '-'}</td>
                        <td><span className={`badge ${entry.status === 'clocked_in' ? 'green' : 'blue'}`}>{entry.status === 'clocked_in' ? 'Working' : 'Completed'}</span></td>
                      </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>

      {showClockIn && (
        <div className="modal-overlay" onClick={() => setShowClockIn(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Clock In Employee</h3><button className="modal-close" onClick={() => setShowClockIn(false)}><X size={16} /></button></div>
            <form onSubmit={handleClockIn}>
              <div className="modal-body">
                <div className="form-group"><label>Employee</label>
                  <select value={clockInForm.employee_id} onChange={e => setClockInForm({ ...clockInForm, employee_id: e.target.value })} required>
                    <option value="">Select Employee</option>
                    {employees.filter(e => e.status === 'active').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>))}
                  </select></div>
                <div className="form-group"><label>Location</label>
                  <select value={clockInForm.location_id} onChange={e => setClockInForm({ ...clockInForm, location_id: e.target.value })}>
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select></div>
                <div className="form-group"><label>Notes</label><input value={clockInForm.notes} onChange={e => setClockInForm({ ...clockInForm, notes: e.target.value })} placeholder="Optional notes" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowClockIn(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Clocking In...' : 'Clock In'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

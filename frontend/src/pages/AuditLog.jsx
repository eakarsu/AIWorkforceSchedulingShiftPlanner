import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Search, FileText, Activity } from 'lucide-react';

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', entity_type: '', user_name: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.action) params.set('action', filters.action);
    if (filters.entity_type) params.set('entity_type', filters.entity_type);
    if (filters.user_name) params.set('user_name', filters.user_name);

    Promise.all([
      apiFetch(`/api/audit-log?${params}`).then(r => r.json()),
      apiFetch('/api/audit-log/stats').then(r => r.json()),
    ]).then(([e, s]) => {
      setEntries(Array.isArray(e) ? e : []);
      setStats(s);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    load();
  };

  const actionColors = {
    create: 'green', update: 'blue', delete: 'red',
    login: 'purple', clock_in: 'green', clock_out: 'orange',
    approve: 'green', deny: 'red',
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="page-header"><h2>Audit Log</h2></div>
      <div className="page-body">
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#dbeafe', borderRadius: 12, padding: 12 }}><FileText size={24} color="#3b82f6" /></div>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Total Events</div></div>
            </div>
            <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#d1fae5', borderRadius: 12, padding: 12 }}><Activity size={24} color="#10b981" /></div>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.today}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Events Today</div></div>
            </div>
            <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#fef3c7', borderRadius: 12, padding: 12 }}><Search size={24} color="#f59e0b" /></div>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.recent_users?.length || 0}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Active Users (7d)</div></div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleFilter} style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 12 }}>Action</label>
              <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })}>
                <option value="">All Actions</option>
                <option value="create">Create</option><option value="update">Update</option><option value="delete">Delete</option>
                <option value="login">Login</option><option value="clock_in">Clock In</option><option value="clock_out">Clock Out</option>
                <option value="approve">Approve</option><option value="deny">Deny</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 12 }}>Entity Type</label>
              <select value={filters.entity_type} onChange={e => setFilters({ ...filters, entity_type: e.target.value })}>
                <option value="">All Types</option>
                <option value="employee">Employee</option><option value="shift">Shift</option><option value="location">Location</option>
                <option value="time_off">Time Off</option><option value="swap_request">Swap Request</option>
                <option value="payroll">Payroll</option><option value="department">Department</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 12 }}>User</label>
              <input value={filters.user_name} onChange={e => setFilters({ ...filters, user_name: e.target.value })} placeholder="Search by name" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 38 }}><Search size={14} /> Filter</button>
          </form>
        </div>

        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Time</th><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>User</th><th>Details</th></tr></thead>
                <tbody>
                  {entries.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No audit log entries found</td></tr> :
                    entries.map(entry => (
                      <tr key={entry.id}>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(entry.created_at)}</td>
                        <td><span className={`badge ${actionColors[entry.action] || 'gray'}`}>{entry.action}</span></td>
                        <td>{entry.entity_type}</td>
                        <td>{entry.entity_id || '-'}</td>
                        <td style={{ fontWeight: 500 }}>{entry.user_name || '-'}</td>
                        <td style={{ fontSize: 13, color: '#6b7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.details ? (typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)) : '-'}
                        </td>
                      </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>
    </>
  );
}

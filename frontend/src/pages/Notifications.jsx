import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2, CheckCircle } from 'lucide-react';

const fmtDt = (d) => d ? new Date(d).toLocaleString() : '-';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/notifications').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
    ]).then(([n, e]) => {
      setItems(Array.isArray(n) ? n : []);
      setEmployees(Array.isArray(e) ? e : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const empName = (id) => { const e = employees.find(x => x.id === id); return e ? `${e.first_name} ${e.last_name}` : `#${id}`; };

  const openCreate = () => { setForm({ employee_id: '', type: 'info', title: '', message: '' }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...form, employee_id: parseInt(form.employee_id) };
      const res = await apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const markRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify({ is_read: true }) });
      setSelected(null); load();
    } catch { alert('Failed to update'); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <>
      <div className="page-header"><h2>Notifications</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Type</th><th>Title</th><th>Message</th><th>Read</th><th>Date</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No notifications</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)} style={{ opacity: item.is_read ? 0.6 : 1 }}>
                        <td style={{ fontWeight: 600 }}>{empName(item.employee_id)}</td>
                        <td><span className={`badge ${item.type === 'alert' ? 'red' : item.type === 'warning' ? 'yellow' : 'blue'}`}>{item.type}</span></td>
                        <td style={{ fontWeight: 600 }}>{item.title || '-'}</td>
                        <td>{(item.message || '-').substring(0, 50)}</td>
                        <td><span className={`badge ${item.is_read ? 'green' : 'gray'}`}>{item.is_read ? 'Read' : 'Unread'}</span></td>
                        <td>{fmtDt(item.created_at)}</td>
                      </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Notification Details</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Employee', empName(selected.employee_id)], ['Type', selected.type], ['Title', selected.title || '-'],
                ['Message', selected.message || '-'], ['Read', selected.is_read ? 'Yes' : 'No'], ['Created', fmtDt(selected.created_at)]
              ].map(([l, v]) => (
                <div key={l} className="detail-row"><div className="detail-label">{l}</div><div className="detail-value">{v}</div></div>
              ))}
            </div>
            <div className="modal-footer">
              {!selected.is_read && <button className="btn btn-success" onClick={() => markRead(selected.id)}><CheckCircle size={14} /> Mark Read</button>}
              <button className="btn btn-danger" onClick={() => { setShowDelete(selected); setSelected(null); }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New Notification</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Employee</label>
                    <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
                      <option value="">Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select></div>
                  <div className="form-group"><label>Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="info">Info</option><option value="warning">Warning</option><option value="alert">Alert</option><option value="reminder">Reminder</option>
                    </select></div>
                </div>
                <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div className="form-group"><label>Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Send'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Delete</h3><button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button></div>
            <div className="modal-body"><p className="confirm-text">Delete this notification?</p></div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

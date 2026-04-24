import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

const fmtDt = (d) => d ? new Date(d).toLocaleString() : '-';

export default function Compliance() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/compliance').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
    ]).then(([c, e]) => {
      setItems(Array.isArray(c) ? c : []);
      setEmployees(Array.isArray(e) ? e : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const empName = (id) => { const e = employees.find(x => x.id === id); return e ? `${e.first_name} ${e.last_name}` : `#${id}`; };
  const statusClass = (s) => ({ resolved: 'green', open: 'yellow', flagged: 'red', pending: 'yellow' }[s] || 'gray');
  const severityClass = (s) => ({ low: 'blue', medium: 'yellow', high: 'red', critical: 'red' }[s] || 'gray');

  const blank = { employee_id: '', shift_id: '', type: '', description: '', severity: 'medium', status: 'open' };
  const openCreate = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ employee_id: item.employee_id || '', shift_id: item.shift_id || '', type: item.type || '', description: item.description || '', severity: item.severity || 'medium', status: item.status || 'open' });
    setEditItem(item); setShowForm(true); setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editItem ? `/api/compliance/${editItem.id}` : '/api/compliance';
      const body = { ...form, employee_id: parseInt(form.employee_id) || null, shift_id: parseInt(form.shift_id) || null };
      const res = await apiFetch(url, { method: editItem ? 'PUT' : 'POST', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/compliance/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <>
      <div className="page-header"><h2>Compliance</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Type</th><th>Description</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No compliance records</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td style={{ fontWeight: 600 }}>{empName(item.employee_id)}</td>
                        <td>{item.type || '-'}</td>
                        <td>{(item.description || '-').substring(0, 50)}</td>
                        <td><span className={`badge ${severityClass(item.severity)}`}>{item.severity}</span></td>
                        <td><span className={`badge ${statusClass(item.status)}`}>{item.status}</span></td>
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
            <div className="modal-header"><h3>Compliance Details</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Employee', empName(selected.employee_id)], ['Shift ID', selected.shift_id || '-'],
                ['Type', selected.type || '-'], ['Description', selected.description || '-'],
                ['Severity', selected.severity], ['Status', selected.status], ['Created', fmtDt(selected.created_at)]
              ].map(([l, v]) => (
                <div key={l} className="detail-row"><div className="detail-label">{l}</div>
                  <div className="detail-value">{l === 'Status' ? <span className={`badge ${statusClass(v)}`}>{v}</span> : l === 'Severity' ? <span className={`badge ${severityClass(v)}`}>{v}</span> : v}</div></div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => openEdit(selected)}><Edit2 size={14} /> Edit</button>
              <button className="btn btn-danger" onClick={() => { setShowDelete(selected); setSelected(null); }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? 'Edit Compliance' : 'Add Compliance'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Employee</label>
                    <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
                      <option value="">Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select></div>
                  <div className="form-group"><label>Shift ID (optional)</label><input type="number" value={form.shift_id} onChange={e => setForm({ ...form, shift_id: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Type</label><input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="e.g. overtime_violation, break_violation" required /></div>
                <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label>Severity</label>
                    <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                    </select></div>
                  <div className="form-group"><label>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="open">Open</option><option value="flagged">Flagged</option><option value="resolved">Resolved</option>
                    </select></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Delete</h3><button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button></div>
            <div className="modal-body"><p className="confirm-text">Delete this compliance record?</p></div>
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

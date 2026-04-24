import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

export default function Overtime() {
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
      apiFetch('/api/overtime').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
    ]).then(([o, e]) => {
      setItems(Array.isArray(o) ? o : []);
      setEmployees(Array.isArray(e) ? e : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const empName = (id) => { const e = employees.find(x => x.id === id); return e ? `${e.first_name} ${e.last_name}` : `#${id}`; };
  const statusClass = (s) => ({ approved: 'green', pending: 'yellow', denied: 'red' }[s] || 'gray');

  const blank = { employee_id: '', week_start: '', regular_hours: 40, overtime_hours: 0, double_time_hours: 0, status: 'pending' };
  const openCreate = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ employee_id: item.employee_id || '', week_start: item.week_start ? item.week_start.split('T')[0] : '', regular_hours: item.regular_hours || 0, overtime_hours: item.overtime_hours || 0, double_time_hours: item.double_time_hours || 0, status: item.status || 'pending' });
    setEditItem(item); setShowForm(true); setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editItem ? `/api/overtime/${editItem.id}` : '/api/overtime';
      const body = { ...form, employee_id: parseInt(form.employee_id), regular_hours: parseFloat(form.regular_hours), overtime_hours: parseFloat(form.overtime_hours), double_time_hours: parseFloat(form.double_time_hours) };
      const res = await apiFetch(url, { method: editItem ? 'PUT' : 'POST', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/overtime/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <>
      <div className="page-header"><h2>Overtime</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Week Start</th><th>Regular Hrs</th><th>OT Hours</th><th>Double Time</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No overtime records</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td style={{ fontWeight: 600 }}>{empName(item.employee_id)}</td>
                        <td>{fmtDate(item.week_start)}</td>
                        <td>{item.regular_hours}</td><td>{item.overtime_hours}</td><td>{item.double_time_hours}</td>
                        <td><span className={`badge ${statusClass(item.status)}`}>{item.status}</span></td>
                      </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Overtime Details</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Employee', empName(selected.employee_id)], ['Week Start', fmtDate(selected.week_start)],
                ['Regular Hours', selected.regular_hours], ['Overtime Hours', selected.overtime_hours],
                ['Double Time Hours', selected.double_time_hours], ['Status', selected.status]
              ].map(([l, v]) => (
                <div key={l} className="detail-row"><div className="detail-label">{l}</div>
                  <div className="detail-value">{l === 'Status' ? <span className={`badge ${statusClass(v)}`}>{v}</span> : v}</div></div>
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
            <div className="modal-header"><h3>{editItem ? 'Edit Overtime' : 'Add Overtime'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Employee</label>
                    <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
                      <option value="">Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select></div>
                  <div className="form-group"><label>Week Start</label><input type="date" value={form.week_start} onChange={e => setForm({ ...form, week_start: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Regular Hours</label><input type="number" step="0.5" value={form.regular_hours} onChange={e => setForm({ ...form, regular_hours: e.target.value })} /></div>
                  <div className="form-group"><label>Overtime Hours</label><input type="number" step="0.5" value={form.overtime_hours} onChange={e => setForm({ ...form, overtime_hours: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Double Time Hours</label><input type="number" step="0.5" value={form.double_time_hours} onChange={e => setForm({ ...form, double_time_hours: e.target.value })} /></div>
                  <div className="form-group"><label>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="pending">Pending</option><option value="approved">Approved</option><option value="denied">Denied</option>
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
            <div className="modal-body"><p className="confirm-text">Delete this overtime record?</p></div>
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

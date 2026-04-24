import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

const fmtDt = (d) => d ? new Date(d).toLocaleString() : '-';

export default function Breaks() {
  const [items, setItems] = useState([]);
  const [shifts, setShifts] = useState([]);
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
      apiFetch('/api/breaks').then(r => r.json()),
      apiFetch('/api/shifts').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
    ]).then(([b, s, e]) => {
      setItems(Array.isArray(b) ? b : []);
      setShifts(Array.isArray(s) ? s : []);
      setEmployees(Array.isArray(e) ? e : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getShiftEmp = (shiftId) => {
    const s = shifts.find(x => x.id === shiftId);
    if (!s) return '-';
    const e = employees.find(x => x.id === s.employee_id);
    return e ? `${e.first_name} ${e.last_name}` : '-';
  };
  const getShiftDate = (shiftId) => { const s = shifts.find(x => x.id === shiftId); return s ? fmtDt(s.start_time) : '-'; };
  const statusClass = (s) => ({ completed: 'green', active: 'blue', scheduled: 'yellow', skipped: 'red' }[s] || 'gray');

  const blank = { shift_id: '', start_time: '', end_time: '', break_type: 'lunch', status: 'scheduled' };
  const openCreate = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ shift_id: item.shift_id || '', start_time: item.start_time ? item.start_time.slice(0, 16) : '', end_time: item.end_time ? item.end_time.slice(0, 16) : '', break_type: item.break_type || 'lunch', status: item.status || 'scheduled' });
    setEditItem(item); setShowForm(true); setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editItem ? `/api/breaks/${editItem.id}` : '/api/breaks';
      const body = { ...form, shift_id: parseInt(form.shift_id) };
      const res = await apiFetch(url, { method: editItem ? 'PUT' : 'POST', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/breaks/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <>
      <div className="page-header"><h2>Break Management</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Shift Date</th><th>Break Start</th><th>Break End</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No breaks found</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td style={{ fontWeight: 600 }}>{getShiftEmp(item.shift_id)}</td>
                        <td>{getShiftDate(item.shift_id)}</td>
                        <td>{fmtDt(item.start_time)}</td><td>{fmtDt(item.end_time)}</td>
                        <td>{item.break_type || '-'}</td>
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
            <div className="modal-header"><h3>Break Details</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Employee', getShiftEmp(selected.shift_id)], ['Shift Date', getShiftDate(selected.shift_id)],
                ['Start Time', fmtDt(selected.start_time)], ['End Time', fmtDt(selected.end_time)],
                ['Break Type', selected.break_type || '-'], ['Status', selected.status]
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
            <div className="modal-header"><h3>{editItem ? 'Edit Break' : 'Add Break'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label>Shift</label>
                  <select value={form.shift_id} onChange={e => setForm({ ...form, shift_id: e.target.value })} required>
                    <option value="">Select shift</option>
                    {shifts.map(s => <option key={s.id} value={s.id}>{getShiftEmp(s.id) || '#' + s.id} - {fmtDt(s.start_time)}</option>)}
                  </select></div>
                <div className="form-row">
                  <div className="form-group"><label>Start Time</label><input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required /></div>
                  <div className="form-group"><label>End Time</label><input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Break Type</label>
                    <select value={form.break_type} onChange={e => setForm({ ...form, break_type: e.target.value })}>
                      <option value="lunch">Lunch</option><option value="rest">Rest</option><option value="other">Other</option>
                    </select></div>
                  <div className="form-group"><label>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="scheduled">Scheduled</option><option value="active">Active</option><option value="completed">Completed</option><option value="skipped">Skipped</option>
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
            <div className="modal-body"><p className="confirm-text">Delete this break record?</p></div>
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

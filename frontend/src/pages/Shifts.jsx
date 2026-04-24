import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

const fmtDt = (d) => d ? new Date(d).toLocaleString() : '-';

export default function Shifts() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
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
      apiFetch('/api/shifts').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
      apiFetch('/api/locations').then(r => r.json()),
    ]).then(([s, e, l]) => {
      setItems(Array.isArray(s) ? s : []);
      setEmployees(Array.isArray(e) ? e : []);
      setLocations(Array.isArray(l) ? l : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const empName = (id) => { const e = employees.find(x => x.id === id); return e ? `${e.first_name} ${e.last_name}` : '-'; };
  const locName = (id) => locations.find(x => x.id === id)?.name || '-';
  const statusClass = (s) => ({ scheduled: 'blue', completed: 'green', cancelled: 'red', in_progress: 'yellow' }[s] || 'gray');

  const blank = { employee_id: '', location_id: '', start_time: '', end_time: '', break_duration: 30, shift_type: 'regular', status: 'scheduled', notes: '' };

  const openCreate = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({
      employee_id: item.employee_id || '', location_id: item.location_id || '',
      start_time: item.start_time ? item.start_time.slice(0, 16) : '',
      end_time: item.end_time ? item.end_time.slice(0, 16) : '',
      break_duration: item.break_duration || 30, shift_type: item.shift_type || 'regular',
      status: item.status || 'scheduled', notes: item.notes || '',
    });
    setEditItem(item); setShowForm(true); setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editItem ? `/api/shifts/${editItem.id}` : '/api/shifts';
      const method = editItem ? 'PUT' : 'POST';
      const body = { ...form, employee_id: parseInt(form.employee_id), location_id: parseInt(form.location_id), break_duration: parseInt(form.break_duration) };
      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/shifts/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <>
      <div className="page-header"><h2>Shifts</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Location</th><th>Start Time</th><th>End Time</th><th>Break</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No shifts found</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td style={{ fontWeight: 600 }}>{empName(item.employee_id)}</td>
                        <td>{locName(item.location_id)}</td>
                        <td>{fmtDt(item.start_time)}</td>
                        <td>{fmtDt(item.end_time)}</td>
                        <td>{item.break_duration || 0} min</td>
                        <td><span className={`badge ${item.shift_type === 'overtime' ? 'purple' : 'blue'}`}>{item.shift_type}</span></td>
                        <td><span className={`badge ${statusClass(item.status)}`}>{item.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Shift Details</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Employee', empName(selected.employee_id)], ['Location', locName(selected.location_id)],
                ['Start Time', fmtDt(selected.start_time)], ['End Time', fmtDt(selected.end_time)],
                ['Break Duration', `${selected.break_duration || 0} min`], ['Shift Type', selected.shift_type],
                ['Status', selected.status], ['Notes', selected.notes || '-']
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
            <div className="modal-header"><h3>{editItem ? 'Edit Shift' : 'Add Shift'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Employee</label>
                    <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
                      <option value="">Select employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select></div>
                  <div className="form-group"><label>Location</label>
                    <select value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })} required>
                      <option value="">Select location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Start Time</label><input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required /></div>
                  <div className="form-group"><label>End Time</label><input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Break (min)</label><input type="number" value={form.break_duration} onChange={e => setForm({ ...form, break_duration: e.target.value })} /></div>
                  <div className="form-group"><label>Shift Type</label>
                    <select value={form.shift_type} onChange={e => setForm({ ...form, shift_type: e.target.value })}>
                      <option value="regular">Regular</option><option value="overtime">Overtime</option><option value="holiday">Holiday</option>
                    </select></div>
                </div>
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select></div>
                <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
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
            <div className="modal-body"><p className="confirm-text">Are you sure you want to delete this shift?</p></div>
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

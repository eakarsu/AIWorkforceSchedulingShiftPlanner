import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2, Copy, Play } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ShiftTemplates() {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showApply, setShowApply] = useState(null);
  const [form, setForm] = useState({});
  const [applyForm, setApplyForm] = useState({ date: '', employee_ids: [] });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/shift-templates').then(r => r.json()),
      apiFetch('/api/locations').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
    ]).then(([t, l, e]) => {
      setItems(Array.isArray(t) ? t : []);
      setLocations(Array.isArray(l) ? l : []);
      setEmployees(Array.isArray(e) ? e : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const blank = { name: '', location_id: '', start_time: '09:00', end_time: '17:00', break_duration: 30, shift_type: 'regular', required_employees: 1, days_of_week: [], status: 'active' };
  const openCreate = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    let days = [];
    try { days = typeof item.days_of_week === 'string' ? JSON.parse(item.days_of_week) : (item.days_of_week || []); } catch {}
    setForm({
      name: item.name || '', location_id: item.location_id || '', start_time: item.start_time || '09:00', end_time: item.end_time || '17:00',
      break_duration: item.break_duration || 30, shift_type: item.shift_type || 'regular', required_employees: item.required_employees || 1,
      days_of_week: days, status: item.status || 'active'
    });
    setEditItem(item); setShowForm(true); setSelected(null);
  };

  const toggleDay = (dayIdx) => {
    const days = form.days_of_week || [];
    setForm({ ...form, days_of_week: days.includes(dayIdx) ? days.filter(d => d !== dayIdx) : [...days, dayIdx] });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, days_of_week: JSON.stringify(form.days_of_week || []) };
      const url = editItem ? `/api/shift-templates/${editItem.id}` : '/api/shift-templates';
      const res = await apiFetch(url, { method: editItem ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleApply = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await apiFetch(`/api/shift-templates/${showApply.id}/apply`, {
        method: 'POST', body: JSON.stringify(applyForm)
      });
      if (!res.ok) throw new Error('Failed to apply template');
      const data = await res.json();
      alert(data.message);
      setShowApply(null);
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/shift-templates/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  const toggleEmployee = (empId) => {
    const ids = applyForm.employee_ids;
    setApplyForm({ ...applyForm, employee_ids: ids.includes(empId) ? ids.filter(i => i !== empId) : [...ids, empId] });
  };

  const getDaysLabel = (days) => {
    try {
      const parsed = typeof days === 'string' ? JSON.parse(days) : (days || []);
      if (parsed.length === 0) return 'Not set';
      return parsed.map(d => DAYS[d]?.substring(0, 3)).join(', ');
    } catch { return 'Not set'; }
  };

  return (
    <>
      <div className="page-header"><h2>Shift Templates</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Template</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Location</th><th>Time</th><th>Type</th><th>Days</th><th>Staff Needed</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No shift templates found</td></tr> :
                    items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.location_name || '-'}</td>
                        <td>{item.start_time} - {item.end_time}</td>
                        <td><span className="badge blue">{item.shift_type}</span></td>
                        <td>{getDaysLabel(item.days_of_week)}</td>
                        <td>{item.required_employees}</td>
                        <td><span className={`badge ${item.status === 'active' ? 'green' : 'gray'}`}>{item.status}</span></td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => { setShowApply(item); setApplyForm({ date: '', employee_ids: [] }); }}><Play size={12} /> Apply</button>
                          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                          <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setShowDelete(item)}><Trash2 size={12} /></button>
                        </td>
                      </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? 'Edit Template' : 'Add Template'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label>Template Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>Location</label>
                  <select value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select></div>
                <div className="form-row">
                  <div className="form-group"><label>Start Time</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required /></div>
                  <div className="form-group"><label>End Time</label><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Break (min)</label><input type="number" value={form.break_duration} onChange={e => setForm({ ...form, break_duration: e.target.value })} /></div>
                  <div className="form-group"><label>Staff Required</label><input type="number" min="1" value={form.required_employees} onChange={e => setForm({ ...form, required_employees: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Shift Type</label>
                  <select value={form.shift_type} onChange={e => setForm({ ...form, shift_type: e.target.value })}>
                    <option value="regular">Regular</option><option value="overtime">Overtime</option><option value="holiday">Holiday</option><option value="night">Night</option>
                  </select></div>
                <div className="form-group"><label>Days of Week</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {DAYS.map((day, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 13,
                          background: (form.days_of_week || []).includes(i) ? '#3b82f6' : '#fff', color: (form.days_of_week || []).includes(i) ? '#fff' : '#374151' }}>
                        {day.substring(0, 3)}
                      </button>))}
                  </div></div>
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApply && (
        <div className="modal-overlay" onClick={() => setShowApply(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Apply Template: {showApply.name}</h3><button className="modal-close" onClick={() => setShowApply(null)}><X size={16} /></button></div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                <div className="form-group"><label>Date</label><input type="date" value={applyForm.date} onChange={e => setApplyForm({ ...applyForm, date: e.target.value })} required /></div>
                <div className="form-group"><label>Select Employees ({applyForm.employee_ids.length} selected)</label>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: 8, padding: 8 }}>
                    {employees.filter(e => e.status === 'active').map(emp => (
                      <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={applyForm.employee_ids.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} />
                        {emp.first_name} {emp.last_name} - {emp.position || emp.department || ''}
                      </label>))}
                  </div></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowApply(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || applyForm.employee_ids.length === 0}>{saving ? 'Creating...' : `Create ${applyForm.employee_ids.length} Shift(s)`}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Delete</h3><button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button></div>
            <div className="modal-body"><p className="confirm-text">Are you sure you want to delete template "{showDelete.name}"?</p></div>
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

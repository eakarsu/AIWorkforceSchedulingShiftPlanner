import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

export default function Employees() {
  const [items, setItems] = useState([]);
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
      apiFetch('/api/employees').then(r => r.json()),
      apiFetch('/api/locations').then(r => r.json())
    ]).then(([emp, loc]) => {
      setItems(Array.isArray(emp) ? emp : []);
      setLocations(Array.isArray(loc) ? loc : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ first_name: '', last_name: '', email: '', phone: '', position: '', department: '', hourly_rate: '', hire_date: '', location_id: '', status: 'active' });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      email: item.email || '',
      phone: item.phone || '',
      position: item.position || '',
      department: item.department || '',
      hourly_rate: item.hourly_rate || '',
      hire_date: item.hire_date ? item.hire_date.split('T')[0] : '',
      location_id: item.location_id || '',
      status: item.status || 'active',
    });
    setEditItem(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editItem ? `/api/employees/${editItem.id}` : '/api/employees';
      const method = editItem ? 'PUT' : 'POST';
      const body = { ...form, hourly_rate: parseFloat(form.hourly_rate) || 0, location_id: parseInt(form.location_id) || null };
      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
      setShowDelete(null);
      setSelected(null);
      load();
    } catch {
      alert('Failed to delete');
    }
  };

  const getLocName = (id) => locations.find(l => l.id === id)?.name || '-';
  const statusClass = (s) => s === 'active' ? 'green' : s === 'terminated' ? 'red' : 'gray';

  return (
    <>
      <div className="page-header">
        <h2>Employees</h2>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button>
      </div>
      <div className="page-body">
        <div className="card">
          {loading ? (
            <div className="loading-container"><div className="spinner"></div> Loading...</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Position</th><th>Department</th><th>Location</th><th>Hourly Rate</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No employees found</td></tr>
                  ) : items.map(item => (
                    <tr key={item.id} onClick={() => setSelected(item)}>
                      <td style={{ fontWeight: 600 }}>{item.first_name} {item.last_name}</td>
                      <td>{item.email}</td>
                      <td>{item.position || '-'}</td>
                      <td>{item.department || '-'}</td>
                      <td>{getLocName(item.location_id)}</td>
                      <td>${parseFloat(item.hourly_rate || 0).toFixed(2)}</td>
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
            <div className="modal-header">
              <h3>{selected.first_name} {selected.last_name}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {[
                ['First Name', selected.first_name],
                ['Last Name', selected.last_name],
                ['Email', selected.email],
                ['Phone', selected.phone || '-'],
                ['Position', selected.position || '-'],
                ['Department', selected.department || '-'],
                ['Hourly Rate', `$${parseFloat(selected.hourly_rate || 0).toFixed(2)}`],
                ['Hire Date', selected.hire_date ? new Date(selected.hire_date).toLocaleDateString() : '-'],
                ['Location', getLocName(selected.location_id)],
                ['Status', selected.status],
              ].map(([label, value]) => (
                <div key={label} className="detail-row">
                  <div className="detail-label">{label}</div>
                  <div className="detail-value">{label === 'Status' ? <span className={`badge ${statusClass(value)}`}>{value}</span> : value}</div>
                </div>
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
            <div className="modal-header">
              <h3>{editItem ? 'Edit Employee' : 'Add Employee'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Position</label>
                    <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Hourly Rate</label>
                    <input type="number" step="0.01" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Hire Date</label>
                    <input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <select value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                      <option value="">Select location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
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
            <div className="modal-body">
              <p className="confirm-text">Are you sure you want to delete {showDelete.first_name} {showDelete.last_name}?</p>
            </div>
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

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2, Building2, Users, DollarSign } from 'lucide-react';

export default function Departments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/api/departments').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const blank = { name: '', description: '', manager_name: '', budget: '', status: 'active' };
  const openCreate = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', manager_name: item.manager_name || '', budget: item.budget || '', status: item.status || 'active' });
    setEditItem(item); setShowForm(true); setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editItem ? `/api/departments/${editItem.id}` : '/api/departments';
      const res = await apiFetch(url, { method: editItem ? 'PUT' : 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/departments/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  const statusClass = (s) => s === 'active' ? 'green' : 'gray';

  const totalBudget = items.reduce((sum, d) => sum + parseFloat(d.budget || 0), 0);
  const totalEmployees = items.reduce((sum, d) => sum + parseInt(d.employee_count || 0), 0);

  return (
    <>
      <div className="page-header"><h2>Departments</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Department</button></div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#dbeafe', borderRadius: 12, padding: 12 }}><Building2 size={24} color="#3b82f6" /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>{items.length}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Total Departments</div></div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#d1fae5', borderRadius: 12, padding: 12 }}><Users size={24} color="#10b981" /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>{totalEmployees}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Total Employees</div></div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fef3c7', borderRadius: 12, padding: 12 }}><DollarSign size={24} color="#f59e0b" /></div>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>${totalBudget.toLocaleString()}</div><div style={{ color: '#6b7280', fontSize: 13 }}>Total Budget</div></div>
          </div>
        </div>

        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Manager</th><th>Employees</th><th>Budget</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No departments found</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.manager_name || '-'}</td>
                        <td>{item.employee_count || 0}</td>
                        <td>${parseFloat(item.budget || 0).toLocaleString()}</td>
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
            <div className="modal-header"><h3>{selected.name}</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Name', selected.name], ['Description', selected.description], ['Manager', selected.manager_name],
                ['Budget', `$${parseFloat(selected.budget || 0).toLocaleString()}`], ['Employees', selected.employee_count || 0], ['Status', selected.status]
              ].map(([l, v]) => (
                <div key={l} className="detail-row"><div className="detail-label">{l}</div>
                  <div className="detail-value">{l === 'Status' ? <span className={`badge ${statusClass(v)}`}>{v}</span> : (v || '-')}</div></div>
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
            <div className="modal-header"><h3>{editItem ? 'Edit Department' : 'Add Department'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Manager Name</label><input value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} /></div>
                  <div className="form-group"><label>Budget ($)</label><input type="number" step="0.01" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
                </div>
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

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Delete</h3><button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button></div>
            <div className="modal-body"><p className="confirm-text">Are you sure you want to delete {showDelete.name}?</p></div>
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

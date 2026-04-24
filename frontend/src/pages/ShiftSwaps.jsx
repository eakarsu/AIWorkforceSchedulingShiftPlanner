import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2, Check, XCircle } from 'lucide-react';

const fmtDt = (d) => d ? new Date(d).toLocaleString() : '-';

export default function ShiftSwaps() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/swap-requests').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
      apiFetch('/api/shifts').then(r => r.json()),
    ]).then(([sw, e, s]) => {
      setItems(Array.isArray(sw) ? sw : []);
      setEmployees(Array.isArray(e) ? e : []);
      setShifts(Array.isArray(s) ? s : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const empName = (id) => { const e = employees.find(x => x.id === id); return e ? `${e.first_name} ${e.last_name}` : `#${id}`; };
  const shiftLabel = (id) => { const s = shifts.find(x => x.id === id); return s ? fmtDt(s.start_time) : `#${id}`; };
  const statusClass = (s) => ({ pending: 'yellow', approved: 'green', denied: 'red' }[s] || 'gray');

  const openCreate = () => { setForm({ requester_id: '', requester_shift_id: '', requested_id: '', requested_shift_id: '', reason: '' }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...form, requester_id: parseInt(form.requester_id), requester_shift_id: parseInt(form.requester_shift_id), requested_id: parseInt(form.requested_id), requested_shift_id: parseInt(form.requested_shift_id) };
      const res = await apiFetch('/api/swap-requests', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleAction = async (id, status) => {
    try {
      await apiFetch(`/api/swap-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setSelected(null); load();
    } catch { alert('Failed to update'); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/swap-requests/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <>
      <div className="page-header"><h2>Shift Swaps</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Requester</th><th>Requester Shift</th><th>Requested Employee</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No swap requests found</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td style={{ fontWeight: 600 }}>{empName(item.requester_id)}</td>
                        <td>{shiftLabel(item.requester_shift_id)}</td>
                        <td>{empName(item.requested_id)}</td>
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
            <div className="modal-header"><h3>Swap Request Details</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Requester', empName(selected.requester_id)], ['Requester Shift', shiftLabel(selected.requester_shift_id)],
                ['Requested Employee', empName(selected.requested_id)], ['Requested Shift', shiftLabel(selected.requested_shift_id)],
                ['Reason', selected.reason || '-'], ['Status', selected.status], ['Created', fmtDt(selected.created_at)]
              ].map(([l, v]) => (
                <div key={l} className="detail-row"><div className="detail-label">{l}</div>
                  <div className="detail-value">{l === 'Status' ? <span className={`badge ${statusClass(v)}`}>{v}</span> : v}</div></div>
              ))}
            </div>
            <div className="modal-footer">
              {selected.status === 'pending' && (
                <>
                  <button className="btn btn-success" onClick={() => handleAction(selected.id, 'approved')}><Check size={14} /> Approve</button>
                  <button className="btn btn-danger" onClick={() => handleAction(selected.id, 'denied')}><XCircle size={14} /> Deny</button>
                </>
              )}
              <button className="btn btn-danger" onClick={() => { setShowDelete(selected); setSelected(null); }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New Swap Request</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Requester</label>
                    <select value={form.requester_id} onChange={e => setForm({ ...form, requester_id: e.target.value })} required>
                      <option value="">Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select></div>
                  <div className="form-group"><label>Requester Shift</label>
                    <select value={form.requester_shift_id} onChange={e => setForm({ ...form, requester_shift_id: e.target.value })} required>
                      <option value="">Select</option>{shifts.map(s => <option key={s.id} value={s.id}>{fmtDt(s.start_time)}</option>)}
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Requested Employee</label>
                    <select value={form.requested_id} onChange={e => setForm({ ...form, requested_id: e.target.value })} required>
                      <option value="">Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select></div>
                  <div className="form-group"><label>Requested Shift</label>
                    <select value={form.requested_shift_id} onChange={e => setForm({ ...form, requested_shift_id: e.target.value })} required>
                      <option value="">Select</option>{shifts.map(s => <option key={s.id} value={s.id}>{fmtDt(s.start_time)}</option>)}
                    </select></div>
                </div>
                <div className="form-group"><label>Reason</label><textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Delete</h3><button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button></div>
            <div className="modal-body"><p className="confirm-text">Are you sure you want to delete this swap request?</p></div>
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

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

export default function Forecasts() {
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
      apiFetch('/api/forecasts').then(r => r.json()),
      apiFetch('/api/locations').then(r => r.json()),
    ]).then(([f, l]) => {
      setItems(Array.isArray(f) ? f : []);
      setLocations(Array.isArray(l) ? l : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const locName = (id) => locations.find(x => x.id === id)?.name || `#${id}`;

  const blank = { location_id: '', forecast_date: '', hour: 0, predicted_demand: 0, actual_demand: 0, confidence: 0.8 };
  const openCreate = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ location_id: item.location_id || '', forecast_date: item.forecast_date ? item.forecast_date.split('T')[0] : '', hour: item.hour || 0, predicted_demand: item.predicted_demand || 0, actual_demand: item.actual_demand || 0, confidence: item.confidence || 0.8 });
    setEditItem(item); setShowForm(true); setSelected(null);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editItem ? `/api/forecasts/${editItem.id}` : '/api/forecasts';
      const body = { ...form, location_id: parseInt(form.location_id), hour: parseInt(form.hour), predicted_demand: parseFloat(form.predicted_demand), actual_demand: parseFloat(form.actual_demand), confidence: parseFloat(form.confidence) };
      const res = await apiFetch(url, { method: editItem ? 'PUT' : 'POST', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/forecasts/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  const confColor = (c) => c >= 0.8 ? 'green' : c >= 0.6 ? 'yellow' : 'red';

  return (
    <>
      <div className="page-header"><h2>Demand Forecasts</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Location</th><th>Date</th><th>Hour</th><th>Predicted</th><th>Actual</th><th>Confidence</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No forecasts</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td style={{ fontWeight: 600 }}>{locName(item.location_id)}</td>
                        <td>{fmtDate(item.forecast_date)}</td><td>{item.hour}:00</td>
                        <td>{item.predicted_demand}</td><td>{item.actual_demand || '-'}</td>
                        <td><span className={`badge ${confColor(item.confidence)}`}>{(item.confidence * 100).toFixed(0)}%</span></td>
                      </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Forecast Details</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {[['Location', locName(selected.location_id)], ['Date', fmtDate(selected.forecast_date)],
                ['Hour', `${selected.hour}:00`], ['Predicted Demand', selected.predicted_demand],
                ['Actual Demand', selected.actual_demand || '-'], ['Confidence', `${(selected.confidence * 100).toFixed(0)}%`]
              ].map(([l, v]) => (
                <div key={l} className="detail-row"><div className="detail-label">{l}</div><div className="detail-value">{v}</div></div>
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
            <div className="modal-header"><h3>{editItem ? 'Edit Forecast' : 'Add Forecast'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Location</label>
                    <select value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })} required>
                      <option value="">Select</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select></div>
                  <div className="form-group"><label>Date</label><input type="date" value={form.forecast_date} onChange={e => setForm({ ...form, forecast_date: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Hour (0-23)</label><input type="number" min="0" max="23" value={form.hour} onChange={e => setForm({ ...form, hour: e.target.value })} required /></div>
                  <div className="form-group"><label>Confidence (0-1)</label><input type="number" step="0.01" min="0" max="1" value={form.confidence} onChange={e => setForm({ ...form, confidence: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Predicted Demand</label><input type="number" value={form.predicted_demand} onChange={e => setForm({ ...form, predicted_demand: e.target.value })} required /></div>
                  <div className="form-group"><label>Actual Demand</label><input type="number" value={form.actual_demand} onChange={e => setForm({ ...form, actual_demand: e.target.value })} /></div>
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
            <div className="modal-body"><p className="confirm-text">Delete this forecast?</p></div>
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

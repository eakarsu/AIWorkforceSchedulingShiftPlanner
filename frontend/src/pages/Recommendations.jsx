import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { X, Trash2, Brain } from 'lucide-react';

const fmtDt = (d) => d ? new Date(d).toLocaleString() : '-';

export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDelete, setShowDelete] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/recommendations').then(r => r.json()),
      apiFetch('/api/locations').then(r => r.json()),
    ]).then(([r, l]) => {
      setItems(Array.isArray(r) ? r : []);
      setLocations(Array.isArray(l) ? l : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const locName = (id) => locations.find(x => x.id === id)?.name || `#${id}`;
  const statusClass = (s) => ({ active: 'green', pending: 'yellow', applied: 'blue', dismissed: 'gray' }[s] || 'gray');
  const typeClass = (t) => ({ scheduling: 'blue', staffing: 'green', cost_saving: 'yellow', compliance: 'red' }[t] || 'purple');

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/recommendations/${id}`, { method: 'DELETE' }); setShowDelete(null); setSelected(null); load(); }
    catch { alert('Failed to delete'); }
  };

  const renderDetails = (item) => {
    const details = item.details || item.recommendation_text || item.description || '';
    if (typeof details === 'object') {
      return Object.entries(details).map(([key, val]) => (
        <div key={key} className="ai-section">
          <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h4>
          {Array.isArray(val) ? (
            <ul>{val.map((v, i) => <li key={i}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>)}</ul>
          ) : typeof val === 'object' ? (
            <p>{JSON.stringify(val, null, 2)}</p>
          ) : (
            <p>{String(val)}</p>
          )}
        </div>
      ));
    }
    if (typeof details === 'string' && details) {
      return details.split('\n').filter(Boolean).map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) return <h4 key={i} style={{ marginTop: 12, marginBottom: 6 }}>{line.replace(/\*\*/g, '')}</h4>;
        if (line.match(/^\d+\./)) return <li key={i} style={{ marginLeft: 16, marginBottom: 4 }}>{line}</li>;
        return <p key={i} style={{ marginBottom: 6 }}>{line}</p>;
      });
    }
    return <p style={{ color: 'var(--text-secondary)' }}>No additional details available.</p>;
  };

  return (
    <>
      <div className="page-header"><h2>AI Recommendations</h2></div>
      <div className="page-body">
        <div className="card">
          {loading ? <div className="loading-container"><div className="spinner"></div> Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Type</th><th>Location</th><th>Title</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No recommendations</td></tr> :
                    items.map(item => (
                      <tr key={item.id} onClick={() => setSelected(item)}>
                        <td><span className={`badge ${typeClass(item.type)}`}>{item.type}</span></td>
                        <td>{locName(item.location_id)}</td>
                        <td style={{ fontWeight: 600 }}>{item.title || '-'}</td>
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
          <div className="modal" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3><Brain size={20} style={{ marginRight: 8 }} /> {selected.title || 'Recommendation'}</h3><button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className={`badge ${typeClass(selected.type)}`}>{selected.type}</span>
                <span className={`badge ${statusClass(selected.status)}`}>{selected.status}</span>
              </div>
              <div className="detail-row"><div className="detail-label">Location</div><div className="detail-value">{locName(selected.location_id)}</div></div>
              <div className="detail-row"><div className="detail-label">Created</div><div className="detail-value">{fmtDt(selected.created_at)}</div></div>
              <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 8, borderLeft: '4px solid var(--accent)' }}>
                {renderDetails(selected)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => { setShowDelete(selected); setSelected(null); }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Confirm Delete</h3><button className="modal-close" onClick={() => setShowDelete(null)}><X size={16} /></button></div>
            <div className="modal-body"><p className="confirm-text">Delete this recommendation?</p></div>
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

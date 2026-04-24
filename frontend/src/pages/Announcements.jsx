import React, { useState, useEffect } from 'react';
import { apiFetch, useAuth } from '../App';
import { Plus, X, Edit2, Trash2, Pin, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function Announcements() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/api/announcements').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const blank = { title: '', content: '', priority: 'normal', category: 'general', is_pinned: false, expires_at: '' };
  const openCreate = () => { setForm({ ...blank, author_name: user?.name || '' }); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({
      title: item.title || '', content: item.content || '', priority: item.priority || 'normal',
      category: item.category || 'general', author_name: item.author_name || '', is_pinned: item.is_pinned || false,
      expires_at: item.expires_at ? item.expires_at.split('T')[0] : ''
    });
    setEditItem(item); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, expires_at: form.expires_at || null };
      const url = editItem ? `/api/announcements/${editItem.id}` : '/api/announcements';
      const res = await apiFetch(url, { method: editItem ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save');
      setShowForm(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' }); setShowDelete(null); load(); }
    catch { alert('Failed to delete'); }
  };

  const priorityConfig = {
    urgent: { color: '#ef4444', bg: '#fef2f2', icon: <AlertCircle size={16} /> },
    high: { color: '#f59e0b', bg: '#fffbeb', icon: <AlertTriangle size={16} /> },
    normal: { color: '#3b82f6', bg: '#eff6ff', icon: <Info size={16} /> },
    low: { color: '#6b7280', bg: '#f9fafb', icon: <Info size={16} /> },
  };

  const categoryLabels = { general: 'General', schedule: 'Schedule', policy: 'Policy', event: 'Event', maintenance: 'Maintenance' };

  const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <>
      <div className="page-header"><h2>Announcements</h2><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Announcement</button></div>
      <div className="page-body">
        {loading ? <div className="card"><div className="loading-container"><div className="spinner"></div> Loading...</div></div> : (
          items.length === 0 ? <div className="card" style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>No announcements yet</div> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map(item => {
              const p = priorityConfig[item.priority] || priorityConfig.normal;
              const isExpired = item.expires_at && new Date(item.expires_at) < new Date();
              return (
                <div key={item.id} className="card" style={{ padding: 0, opacity: isExpired ? 0.6 : 1 }}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {item.is_pinned && <Pin size={14} color="#f59e0b" />}
                        <h3 style={{ margin: 0, fontSize: 16 }}>{item.title}</h3>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: p.bg, color: p.color }}>
                          {item.priority.toUpperCase()}
                        </span>
                        <span className="badge blue">{categoryLabels[item.category] || item.category}</span>
                        {isExpired && <span className="badge gray">Expired</span>}
                      </div>
                      <p style={{ margin: '0 0 12px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.content}</p>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#9ca3af' }}>
                        <span>By: {item.author_name || 'System'}</span>
                        <span>Posted: {formatDate(item.created_at)}</span>
                        {item.expires_at && <span>Expires: {formatDate(item.expires_at)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setShowDelete(item)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? 'Edit Announcement' : 'New Announcement'}</h3><button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div className="form-group"><label>Content</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} required /></div>
                <div className="form-row">
                  <div className="form-group"><label>Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select></div>
                  <div className="form-group"><label>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="general">General</option><option value="schedule">Schedule</option><option value="policy">Policy</option>
                      <option value="event">Event</option><option value="maintenance">Maintenance</option>
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Author</label><input value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} /></div>
                  <div className="form-group"><label>Expires At</label><input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} />
                    Pin this announcement to the top
                  </label>
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
            <div className="modal-body"><p className="confirm-text">Are you sure you want to delete "{showDelete.title}"?</p></div>
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

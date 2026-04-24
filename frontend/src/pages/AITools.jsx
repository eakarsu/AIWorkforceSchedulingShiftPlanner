import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Sparkles, TrendingUp, Shield, Clock, Timer, DollarSign, Brain } from 'lucide-react';

function AIResultDisplay({ data, title }) {
  if (!data) return null;

  const renderValue = (val, depth = 0) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
    if (typeof val === 'boolean') return <span className={`badge ${val ? 'green' : 'red'}`}>{val ? 'Yes' : 'No'}</span>;
    if (typeof val === 'number') return <span style={{ fontWeight: 600 }}>{val}</span>;
    if (typeof val === 'string') {
      // Parse markdown-like text
      const lines = val.split('\n').filter(Boolean);
      if (lines.length > 1) {
        return (
          <div>
            {lines.map((line, i) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                return <h4 key={i} style={{ marginTop: 12, marginBottom: 6, fontSize: 14, fontWeight: 700 }}>{trimmed.replace(/\*\*/g, '')}</h4>;
              }
              if (trimmed.match(/^\d+\.\s/)) {
                return <div key={i} style={{ padding: '4px 0 4px 16px', fontSize: 14 }}>{trimmed}</div>;
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return <div key={i} style={{ padding: '3px 0 3px 16px', fontSize: 14, display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&gt;</span>{trimmed.slice(2)}</div>;
              }
              return <p key={i} style={{ fontSize: 14, marginBottom: 4, lineHeight: 1.6 }}>{trimmed}</p>;
            })}
          </div>
        );
      }
      return <span>{val}</span>;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span style={{ color: 'var(--text-muted)' }}>None</span>;
      if (typeof val[0] === 'object') {
        return (
          <div style={{ marginTop: 8 }}>
            {val.map((item, i) => (
              <div key={i} style={{ background: depth % 2 === 0 ? '#f9fafb' : 'white', padding: 12, borderRadius: 8, marginBottom: 8, border: '1px solid var(--border-light)' }}>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', padding: '3px 0', fontSize: 13 }}>
                    <span style={{ width: 130, flexShrink: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    <span>{renderValue(v, depth + 1)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {val.map((item, i) => (
            <li key={i} style={{ padding: '4px 0', fontSize: 14, display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>&gt;</span>
              {String(item)}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object') {
      return (
        <div style={{ marginTop: 4 }}>
          {Object.entries(val).map(([k, v]) => (
            <div key={k} className="ai-section" style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, textTransform: 'capitalize' }}>
                {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </h4>
              <div style={{ paddingLeft: 8 }}>{renderValue(v, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(val)}</span>;
  };

  return (
    <div className="ai-result-card">
      <div className="ai-header">
        <Brain size={20} />
        <h3>{title || 'AI Analysis Result'}</h3>
        <span className="ai-badge">AI GENERATED</span>
      </div>
      <div className="ai-result-body">
        {typeof data === 'string' ? (
          renderValue(data)
        ) : typeof data === 'object' ? (
          Object.entries(data).map(([key, val]) => (
            <div key={key} className="ai-section">
              <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h4>
              <div>{renderValue(val)}</div>
            </div>
          ))
        ) : (
          <p>{String(data)}</p>
        )}
      </div>
    </div>
  );
}

function AIToolSection({ title, description, icon, fields, endpoint, locations }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body = {};
      fields.forEach(f => {
        const val = form[f.name] || f.default || '';
        body[f.name] = f.type === 'number' ? parseInt(val) : val;
      });
      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tool-card">
      <h3>{icon} {title}</h3>
      <p>{description}</p>
      <div className="ai-tool-form">
        {fields.map(f => (
          <div key={f.name} className="form-group">
            <label>{f.label}</label>
            {f.name === 'location_id' ? (
              <select value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: e.target.value })}>
                <option value="">Select location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            ) : (
              <input
                type={f.type || 'text'}
                value={form[f.name] || f.default || ''}
                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                placeholder={f.placeholder || ''}
              />
            )}
          </div>
        ))}
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14, marginRight: 6, borderWidth: 2 }}></div> Analyzing...</> : <><Sparkles size={14} /> Run AI</>}
          </button>
        </div>
      </div>
      {error && <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 13 }}>{error}</div>}
      {result && <AIResultDisplay data={result} title={title} />}
    </div>
  );
}

export default function AITools() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    apiFetch('/api/locations').then(r => r.json()).then(d => setLocations(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  return (
    <>
      <div className="page-header"><h2>AI Tools</h2></div>
      <div className="page-body">
        <AIToolSection
          title="Optimize Schedule"
          description="Let AI optimize your employee schedule for maximum coverage and minimum cost."
          icon={<Sparkles size={20} style={{ color: '#8b5cf6' }} />}
          endpoint="/api/ai/optimize-schedule"
          locations={locations}
          fields={[
            { name: 'location_id', label: 'Location', type: 'number' },
            { name: 'start_date', label: 'Start Date', type: 'date', default: today },
            { name: 'end_date', label: 'End Date', type: 'date', default: nextWeek },
          ]}
        />

        <AIToolSection
          title="Demand Forecast"
          description="AI-powered demand prediction to help you staff appropriately."
          icon={<TrendingUp size={20} style={{ color: '#3b82f6' }} />}
          endpoint="/api/ai/demand-forecast"
          locations={locations}
          fields={[
            { name: 'location_id', label: 'Location', type: 'number' },
            { name: 'date', label: 'Date', type: 'date', default: today },
          ]}
        />

        <AIToolSection
          title="Compliance Check"
          description="Scan for labor law violations and compliance issues at a location."
          icon={<Shield size={20} style={{ color: '#ef4444' }} />}
          endpoint="/api/ai/compliance-check"
          locations={locations}
          fields={[
            { name: 'location_id', label: 'Location', type: 'number' },
          ]}
        />

        <AIToolSection
          title="Shift Recommendations"
          description="Get AI-powered shift assignment recommendations for optimal coverage."
          icon={<Clock size={20} style={{ color: '#10b981' }} />}
          endpoint="/api/ai/shift-recommendations"
          locations={locations}
          fields={[
            { name: 'location_id', label: 'Location', type: 'number' },
            { name: 'date', label: 'Date', type: 'date', default: today },
          ]}
        />

        <AIToolSection
          title="Overtime Analysis"
          description="Analyze overtime patterns and get suggestions to reduce costs."
          icon={<Timer size={20} style={{ color: '#f59e0b' }} />}
          endpoint="/api/ai/analyze-overtime"
          locations={locations}
          fields={[
            { name: 'start_date', label: 'Start Date', type: 'date', default: today },
            { name: 'end_date', label: 'End Date', type: 'date', default: nextWeek },
          ]}
        />

        <AIToolSection
          title="Payroll Insights"
          description="Get AI-powered insights into payroll patterns and optimization opportunities."
          icon={<DollarSign size={20} style={{ color: '#8b5cf6' }} />}
          endpoint="/api/ai/payroll-insights"
          locations={locations}
          fields={[
            { name: 'start_date', label: 'Start Date', type: 'date', default: today },
            { name: 'end_date', label: 'End Date', type: 'date', default: nextWeek },
          ]}
        />
      </div>
    </>
  );
}

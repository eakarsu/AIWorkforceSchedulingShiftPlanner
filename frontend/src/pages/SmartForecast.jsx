import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Sparkles, TrendingUp, Save, RefreshCw, AlertCircle } from 'lucide-react';

// Smart Forecast Generator - parses AI hourly predictions and persists them
// Replaces the hardcoded `hour=12, predicted_demand=7.5` stub in the backend.
export default function SmartForecast() {
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    apiFetch('/api/locations').then(r => r.json()).then(d => setLocations(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Parse hourly predictions out of AI response (text or structured)
  const parseAiHourly = (raw) => {
    if (!raw) return [];
    const blob = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const rows = [];
    // Try JSON first
    try {
      const obj = typeof raw === 'object' ? raw : JSON.parse(blob);
      const arr = obj.hourly_predictions || obj.predictions || obj.forecast || obj.hours;
      if (Array.isArray(arr)) {
        arr.forEach(r => {
          const hour = parseInt(r.hour ?? r.h ?? r.time);
          const demand = parseFloat(r.predicted_demand ?? r.demand ?? r.value);
          const conf = parseFloat(r.confidence ?? r.conf ?? 0.8);
          if (!Number.isNaN(hour) && !Number.isNaN(demand)) {
            rows.push({ hour, predicted_demand: demand, confidence: conf || 0.8 });
          }
        });
        if (rows.length) return rows;
      }
    } catch {}
    // Fallback regex: lines like "10:00 - 5 staff", "Hour 10: 5", "10am: 5 customers"
    const re = /(?:hour\s+)?(\d{1,2})(?::00|\s*am|\s*pm|:\d{2})?[^\d]+(\d+(?:\.\d+)?)/gi;
    let m;
    const seen = new Set();
    while ((m = re.exec(blob))) {
      const h = parseInt(m[1]);
      if (h < 0 || h > 23 || seen.has(h)) continue;
      seen.add(h);
      rows.push({ hour: h, predicted_demand: parseFloat(m[2]), confidence: 0.75 });
    }
    return rows.sort((a, b) => a.hour - b.hour);
  };

  const runForecast = async () => {
    if (!locationId) { setError('Choose a location'); return; }
    setLoading(true); setError(''); setAiResult(null); setParsed([]); setSavedCount(0);
    try {
      const res = await apiFetch('/api/ai/demand-forecast', {
        method: 'POST',
        body: JSON.stringify({ location_id: parseInt(locationId), date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');
      setAiResult(data);
      const rows = parseAiHourly(data.ai_analysis || data.forecast || data);
      setParsed(rows);
      if (!rows.length) setError('Could not extract hourly predictions from AI response. Edit values manually below.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const updateRow = (i, field, value) => {
    const next = [...parsed];
    next[i] = { ...next[i], [field]: parseFloat(value) || 0 };
    setParsed(next);
  };

  const removeRow = (i) => setParsed(parsed.filter((_, j) => j !== i));
  const addRow = () => setParsed([...parsed, { hour: 12, predicted_demand: 5, confidence: 0.8 }]);

  const saveAll = async () => {
    if (!parsed.length) return;
    setSaving(true); setSavedCount(0);
    let saved = 0;
    for (const row of parsed) {
      try {
        await apiFetch('/api/forecasts', {
          method: 'POST',
          body: JSON.stringify({
            location_id: parseInt(locationId),
            forecast_date: date,
            hour: row.hour,
            predicted_demand: row.predicted_demand,
            actual_demand: 0,
            confidence: row.confidence,
          }),
        });
        saved += 1;
        setSavedCount(saved);
      } catch {}
    }
    setSaving(false);
  };

  return (
    <>
      <div className="page-header">
        <h2>Smart Forecast Generator</h2>
        <span className="ai-badge" style={{ background: '#8b5cf6', color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: 11 }}>AI PARSED</span>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Generate hourly demand predictions, parse them from AI output, then commit each row to the database.
            This page replaces the legacy stub that wrote a single hardcoded forecast row.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group">
              <label>Location</label>
              <select value={locationId} onChange={e => setLocationId(e.target.value)}>
                <option value="">Select location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Forecast Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={runForecast} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14, marginRight: 6, borderWidth: 2 }}></div> Generating...</> : <><Sparkles size={14} /> Run AI Forecast</>}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: 10, background: '#fef3c7', color: '#92400e', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {parsed.length > 0 && (
          <div className="card" style={{ marginTop: 20, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}><TrendingUp size={18} /> Parsed Hourly Predictions ({parsed.length})</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" onClick={addRow}>+ Add Row</button>
                <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
                  {saving ? <><RefreshCw size={14} className="spin" /> Saving {savedCount}/{parsed.length}</> : <><Save size={14} /> Commit All to DB</>}
                </button>
              </div>
            </div>
            {savedCount > 0 && !saving && (
              <div style={{ padding: 10, background: '#d1fae5', color: '#065f46', borderRadius: 8, marginBottom: 12 }}>
                Successfully saved {savedCount} forecast rows to the database.
              </div>
            )}
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Hour</th><th>Predicted Demand</th><th>Confidence</th><th></th></tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => (
                    <tr key={i}>
                      <td><input type="number" min="0" max="23" value={row.hour} onChange={e => updateRow(i, 'hour', e.target.value)} style={{ width: 80 }} /></td>
                      <td><input type="number" step="0.1" value={row.predicted_demand} onChange={e => updateRow(i, 'predicted_demand', e.target.value)} style={{ width: 120 }} /></td>
                      <td><input type="number" step="0.01" min="0" max="1" value={row.confidence} onChange={e => updateRow(i, 'confidence', e.target.value)} style={{ width: 100 }} /></td>
                      <td><button className="btn btn-danger" onClick={() => removeRow(i)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {aiResult && (
          <div className="card" style={{ marginTop: 20, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Raw AI Response</h3>
            <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto', maxHeight: 300 }}>
              {typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <style>{`.spin { animation: spinrot 1s linear infinite; } @keyframes spinrot { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Sparkles, Lock, Save, AlertTriangle, CheckCircle } from 'lucide-react';

// Auto-Scheduler with constraint hints (LLM intent + deterministic legality checks)
// User declares preferences; AI proposes a schedule; UI validates against time-off and overlaps before committing.
export default function AutoScheduler() {
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [form, setForm] = useState({
    location_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    intent: 'Maximize coverage with minimum overtime, prefer fairness',
    max_ot_hours: 5,
    min_rest_hours: 11,
  });
  const [proposed, setProposed] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/locations').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
      apiFetch('/api/time-off').then(r => r.json()),
      apiFetch('/api/shifts').then(r => r.json()),
    ]).then(([l, e, t, s]) => {
      setLocations(Array.isArray(l) ? l : []);
      setEmployees(Array.isArray(e) ? e : []);
      setTimeOff(Array.isArray(t) ? t : []);
      setShifts(Array.isArray(s) ? s : []);
    }).catch(() => {});
  }, []);

  const parseShifts = (raw) => {
    const blob = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const out = [];
    try {
      const obj = typeof raw === 'object' ? raw : JSON.parse(blob);
      const arr = obj.proposed_shifts || obj.schedule || obj.shifts || obj.assignments;
      if (Array.isArray(arr)) {
        arr.forEach(r => {
          out.push({
            employee_id: r.employee_id || r.employeeId,
            start_time: r.start_time || r.start || r.startTime,
            end_time: r.end_time || r.end || r.endTime,
            location_id: r.location_id || form.location_id,
            shift_type: r.shift_type || 'regular',
            notes: r.notes || r.reason || '',
          });
        });
      }
    } catch {}
    return out.filter(s => s.employee_id && s.start_time && s.end_time);
  };

  // Detect violations
  const validateShifts = (proposed) => {
    const issues = [];
    proposed.forEach((s, idx) => {
      // Time-off overlap
      const overlap = timeOff.find(t => {
        if (t.employee_id !== s.employee_id) return false;
        const a = new Date(s.start_time);
        return a >= new Date(t.start_date) && a <= new Date(t.end_date);
      });
      if (overlap) issues.push({ index: idx, type: 'time_off', message: `Employee on approved time off (${overlap.reason || overlap.type || 'leave'})` });
      // Existing shift overlap
      const exists = shifts.find(x => {
        if (x.employee_id !== s.employee_id) return false;
        const aStart = new Date(s.start_time).getTime();
        const aEnd = new Date(s.end_time).getTime();
        const bStart = new Date(x.start_time).getTime();
        const bEnd = new Date(x.end_time).getTime();
        return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
      });
      if (exists) issues.push({ index: idx, type: 'overlap', message: `Conflicts with existing shift #${exists.id}` });
      // Min rest hours
      const sameDay = proposed.filter((p, j) => j !== idx && p.employee_id === s.employee_id);
      sameDay.forEach(p => {
        const gap = Math.abs(new Date(s.start_time) - new Date(p.end_time)) / 3600000;
        if (gap < form.min_rest_hours) {
          issues.push({ index: idx, type: 'rest', message: `Less than ${form.min_rest_hours}h rest between proposed shifts` });
        }
      });
    });
    return issues;
  };

  const runAutoSchedule = async () => {
    if (!form.location_id) { setError('Pick a location'); return; }
    setLoading(true); setError(''); setProposed([]); setConflicts([]); setCommitted(0);
    try {
      const res = await apiFetch('/api/ai/optimize-schedule', {
        method: 'POST',
        body: JSON.stringify({
          location_id: parseInt(form.location_id),
          start_date: form.start_date,
          end_date: form.end_date,
          constraints: { max_ot_hours: form.max_ot_hours, min_rest_hours: form.min_rest_hours, intent: form.intent },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI failed');
      const parsed = parseShifts(data.ai_analysis || data.optimization || data);
      setProposed(parsed);
      setConflicts(validateShifts(parsed));
      if (!parsed.length) setError('AI did not return parseable shift assignments. Try simpler intent or add structured prompt.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const commitAll = async () => {
    setCommitting(true); setCommitted(0);
    let n = 0;
    for (let i = 0; i < proposed.length; i++) {
      if (conflicts.some(c => c.index === i)) continue;
      try {
        await apiFetch('/api/shifts', {
          method: 'POST',
          body: JSON.stringify({
            employee_id: parseInt(proposed[i].employee_id),
            location_id: parseInt(proposed[i].location_id || form.location_id),
            start_time: proposed[i].start_time,
            end_time: proposed[i].end_time,
            shift_type: proposed[i].shift_type || 'regular',
            status: 'scheduled',
            notes: 'Auto-scheduled: ' + (proposed[i].notes || ''),
          }),
        });
        n += 1; setCommitted(n);
      } catch {}
    }
    setCommitting(false);
  };

  const empName = (id) => { const e = employees.find(x => x.id == id); return e ? `${e.first_name} ${e.last_name}` : `#${id}`; };

  return (
    <>
      <div className="page-header"><h2>Auto-Scheduler</h2></div>
      <div className="page-body">
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Combine LLM intent ("prefer fairness, max OT 5h") with deterministic constraint validation
            (time-off overlap, existing-shift conflict, minimum rest hours) before committing.
          </p>
          <div className="form-row">
            <div className="form-group"><label>Location</label>
              <select value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                <option value="">Select</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div className="form-group"><label>End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Optimization Intent</label>
            <textarea rows={2} value={form.intent} onChange={e => setForm({ ...form, intent: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Max OT Hours / week</label>
              <input type="number" value={form.max_ot_hours} onChange={e => setForm({ ...form, max_ot_hours: parseInt(e.target.value) || 0 })} /></div>
            <div className="form-group"><label>Min Rest Hours between shifts</label>
              <input type="number" value={form.min_rest_hours} onChange={e => setForm({ ...form, min_rest_hours: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={runAutoSchedule} disabled={loading}>
            {loading ? <>Generating...</> : <><Sparkles size={14} /> Run Auto-Scheduler</>}
          </button>
          {error && <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', color: '#dc2626', borderRadius: 8 }}>{error}</div>}
        </div>

        {proposed.length > 0 && (
          <div className="card" style={{ marginTop: 20, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Proposed Schedule ({proposed.length} shifts, {conflicts.length} conflicts)</h3>
              <button className="btn btn-primary" onClick={commitAll} disabled={committing}>
                {committing ? <>Committing {committed}/{proposed.length - conflicts.length}</> :
                  <><Lock size={14} /> Commit Valid Shifts ({proposed.length - new Set(conflicts.map(c => c.index)).size})</>}
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Start</th><th>End</th><th>Status</th><th>Notes</th></tr></thead>
                <tbody>
                  {proposed.map((s, i) => {
                    const issues = conflicts.filter(c => c.index === i);
                    return (
                      <tr key={i} style={issues.length ? { background: '#fef2f2' } : {}}>
                        <td>{empName(s.employee_id)}</td>
                        <td>{new Date(s.start_time).toLocaleString()}</td>
                        <td>{new Date(s.end_time).toLocaleString()}</td>
                        <td>{issues.length ? <span style={{ color: '#dc2626', display: 'flex', gap: 4, alignItems: 'center' }}><AlertTriangle size={14} /> {issues.map(x => x.type).join(', ')}</span> : <span style={{ color: '#059669', display: 'flex', gap: 4, alignItems: 'center' }}><CheckCircle size={14} /> OK</span>}</td>
                        <td>{issues.length ? issues.map(x => x.message).join('; ') : s.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

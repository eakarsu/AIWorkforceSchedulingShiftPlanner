import React, { useState, useEffect } from 'react';
import { apiFetch } from '../App';
import { Sparkles, ArrowLeftRight, Send, Star } from 'lucide-react';

// Smart Shift Swap Matchmaker - rank candidates by skill + availability for a swap request
export default function SwapMatchmaker() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [shiftId, setShiftId] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(new Set());

  useEffect(() => {
    Promise.all([
      apiFetch('/api/shifts').then(r => r.json()),
      apiFetch('/api/employees').then(r => r.json()),
      apiFetch('/api/availability').then(r => r.json()),
      apiFetch('/api/time-off').then(r => r.json()),
    ]).then(([s, e, a, t]) => {
      setShifts(Array.isArray(s) ? s : []);
      setEmployees(Array.isArray(e) ? e : []);
      setAvailability(Array.isArray(a) ? a : []);
      setTimeOff(Array.isArray(t) ? t : []);
    }).catch(() => {});
  }, []);

  const empName = (id) => { const e = employees.find(x => x.id == id); return e ? `${e.first_name} ${e.last_name}` : `#${id}`; };

  // Score each candidate by availability + skill + workload fairness
  const scoreCandidate = (emp, shift) => {
    let score = 50; // base
    const reasons = [];
    const start = new Date(shift.start_time);
    const dow = start.getDay();
    const hour = start.getHours();
    // Availability check
    const avail = availability.find(a => a.employee_id === emp.id && a.day_of_week === dow);
    if (avail) {
      const a1 = parseInt((avail.start_time || '00:00').split(':')[0]);
      const a2 = parseInt((avail.end_time || '23:59').split(':')[0]);
      if (hour >= a1 && hour < a2) { score += 30; reasons.push('available this hour'); }
      else { score -= 20; reasons.push('outside available hours'); }
    } else { score -= 10; reasons.push('no availability set'); }
    // Time off conflict
    const off = timeOff.find(t => t.employee_id === emp.id && start >= new Date(t.start_date) && start <= new Date(t.end_date));
    if (off) { score = 0; reasons.push('has approved time off'); }
    // Workload (fewer recent shifts → higher score)
    const recent = shifts.filter(s => s.employee_id === emp.id).length;
    if (recent < 5) { score += 15; reasons.push('low recent workload'); }
    else if (recent > 15) { score -= 10; reasons.push('high recent workload'); }
    // Same role bonus
    const requester = employees.find(x => x.id == requesterId);
    if (requester && requester.role === emp.role) { score += 10; reasons.push('same role'); }
    return { score: Math.max(0, Math.min(100, score)), reasons };
  };

  const findMatches = () => {
    if (!shiftId) return;
    setLoading(true);
    const shift = shifts.find(s => s.id == shiftId);
    if (!shift) { setLoading(false); return; }
    const candidates = employees
      .filter(e => e.id != requesterId)
      .map(emp => ({ emp, ...scoreCandidate(emp, shift) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setMatches(candidates);
    setLoading(false);
  };

  const sendOffer = async (candidateId) => {
    try {
      await apiFetch('/api/swap-requests', {
        method: 'POST',
        body: JSON.stringify({
          requester_id: parseInt(requesterId),
          shift_id: parseInt(shiftId),
          target_employee_id: parseInt(candidateId),
          status: 'pending',
          reason: 'AI-matched offer',
        }),
      }).then(() => {
        const next = new Set(requested); next.add(candidateId); setRequested(next);
      });
    } catch { alert('Failed to send offer'); }
  };

  const selectedShift = shifts.find(s => s.id == shiftId);

  return (
    <>
      <div className="page-header"><h2>Shift Swap Matchmaker</h2></div>
      <div className="page-body">
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Pick a shift to swap and the requester. The matchmaker ranks colleagues by availability,
            workload fairness, role match, and time-off status, then lets you send ranked swap offers.
          </p>
          <div className="form-row">
            <div className="form-group"><label>Requester</label>
              <select value={requesterId} onChange={e => setRequesterId(e.target.value)}>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Shift to Swap</label>
              <select value={shiftId} onChange={e => setShiftId(e.target.value)}>
                <option value="">Select shift</option>
                {shifts.filter(s => !requesterId || s.employee_id == requesterId).map(s => (
                  <option key={s.id} value={s.id}>#{s.id} - {empName(s.employee_id)} - {new Date(s.start_time).toLocaleString()}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={findMatches} disabled={!shiftId || loading}>
            <Sparkles size={14} /> Find Best Matches
          </button>
        </div>

        {selectedShift && matches.length > 0 && (
          <div className="card" style={{ marginTop: 20, padding: 20 }}>
            <h3>Ranked Candidates for Shift #{selectedShift.id}</h3>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {matches.map((m, i) => (
                <div key={m.emp.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 16, background: i === 0 ? '#f0fdf4' : '#f9fafb',
                  borderRadius: 8, border: `2px solid ${i === 0 ? '#10b981' : '#e5e7eb'}`,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 18 }}>#{i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{m.emp.first_name} {m.emp.last_name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({m.emp.role || 'staff'})</span>
                      {i === 0 && <Star size={14} fill="#fbbf24" stroke="#fbbf24" />}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {m.reasons.join(' • ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      padding: '6px 14px', borderRadius: 999,
                      background: m.score > 70 ? '#10b981' : m.score > 40 ? '#f59e0b' : '#ef4444',
                      color: 'white', fontWeight: 700,
                    }}>{m.score}/100</div>
                    <button
                      className="btn btn-primary"
                      disabled={requested.has(m.emp.id) || m.score === 0}
                      onClick={() => sendOffer(m.emp.id)}
                    >
                      {requested.has(m.emp.id) ? 'Sent' : <><Send size={14} /> Send Offer</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

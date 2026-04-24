import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../App';
import {
  Users, Clock, MapPin, ArrowLeftRight, Calendar, CalendarCheck,
  Coffee, Timer, DollarSign, Shield, Bell, TrendingUp, Brain,
  BarChart3, Sparkles, AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/reports/dashboard')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const features = [
    { path: '/employees', icon: <Users />, color: 'blue', title: 'Employees', desc: 'Manage workforce profiles, positions, and departments' },
    { path: '/shifts', icon: <Clock />, color: 'green', title: 'Shifts', desc: 'Schedule, assign, and track employee shifts' },
    { path: '/locations', icon: <MapPin />, color: 'red', title: 'Locations', desc: 'Manage work locations and facilities' },
    { path: '/shift-swaps', icon: <ArrowLeftRight />, color: 'purple', title: 'Shift Swaps', desc: 'Handle shift swap requests between employees' },
    { path: '/time-off', icon: <Calendar />, color: 'yellow', title: 'Time Off', desc: 'Process vacation, sick leave, and PTO requests' },
    { path: '/availability', icon: <CalendarCheck />, color: 'cyan', title: 'Availability', desc: 'Track employee availability preferences' },
    { path: '/breaks', icon: <Coffee />, color: 'orange', title: 'Break Management', desc: 'Monitor and manage break schedules' },
    { path: '/overtime', icon: <Timer />, color: 'indigo', title: 'Overtime', desc: 'Track and manage overtime hours and pay' },
    { path: '/payroll', icon: <DollarSign />, color: 'green', title: 'Payroll', desc: 'Process payroll, deductions, and payments' },
    { path: '/compliance', icon: <Shield />, color: 'red', title: 'Compliance', desc: 'Monitor labor law and policy compliance' },
    { path: '/notifications', icon: <Bell />, color: 'yellow', title: 'Notifications', desc: 'System alerts and employee notifications' },
    { path: '/forecasts', icon: <TrendingUp />, color: 'blue', title: 'Demand Forecasts', desc: 'AI-powered demand predictions' },
    { path: '/recommendations', icon: <Brain />, color: 'purple', title: 'AI Recommendations', desc: 'Smart scheduling suggestions' },
    { path: '/reports', icon: <BarChart3 />, color: 'indigo', title: 'Reports', desc: 'Analytics, labor costs, and attendance' },
    { path: '/ai-tools', icon: <Sparkles />, color: 'pink', title: 'AI Tools', desc: 'Advanced AI scheduling and analysis tools' },
  ];

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Welcome back{user?.email ? `, ${user.email}` : ''}
        </span>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><Users size={24} /></div>
            <div className="stat-info">
              <h3>{stats?.total_employees ?? '-'}</h3>
              <p>Total Employees</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Clock size={24} /></div>
            <div className="stat-info">
              <h3>{stats?.shifts_today ?? '-'}</h3>
              <p>Today's Shifts</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><Calendar size={24} /></div>
            <div className="stat-info">
              <h3>{stats ? (stats.pending_swap_requests + stats.pending_time_off) : '-'}</h3>
              <p>Pending Requests</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><AlertTriangle size={24} /></div>
            <div className="stat-info">
              <h3>{stats?.compliance_issues ?? '-'}</h3>
              <p>Compliance Alerts</p>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Features</h3>
        <div className="feature-grid">
          {features.map(f => (
            <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
              <div className={`card-icon ${f.color}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

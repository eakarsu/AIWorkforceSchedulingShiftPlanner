import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, MapPin, ArrowLeftRight, Calendar,
  CalendarCheck, Coffee, Timer, DollarSign, Shield, Bell,
  TrendingUp, Brain, BarChart3, Sparkles, LogOut, Building2,
  Copy, LogIn, Megaphone, FileText
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import Locations from './pages/Locations';
import ShiftSwaps from './pages/ShiftSwaps';
import TimeOff from './pages/TimeOff';
import Availability from './pages/Availability';
import Breaks from './pages/Breaks';
import Overtime from './pages/Overtime';
import Payroll from './pages/Payroll';
import Compliance from './pages/Compliance';
import Notifications from './pages/Notifications';
import Forecasts from './pages/Forecasts';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import AITools from './pages/AITools';
import Departments from './pages/Departments';
import ShiftTemplates from './pages/ShiftTemplates';
import TimeClock from './pages/TimeClock';
import Announcements from './pages/Announcements';
import AuditLog from './pages/AuditLog';

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { section: 'Main' },
    { path: '/', icon: <LayoutDashboard />, label: 'Dashboard' },
    { section: 'Management' },
    { path: '/employees', icon: <Users />, label: 'Employees' },
    { path: '/shifts', icon: <Clock />, label: 'Shifts' },
    { path: '/locations', icon: <MapPin />, label: 'Locations' },
    { path: '/departments', icon: <Building2 />, label: 'Departments' },
    { path: '/shift-templates', icon: <Copy />, label: 'Shift Templates' },
    { section: 'Requests' },
    { path: '/shift-swaps', icon: <ArrowLeftRight />, label: 'Shift Swaps' },
    { path: '/time-off', icon: <Calendar />, label: 'Time Off' },
    { path: '/availability', icon: <CalendarCheck />, label: 'Availability' },
    { section: 'Operations' },
    { path: '/time-clock', icon: <LogIn />, label: 'Time Clock' },
    { path: '/breaks', icon: <Coffee />, label: 'Break Management' },
    { path: '/overtime', icon: <Timer />, label: 'Overtime' },
    { path: '/payroll', icon: <DollarSign />, label: 'Payroll' },
    { path: '/compliance', icon: <Shield />, label: 'Compliance' },
    { path: '/notifications', icon: <Bell />, label: 'Notifications' },
    { path: '/announcements', icon: <Megaphone />, label: 'Announcements' },
    { path: '/audit-log', icon: <FileText />, label: 'Audit Log' },
    { section: 'Intelligence' },
    { path: '/forecasts', icon: <TrendingUp />, label: 'Demand Forecasts' },
    { path: '/recommendations', icon: <Brain />, label: 'AI Recommendations' },
    { path: '/reports', icon: <BarChart3 />, label: 'Reports' },
    { path: '/ai-tools', icon: <Sparkles />, label: 'AI Tools' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">S</div>
        <div>
          <h1>ShiftHub</h1>
          <span>AI Workforce Scheduler</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="sidebar-section-label">{item.section}</div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <>
      <Sidebar />
      <div className="main-content">{children}</div>
    </>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
          <Route path="/shift-swaps" element={<ProtectedRoute><ShiftSwaps /></ProtectedRoute>} />
          <Route path="/time-off" element={<ProtectedRoute><TimeOff /></ProtectedRoute>} />
          <Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
          <Route path="/breaks" element={<ProtectedRoute><Breaks /></ProtectedRoute>} />
          <Route path="/overtime" element={<ProtectedRoute><Overtime /></ProtectedRoute>} />
          <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/forecasts" element={<ProtectedRoute><Forecasts /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
          <Route path="/shift-templates" element={<ProtectedRoute><ShiftTemplates /></ProtectedRoute>} />
          <Route path="/time-clock" element={<ProtectedRoute><TimeClock /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
          <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

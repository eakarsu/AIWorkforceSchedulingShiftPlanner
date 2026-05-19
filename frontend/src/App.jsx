import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, MapPin, ArrowLeftRight, Calendar,
  CalendarCheck, Coffee, Timer, DollarSign, Shield, Bell,
  TrendingUp, Brain, BarChart3, Sparkles, LogOut, Building2,
  Copy, LogIn, Megaphone, FileText, Wand2, Mic, AlertTriangle
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

// // === Batch 09 Gaps & Frontend Mounts ===
const PredictiveNoShowModelingWithAiDrivenReminderTimingCfs = React.lazy(() => import('./pages/Batch09/PredictiveNoShowModelingWithAiDrivenReminderTimingCfs'));
const FairnessAuditByDemographicCfs = React.lazy(() => import('./pages/Batch09/FairnessAuditByDemographicCfs'));
const BurnoutRiskDetectionFromShiftPatternsSurveyCfs = React.lazy(() => import('./pages/Batch09/BurnoutRiskDetectionFromShiftPatternsSurveyCfs'));
const GigWorkerPreferenceLearningCfs = React.lazy(() => import('./pages/Batch09/GigWorkerPreferenceLearningCfs'));
const ExternalLaborMarketIntegrationForFillInsCfs = React.lazy(() => import('./pages/Batch09/ExternalLaborMarketIntegrationForFillInsCfs'));
const WageCompressionDetectionInternalEquityAlertsCfs = React.lazy(() => import('./pages/Batch09/WageCompressionDetectionInternalEquityAlertsCfs'));
const WorkforceCapacityPlanningWithTurnoverPredictionCfs = React.lazy(() => import('./pages/Batch09/WorkforceCapacityPlanningWithTurnoverPredictionCfs'));
const ProductivityPerShiftAnalysisWithAnomalyFlagsCfs = React.lazy(() => import('./pages/Batch09/ProductivityPerShiftAnalysisWithAnomalyFlagsCfs'));
const AiBurnoutFatigueRiskModelingGapAi = React.lazy(() => import('./pages/Batch09/AiBurnoutFatigueRiskModelingGapAi'));
const AiFairnessAuditorForScheduleEquityGapAi = React.lazy(() => import('./pages/Batch09/AiFairnessAuditorForScheduleEquityGapAi'));
const PredictiveTurnoverAndRetentionModelingGapAi = React.lazy(() => import('./pages/Batch09/PredictiveTurnoverAndRetentionModelingGapAi'));
const AiCandidateToShiftMatchingForGigWorkersGapAi = React.lazy(() => import('./pages/Batch09/AiCandidateToShiftMatchingForGigWorkersGapAi'));
const BenefitsManagementGapNon = React.lazy(() => import('./pages/Batch09/BenefitsManagementGapNon'));
const PerformanceReviewModuleGapNon = React.lazy(() => import('./pages/Batch09/PerformanceReviewModuleGapNon'));
const TrainingAndLmsIntegrationGapNon = React.lazy(() => import('./pages/Batch09/TrainingAndLmsIntegrationGapNon'));
const CertificationExpirationAlertsGapNon = React.lazy(() => import('./pages/Batch09/CertificationExpirationAlertsGapNon'));
const GeofencedClockInMobileAttendanceGapNon = React.lazy(() => import('./pages/Batch09/GeofencedClockInMobileAttendanceGapNon'));
const TipPoolAndTipOutCalculationsGapNon = React.lazy(() => import('./pages/Batch09/TipPoolAndTipOutCalculationsGapNon'));

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
        
      {/* // === Batch 09 Gaps & Frontend Mounts === */}
        <Route path="/batch09/cfs/predictive-no-show-modeling-with-ai-driven-reminder-timing" element={<React.Suspense fallback={<div>Loading...</div>}><PredictiveNoShowModelingWithAiDrivenReminderTimingCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/fairness-audit-by-demographic" element={<React.Suspense fallback={<div>Loading...</div>}><FairnessAuditByDemographicCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/burnout-risk-detection-from-shift-patterns-survey" element={<React.Suspense fallback={<div>Loading...</div>}><BurnoutRiskDetectionFromShiftPatternsSurveyCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/gig-worker-preference-learning" element={<React.Suspense fallback={<div>Loading...</div>}><GigWorkerPreferenceLearningCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/external-labor-market-integration-for-fill-ins" element={<React.Suspense fallback={<div>Loading...</div>}><ExternalLaborMarketIntegrationForFillInsCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/wage-compression-detection-internal-equity-alerts" element={<React.Suspense fallback={<div>Loading...</div>}><WageCompressionDetectionInternalEquityAlertsCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/workforce-capacity-planning-with-turnover-prediction" element={<React.Suspense fallback={<div>Loading...</div>}><WorkforceCapacityPlanningWithTurnoverPredictionCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/productivity-per-shift-analysis-with-anomaly-flags" element={<React.Suspense fallback={<div>Loading...</div>}><ProductivityPerShiftAnalysisWithAnomalyFlagsCfs /></React.Suspense>} />
        <Route path="/batch09/gap-ai/ai-burnout-fatigue-risk-modeling" element={<React.Suspense fallback={<div>Loading...</div>}><AiBurnoutFatigueRiskModelingGapAi /></React.Suspense>} />
        <Route path="/batch09/gap-ai/ai-fairness-auditor-for-schedule-equity" element={<React.Suspense fallback={<div>Loading...</div>}><AiFairnessAuditorForScheduleEquityGapAi /></React.Suspense>} />
        <Route path="/batch09/gap-ai/predictive-turnover-and-retention-modeling" element={<React.Suspense fallback={<div>Loading...</div>}><PredictiveTurnoverAndRetentionModelingGapAi /></React.Suspense>} />
        <Route path="/batch09/gap-ai/ai-candidate-to-shift-matching-for-gig-workers" element={<React.Suspense fallback={<div>Loading...</div>}><AiCandidateToShiftMatchingForGigWorkersGapAi /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/benefits-management" element={<React.Suspense fallback={<div>Loading...</div>}><BenefitsManagementGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/performance-review-module" element={<React.Suspense fallback={<div>Loading...</div>}><PerformanceReviewModuleGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/training-and-lms-integration" element={<React.Suspense fallback={<div>Loading...</div>}><TrainingAndLmsIntegrationGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/certification-expiration-alerts" element={<React.Suspense fallback={<div>Loading...</div>}><CertificationExpirationAlertsGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/geofenced-clock-in-mobile-attendance" element={<React.Suspense fallback={<div>Loading...</div>}><GeofencedClockInMobileAttendanceGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/tip-pool-and-tip-out-calculations" element={<React.Suspense fallback={<div>Loading...</div>}><TipPoolAndTipOutCalculationsGapNon /></React.Suspense>} />

      </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

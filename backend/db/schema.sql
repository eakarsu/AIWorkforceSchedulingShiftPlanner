-- Users table (for login)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  hourly_rate DECIMAL(10,2) DEFAULT 15.00,
  hire_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  location_id INTEGER REFERENCES locations(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  break_duration INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'scheduled',
  shift_type VARCHAR(50) DEFAULT 'regular',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shift Swap Requests
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  requester_shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
  requested_id INTEGER REFERENCES employees(id),
  requested_shift_id INTEGER REFERENCES shifts(id),
  status VARCHAR(20) DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Time Off Requests
CREATE TABLE IF NOT EXISTS time_off_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'vacation',
  status VARCHAR(20) DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Availability
CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Breaks
CREATE TABLE IF NOT EXISTS breaks (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  break_type VARCHAR(50) DEFAULT 'meal',
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Overtime Records
CREATE TABLE IF NOT EXISTS overtime_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  regular_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  double_time_hours DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  regular_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  gross_pay DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_pay DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Demand Forecasts
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  forecast_date DATE NOT NULL,
  hour INTEGER,
  predicted_demand DECIMAL(5,2),
  actual_demand DECIMAL(5,2),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Records
CREATE TABLE IF NOT EXISTS compliance_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  shift_id INTEGER REFERENCES shifts(id),
  type VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'flagged',
  severity VARCHAR(20) DEFAULT 'warning',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  manager_name VARCHAR(255),
  budget DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shift Templates
CREATE TABLE IF NOT EXISTS shift_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location_id INTEGER REFERENCES locations(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 30,
  shift_type VARCHAR(50) DEFAULT 'regular',
  required_employees INTEGER DEFAULT 1,
  days_of_week JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Time Clock
CREATE TABLE IF NOT EXISTS time_clock (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id),
  clock_in TIMESTAMP NOT NULL,
  clock_out TIMESTAMP,
  total_hours DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'clocked_in',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  category VARCHAR(50) DEFAULT 'general',
  author_name VARCHAR(255),
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  user_name VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  location_id INTEGER REFERENCES locations(id),
  title VARCHAR(255),
  recommendation TEXT,
  details JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data for AI Workforce Scheduling & Shift Planner

\if :{?allow_demo_seed}
\else
\echo 'Demo seed disabled; pass -v allow_demo_seed=1 only for an isolated non-production database.'
\quit
\endif

-- Clear existing data (in reverse dependency order)
TRUNCATE audit_log, announcements, time_clock, shift_templates, departments, ai_recommendations, compliance_records, demand_forecasts, notifications, payroll, overtime_records, breaks, availability, time_off_requests, shift_swap_requests, shifts, employees, locations, users RESTART IDENTITY CASCADE;

-- ============================================
-- Users
-- ============================================
INSERT INTO users (email, password, name, role) VALUES
('admin@shifthub.com', '$2a$10$rDkOlz0bFYmGNqj3OGTC7eC.z4C1qK2Iq5j1lKFhSCOhxu1Hw4xS6', 'Admin User', 'admin');

-- ============================================
-- Locations (15+)
-- ============================================
INSERT INTO locations (name, address, city, state, timezone, phone, status) VALUES
('Downtown Bistro', '123 Main St', 'New York', 'NY', 'America/New_York', '212-555-0101', 'active'),
('Harbor Grill', '456 Ocean Ave', 'Miami', 'FL', 'America/New_York', '305-555-0102', 'active'),
('Lakeside Cafe', '789 Lake Dr', 'Chicago', 'IL', 'America/Chicago', '312-555-0103', 'active'),
('Mountain Lodge', '321 Peak Rd', 'Denver', 'CO', 'America/Denver', '720-555-0104', 'active'),
('Sunset Terrace', '654 Sunset Blvd', 'Los Angeles', 'CA', 'America/Los_Angeles', '310-555-0105', 'active'),
('Pacific Pier', '987 Pier Way', 'San Francisco', 'CA', 'America/Los_Angeles', '415-555-0106', 'active'),
('Liberty Diner', '147 Freedom Ave', 'Philadelphia', 'PA', 'America/New_York', '215-555-0107', 'active'),
('Bayou Kitchen', '258 Cajun Ln', 'New Orleans', 'LA', 'America/Chicago', '504-555-0108', 'active'),
('Desert Oasis', '369 Cactus Rd', 'Phoenix', 'AZ', 'America/Phoenix', '602-555-0109', 'active'),
('Emerald City Eats', '471 Pine St', 'Seattle', 'WA', 'America/Los_Angeles', '206-555-0110', 'active'),
('Peachtree Pub', '582 Peach Ave', 'Atlanta', 'GA', 'America/New_York', '404-555-0111', 'active'),
('River Walk Cantina', '693 River Rd', 'San Antonio', 'TX', 'America/Chicago', '210-555-0112', 'active'),
('Beacon Hill Bar', '804 Beacon St', 'Boston', 'MA', 'America/New_York', '617-555-0113', 'active'),
('Music City Grill', '915 Broadway', 'Nashville', 'TN', 'America/Chicago', '615-555-0114', 'active'),
('Gateway Diner', '126 Arch Way', 'St. Louis', 'MO', 'America/Chicago', '314-555-0115', 'active'),
('Aloha Lounge', '237 Beach Rd', 'Honolulu', 'HI', 'Pacific/Honolulu', '808-555-0116', 'active');

-- ============================================
-- Employees (20+)
-- ============================================
INSERT INTO employees (first_name, last_name, email, phone, position, department, hourly_rate, hire_date, status, location_id) VALUES
('Maria', 'Rodriguez', 'maria.rodriguez@email.com', '212-555-1001', 'Server', 'Front of House', 18.50, NOW() - INTERVAL '2 years', 'active', 1),
('James', 'Chen', 'james.chen@email.com', '212-555-1002', 'Cook', 'Kitchen', 22.00, NOW() - INTERVAL '1 year 6 months', 'active', 1),
('Sarah', 'Williams', 'sarah.williams@email.com', '305-555-1003', 'Bartender', 'Bar', 20.00, NOW() - INTERVAL '3 years', 'active', 2),
('Michael', 'Johnson', 'michael.johnson@email.com', '305-555-1004', 'Host', 'Front of House', 16.00, NOW() - INTERVAL '8 months', 'active', 2),
('Emily', 'Davis', 'emily.davis@email.com', '312-555-1005', 'Server', 'Front of House', 17.50, NOW() - INTERVAL '1 year', 'active', 3),
('David', 'Martinez', 'david.martinez@email.com', '312-555-1006', 'Manager', 'Management', 28.00, NOW() - INTERVAL '4 years', 'active', 3),
('Jessica', 'Brown', 'jessica.brown@email.com', '720-555-1007', 'Cashier', 'Front of House', 15.50, NOW() - INTERVAL '6 months', 'active', 4),
('Robert', 'Taylor', 'robert.taylor@email.com', '720-555-1008', 'Cook', 'Kitchen', 21.00, NOW() - INTERVAL '2 years 3 months', 'active', 4),
('Ashley', 'Anderson', 'ashley.anderson@email.com', '310-555-1009', 'Server', 'Front of House', 19.00, NOW() - INTERVAL '1 year 8 months', 'active', 5),
('Daniel', 'Thomas', 'daniel.thomas@email.com', '310-555-1010', 'Bartender', 'Bar', 21.50, NOW() - INTERVAL '5 years', 'active', 5),
('Lauren', 'Jackson', 'lauren.jackson@email.com', '415-555-1011', 'Host', 'Front of House', 16.50, NOW() - INTERVAL '9 months', 'active', 6),
('Kevin', 'White', 'kevin.white@email.com', '415-555-1012', 'Stocker', 'Kitchen', 17.00, NOW() - INTERVAL '1 year 2 months', 'active', 6),
('Amanda', 'Harris', 'amanda.harris@email.com', '215-555-1013', 'Server', 'Front of House', 18.00, NOW() - INTERVAL '2 years 5 months', 'active', 7),
('Christopher', 'Clark', 'christopher.clark@email.com', '504-555-1014', 'Cook', 'Kitchen', 23.00, NOW() - INTERVAL '6 years', 'active', 8),
('Megan', 'Lewis', 'megan.lewis@email.com', '602-555-1015', 'Manager', 'Management', 27.00, NOW() - INTERVAL '3 years 4 months', 'active', 9),
('Brandon', 'Walker', 'brandon.walker@email.com', '206-555-1016', 'Bartender', 'Bar', 20.50, NOW() - INTERVAL '2 years', 'active', 10),
('Nicole', 'Hall', 'nicole.hall@email.com', '404-555-1017', 'Server', 'Front of House', 17.50, NOW() - INTERVAL '11 months', 'active', 11),
('Tyler', 'Allen', 'tyler.allen@email.com', '210-555-1018', 'Cashier', 'Front of House', 15.00, NOW() - INTERVAL '4 months', 'active', 12),
('Rachel', 'Young', 'rachel.young@email.com', '617-555-1019', 'Cook', 'Kitchen', 22.50, NOW() - INTERVAL '1 year 10 months', 'active', 13),
('Justin', 'King', 'justin.king@email.com', '615-555-1020', 'Host', 'Front of House', 16.00, NOW() - INTERVAL '7 months', 'active', 14),
('Stephanie', 'Wright', 'stephanie.wright@email.com', '314-555-1021', 'Server', 'Front of House', 18.00, NOW() - INTERVAL '2 years 1 month', 'active', 15),
('Andrew', 'Lopez', 'andrew.lopez@email.com', '808-555-1022', 'Bartender', 'Bar', 21.00, NOW() - INTERVAL '3 years 6 months', 'active', 16),
('Samantha', 'Hill', 'samantha.hill@email.com', '212-555-1023', 'Stocker', 'Kitchen', 16.50, NOW() - INTERVAL '5 months', 'active', 1),
('Ryan', 'Scott', 'ryan.scott@email.com', '305-555-1024', 'Cook', 'Kitchen', 20.00, NOW() - INTERVAL '1 year 4 months', 'active', 2);

-- ============================================
-- Shifts (30+) - mix of past, current, and future
-- ============================================
INSERT INTO shifts (employee_id, location_id, start_time, end_time, break_duration, status, shift_type, notes) VALUES
-- Past shifts
(1, 1, NOW() - INTERVAL '3 days' + TIME '08:00', NOW() - INTERVAL '3 days' + TIME '16:00', 30, 'completed', 'regular', 'Morning shift'),
(2, 1, NOW() - INTERVAL '3 days' + TIME '10:00', NOW() - INTERVAL '3 days' + TIME '18:00', 30, 'completed', 'regular', 'Mid shift'),
(3, 2, NOW() - INTERVAL '2 days' + TIME '16:00', NOW() - INTERVAL '2 days' + TIME '23:00', 30, 'completed', 'regular', 'Evening bar shift'),
(4, 2, NOW() - INTERVAL '2 days' + TIME '11:00', NOW() - INTERVAL '2 days' + TIME '19:00', 30, 'completed', 'regular', 'Lunch hosting'),
(5, 3, NOW() - INTERVAL '1 day' + TIME '06:00', NOW() - INTERVAL '1 day' + TIME '14:00', 30, 'completed', 'regular', 'Early morning'),
(6, 3, NOW() - INTERVAL '1 day' + TIME '09:00', NOW() - INTERVAL '1 day' + TIME '17:00', 30, 'completed', 'regular', 'Manager on duty'),
(7, 4, NOW() - INTERVAL '4 days' + TIME '07:00', NOW() - INTERVAL '4 days' + TIME '15:00', 30, 'completed', 'regular', 'Register duty'),
(8, 4, NOW() - INTERVAL '4 days' + TIME '14:00', NOW() - INTERVAL '4 days' + TIME '22:00', 30, 'completed', 'regular', 'Dinner prep'),
(14, 8, NOW() - INTERVAL '5 days' + TIME '10:00', NOW() - INTERVAL '5 days' + TIME '18:00', 30, 'completed', 'regular', 'Kitchen shift'),
(15, 9, NOW() - INTERVAL '5 days' + TIME '08:00', NOW() - INTERVAL '5 days' + TIME '16:00', 30, 'completed', 'regular', 'Day management'),
-- Today shifts
(1, 1, NOW()::DATE + TIME '08:00', NOW()::DATE + TIME '16:00', 30, 'in_progress', 'regular', 'Morning server shift'),
(2, 1, NOW()::DATE + TIME '10:00', NOW()::DATE + TIME '18:00', 30, 'scheduled', 'regular', 'Kitchen prep and service'),
(3, 2, NOW()::DATE + TIME '16:00', NOW()::DATE + TIME '23:00', 30, 'scheduled', 'regular', 'Bar evening shift'),
(9, 5, NOW()::DATE + TIME '11:00', NOW()::DATE + TIME '19:00', 30, 'scheduled', 'regular', 'Lunch and dinner service'),
(10, 5, NOW()::DATE + TIME '17:00', NOW()::DATE + TIME '01:00', 30, 'scheduled', 'regular', 'Evening bar'),
(11, 6, NOW()::DATE + TIME '09:00', NOW()::DATE + TIME '17:00', 30, 'in_progress', 'regular', 'Front desk hosting'),
(16, 10, NOW()::DATE + TIME '15:00', NOW()::DATE + TIME '23:00', 30, 'scheduled', 'regular', 'Evening bartending'),
(17, 11, NOW()::DATE + TIME '11:00', NOW()::DATE + TIME '19:00', 30, 'scheduled', 'regular', 'Lunch server'),
-- Future shifts
(1, 1, NOW() + INTERVAL '1 day' + TIME '08:00', NOW() + INTERVAL '1 day' + TIME '16:00', 30, 'scheduled', 'regular', 'Morning shift'),
(5, 3, NOW() + INTERVAL '1 day' + TIME '06:00', NOW() + INTERVAL '1 day' + TIME '14:00', 30, 'scheduled', 'regular', 'Early open'),
(6, 3, NOW() + INTERVAL '1 day' + TIME '14:00', NOW() + INTERVAL '1 day' + TIME '22:00', 30, 'scheduled', 'overtime', 'Extended coverage'),
(12, 6, NOW() + INTERVAL '2 days' + TIME '08:00', NOW() + INTERVAL '2 days' + TIME '16:00', 30, 'scheduled', 'regular', 'Stock and prep'),
(13, 7, NOW() + INTERVAL '2 days' + TIME '11:00', NOW() + INTERVAL '2 days' + TIME '19:00', 30, 'scheduled', 'regular', 'Lunch service'),
(18, 12, NOW() + INTERVAL '2 days' + TIME '09:00', NOW() + INTERVAL '2 days' + TIME '17:00', 30, 'scheduled', 'regular', 'Register duty'),
(19, 13, NOW() + INTERVAL '3 days' + TIME '10:00', NOW() + INTERVAL '3 days' + TIME '18:00', 30, 'scheduled', 'regular', 'Kitchen shift'),
(20, 14, NOW() + INTERVAL '3 days' + TIME '09:00', NOW() + INTERVAL '3 days' + TIME '17:00', 30, 'scheduled', 'regular', 'Host shift'),
(21, 15, NOW() + INTERVAL '3 days' + TIME '11:00', NOW() + INTERVAL '3 days' + TIME '19:00', 30, 'scheduled', 'regular', 'Dinner service'),
(22, 16, NOW() + INTERVAL '4 days' + TIME '16:00', NOW() + INTERVAL '4 days' + TIME '00:00', 30, 'scheduled', 'regular', 'Night bar'),
(23, 1, NOW() + INTERVAL '4 days' + TIME '07:00', NOW() + INTERVAL '4 days' + TIME '15:00', 30, 'scheduled', 'regular', 'Morning stock'),
(24, 2, NOW() + INTERVAL '4 days' + TIME '10:00', NOW() + INTERVAL '4 days' + TIME '18:00', 30, 'scheduled', 'regular', 'Kitchen mid shift'),
(4, 2, NOW() + INTERVAL '5 days' + TIME '11:00', NOW() + INTERVAL '5 days' + TIME '19:00', 30, 'scheduled', 'regular', 'Lunch hosting'),
(8, 4, NOW() + INTERVAL '5 days' + TIME '14:00', NOW() + INTERVAL '5 days' + TIME '22:00', 30, 'scheduled', 'overtime', 'Extended kitchen'),
(10, 5, NOW() + INTERVAL '6 days' + TIME '17:00', NOW() + INTERVAL '6 days' + TIME '01:00', 30, 'scheduled', 'regular', 'Weekend bar'),
(15, 9, NOW() + INTERVAL '7 days' + TIME '08:00', NOW() + INTERVAL '7 days' + TIME '16:00', 30, 'scheduled', 'regular', 'Week ahead management');

-- ============================================
-- Shift Swap Requests (15+)
-- ============================================
INSERT INTO shift_swap_requests (requester_id, requester_shift_id, requested_id, requested_shift_id, status, reason) VALUES
(1, 11, 23, 29, 'pending', 'Doctor appointment on that day'),
(3, 13, 4, 31, 'pending', 'Family event in the evening'),
(5, 20, 6, 21, 'approved', 'Need to switch to afternoon'),
(9, 14, 10, 15, 'pending', 'Prefer evening shift'),
(11, 16, 12, 22, 'denied', 'Schedule conflict with classes'),
(1, 19, 2, 12, 'pending', 'Want day off for birthday'),
(13, 23, 17, 18, 'approved', 'Travel plans'),
(16, 17, 10, 15, 'pending', 'Personal reasons'),
(18, 24, 20, 26, 'pending', 'Need morning availability'),
(19, 25, 14, 9, 'approved', 'Childcare scheduling'),
(21, 27, 5, 20, 'pending', 'Moving to new apartment'),
(22, 28, 3, 13, 'denied', 'Different locations too far'),
(7, 7, 8, 8, 'approved', 'Switching with kitchen colleague'),
(4, 4, 24, 30, 'pending', 'Prefer lunch shifts'),
(17, 18, 9, 14, 'pending', 'Concert tickets for evening'),
(20, 26, 21, 27, 'pending', 'Study group conflict');

-- ============================================
-- Time Off Requests (15+)
-- ============================================
INSERT INTO time_off_requests (employee_id, start_date, end_date, type, status, reason) VALUES
(1, NOW()::DATE + 14, NOW()::DATE + 18, 'vacation', 'pending', 'Family vacation to Florida'),
(2, NOW()::DATE + 7, NOW()::DATE + 7, 'sick', 'approved', 'Dental surgery'),
(3, NOW()::DATE + 21, NOW()::DATE + 25, 'vacation', 'pending', 'Cruise trip'),
(5, NOW()::DATE + 10, NOW()::DATE + 12, 'personal', 'approved', 'Moving to new apartment'),
(6, NOW()::DATE + 30, NOW()::DATE + 37, 'vacation', 'pending', 'Annual family reunion'),
(8, NOW()::DATE + 3, NOW()::DATE + 3, 'sick', 'approved', 'Not feeling well'),
(9, NOW()::DATE + 5, NOW()::DATE + 9, 'vacation', 'denied', 'Short notice - busy period'),
(10, NOW()::DATE + 45, NOW()::DATE + 52, 'vacation', 'pending', 'International travel'),
(12, NOW()::DATE + 8, NOW()::DATE + 8, 'personal', 'approved', 'Car maintenance appointment'),
(14, NOW()::DATE + 20, NOW()::DATE + 22, 'vacation', 'pending', 'Weekend getaway'),
(15, NOW()::DATE + 60, NOW()::DATE + 74, 'vacation', 'pending', 'Extended leave'),
(17, NOW()::DATE + 2, NOW()::DATE + 2, 'sick', 'approved', 'Migraine'),
(19, NOW()::DATE + 15, NOW()::DATE + 17, 'personal', 'pending', 'Graduation ceremony'),
(20, NOW()::DATE + 25, NOW()::DATE + 28, 'vacation', 'pending', 'Camping trip'),
(22, NOW()::DATE + 35, NOW()::DATE + 40, 'vacation', 'approved', 'Honeymoon'),
(23, NOW()::DATE + 4, NOW()::DATE + 4, 'sick', 'pending', 'Doctor follow-up'),
(24, NOW()::DATE + 11, NOW()::DATE + 13, 'personal', 'pending', 'Home renovation');

-- ============================================
-- Availability (15+)
-- ============================================
INSERT INTO availability (employee_id, day_of_week, start_time, end_time, is_available) VALUES
(1, 1, '08:00', '22:00', true),
(1, 2, '08:00', '22:00', true),
(1, 3, '08:00', '16:00', true),
(1, 4, '08:00', '22:00', true),
(1, 5, '08:00', '22:00', true),
(2, 1, '06:00', '18:00', true),
(2, 2, '06:00', '18:00', true),
(2, 3, '06:00', '18:00', true),
(3, 4, '14:00', '23:00', true),
(3, 5, '14:00', '23:00', true),
(3, 6, '14:00', '23:00', true),
(5, 0, '00:00', '00:00', false),
(5, 1, '06:00', '14:00', true),
(5, 2, '06:00', '14:00', true),
(6, 1, '09:00', '17:00', true),
(6, 2, '09:00', '17:00', true),
(6, 3, '09:00', '17:00', true),
(6, 4, '09:00', '17:00', true),
(6, 5, '09:00', '17:00', true),
(9, 1, '10:00', '20:00', true),
(9, 3, '10:00', '20:00', true),
(9, 5, '10:00', '20:00', true),
(10, 4, '16:00', '02:00', true),
(10, 5, '16:00', '02:00', true),
(10, 6, '16:00', '02:00', true);

-- ============================================
-- Breaks (15+)
-- ============================================
INSERT INTO breaks (shift_id, start_time, end_time, break_type, status) VALUES
(1, NOW() - INTERVAL '3 days' + TIME '12:00', NOW() - INTERVAL '3 days' + TIME '12:30', 'meal', 'completed'),
(2, NOW() - INTERVAL '3 days' + TIME '13:00', NOW() - INTERVAL '3 days' + TIME '13:30', 'meal', 'completed'),
(3, NOW() - INTERVAL '2 days' + TIME '19:00', NOW() - INTERVAL '2 days' + TIME '19:15', 'rest', 'completed'),
(4, NOW() - INTERVAL '2 days' + TIME '14:00', NOW() - INTERVAL '2 days' + TIME '14:30', 'meal', 'completed'),
(5, NOW() - INTERVAL '1 day' + TIME '10:00', NOW() - INTERVAL '1 day' + TIME '10:30', 'meal', 'completed'),
(6, NOW() - INTERVAL '1 day' + TIME '12:00', NOW() - INTERVAL '1 day' + TIME '12:30', 'meal', 'completed'),
(7, NOW() - INTERVAL '4 days' + TIME '11:00', NOW() - INTERVAL '4 days' + TIME '11:30', 'meal', 'completed'),
(8, NOW() - INTERVAL '4 days' + TIME '18:00', NOW() - INTERVAL '4 days' + TIME '18:15', 'rest', 'completed'),
(11, NOW()::DATE + TIME '12:00', NOW()::DATE + TIME '12:30', 'meal', 'scheduled'),
(12, NOW()::DATE + TIME '13:00', NOW()::DATE + TIME '13:30', 'meal', 'scheduled'),
(13, NOW()::DATE + TIME '19:00', NOW()::DATE + TIME '19:15', 'rest', 'scheduled'),
(14, NOW()::DATE + TIME '14:30', NOW()::DATE + TIME '15:00', 'meal', 'scheduled'),
(15, NOW()::DATE + TIME '20:00', NOW()::DATE + TIME '20:15', 'rest', 'scheduled'),
(16, NOW()::DATE + TIME '12:30', NOW()::DATE + TIME '13:00', 'meal', 'scheduled'),
(19, NOW() + INTERVAL '1 day' + TIME '12:00', NOW() + INTERVAL '1 day' + TIME '12:30', 'meal', 'scheduled'),
(20, NOW() + INTERVAL '1 day' + TIME '10:00', NOW() + INTERVAL '1 day' + TIME '10:30', 'meal', 'scheduled');

-- ============================================
-- Overtime Records (15+)
-- ============================================
INSERT INTO overtime_records (employee_id, week_start, regular_hours, overtime_hours, double_time_hours, status) VALUES
(1, NOW()::DATE - INTERVAL '7 days', 40.00, 5.50, 0, 'approved'),
(2, NOW()::DATE - INTERVAL '7 days', 40.00, 8.00, 2.00, 'approved'),
(3, NOW()::DATE - INTERVAL '7 days', 38.00, 0, 0, 'approved'),
(5, NOW()::DATE - INTERVAL '7 days', 40.00, 3.00, 0, 'approved'),
(6, NOW()::DATE - INTERVAL '7 days', 40.00, 10.00, 0, 'flagged'),
(8, NOW()::DATE - INTERVAL '7 days', 40.00, 6.00, 0, 'approved'),
(9, NOW()::DATE - INTERVAL '7 days', 36.00, 0, 0, 'approved'),
(10, NOW()::DATE - INTERVAL '7 days', 40.00, 12.00, 4.00, 'flagged'),
(14, NOW()::DATE - INTERVAL '7 days', 40.00, 4.00, 0, 'approved'),
(1, NOW()::DATE - INTERVAL '14 days', 40.00, 2.00, 0, 'approved'),
(2, NOW()::DATE - INTERVAL '14 days', 40.00, 7.00, 0, 'approved'),
(6, NOW()::DATE - INTERVAL '14 days', 40.00, 8.50, 0, 'approved'),
(10, NOW()::DATE - INTERVAL '14 days', 40.00, 9.00, 2.00, 'flagged'),
(15, NOW()::DATE - INTERVAL '14 days', 40.00, 1.50, 0, 'approved'),
(19, NOW()::DATE - INTERVAL '14 days', 40.00, 3.00, 0, 'approved'),
(22, NOW()::DATE - INTERVAL '7 days', 40.00, 6.50, 0, 'pending');

-- ============================================
-- Payroll (15+)
-- ============================================
INSERT INTO payroll (employee_id, period_start, period_end, regular_hours, overtime_hours, gross_pay, deductions, net_pay, status) VALUES
(1, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 7.50, 1688.75, 337.75, 1351.00, 'processed'),
(2, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 15.00, 2255.00, 451.00, 1804.00, 'processed'),
(3, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 76.00, 0, 1520.00, 304.00, 1216.00, 'processed'),
(5, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 3.00, 1478.75, 295.75, 1183.00, 'processed'),
(6, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 18.50, 3017.00, 603.40, 2413.60, 'processed'),
(8, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 6.00, 1869.00, 373.80, 1495.20, 'processed'),
(9, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 72.00, 0, 1368.00, 273.60, 1094.40, 'processed'),
(10, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 21.00, 2397.25, 479.45, 1917.80, 'processed'),
(14, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 4.00, 1978.00, 395.60, 1582.40, 'processed'),
(15, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 1.50, 2220.75, 444.15, 1776.60, 'processed'),
(17, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 64.00, 0, 1120.00, 224.00, 896.00, 'processed'),
(19, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 3.00, 1901.25, 380.25, 1521.00, 'processed'),
(20, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 72.00, 0, 1152.00, 230.40, 921.60, 'processed'),
(22, NOW()::DATE - INTERVAL '14 days', NOW()::DATE - INTERVAL '1 day', 80.00, 6.50, 1884.75, 376.95, 1507.80, 'processed'),
(1, NOW()::DATE - INTERVAL '28 days', NOW()::DATE - INTERVAL '15 days', 80.00, 4.00, 1591.00, 318.20, 1272.80, 'processed'),
(2, NOW()::DATE - INTERVAL '28 days', NOW()::DATE - INTERVAL '15 days', 80.00, 10.00, 2090.00, 418.00, 1672.00, 'processed');

-- ============================================
-- Notifications (15+)
-- ============================================
INSERT INTO notifications (employee_id, type, title, message, is_read) VALUES
(1, 'shift_reminder', 'Upcoming Shift Tomorrow', 'You have a shift scheduled tomorrow from 8:00 AM to 4:00 PM at Downtown Bistro.', false),
(1, 'swap_request', 'Shift Swap Request', 'You have a new shift swap request from Samantha Hill.', false),
(2, 'schedule_change', 'Schedule Updated', 'Your shift on Friday has been updated. Please review the new times.', true),
(3, 'swap_approved', 'Swap Request Approved', 'Your shift swap request has been approved by management.', true),
(5, 'time_off_approved', 'Time Off Approved', 'Your time off request from the 10th to 12th has been approved.', true),
(6, 'overtime_alert', 'Overtime Warning', 'You are approaching 10+ overtime hours this week. Please check with your manager.', false),
(8, 'time_off_approved', 'Sick Leave Approved', 'Your sick leave for tomorrow has been approved.', true),
(9, 'swap_denied', 'Swap Request Denied', 'Your shift swap request was denied due to scheduling conflicts.', false),
(10, 'compliance_alert', 'Compliance Warning', 'You have exceeded the maximum consecutive hours. Please review your schedule.', false),
(12, 'shift_reminder', 'Shift in 2 Days', 'Reminder: You have a shift scheduled in 2 days at Pacific Pier.', false),
(14, 'payroll', 'Payroll Processed', 'Your payroll for the last period has been processed. Check your account.', true),
(15, 'overtime_alert', 'Extended Leave Pending', 'Your extended leave request is still pending review.', false),
(17, 'shift_reminder', 'Shift Today', 'Reminder: Your shift starts at 11:00 AM today at Peachtree Pub.', false),
(19, 'schedule_change', 'New Shift Assigned', 'A new shift has been assigned to you for next week.', false),
(20, 'time_off_pending', 'Time Off Request Received', 'Your camping trip time off request has been submitted and is pending.', false),
(22, 'payroll', 'Payroll Statement Available', 'Your latest payroll statement is now available for review.', true);

-- ============================================
-- Demand Forecasts (15+)
-- ============================================
INSERT INTO demand_forecasts (location_id, forecast_date, hour, predicted_demand, actual_demand, confidence) VALUES
(1, NOW()::DATE, 8, 3.50, 3.00, 0.85),
(1, NOW()::DATE, 12, 8.75, 9.00, 0.92),
(1, NOW()::DATE, 18, 7.20, NULL, 0.88),
(2, NOW()::DATE, 12, 6.50, 7.00, 0.80),
(2, NOW()::DATE, 19, 9.00, NULL, 0.87),
(3, NOW()::DATE, 7, 2.00, 2.50, 0.75),
(3, NOW()::DATE, 12, 7.80, 8.00, 0.91),
(5, NOW()::DATE, 12, 8.00, NULL, 0.89),
(5, NOW()::DATE, 20, 9.50, NULL, 0.93),
(1, NOW()::DATE + 1, 12, 9.00, NULL, 0.82),
(1, NOW()::DATE + 1, 18, 7.80, NULL, 0.84),
(2, NOW()::DATE + 1, 12, 7.00, NULL, 0.78),
(3, NOW()::DATE + 1, 12, 8.20, NULL, 0.86),
(6, NOW()::DATE, 11, 5.50, 5.00, 0.83),
(6, NOW()::DATE, 17, 6.80, NULL, 0.81),
(8, NOW()::DATE, 12, 7.50, 8.00, 0.90),
(10, NOW()::DATE, 18, 8.00, NULL, 0.86),
(14, NOW()::DATE, 19, 9.20, NULL, 0.91);

-- ============================================
-- Compliance Records (15+)
-- ============================================
INSERT INTO compliance_records (employee_id, shift_id, type, description, status, severity) VALUES
(10, 15, 'max_hours', 'Employee exceeded 12 consecutive hours in a shift', 'flagged', 'critical'),
(6, 6, 'overtime_excess', 'Employee has accumulated over 10 hours of overtime this week', 'flagged', 'warning'),
(2, 2, 'break_violation', 'Employee did not take required 30-minute meal break during 8-hour shift', 'resolved', 'warning'),
(1, 1, 'rest_period', 'Less than 8 hours between consecutive shifts', 'flagged', 'warning'),
(10, 15, 'overtime_excess', 'Accumulated 12+ overtime hours with 4 hours double time', 'flagged', 'critical'),
(8, 8, 'break_violation', 'Break taken 15 minutes late', 'resolved', 'info'),
(5, 5, 'minor_labor', 'Shift starts before 7 AM - verify age compliance', 'resolved', 'info'),
(3, 3, 'max_hours', 'Shift ends after midnight - check consecutive day rules', 'flagged', 'warning'),
(14, 9, 'overtime_excess', 'Approaching weekly overtime limit', 'flagged', 'warning'),
(9, 14, 'scheduling_conflict', 'Overlapping shift detected with another assignment', 'resolved', 'warning'),
(6, 21, 'overtime_excess', 'Scheduled for overtime shift while already at 40 regular hours', 'flagged', 'critical'),
(15, 10, 'rest_period', 'Insufficient rest between shifts on consecutive days', 'resolved', 'warning'),
(22, 28, 'max_hours', 'Late night shift may violate local curfew labor laws', 'flagged', 'info'),
(1, 19, 'scheduling_conflict', 'Potential double booking detected', 'flagged', 'warning'),
(17, 18, 'break_violation', 'Break not scheduled for 8-hour shift', 'flagged', 'warning'),
(24, 30, 'rest_period', 'Only 6 hours rest between back-to-back shifts', 'flagged', 'critical');

-- ============================================
-- AI Recommendations (15+)
-- ============================================
INSERT INTO ai_recommendations (type, location_id, title, recommendation, details, status) VALUES
('schedule_optimization', 1, 'Optimize Morning Coverage', 'Add one additional server between 11 AM - 2 PM to handle lunch rush demand.', '{"suggested_employees": [23, 1], "time_slot": "11:00-14:00", "expected_improvement": "15% faster service"}', 'pending'),
('cost_reduction', 1, 'Reduce Overtime Costs', 'Redistribute shifts for James Chen to avoid overtime. Estimated savings: $165/week.', '{"employee_id": 2, "current_overtime": 8, "target_overtime": 0, "weekly_savings": 165}', 'pending'),
('demand_forecast', 2, 'Weekend Staffing Increase', 'Historical data suggests 30% higher demand on Saturdays. Schedule 2 additional staff.', '{"day": "Saturday", "demand_increase": "30%", "additional_staff": 2}', 'approved'),
('compliance', 3, 'Break Schedule Adjustment', 'Multiple break violations detected. Implement automated break reminders.', '{"violations_count": 3, "affected_employees": [5, 6]}', 'pending'),
('schedule_optimization', 5, 'Evening Shift Gap', 'Gap identified between 4-5 PM when demand is rising. Overlap shifts for smoother transition.', '{"gap_start": "16:00", "gap_end": "17:00", "suggested_overlap": 60}', 'pending'),
('cost_reduction', 3, 'Cross-Training Opportunity', 'Training Emily Davis as backup bartender could reduce need for overtime coverage.', '{"employee_id": 5, "current_role": "Server", "suggested_training": "Bartender", "roi_weeks": 8}', 'approved'),
('demand_forecast', 8, 'Holiday Staffing Plan', 'Mardi Gras week requires 50% more staff. Begin scheduling 3 weeks in advance.', '{"event": "Mardi Gras", "staff_increase": "50%", "advance_notice_weeks": 3}', 'pending'),
('schedule_optimization', 10, 'Rain Day Adjustment', 'Seattle location sees 20% drop in customers on rainy days. Reduce staffing accordingly.', '{"weather_impact": "-20%", "suggested_reduction": 1}', 'pending'),
('compliance', 5, 'Overtime Pattern Alert', 'Daniel Thomas has had overtime for 4 consecutive weeks. Risk of burnout and compliance issues.', '{"employee_id": 10, "consecutive_ot_weeks": 4, "total_ot_hours": 42}', 'flagged'),
('cost_reduction', 9, 'Shift Length Optimization', 'Shorter 6-hour shifts during slow periods could save $420/week at Desert Oasis.', '{"current_shift_hours": 8, "suggested_hours": 6, "slow_period": "14:00-16:00", "weekly_savings": 420}', 'pending'),
('demand_forecast', 14, 'Concert Night Surge', 'Nashville location experiences 40% surge on concert nights. Correlate with event calendar.', '{"surge_percentage": 40, "data_source": "historical_sales"}', 'approved'),
('schedule_optimization', 6, 'Split Shift Strategy', 'Pacific Pier could benefit from split shifts during the gap between lunch and dinner service.', '{"gap_period": "14:00-16:30", "potential_savings": "$280/week"}', 'pending'),
('compliance', 1, 'Rest Period Enforcement', 'Downtown Bistro has 3 employees with less than 8 hours between shifts this week.', '{"affected_employees": [1, 2, 23], "minimum_rest_hours": 8}', 'flagged'),
('cost_reduction', 16, 'Seasonal Adjustment', 'Tourist season ending - reduce staff by 2 for the next 3 months at Aloha Lounge.', '{"season": "off-peak", "reduction": 2, "duration_months": 3, "estimated_savings": "$8,400"}', 'pending'),
('schedule_optimization', 4, 'Peak Hour Staggering', 'Stagger start times by 30 minutes to ensure continuous coverage during mountain lodge lunch rush.', '{"current_start": "11:00", "suggested_starts": ["10:30", "11:00", "11:30"], "coverage_improvement": "25%"}', 'pending'),
('demand_forecast', 11, 'Game Day Planning', 'Atlanta location sees 60% increase during home games. Next game in 5 days.', '{"event_type": "sports", "demand_increase": "60%", "days_until": 5}', 'pending');

-- ============================================
-- Departments
-- ============================================
INSERT INTO departments (name, description, manager_name, budget, status) VALUES
('Kitchen', 'Food preparation and cooking staff', 'Marco Rodriguez', 85000.00, 'active'),
('Front of House', 'Servers, hosts, and dining room staff', 'Sarah Mitchell', 72000.00, 'active'),
('Bar', 'Bartenders and bar-back staff', 'James Chen', 45000.00, 'active'),
('Management', 'General managers and shift supervisors', 'Admin User', 120000.00, 'active'),
('Maintenance', 'Cleaning and facility maintenance crew', 'Tom Harris', 35000.00, 'active'),
('Delivery', 'Delivery drivers and dispatchers', 'Lisa Park', 55000.00, 'active'),
('Events', 'Event planning and catering team', 'Diana Foster', 40000.00, 'active'),
('Training', 'New employee onboarding and training', 'Robert Kim', 25000.00, 'inactive');

-- ============================================
-- Shift Templates
-- ============================================
INSERT INTO shift_templates (name, location_id, start_time, end_time, break_duration, shift_type, required_employees, days_of_week, status) VALUES
('Morning Opening', 1, '06:00', '14:00', 30, 'regular', 3, '[1,2,3,4,5]', 'active'),
('Afternoon Service', 1, '11:00', '19:00', 45, 'regular', 4, '[1,2,3,4,5,6]', 'active'),
('Evening Close', 1, '16:00', '00:00', 30, 'regular', 5, '[1,2,3,4,5,6,0]', 'active'),
('Weekend Brunch', 2, '08:00', '15:00', 30, 'regular', 6, '[0,6]', 'active'),
('Night Shift', 3, '22:00', '06:00', 45, 'night', 2, '[1,2,3,4,5]', 'active'),
('Holiday Special', 1, '10:00', '22:00', 60, 'holiday', 8, '[]', 'active'),
('Quick Cover', 4, '12:00', '18:00', 15, 'regular', 2, '[1,2,3,4,5]', 'active'),
('Double Shift', 5, '08:00', '20:00', 60, 'overtime', 3, '[5,6]', 'inactive');

-- ============================================
-- Time Clock (sample entries)
-- ============================================
INSERT INTO time_clock (employee_id, location_id, clock_in, clock_out, total_hours, status, notes) VALUES
(1, 1, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '30 minutes', 7.50, 'clocked_out', NULL),
(2, 1, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 hour', 5.00, 'clocked_out', NULL),
(3, 2, NOW() - INTERVAL '4 hours', NULL, NULL, 'clocked_in', 'Covering for Amy'),
(5, 3, NOW() - INTERVAL '3 hours', NULL, NULL, 'clocked_in', NULL),
(8, 1, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '2 hours', 5.00, 'clocked_out', NULL),
(10, 4, NOW() - INTERVAL '5 hours', NULL, NULL, 'clocked_in', 'Training new staff'),
(12, 2, NOW() - INTERVAL '9 hours', NOW() - INTERVAL '1 hour', 8.00, 'clocked_out', NULL),
(15, 5, NOW() - INTERVAL '2 hours', NULL, NULL, 'clocked_in', NULL);

-- ============================================
-- Announcements
-- ============================================
INSERT INTO announcements (title, content, priority, category, author_name, is_pinned, expires_at) VALUES
('New Schedule System Launch', 'We are excited to announce the launch of our new AI-powered scheduling system! All managers should familiarize themselves with the new features by end of week.', 'urgent', 'general', 'Admin User', true, NULL),
('Holiday Schedule Reminder', 'Please submit all holiday time-off requests by the end of this month. Late requests may not be accommodated.', 'high', 'schedule', 'Sarah Mitchell', true, NOW() + INTERVAL '30 days'),
('Updated Break Policy', 'Effective immediately, all shifts over 6 hours require a minimum 30-minute break. Please ensure compliance.', 'normal', 'policy', 'Admin User', false, NULL),
('Staff Appreciation Event', 'Join us for a team appreciation dinner next Friday at 7 PM at the Downtown Bistro! RSVP to your manager.', 'normal', 'event', 'Diana Foster', false, NOW() + INTERVAL '10 days'),
('Kitchen Equipment Maintenance', 'The walk-in cooler at Harbor Grill will be serviced on Monday from 6-8 AM. Plan food prep accordingly.', 'high', 'maintenance', 'Tom Harris', false, NOW() + INTERVAL '3 days'),
('New Uniform Policy', 'Starting next month, all front-of-house staff must wear the new branded uniforms. See your manager for sizing.', 'low', 'policy', 'Sarah Mitchell', false, NOW() + INTERVAL '45 days'),
('Training Session: Food Safety', 'Mandatory food safety refresher training scheduled for all kitchen staff. Multiple sessions available.', 'normal', 'general', 'Robert Kim', false, NOW() + INTERVAL '14 days');

-- ============================================
-- Audit Log
-- ============================================
INSERT INTO audit_log (action, entity_type, entity_id, user_name, details) VALUES
('create', 'employee', 1, 'Admin User', '{"name": "John Smith", "position": "Line Cook"}'),
('create', 'employee', 2, 'Admin User', '{"name": "Maria Garcia", "position": "Server"}'),
('update', 'shift', 5, 'Admin User', '{"field": "status", "old": "scheduled", "new": "completed"}'),
('create', 'location', 1, 'Admin User', '{"name": "Downtown Bistro"}'),
('approve', 'time_off', 1, 'Admin User', '{"employee": "John Smith", "dates": "2024-01-15 to 2024-01-17"}'),
('clock_in', 'time_clock', 3, 'Admin User', '{"employee": "David Lee", "location": "Harbor Grill"}'),
('create', 'department', 1, 'Admin User', '{"name": "Kitchen"}'),
('update', 'employee', 5, 'Admin User', '{"field": "hourly_rate", "old": 15.00, "new": 17.50}'),
('delete', 'shift', 12, 'Admin User', '{"reason": "Cancelled due to low demand"}'),
('login', 'user', 1, 'Admin User', '{"ip": "192.168.1.1"}'),
('create', 'announcement', 1, 'Admin User', '{"title": "New Schedule System Launch"}'),
('clock_out', 'time_clock', 1, 'Admin User', '{"employee": "John Smith", "hours": 7.5}');

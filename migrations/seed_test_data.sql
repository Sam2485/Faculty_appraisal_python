-- Test seed data for local development
-- Password for all users: Admin@123

INSERT INTO faculty_profiles (email, full_name, password_hash, appraisal_role, school, department, designation, employee_id, qualification, teaching_experience, phone, is_verified)
VALUES
  ('priya.sharma@dypatil.edu',   'Dr. Priya Sharma',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCSEA', 'Computer Science',  'Assistant Professor', 'EMP001', 'Ph.D Computer Science',    '8 Years',  '9876543201', true),
  ('rohit.verma@dypatil.edu',    'Prof. Rohit Verma',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCSEA', 'Computer Science',  'Assistant Professor', 'EMP002', 'M.Tech',                   '5 Years',  '9876543202', true),
  ('meena.patil@dypatil.edu',    'Dr. Meena Patil',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCSEA', 'IT',                'Associate Professor', 'EMP003', 'Ph.D IT',                  '12 Years', '9876543203', true),
  ('suresh.naik@dypatil.edu',    'Dr. Suresh Naik',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'SoCSEA', 'Computer Science',  'Professor & HOD',     'EMP010', 'Ph.D',                     '18 Years', '9876543210', true),
  ('anita.desai@dypatil.edu',    'Prof. Anita Desai',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoBB',   'Management',        'Assistant Professor', 'EMP004', 'MBA',                      '6 Years',  '9876543204', true),
  ('vikram.joshi@dypatil.edu',   'Dr. Vikram Joshi',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'SoBB',   'Management',        'Professor & HOD',     'EMP011', 'Ph.D Management',          '20 Years', '9876543211', true),
  ('lakshmi.rao@dypatil.edu',    'Dr. Lakshmi Rao',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCE',   'Civil Engineering', 'Associate Professor', 'EMP005', 'Ph.D Civil',               '10 Years', '9876543205', true),
  ('amit.kulkarni@dypatil.edu',  'Prof. Amit Kulkarni', '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoMCS',  'Media Studies',     'Assistant Professor', 'EMP006', 'M.A. Mass Communication',  '4 Years',  '9876543206', true),
  ('deepa.menon@dypatil.edu',    'Dr. Deepa Menon',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'director',          'SoCSEA', 'Computer Science',  'Director',            'EMP020', 'Ph.D',                     '22 Years', '9876543220', true),
  ('rajesh.kumar@dypatil.edu',   'Dr. Rajesh Kumar',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'director',          'SoBB',   'Management',        'Director',            'EMP021', 'Ph.D',                     '25 Years', '9876543221', true),
  ('sunita.rao@dypatil.edu',     'Prof. Sunita Rao',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'dean',              'SoCSEA', 'Engineering',       'Dean of Academics',   'EMP030', 'Ph.D',                     '28 Years', '9876543230', true),
  ('mohan.singh@dypatil.edu',    'Mr. Mohan Singh',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'registrar',         NULL,     'Administration',    'Registrar',           'EMP031', 'MBA, LLB',                 '15 Years', '9876543231', true),
  ('arun.mehta@dypatil.edu',     'Dr. Arun Mehta',      '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'vc',                NULL,     'Administration',    'Vice Chancellor',     'EMP040', 'Ph.D',                     '35 Years', '9876543240', true),
  ('ravi.shinde@dypatil.edu',    'Mr. Ravi Shinde',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'non_teaching_staff',NULL,     'Administration',    'Lab Assistant',       'EMP050', 'B.Sc',                     '7 Years',  '9876543250', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO appraisal_config (academic_year, is_open, submission_start, submission_end)
VALUES
  ('2024-25', true,  '2025-01-01 00:00:00+05:30', '2025-06-30 23:59:59+05:30'),
  ('2023-24', false, '2024-01-01 00:00:00+05:30', '2024-06-30 23:59:59+05:30'),
  ('2022-23', false, '2023-01-01 00:00:00+05:30', '2023-06-30 23:59:59+05:30')
ON CONFLICT (academic_year) DO NOTHING;

INSERT INTO declarations (faculty_email, academic_year, part_a_total, part_b_total, grand_total, status)
VALUES
  ('priya.sharma@dypatil.edu',  '2024-25', 142, 185, 327, 'Submitted'),
  ('rohit.verma@dypatil.edu',   '2024-25', 115, 140, 255, 'Submitted'),
  ('meena.patil@dypatil.edu',   '2024-25', 155, 210, 365, 'HOD Reviewed'),
  ('anita.desai@dypatil.edu',   '2024-25', 130, 160, 290, 'Submitted'),
  ('lakshmi.rao@dypatil.edu',   '2024-25', 120, 175, 295, 'Director Reviewed'),
  ('amit.kulkarni@dypatil.edu', '2024-25',  98, 120, 218, 'Pending Review'),
  ('priya.sharma@dypatil.edu',  '2023-24', 138, 178, 316, 'VC Reviewed'),
  ('meena.patil@dypatil.edu',   '2023-24', 148, 195, 343, 'VC Reviewed')
ON CONFLICT (faculty_email, academic_year) DO NOTHING;

INSERT INTO appraisal_reviews (faculty_email, academic_year, reviewer_email, reviewer_role, part_a_score, part_b_score, total_score, remarks, status)
VALUES
  ('priya.sharma@dypatil.edu', '2024-25', 'suresh.naik@dypatil.edu', 'hod',      138, 180, 318, 'Good performance overall.',   'HOD Reviewed'),
  ('meena.patil@dypatil.edu',  '2024-25', 'suresh.naik@dypatil.edu', 'hod',      150, 205, 355, 'Excellent research output.',  'HOD Reviewed'),
  ('meena.patil@dypatil.edu',  '2024-25', 'deepa.menon@dypatil.edu', 'director', 148, 200, 348, 'Consistent high performer.',  'Director Reviewed'),
  ('lakshmi.rao@dypatil.edu',  '2024-25', 'deepa.menon@dypatil.edu', 'director', 118, 170, 288, 'Satisfactory.',               'Director Reviewed'),
  ('priya.sharma@dypatil.edu', '2023-24', 'suresh.naik@dypatil.edu', 'hod',      135, 175, 310, 'Good.',                       'VC Reviewed'),
  ('priya.sharma@dypatil.edu', '2023-24', 'deepa.menon@dypatil.edu', 'director', 133, 172, 305, 'Solid contributions.',        'VC Reviewed'),
  ('priya.sharma@dypatil.edu', '2023-24', 'sunita.rao@dypatil.edu',  'dean',     132, 170, 302, 'Recommended for promotion.',  'VC Reviewed'),
  ('priya.sharma@dypatil.edu', '2023-24', 'arun.mehta@dypatil.edu',  'vc',       130, 168, 298, 'Approved.',                   'VC Reviewed')
ON CONFLICT (faculty_email, academic_year, reviewer_role) DO NOTHING;

INSERT INTO announcements (title, body, audience, is_active, created_by)
VALUES
  ('Appraisal Submission Open 2024-25', 'All faculty members are requested to submit their self-appraisal forms for 2024-25 by 30th June 2025. Please ensure all sections are filled accurately.', 'faculty', true, 'admin@dypatil.edu'),
  ('HOD Review Deadline', 'All HODs must complete the review of department faculty appraisals by 15th July 2025.', 'hod', true, 'admin@dypatil.edu'),
  ('Faculty Development Programme', 'A two-day FDP on Research Methodology will be conducted on 20-21 June 2025. All faculty are encouraged to participate.', 'all', true, 'admin@dypatil.edu'),
  ('Non-Teaching Staff Appraisal', 'Non-teaching staff appraisal forms for 2024-25 are now available. Please complete and submit before 30th June 2025.', 'non_teaching_staff', true, 'admin@dypatil.edu')
ON CONFLICT DO NOTHING;

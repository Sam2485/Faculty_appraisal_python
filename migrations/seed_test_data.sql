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
  ('ravi.shinde@dypatil.edu',    'Mr. Ravi Shinde',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'non_teaching_staff',NULL,     'Administration',    'Lab Assistant',       'EMP050', 'B.Sc',                     '7 Years',  '9876543250', true),

  -- SoCSEA (additional)
  ('neha.gokhale@dypatil.edu',   'Dr. Neha Gokhale',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCSEA', 'Data Science',      'Assistant Professor', 'EMP051', 'Ph.D Data Science',        '3 Years',  '9876543251', true),
  ('sanjay.More@dypatil.edu',    'Prof. Sanjay More',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCSEA', 'Cybersecurity',     'Assistant Professor', 'EMP052', 'M.Tech Cybersecurity',     '5 Years',  '9876543252', true),
  ('pooja.deshpande@dypatil.edu','Ms. Pooja Deshpande', '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCSEA', 'AI & ML',           'Lecturer',            'EMP053', 'M.Tech AI',                '2 Years',  '9876543253', false),

  -- SoCE
  ('arjun.sawant@dypatil.edu',   'Dr. Arjun Sawant',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'SoCE',   'Civil Engineering', 'Professor & HOD',     'EMP054', 'Ph.D Structural Engg',     '16 Years', '9876543254', true),
  ('prerna.kapoor@dypatil.edu',  'Prof. Prerna Kapoor', '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCE',   'Structural Engg',   'Associate Professor', 'EMP055', 'M.Tech Structures',        '9 Years',  '9876543255', true),
  ('dinesh.wagh@dypatil.edu',    'Mr. Dinesh Wagh',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoCE',   'Transportation',    'Assistant Professor', 'EMP056', 'M.E. Transportation',      '4 Years',  '9876543256', false),
  ('kavita.bhosle@dypatil.edu',  'Dr. Kavita Bhosle',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'director',          'SoCE',   'Civil Engineering', 'Director',            'EMP057', 'Ph.D',                     '21 Years', '9876543257', true),

  -- SoEMR
  ('harish.pawar@dypatil.edu',   'Dr. Harish Pawar',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'SoEMR',  'Electronics',       'Professor & HOD',     'EMP058', 'Ph.D Electronics',         '14 Years', '9876543258', true),
  ('shruti.iyer@dypatil.edu',    'Prof. Shruti Iyer',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoEMR',  'Mechanical Engg',   'Assistant Professor', 'EMP059', 'M.Tech Mechanical',        '6 Years',  '9876543259', true),
  ('omkar.kulkarni@dypatil.edu', 'Mr. Omkar Kulkarni',  '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoEMR',  'Robotics',          'Lecturer',            'EMP060', 'M.Tech Robotics',          '1 Year',   '9876543260', false),
  ('nandini.joshi@dypatil.edu',  'Dr. Nandini Joshi',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'director',          'SoEMR',  'Electronics',       'Director',            'EMP061', 'Ph.D',                     '19 Years', '9876543261', true),

  -- SoC
  ('prasad.kulkarni@dypatil.edu','Dr. Prasad Kulkarni', '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'SoC',    'Commerce',          'Professor & HOD',     'EMP062', 'Ph.D Commerce',            '17 Years', '9876543262', true),
  ('rekha.nair@dypatil.edu',     'Prof. Rekha Nair',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoC',    'Accounting',        'Associate Professor', 'EMP063', 'M.Com, Ph.D',              '11 Years', '9876543263', true),
  ('vivek.tiwari@dypatil.edu',   'Mr. Vivek Tiwari',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoC',    'Finance',           'Assistant Professor', 'EMP064', 'MBA Finance',              '4 Years',  '9876543264', true),

  -- CISR
  ('alka.mishra@dypatil.edu',    'Dr. Alka Mishra',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'CISR',   'International Rel', 'Professor & HOD',     'EMP065', 'Ph.D International Rel',   '13 Years', '9876543265', true),
  ('gaurav.pandey@dypatil.edu',  'Prof. Gaurav Pandey', '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'CISR',   'Security Studies',  'Assistant Professor', 'EMP066', 'M.A. Security Studies',    '5 Years',  '9876543266', true),
  ('ritu.sharma@dypatil.edu',    'Ms. Ritu Sharma',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'CISR',   'Diplomacy',         'Lecturer',            'EMP067', 'M.A. Diplomacy',           '2 Years',  '9876543267', false),

  -- SoMCS (additional)
  ('tejal.deshpande@dypatil.edu','Dr. Tejal Deshpande', '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'SoMCS',  'Media Studies',     'Professor & HOD',     'EMP068', 'Ph.D Media',               '15 Years', '9876543268', true),
  ('nikhil.shah@dypatil.edu',    'Prof. Nikhil Shah',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoMCS',  'Journalism',        'Assistant Professor', 'EMP069', 'M.A. Journalism',          '6 Years',  '9876543269', true),
  ('sneha.patil@dypatil.edu',    'Ms. Sneha Patil',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoMCS',  'Film & Television', 'Lecturer',            'EMP070', 'M.F.A.',                   '3 Years',  '9876543270', true),

  -- CioD
  ('aditya.rane@dypatil.edu',    'Prof. Aditya Rane',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'CioD',   'Industrial Design', 'Professor & HOD',     'EMP071', 'M.Des Industrial Design',  '12 Years', '9876543271', true),
  ('pallavi.kadam@dypatil.edu',  'Ms. Pallavi Kadam',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'CioD',   'Product Design',    'Assistant Professor', 'EMP072', 'M.Des Product Design',     '4 Years',  '9876543272', true),
  ('sameer.gawde@dypatil.edu',   'Mr. Sameer Gawde',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'CioD',   'UI/UX Design',      'Lecturer',            'EMP073', 'B.Des, M.Des',             '2 Years',  '9876543273', false),
  ('madhuri.karnik@dypatil.edu', 'Dr. Madhuri Karnik',  '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'director',          'CioD',   'Design',            'Director',            'EMP074', 'Ph.D Design',              '20 Years', '9876543274', true),

  -- SoAA
  ('farhan.qureshi@dypatil.edu', 'Prof. Farhan Qureshi','$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'hod',               'SoAA',   'Architecture',      'Professor & HOD',     'EMP075', 'M.Arch',                   '14 Years', '9876543275', true),
  ('divya.bhat@dypatil.edu',     'Ms. Divya Bhat',      '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoAA',   'Urban Design',      'Assistant Professor', 'EMP076', 'M.Arch Urban Design',      '5 Years',  '9876543276', true),
  ('rahul.chitale@dypatil.edu',  'Mr. Rahul Chitale',   '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoAA',   'Interior Design',   'Lecturer',            'EMP077', 'B.Arch, M.Des',            '3 Years',  '9876543277', false),

  -- SoBB (additional)
  ('leena.gupte@dypatil.edu',    'Dr. Leena Gupte',     '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoBB',   'Marketing',         'Associate Professor', 'EMP078', 'Ph.D Marketing',           '10 Years', '9876543278', true),
  ('sachin.parab@dypatil.edu',   'Prof. Sachin Parab',  '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'faculty',           'SoBB',   'HR Management',     'Assistant Professor', 'EMP079', 'MBA HR',                   '7 Years',  '9876543279', true),

  -- Non-teaching (additional)
  ('sundar.rao@dypatil.edu',     'Mr. Sundar Rao',      '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'non_teaching_staff',NULL,     'Administration',    'Office Assistant',    'EMP080', 'B.Com',                    '5 Years',  '9876543280', true),
  ('meera.kamble@dypatil.edu',   'Ms. Meera Kamble',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'non_teaching_staff',NULL,     'Library',           'Librarian',           'EMP081', 'M.Lib.I.Sc',               '9 Years',  '9876543281', true),
  ('ashok.jadhav@dypatil.edu',   'Mr. Ashok Jadhav',    '$2b$12$Qk9I.wQ/OeiysgVkgfemJO9IQlPeSbG6g2jBBkyOqXFlIVXEkUyDW', 'non_teaching_staff',NULL,     'IT Support',        'System Administrator','EMP082', 'B.E. IT',                  '6 Years',  '9876543282', false)
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

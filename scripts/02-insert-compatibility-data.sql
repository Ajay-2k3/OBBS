-- Insert blood compatibility data
INSERT INTO public.blood_compatibility (recipient_type, donor_type, is_compatible, compatibility_score) VALUES
-- O- recipients (universal recipient for plasma, can only receive O-)
('O-', 'O-', true, 10),
('O-', 'O+', false, 0),
('O-', 'A-', false, 0),
('O-', 'A+', false, 0),
('O-', 'B-', false, 0),
('O-', 'B+', false, 0),
('O-', 'AB-', false, 0),
('O-', 'AB+', false, 0),

-- O+ recipients
('O+', 'O-', true, 9),
('O+', 'O+', true, 10),
('O+', 'A-', false, 0),
('O+', 'A+', false, 0),
('O+', 'B-', false, 0),
('O+', 'B+', false, 0),
('O+', 'AB-', false, 0),
('O+', 'AB+', false, 0),

-- A- recipients
('A-', 'O-', true, 8),
('A-', 'O+', false, 0),
('A-', 'A-', true, 10),
('A-', 'A+', false, 0),
('A-', 'B-', false, 0),
('A-', 'B+', false, 0),
('A-', 'AB-', false, 0),
('A-', 'AB+', false, 0),

-- A+ recipients
('A+', 'O-', true, 7),
('A+', 'O+', true, 8),
('A+', 'A-', true, 9),
('A+', 'A+', true, 10),
('A+', 'B-', false, 0),
('A+', 'B+', false, 0),
('A+', 'AB-', false, 0),
('A+', 'AB+', false, 0),

-- B- recipients
('B-', 'O-', true, 8),
('B-', 'O+', false, 0),
('B-', 'A-', false, 0),
('B-', 'A+', false, 0),
('B-', 'B-', true, 10),
('B-', 'B+', false, 0),
('B-', 'AB-', false, 0),
('B-', 'AB+', false, 0),

-- B+ recipients
('B+', 'O-', true, 7),
('B+', 'O+', true, 8),
('B+', 'A-', false, 0),
('B+', 'A+', false, 0),
('B+', 'B-', true, 9),
('B+', 'B+', true, 10),
('B+', 'AB-', false, 0),
('B+', 'AB+', false, 0),

-- AB- recipients
('AB-', 'O-', true, 6),
('AB-', 'O+', false, 0),
('AB-', 'A-', true, 8),
('AB-', 'A+', false, 0),
('AB-', 'B-', true, 8),
('AB-', 'B+', false, 0),
('AB-', 'AB-', true, 10),
('AB-', 'AB+', false, 0),

-- AB+ recipients (universal recipient)
('AB+', 'O-', true, 5),
('AB+', 'O+', true, 6),
('AB+', 'A-', true, 7),
('AB+', 'A+', true, 8),
('AB+', 'B-', true, 7),
('AB+', 'B+', true, 8),
('AB+', 'AB-', true, 9),
('AB+', 'AB+', true, 10);

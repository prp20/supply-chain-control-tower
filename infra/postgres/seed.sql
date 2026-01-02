-- CLEAN START
TRUNCATE suppliers, parts, supplier_parts, inventory RESTART IDENTITY CASCADE;

-- SUPPLIERS
INSERT INTO suppliers (name, country, city, latitude, longitude) VALUES
('Bosch USA', 'USA', 'Detroit', 42.3314, -83.0458),
('Bosch Germany', 'Germany', 'Stuttgart', 48.7758, 9.1829),
('Denso', 'Japan', 'Nagoya', 35.1815, 136.9066),
('CATL', 'China', 'Ningde', 26.6618, 119.5226),
('Motherson', 'India', 'Noida', 28.5355, 77.3910),
('LG Energy', 'South Korea', 'Seoul', 37.5665, 126.9780),
('Valeo', 'France', 'Paris', 48.8566, 2.3522),
('Nemak', 'Mexico', 'Monterrey', 25.6866, -100.3161);

-- PARTS
INSERT INTO parts (part_name, criticality, unit_cost) VALUES
('Engine', 'HIGH', 5000),
('Transmission', 'HIGH', 3200),
('Battery Pack', 'HIGH', 4500),
('ECU', 'MEDIUM', 900),
('Brake System', 'HIGH', 1200),
('Steering System', 'MEDIUM', 800),
('Suspension', 'MEDIUM', 1100),
('Infotainment', 'LOW', 700),
('Fuel System', 'MEDIUM', 1500),
('Wiring Harness', 'HIGH', 600);

-- SUPPLIER ↔ PART MAPPING
INSERT INTO supplier_parts (supplier_id, part_id, lead_time_days, capacity_per_day)
VALUES
(1, 1, 5, 50),
(2, 1, 12, 40),
(3, 4, 7, 200),
(4, 3, 15, 100),
(5, 10, 10, 300),
(6, 2, 8, 60),
(7, 3, 14, 120),
(8, 5, 6, 80);

-- INVENTORY
INSERT INTO inventory (part_id, quantity)
SELECT id,
       CASE
           WHEN criticality = 'HIGH' THEN 200
           WHEN criticality = 'MEDIUM' THEN 400
           ELSE 800
       END
FROM parts;

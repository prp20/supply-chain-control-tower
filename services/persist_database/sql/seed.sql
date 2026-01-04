INSERT INTO suppliers (name, country, city, office_latitude, office_longitude, max_daily_capacity)
VALUES
('Pacific Auto Components', 'USA', 'Los Angeles, CA', 34.0522, -118.2437, 500),
('Southwest Drive Systems', 'USA', 'Phoenix, AZ', 33.4484, -112.0740, 420),
('Gulf Coast Auto Supply', 'USA', 'Houston, TX', 29.7604, -95.3698, 480),
('Bay Area Mobility Parts', 'USA', 'San Jose, CA', 37.3382, -121.8863, 450),
('Rocky Mountain AutoTech', 'USA', 'Denver, CO', 39.7392, -104.9903, 400),
('Southeast Vehicle Systems', 'USA', 'Atlanta, GA', 33.7490, -84.3880, 430)
ON CONFLICT (name) DO NOTHING;


INSERT INTO parts (name, criticality, cost_per_piece)
VALUES
('Engine Control Unit', 'CRITICAL', 1200),
('Transmission Assembly', 'CRITICAL', 2500),
('Brake System', 'HIGH', 800),
('Steering Rack', 'HIGH', 600),
('Suspension Assembly', 'MEDIUM', 700),
('Airbag Module', 'CRITICAL', 900),
('Fuel Pump', 'HIGH', 400),
('Battery Pack', 'CRITICAL', 3000),
('Radiator', 'MEDIUM', 500),
('Exhaust System', 'LOW', 300)
ON CONFLICT (name) DO NOTHING;


INSERT INTO supplier_parts (supplier_id, part_id)
VALUES
-- Engine Control Unit
(1,1),(4,1),

-- Transmission Assembly
(2,2),(5,2),

-- Brake System
(1,3),(6,3),

-- Steering Rack
(3,4),(5,4),

-- Suspension Assembly
(4,5),(6,5),

-- Airbag Module
(2,6),(3,6),

-- Fuel Pump
(1,7),(5,7),

-- Battery Pack
(4,8),(6,8),

-- Radiator
(3,9),(2,9),

-- Exhaust System
(6,10),(1,10)
ON CONFLICT (supplier_id, part_id) DO NOTHING;

INSERT INTO inventory (part_id, minimum_required, current_stock, criticality)
VALUES
(1, 50, 120, 'CRITICAL'),
(2, 40, 90, 'CRITICAL'),
(3, 60, 150, 'HIGH'),
(4, 50, 110, 'HIGH'),
(5, 70, 160, 'MEDIUM'),
(6, 30, 80, 'CRITICAL'),
(7, 60, 140, 'HIGH'),
(8, 20, 60, 'CRITICAL'),
(9, 50, 130, 'MEDIUM'),
(10, 80, 200, 'LOW')
ON CONFLICT (part_id) DO NOTHING;

INSERT INTO vehicles (vehicle_make, driver_name)
VALUES
('Volvo FH', 'John Miller'),
('Scania R500', 'Alex Rodriguez'),
('Mercedes Actros', 'Sven Karlsson'),
('MAN TGX', 'Robert Brown')
ON CONFLICT DO NOTHING;

INSERT INTO trips (
    vehicle_id,
    start_lat,
    start_long,
    dest_lat,
    dest_long,
    route,
    part_id,
    Number_of_parts,
    trip_cost_estimate,
    trip_status
)
VALUES
-- Los Angeles → Detroit
(1, 34.0522, -118.2437, 42.3314, -83.0458, '{}'::jsonb, 1, 20, 15000, 'YET_TO_START'),

-- Phoenix → Detroit
(2, 33.4484, -112.0740, 42.3314, -83.0458, '{}'::jsonb, 2, 15, 14000, 'YET_TO_START'),

-- Houston → Detroit
(3, 29.7604, -95.3698, 42.3314, -83.0458, '{}'::jsonb, 3, 30, 11000, 'YET_TO_START'),

-- San Jose → Detroit
(4, 37.3382, -121.8863, 42.3314, -83.0458, '{}'::jsonb, 8, 10, 18000, 'YET_TO_START')
ON CONFLICT DO NOTHING;



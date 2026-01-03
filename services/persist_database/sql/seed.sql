INSERT INTO suppliers (name, country, city, office_latitude, office_longitude, max_daily_capacity)
VALUES
('Detroit Auto Supplies', 'USA', 'Detroit', 42.3314, -83.0458, 500),
('Bavarian Motors Supply', 'Germany', 'Munich', 48.1351, 11.5820, 400),
('Tokyo Precision Parts', 'Japan', 'Tokyo', 35.6762, 139.6503, 450),
('Monterrey Auto Components', 'Mexico', 'Monterrey', 25.6866, -100.3161, 350),
('Seoul Mobility Systems', 'South Korea', 'Seoul', 37.5665, 126.9780, 420),
('Pune AutoTech', 'India', 'Pune', 18.5204, 73.8567, 380);

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
('Exhaust System', 'LOW', 300);


INSERT INTO supplier_parts (supplier_id, part_id)
VALUES
-- ECU
(1,1),(2,1),
-- Transmission
(2,2),(3,2),
-- Brake
(1,3),(4,3),
-- Steering
(3,4),(5,4),
-- Suspension
(4,5),(6,5),
-- Airbag
(2,6),(3,6),
-- Fuel Pump
(1,7),(6,7),
-- Battery
(5,8),(3,8),
-- Radiator
(4,9),(6,9),
-- Exhaust
(1,10),(4,10);

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
(10, 80, 200, 'LOW');

INSERT INTO vehicles (vehicle_make, driver_name)
VALUES
('Volvo FH', 'John Miller'),
('Scania R500', 'Alex Rodriguez'),
('Mercedes Actros', 'Sven Karlsson'),
('MAN TGX', 'Robert Brown');

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
(1, 48.1351, 11.5820, 42.3314, -83.0458, '{}'::jsonb, 1, 20, 15000, 'YET_TO_START'),
(2, 35.6762, 139.6503, 42.3314, -83.0458, '{}'::jsonb, 2, 15, 20000, 'YET_TO_START'),
(3, 25.6866, -100.3161, 42.3314, -83.0458, '{}'::jsonb, 3, 30, 12000, 'YET_TO_START'),
(4, 18.5204, 73.8567, 42.3314, -83.0458, '{}'::jsonb, 8, 10, 25000, 'YET_TO_START');


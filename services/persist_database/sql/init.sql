-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    office_latitude NUMERIC,
    office_longitude NUMERIC,
    max_daily_capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE suppliers
ADD CONSTRAINT unique_supplier_name UNIQUE (name);

-- Parts
CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    criticality TEXT CHECK (
        criticality IN ('CRITICAL','HIGH','MEDIUM','LOW')
    ),
    cost_per_piece NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE parts
ADD CONSTRAINT unique_part_name UNIQUE (name);

-- Supplier ↔ Parts
CREATE TABLE IF NOT EXISTS supplier_parts (
    supplier_id INT REFERENCES suppliers(id),
    part_id INT REFERENCES parts(id),
    PRIMARY KEY (supplier_id, part_id)
);


-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    part_id INT REFERENCES parts(id),
    minimum_required INT,
    current_stock INT,
    criticality TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE inventory
ADD CONSTRAINT unique_inventory_part UNIQUE (part_id);

-- Vehicles available
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_make TEXT,
    driver_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id),
    start_lat NUMERIC,
    start_long NUMERIC,
    dest_lat NUMERIC,
    dest_long NUMERIC,
    route JSONB,
    part_id INT REFERENCES parts(id),
    Number_of_parts INT,
    trip_cost_estimate NUMERIC,
    trip_status TEXT DEFAULT 'YET_TO_START',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE trips
ADD CONSTRAINT unique_vehicle_trip UNIQUE (vehicle_id, part_id, trip_status);

CREATE TABLE IF NOT EXISTS inventory_analysis (
    id SERIAL PRIMARY KEY,
    part_id INT REFERENCES parts(id),
    health_score INT,
    risk_level TEXT,
    stock_gap INT,
    supplier_risk BOOLEAN,
    recommendation TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


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

-- Vehicles available
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_make TEXT,
    driver_name TEXT,
    driver_dl_id TEXT UNIQUE,
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
    trip_cost_estimate NUMERIC,
    trip_status TEXT DEFAULT 'YET_TO_START',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


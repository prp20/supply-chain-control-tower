-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT,
    latitude NUMERIC,
    longitude NUMERIC
);

-- Parts
CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    part_name TEXT NOT NULL,
    criticality TEXT CHECK (criticality IN ('HIGH','MEDIUM','LOW')),
    unit_cost NUMERIC
);

-- Supplier ↔ Parts
CREATE TABLE IF NOT EXISTS supplier_parts (
    id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(id),
    part_id INT REFERENCES parts(id),
    lead_time_days INT,
    capacity_per_day INT
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    part_id INT REFERENCES parts(id),
    quantity INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS supply_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT,
    entity_id TEXT,
    severity TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

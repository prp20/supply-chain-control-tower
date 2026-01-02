from fastapi import FastAPI
import psycopg2
import os

app = FastAPI(title="Data Service")

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "postgres"),
    "dbname": os.getenv("POSTGRES_DB", "plant_ai"),
    "user": os.getenv("POSTGRES_USER", "plant_user"),
    "password": os.getenv("POSTGRES_PASSWORD", "plant_pass"),
}

# ---------------------------
# Health Check
# ---------------------------
@app.get("/health")
def health():
    return {"status": "data-service healthy"}

# ---------------------------
# Get Parts
# ---------------------------
@app.get("/parts")
def get_parts():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, part_name, criticality, unit_cost
        FROM parts
        ORDER BY id
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "id": r[0],
            "part_name": r[1],
            "criticality": r[2],
            "unit_cost": float(r[3])
        }
        for r in rows
    ]

# ---------------------------
# Get Suppliers
# ---------------------------
@app.get("/suppliers")
def get_suppliers():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, country, city
        FROM suppliers
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "id": r[0],
            "name": r[1],
            "country": r[2],
            "city": r[3]
        }
        for r in rows
    ]

# ---------------------------
# Inventory Status
# ---------------------------
@app.get("/inventory")
def get_inventory():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT p.part_name, i.quantity, p.criticality
        FROM inventory i
        JOIN parts p ON i.part_id = p.id
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "part": r[0],
            "quantity": r[1],
            "criticality": r[2]
        }
        for r in rows
    ]

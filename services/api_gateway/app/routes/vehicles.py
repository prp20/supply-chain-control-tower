from fastapi import APIRouter
from app.db import get_db_connection

router = APIRouter()

@router.get("/vehicles")
def get_vehicles():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            t.id AS trip_id,
            v.id AS vehicle_id,
            v.vehicle_make,
        FROM trips t
        JOIN vehicles v ON v.id = t.vehicle_id
        WHERE t.route IS NOT NULL
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "trip_id": r[0],
            "vehicle_id": r[1],
            "vehicle_make": r[2]
        }
        for r in rows
    ]
from fastapi import APIRouter
from app.db import get_db_connection

router = APIRouter()

@router.get("/trips")
def get_trips():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            trip_status,
            part_id,
            Number_of_parts,
            trip_cost_estimate
        FROM trips
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "trip_id": r[0],
            "status": r[1],
            "part_id": r[2],
            "quantity": r[3],
            "cost_estimate": r[4]
        }
        for r in rows
    ]

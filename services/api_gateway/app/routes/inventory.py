from fastapi import APIRouter
from app.db import get_db_connection

router = APIRouter()

@router.get("/inventory")
def get_inventory():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            p.name,
            i.current_stock,
            i.minimum_required,
            i.criticality
        FROM inventory i
        JOIN parts p ON p.id = i.part_id
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "part": r[0],
            "current_stock": r[1],
            "minimum_required": r[2],
            "criticality": r[3]
        }
        for r in rows
    ]

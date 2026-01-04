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

@router.get("/inventory/summary")
def inventory_summary():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT COUNT(*) FROM inventory
    """)
    total_parts = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM inventory
        WHERE current_stock < minimum_required
    """)
    below_min = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM inventory_analysis ia
        JOIN inventory i ON i.part_id = ia.part_id
        WHERE ia.risk_level = 'HIGH'
          AND i.criticality = 'CRITICAL'
    """)
    critical_risk = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM trips
        WHERE trip_status IN ('YET_TO_START', 'STARTED')
          AND part_id IS NOT NULL
    """)
    active_replenishments = cur.fetchone()[0]

    conn.close()

    return {
        "total_parts": total_parts,
        "parts_below_minimum": below_min,
        "critical_parts_at_risk": critical_risk,
        "active_replenishments": active_replenishments
    }

@router.get("/inventory/health")
def inventory_health():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT ON (i.part_id)
            i.part_id,
            p.name,
            i.criticality,
            i.current_stock,
            i.minimum_required,
            ia.health_score,
            ia.risk_level
        FROM inventory i
        JOIN parts p ON p.id = i.part_id
        JOIN inventory_analysis ia ON ia.part_id = i.part_id
        ORDER BY i.part_id, ia.analyzed_at DESC
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "part_id": r[0],
            "part_name": r[1],
            "criticality": r[2],
            "current_stock": r[3],
            "minimum_required": r[4],
            "health_score": r[5],
            "risk_level": r[6]
        }
        for r in rows
    ]

@router.get("/inventory/part/{part_id}")
def inventory_part(part_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            p.name,
            i.criticality,
            i.current_stock,
            i.minimum_required,
            ia.health_score,
            ia.risk_level,
            ia.recommendation,
            ia.analyzed_at
        FROM inventory i
        JOIN parts p ON p.id = i.part_id
        JOIN inventory_analysis ia ON ia.part_id = i.part_id
        WHERE i.part_id = %s
        ORDER BY ia.analyzed_at DESC
        LIMIT 1
    """, (part_id,))

    r = cur.fetchone()
    conn.close()

    if not r:
        return {"error": "Part not found"}

    return {
        "part_id": part_id,
        "part_name": r[0],
        "criticality": r[1],
        "current_stock": r[2],
        "minimum_required": r[3],
        "health_score": r[4],
        "risk_level": r[5],
        "recommendation": r[6],
        "last_updated": r[7]
    }

@router.get("/inventory/analysis/{part_id}")
def inventory_analysis_history(part_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            health_score,
            risk_level,
            analyzed_at
        FROM inventory_analysis
        WHERE part_id = %s
        ORDER BY analyzed_at ASC
    """, (part_id,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "health_score": r[0],
            "risk_level": r[1],
            "analyzed_at": r[2]
        }
        for r in rows
    ]

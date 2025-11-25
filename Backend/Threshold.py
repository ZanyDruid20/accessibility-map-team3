from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import aiomysql
from Backend.database import get_db_pool

router = APIRouter()

class ThresholdUpdate(BaseModel):
    node_id: str


@router.put("/update_threshold")
async def update_threshold(node_id: str = Query(...)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:

                # -----------------------------
                # DOOR NODE
                # -----------------------------
                if "_d" in node_id:
                    await cur.execute("SELECT threshold FROM nodes WHERE door_id = %s", (node_id,))
                    node = await cur.fetchone()

                    if not node:
                        raise HTTPException(status_code=404, detail="Node does not exist")

                    new_threshold = node["threshold"] + 1
                    on_off = 0 if new_threshold >= 3 else 1

                    await cur.execute(
                        "UPDATE nodes SET threshold=%s, on_off=%s WHERE door_id=%s",
                        (new_threshold, on_off, node_id)
                    )
                    await conn.commit()

                    return {
                        "success": True,
                        "node_id": node_id,
                        "new_threshold": new_threshold,
                        "on_off_status": on_off
                    }

                # -----------------------------
                # ELEVATOR NODE
                # -----------------------------
                elif "_e" in node_id:
                    await cur.execute("SELECT threshold FROM nodes WHERE elevator_id = %s", (node_id,))
                    node = await cur.fetchone()

                    if not node:
                        raise HTTPException(status_code=404, detail="Node does not exist")

                    new_threshold = node["threshold"] + 1
                    on_off = 0 if new_threshold >= 3 else 1

                    await cur.execute(
                        "UPDATE nodes SET threshold=%s, on_off=%s WHERE elevator_id=%s",
                        (new_threshold, on_off, node_id)
                    )
                    await conn.commit()

                    return {
                        "success": True,
                        "node_id": node_id,
                        "new_threshold": new_threshold,
                        "on_off_status": on_off
                    }

                # -----------------------------
                # INTERSECTION NODE
                # -----------------------------
                else:
                    await cur.execute("SELECT threshold FROM nodes WHERE intersection_id = %s", (node_id,))
                    node = await cur.fetchone()

                    if not node:
                        raise HTTPException(status_code=404, detail="Node does not exist")

                    new_threshold = node["threshold"] + 1
                    on_off = 0 if new_threshold >= 3 else 1

                    await cur.execute(
                        "UPDATE nodes SET threshold=%s, on_off=%s WHERE intersection_id=%s",
                        (new_threshold, on_off, node_id)
                    )
                    await conn.commit()

                    return {
                        "success": True,
                        "node_id": node_id,
                        "new_threshold": new_threshold,
                        "on_off_status": on_off
                    }

    except Exception as e:
        print("DB Error:", e, flush=True)
        raise HTTPException(status_code=500, detail="Server error")


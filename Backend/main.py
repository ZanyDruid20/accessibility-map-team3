from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from Backend.database import get_db_pool
from Backend.astar import a_star
import asyncio
from Backend.models import ReportCreate
from Backend.Login import router as login_router  # type: ignore
from Backend.Threshold import router as threshold_router

app = FastAPI()
db_pool = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(login_router, prefix="/auth", tags=["Authentication"])
app.include_router(threshold_router, prefix="/main", tags=["Main Page"])

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await get_db_pool()


# -------------------------------------------------------------------
# GET SHORTEST PATH
# -------------------------------------------------------------------
@app.get("/shortest-path")
async def shortest_path(
    start_building: str = Query(...),
    start_floor: str = Query(...),
    end_building: str = Query(...),
    end_floor: str = Query(...)
):
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:

                # ---------------------------------------------------
                # Helper: get nodes for a building + floor
                # ---------------------------------------------------
                async def get_nodes(building: str, floor: str):
                    # 1. Try DOOR nodes
                    await cur.execute("""
                        SELECT n.node_id
                        FROM nodes n
                        JOIN doors d ON n.door_id = d.door_id
                        WHERE d.building_id = %s AND d.floor = %s AND n.on_off = 1
                    """, (building, floor))
                    door_rows = await cur.fetchall()

                    if door_rows:
                        return [r[0] for r in door_rows], False

                    # 2. Try elevator nodes
                    await cur.execute("""
                        SELECT n.node_id, e.floor_reach
                        FROM nodes n
                        JOIN elevators e ON n.elevator_id = e.elevator_id
                        WHERE e.building_id = %s
                    """, (building,))
                    elevator_rows = await cur.fetchall()

                    for node_id, floor_reach in elevator_rows:
                        if floor in floor_reach:
                            return [node_id], True

                    return [], False

                start_nodes, start_forced_elevator = await get_nodes(start_building, start_floor)
                end_nodes, _ = await get_nodes(end_building, end_floor)

                if not start_nodes or not end_nodes:
                    raise HTTPException(status_code=404, detail="Start or end building/floor not found")

                # ---------------------------------------------------
                # Build graph
                # ---------------------------------------------------
                await cur.execute("""
                    SELECT start_node, end_node, time_sec
                    FROM paths
                    WHERE on_off = 1
                """)
                edges = await cur.fetchall()

                graph = {}
                for s, e, t in edges:
                    graph.setdefault(s, []).append((e, t))
                    graph.setdefault(e, []).append((s, t))

                for node in set(start_nodes + end_nodes):
                    graph.setdefault(node, [])

                # ---------------------------------------------------
                # Load all node metadata
                # ---------------------------------------------------
                await cur.execute("""
                    SELECT node_id, type, door_id, elevator_id, intersection_id
                    FROM nodes
                """)
                node_rows = await cur.fetchall()

                node_info = {
                    row[0]: {
                        "type": row[1],
                        "door_id": row[2],
                        "elevator_id": row[3],
                        "intersection_id": row[4]
                    }
                    for row in node_rows
                }

                # Map door -> floor
                await cur.execute("SELECT door_id, floor FROM doors")
                door_floor_map = {did: floor for did, floor in await cur.fetchall()}

                # ---------------------------------------------------
                # Run pathfinding
                # ---------------------------------------------------
                best_path = None
                best_cost = float("inf")

                for s in start_nodes:
                    for g in end_nodes:
                        path = a_star(graph, s, g)
                        if not path:
                            continue

                        cost = 0
                        valid = True
                        for a, b in zip(path[:-1], path[1:]):
                            found = False
                            for neigh, t in graph.get(a, []):
                                if neigh == b:
                                    cost += t
                                    found = True
                                    break
                            if not found:
                                valid = False
                                break

                        if valid and cost < best_cost:
                            best_cost = cost
                            best_path = path

                if not best_path:
                    raise HTTPException(status_code=404, detail="No path found")

                # ---------------------------------------------------
                # Convert nodes to readable output
                # ---------------------------------------------------
                path_output = []

                # Forced elevator start
                if start_forced_elevator and start_nodes:
                    elev_node = start_nodes[0]
                    info = node_info.get(elev_node)
                    if info and info.get("elevator_id"):
                        elev_name = info["elevator_id"]
                        first = best_path[0]
                        first_info = node_info.get(first)
                        first_name = first_info["elevator_id"] if first_info["type"] == "elevator" else None
                        if first_name != elev_name:
                            path_output.append(elev_name)

                # Build final readable path
                for nid in best_path:
                    info = node_info.get(nid)
                    if info["type"] == "door":
                        did = info["door_id"]
                        floor = door_floor_map.get(did, "unknown")
                        path_output.append(f"{did}-{floor}")
                    elif info["type"] == "elevator":
                        path_output.append(info["elevator_id"])
                    else:
                        path_output.append(info["intersection_id"])

                return {"path": path_output, "total_time_sec": best_cost}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


# -------------------------------------------------------------------
# REPORT CREATION
# -------------------------------------------------------------------
@app.post("/report")
async def create_report(report: str = Query(...)):
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO reports (state, content)
                    VALUES (0, %s)
                """, (report,))
                await conn.commit()

                return {"message": "Report submitted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# -------------------------------------------------------------------
# GET REPORTS
# -------------------------------------------------------------------
@app.get("/reports")
async def get_unresolved_reports():
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT report_id, content
                    FROM reports
                    WHERE state = 0
                """)
                rows = await cur.fetchall()

                return {"reports": [{"report_id": r[0], "content": r[1]} for r in rows]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# -------------------------------------------------------------------
# RESOLVE REPORT
# -------------------------------------------------------------------
@app.post("/reports/{report_id}/resolve")
async def resolve_report(report_id: int):
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    UPDATE reports
                    SET state = 1
                    WHERE report_id = %s
                """, (report_id,))
                await conn.commit()

                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Report not found")

                return {"message": f"Report {report_id} marked resolved"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# -------------------------------------------------------------------
# TOGGLE NODE
# -------------------------------------------------------------------
@app.post("/nodes/toggle")
async def toggle_node_status(node: str = Query(...)):
    try:
        query = None
        if "_d" in node:
            query = """
                UPDATE nodes
                SET on_off = NOT on_off, threshold = 0
                WHERE door_id = %s
            """
        elif "_e" in node:
            query = """
                UPDATE nodes
                SET on_off = NOT on_off, threshold = 0
                WHERE elevator_id = %s
            """
        else:
            query = """
                UPDATE nodes
                SET on_off = NOT on_off, threshold = 0
                WHERE intersection_id = %s
            """

        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (node,))
                await conn.commit()

                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Node not found")

                return {"message": f"Node {node} on_off changed"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# -------------------------------------------------------------------
# GET OFF NODES
# -------------------------------------------------------------------
@app.get("/nodes/off")
async def get_off_nodes():
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT door_id, elevator_id, intersection_id
                    FROM nodes
                    WHERE on_off = 0
                """)
                rows = await cur.fetchall()

                results = []
                for door_id, elev_id, inter_id in rows:
                    if door_id:
                        results.append(door_id)
                    elif elev_id:
                        results.append(elev_id)
                    else:
                        results.append(inter_id)

                return {"off_nodes": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")



from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from database import get_db_pool
from astar import a_star
import asyncio
from models import ReportCreate

app = FastAPI()
db_pool = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] if using React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await get_db_pool()

from fastapi import HTTPException, Query

# ---------------------------
# GET: Shortest path between buildings (w/ floors)
# ---------------------------
@app.get("/shortest-path")
async def shortest_path(
    start_building: str = Query(...),
    start_floor: str = Query(...),   # floor as string (e.g. "B", "1", "G")
    end_building: str = Query(...),
    end_floor: str = Query(...)
):
    """
    start_floor and end_floor are strings (allow characters like 'B').
    Returns path with door nodes formatted as "doorID-floor" (e.g. "building_d1-B").
    If the start floor has no doors, the elevator for that floor is prepended.
    """
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:

                # -------------------------
                # Helper: get nodes for building+floor
                # returns (list[node_id], forced_elevator_bool)
                # -------------------------
                async def get_nodes(building: str, floor: str):
                    # 1. Try DOOR nodes for that building/floor
                    await cur.execute("""
                        SELECT n.node_id
                        FROM Nodes n
                        JOIN Doors d ON n.door_id = d.door_id
                        WHERE d.building_id = %s AND d.floor = %s AND n.on_off = 1
                    """, (building, floor))

                    door_rows = await cur.fetchall()
                    print(door_rows)
                    if door_rows:
                        return [r[0] for r in door_rows], False  # not forced elevator

                    # 2. No doors -> find elevator nodes for that building
                    await cur.execute("""
                        SELECT n.node_id, e.floor_reach
                        FROM Nodes n
                        JOIN Elevators e ON n.elevator_id = e.elevator_id
                        WHERE e.building_id = %s 
                    """, (building,))
                    elevator_rows = await cur.fetchall()
                    print(elevator_rows)
                    # Check if any elevator can reach the requested floor
                    for node_id, floor_reach in elevator_rows:
                        if floor in floor_reach:
                            return [node_id], True   # forced elevator for this building/floor

                    # 3. No door or elevator access

                    return [], False


                start_nodes, start_forced_elevator = await get_nodes(start_building, start_floor)
                print (start_nodes, start_forced_elevator)
                end_nodes, _ = await get_nodes(end_building, end_floor)

                if not start_nodes or not end_nodes:
                    raise HTTPException(status_code=404, detail="Start or end building/floor not found")

                # -------------------------
                # Build graph (bidirectional)
                # -------------------------
                await cur.execute("""
                    SELECT start_node, end_node, time_sec
                    FROM Paths
                    WHERE on_off = 1
                """)
                edges = await cur.fetchall()

                graph = {}
                for s, e, t in edges:
                    graph.setdefault(s, []).append((e, t))
                    graph.setdefault(e, []).append((s, t))

                # Ensure nodes that appear as start/end exist in graph
                for node in set(start_nodes + end_nodes):
                    graph.setdefault(node, [])

                # -------------------------
                # Load node metadata and door-floor mapping
                # -------------------------
                await cur.execute("""
                    SELECT node_id, type, door_id, elevator_id, intersection_id
                    FROM Nodes
                """)
                node_rows = await cur.fetchall()

                node_info = {}
                for node_id, node_type, door_id, elevator_id, intersection_id in node_rows:
                    node_info[node_id] = {
                        "type": node_type,
                        "door_id": door_id,
                        "elevator_id": elevator_id,
                        "intersection_id": intersection_id
                    }

                # door -> floor map (so we don't repeatedly query DB per node)
                await cur.execute("SELECT door_id, floor FROM Doors")
                door_floor_rows = await cur.fetchall()
                door_floor_map = {door_id: floor for door_id, floor in door_floor_rows}

                # -------------------------
                # Find best path among start x end combinations
                # -------------------------
                best_path = None
                best_cost = float("inf")

                for s in start_nodes:
                    for g in end_nodes:
                        path = a_star(graph, s, g)
                        if not path:
                            continue

                        # compute cost robustly
                        cost = 0
                        invalid = False
                        for a, b in zip(path[:-1], path[1:]):
                            # find edge a -> b
                            found = False
                            for neigh, t in graph.get(a, []):
                                if neigh == b:
                                    cost += t
                                    found = True
                                    break
                            if not found:
                                # missing edge weight: treat path as invalid
                                invalid = True
                                break

                        if invalid:
                            continue

                        if cost < best_cost:
                            best_cost = cost
                            best_path = path

                if not best_path:
                    raise HTTPException(status_code=404, detail="No path found")

                # -------------------------
                # Convert node IDs to display names
                # - door -> "doorID-floor" (floor from door_floor_map)
                # - elevator -> elevator_id
                # - intersection -> intersection_id (or "intersection_<id>" fallback)
                # Also: if start was forced elevator, prepend elevator ID if not already at front
                # -------------------------
                path_output = []

                # If forced elevator start, figure elevator id from the elevator node chosen.
                if start_forced_elevator and start_nodes:
                    elev_node = start_nodes[0]
                    ni = node_info.get(elev_node)
                    if ni and ni.get("elevator_id"):
                        elev_name = ni["elevator_id"]
                        # only prepend if best_path doesn't already start with that elevator node
                        first_node = best_path[0]
                        first_info = node_info.get(first_node, {})
                        first_name = None
                        if first_info.get("type") == "elevator":
                            first_name = first_info.get("elevator_id")
                        if first_name != elev_name:
                            path_output.append(elev_name)

                for nid in best_path:
                    ni = node_info.get(nid, {})
                    ntype = ni.get("type")
                    if ntype == "door":
                        did = ni.get("door_id")
                        floor = door_floor_map.get(did)
                        if floor is None:
                            display = f"{did}-unknown"
                        else:
                            display = f"{did}-{floor}"
                        path_output.append(display)
                    elif ntype == "elevator":
                        eid = ni.get("elevator_id") or f"elevator_{nid}"
                        path_output.append(eid)
                    else:
                        inter = ni.get("intersection_id") or f"intersection_{nid}"
                        path_output.append(inter)

                return {"path": path_output, "total_time_sec": best_cost}

    except HTTPException:
        # re-raise FastAPI HTTPExceptions untouched
        raise
    except Exception as e:
        # helpful debug info in server logs; user sees a 500 with brief message
        # (you can remove str(e) if you don't want internals returned)
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

# ---------------------------
# POST: Create a new report
# ---------------------------
@app.post("/report")
async def create_report(report: str = Query(...)):
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO Reports (state, content)
                    VALUES (0, %s)
                """, (report))
                await conn.commit()

                return {"message": "Report submitted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# ---------------------------
# GET: Fetch unresolved reports
# ---------------------------
@app.get("/reports")
async def get_unresolved_reports():
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT report_id, content
                    FROM Reports
                    WHERE state = 0
                """)
                rows = await cur.fetchall()

                reports = [
                    {"report_id": r[0], "content": r[1]}
                    for r in rows
                ]

                return {"reports": reports}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# ---------------------------
# POST: Mark a report as resolved
# ---------------------------
@app.post("/reports/{report_id}/resolve")
async def resolve_report(report_id: int):
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    UPDATE Reports
                    SET state = 1
                    WHERE report_id = %s
                """, (report_id,))
                await conn.commit()

                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Report not found")

                return {"message": f"Report {report_id} marked resolved"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# ---------------------------
# POST: Admin turn off/on Node
# ---------------------------
@app.post("/nodes/toggle")
async def toggle_node_status(node: str = Query(...)):
    try:
        if "_d" in node:
            async with db_pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        UPDATE Nodes
                        SET on_off = NOT on_off
                        WHERE door_id = %s
                    """, (node))
                    await conn.commit()

                    if cur.rowcount == 0:
                        raise HTTPException(status_code=404, detail="Node not found")

                    return {"message": f"Node: {node} on_off changed"}
        elif "_e" in node:
            async with db_pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        UPDATE Nodes
                        SET on_off = NOT on_off
                        WHERE elevator_id = %s
                    """, (node))
                    await conn.commit()

                    if cur.rowcount == 0:
                        raise HTTPException(status_code=404, detail="Node not found")

                    return {"message": f"Node: {node} on_off changed"}
        else:
            async with db_pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        UPDATE Nodes
                        SET on_off = NOT on_off
                        WHERE intersection_id = %s
                    """, (node))
                    await conn.commit()

                    if cur.rowcount == 0:
                        raise HTTPException(status_code=404, detail="Node not found")

                    return {"message": f"Node: {node} on_off changed"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


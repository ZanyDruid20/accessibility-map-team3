from fastapi import FastAPI, HTTPException, Query
from database import get_db_pool
from astar import a_star
import asyncio

app = FastAPI()
db_pool = None

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await get_db_pool()

@app.get("/shortest-path")
async def shortest_path(start_building: str = Query(...), end_building: str = Query(...)):
    """
    Example:
    GET /shortest-path?start_building=A&end_building=B
    """

    async with db_pool.acquire() as conn:
        async with conn.cursor() as cur:

            # 1️⃣ Find all nodes for start and end buildings
            await cur.execute("""
                SELECT node_id FROM Nodes
                WHERE door_id IN (
                    SELECT door_id FROM Doors WHERE building_id = %s
                )
                OR elevator_id IN (
                    SELECT elevator_id FROM Elevators WHERE building_id = %s
                )
            """, (start_building, start_building))
            start_nodes = [row[0] for row in await cur.fetchall()]

            await cur.execute("""
                SELECT node_id FROM Nodes
                WHERE door_id IN (
                    SELECT door_id FROM Doors WHERE building_id = %s
                )
                OR elevator_id IN (
                    SELECT elevator_id FROM Elevators WHERE building_id = %s
                )
            """, (end_building, end_building))
            end_nodes = [row[0] for row in await cur.fetchall()]

            if not start_nodes or not end_nodes:
                raise HTTPException(status_code=404, detail="Start or end building not found")

            # 2️⃣ Build graph from Paths table
            await cur.execute("""
                SELECT start_node, end_node, time_sec
                FROM Paths WHERE on_off = 1
            """)
            paths = await cur.fetchall()

            graph = {}
            for s, e, t in paths:
                graph.setdefault(s, []).append((e, t))
                graph.setdefault(e, []).append((s, t))  # assume bidirectional

            # Ensure all start/end nodes exist in graph
            for node in start_nodes + end_nodes:
                if node not in graph:
                    graph[node] = []

            # 3️⃣ Create node_id to name mapping
            await cur.execute("""
                SELECT node_id, type, door_id, elevator_id, intersection_id
                FROM Nodes
            """)
            node_rows = await cur.fetchall()
            
            node_to_name = {}
            for node_id, node_type, door_id, elevator_id, intersection_id in node_rows:
                if node_type == 'door':
                    node_to_name[node_id] = door_id
                elif node_type == 'elevator':
                    node_to_name[node_id] = elevator_id
                elif node_type == 'intersection':
                    node_to_name[node_id] = intersection_id

            # 4️⃣ Try all start-end combinations (for simplicity)
            best_path = None
            best_cost = float('inf')

            for s in start_nodes:
                for g in end_nodes:
                    path = a_star(graph, s, g)
                    if path:
                        cost = sum(
                            next(t for n, t in graph[n] if n2 == path[i + 1])
                            for i, (n, n2) in enumerate(zip(path[:-1], path[1:]))
                        )
                        if cost < best_cost:
                            best_cost = cost
                            best_path = path

            if not best_path:
                raise HTTPException(status_code=404, detail="No path found")

            # 5️⃣ Convert node IDs to names
            path_names = [node_to_name.get(node_id, f"unknown_{node_id}") for node_id in best_path]

            return {"path": path_names, "total_time_sec": best_cost}

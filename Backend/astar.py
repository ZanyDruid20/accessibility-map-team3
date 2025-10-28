import heapq

def a_star(graph, start, goal):
    """
    graph: dict {node_id: [(neighbor_id, cost), ...]}
    start, goal: node_ids
    """
    open_set = []
    heapq.heappush(open_set, (0, start))  # (f_score, node)

    came_from = {}
    g_score = {node: float('inf') for node in graph}
    g_score[start] = 0

    f_score = {node: float('inf') for node in graph}
    f_score[start] = 0  # heuristic = 0, since we don't have coordinates

    while open_set:
        _, current = heapq.heappop(open_set)

        if current == goal:
            # reconstruct path
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            return path[::-1]

        for neighbor, cost in graph[current]:
            tentative_g = g_score[current] + cost
            if tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g  # no heuristic
                heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None  # no path found

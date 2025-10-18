import pandas as pd
import mysql.connector

# --- CONFIG ---
CSV_FILE = "campus_map_paths_and_intersections.csv"  # path to your CSV
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "2005",
    "database": "campus_map"
}

# --- CONNECT TO DB ---
cnx = mysql.connector.connect(**DB_CONFIG)
cursor = cnx.cursor(buffered=True)  # ✅ Prevents "Unread result found"

# --- LOAD CSV ---
df = pd.read_csv(CSV_FILE, engine="python").fillna("")

# Keep track of known nodes to avoid duplicates
existing_nodes = set()

# Fetch all existing intersections
cursor.execute("SELECT intersection_id FROM Intersections")
for (intersection_id,) in cursor.fetchall():
    existing_nodes.add(intersection_id.lower().strip())

# --- Ensure node exists ---
def ensure_intersection(node_id):
    node_id_clean = node_id.lower().strip()

    # Try to get existing node
    cursor.execute(
        "SELECT node_id FROM Nodes WHERE intersection_id=%s OR door_id=%s OR elevator_id=%s",
        (node_id_clean, node_id_clean, node_id_clean)
    )
    result = cursor.fetchone()
    if result:
        return result[0]

    # If not found, insert
    try:
        cursor.execute(
            "INSERT INTO Intersections (intersection_id) VALUES (%s)",
            (node_id_clean,)
        )
        cursor.execute(
            """INSERT INTO Nodes (type, threshold, on_off, door_id, elevator_id, intersection_id)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            ("intersection", 0, True, None, None, node_id_clean)
        )
        cnx.commit()  # ✅ Make sure it's written
    except mysql.connector.Error as e:
        print(f"Failed to insert node '{node_id_clean}': {e}")
        return None

    # Fetch numeric node_id after insert
    cursor.execute(
        "SELECT node_id FROM Nodes WHERE intersection_id=%s OR door_id=%s OR elevator_id=%s",
        (node_id_clean, node_id_clean, node_id_clean)
    )
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        print(f"Error: Node '{node_id_clean}' was inserted but cannot be found in Nodes table!")
        return None


# --- PARSE AND INSERT PATHS ---
for _, row in df.iterrows():
    start_node_str = row["starting_node"]
    end_node_str = row["ending_node"]
    time_sec = float(row["time"])

    print(f"Processing path: {start_node_str} -> {end_node_str}")

    start_node = ensure_intersection(start_node_str)
    end_node = ensure_intersection(end_node_str)

    if start_node is None or end_node is None:
        print(f"Skipping path {start_node_str} -> {end_node_str} (missing node)")
        continue

    cursor.execute(
        "INSERT INTO Paths (start_node, end_node, time_sec) VALUES (%s, %s, %s)",
        (start_node, end_node, time_sec)
    )

# --- CLEANUP ---
cnx.commit()
cursor.close()
cnx.close()

print("✅ All paths inserted successfully!")

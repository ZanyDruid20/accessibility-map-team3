import pandas as pd
import mysql.connector

# === CONFIGURE ===
CSV_FILE = "campus_map_doors_and_elevators.csv"
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "2005",
    "database": "campus_map"
}

# === CONNECT ===
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

# === READ CSV ===
df = pd.read_csv(CSV_FILE, engine="python").fillna("")

def bool_from_str(s):
    """Convert YES/NO/etc. to boolean or None"""
    s = str(s).strip().lower()
    if s in ["yes", "y", "true", "1"]:
        return True
    if s in ["no", "n", "false", "0"]:
        return False
    return None

for _, row in df.iterrows():
    building = row["BUILDING"].strip().lower()
    node_id = row["NODE"].strip().lower()
    node_type = row["TYPE"].strip().lower()
    floor = row["FLOOR"]
    exit_floors = str(row.get("EXIT Floors", "")).strip()
    accessible = bool_from_str(row.get("ON/OFF (Accessible)", ""))
    ramp = bool_from_str(row.get("IF DOOR: RAMP?", ""))
    button = bool_from_str(row.get("IF DOOR: BUTTON?", ""))

    # --- Ensure Building exists ---
    cursor.execute("SELECT building_id FROM Buildings WHERE building_id = %s", (building,))
    if cursor.fetchone() is None:
        cursor.execute("INSERT INTO Buildings (building_id) VALUES (%s)", (building,))

    # --- Depending on type ---
    door_id = elevator_id = intersection_id = None

    if node_type == "door":
        cursor.execute("""
            INSERT INTO Doors (door_id, building_id, floor, has_button, has_ramp)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            building_id=VALUES(building_id), floor=VALUES(floor),
            has_button=VALUES(has_button), has_ramp=VALUES(has_ramp)
        """, (node_id, building, floor if floor != "" else None, button, ramp))
        door_id = node_id

    elif node_type == "elevator":
        cursor.execute("""
            INSERT INTO Elevators (elevator_id, building_id, floor_reach, exit_floors)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            building_id=VALUES(building_id), floor_reach=VALUES(floor_reach), exit_floors=VALUES(exit_floors)
        """, (node_id, building, str(floor), exit_floors))
        elevator_id = node_id

    # elif node_type == "intersection":
    #     cursor.execute("""
    #         INSERT IGNORE INTO Intersections (intersection_id)
    #         VALUES (%s)
    #     """, (node_id,))
    #     intersection_id = node_id

    # --- Insert Node ---
    cursor.execute("""
        INSERT INTO Nodes (type, threshold, on_off, door_id, elevator_id, intersection_id)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (node_type, 0, accessible, door_id, elevator_id, intersection_id))

conn.commit()
cursor.close()
conn.close()
print("✅ Done inserting all nodes!")

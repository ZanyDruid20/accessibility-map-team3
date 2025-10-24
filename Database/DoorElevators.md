# Door–Elevator Path Linking Documentation

This SQL script that i wrote on creeate_database_campus_map.sql file automatically links the doors and the elevators inside the database. 

It ensures that accessible doors are connected to nearby elevators in the same building.

This allows the navigation system to calculate routes that include elevators, such as going from a building entrance to an upper-floor hallway.

# What It Does

1. Starts a Transaction
Ensures all operations are atomic — if something fails, nothing is saved.

2. Sets a Default Travel Time
SET @time_sec = 5;
Assigns a default time of 5 seconds between a door and its elevator (used in the Paths table).

3. Ensures All Doors and Elevators Have Node Entries
INSERT INTO Nodes (type, elevator_id)
SELECT 'elevator', e.elevator_id
FROM Elevators e
LEFT JOIN Nodes n ON n.elevator_id = e.elevator_id
WHERE n.elevator_id IS NULL;
# Door–Elevator Path Linking Documentation

This SQL script (added to `create_database_campus_map.sql`) links doors and elevators in the database.

It ensures accessible doors are connected to nearby elevators in the same building so the navigation system can calculate routes that include elevators (for example: from a building entrance to an upper-floor hallway).

## What it does

1. Starts a transaction — ensures all operations are atomic; if something fails, nothing is saved.

2. Sets a default travel time:

```sql
SET @time_sec = 5;
```

This assigns a default time of 5 seconds between a door and its elevator (used in the `Paths` table).

3. Ensures all doors and elevators have corresponding Node entries. Example SQL used to create missing elevator nodes:

```sql
INSERT INTO Nodes (type, elevator_id)
SELECT 'elevator', e.elevator_id
FROM Elevators e
LEFT JOIN Nodes n ON n.elevator_id = e.elevator_id
WHERE n.elevator_id IS NULL;
```

If a door or elevator is not already represented as a `Node`, this inserts it so it can be part of the path network.

## Insert door → elevator paths

This step finds a single elevator for each accessible door and inserts a `Path` from the door node to the elevator node.

```sql
-- 🚪 ➡️ 🛗 Insert door → elevator paths
INSERT INTO Paths (threshold, on_off, time_sec, start_node, end_node)
SELECT
  0, 1, @time_sec, dn.node_id, en.node_id
FROM Doors d
JOIN Nodes dn ON dn.door_id = d.door_id
JOIN (
  SELECT d2.door_id,
    COALESCE(
      (
        SELECT e.elevator_id
        FROM Elevators e
        WHERE e.building_id = d2.building_id
          AND e.exit_floors IS NOT NULL
          AND UPPER(e.exit_floors) LIKE CONCAT('%', UPPER(TRIM(d2.floor)), '%')
        LIMIT 1
      ),
      (
        SELECT MIN(e3.elevator_id)
        FROM Elevators e3
        WHERE e3.building_id = d2.building_id
      )
    ) AS elevator_id
  FROM Doors d2
  WHERE d2.has_ramp = 1 OR d2.has_button = 1
) chosen ON chosen.door_id = d.door_id
JOIN Nodes en ON en.elevator_id = chosen.elevator_id
LEFT JOIN Paths p ON p.start_node = dn.node_id AND p.end_node = en.node_id
WHERE p.path_id IS NULL
  AND chosen.elevator_id IS NOT NULL;
```

### What happens
1. For each accessible door the script searches for a “best matching elevator” in the same building (prefer an elevator whose `exit_floors` contains the door floor).
2. If no elevator matches by floor, the query falls back to a deterministic choice (`MIN(elevator_id)` for that building).
3. It inserts a path between the door's node and the chosen elevator's node. The `p.path_id IS NULL` check prevents duplicates.

## Insert elevator → door paths (reverse direction)

The reverse Paths allow bidirectional traversal (from elevator to door):

```sql
INSERT INTO Paths (threshold, on_off, time_sec, start_node, end_node)
SELECT
  0, 1, @time_sec, en.node_id, dn.node_id
FROM Doors d
JOIN Nodes dn ON dn.door_id = d.door_id
JOIN (
  SELECT d2.door_id,
    COALESCE(
      (
        SELECT e.elevator_id
        FROM Elevators e
        WHERE e.building_id = d2.building_id
          AND e.exit_floors IS NOT NULL
          AND UPPER(e.exit_floors) LIKE CONCAT('%', UPPER(TRIM(d2.floor)), '%')
        LIMIT 1
      ),
      (
        SELECT MIN(e3.elevator_id)
        FROM Elevators e3
        WHERE e3.building_id = d2.building_id
      )
    ) AS elevator_id
  FROM Doors d2
  WHERE d2.has_ramp = 1 OR d2.has_button = 1
) chosen ON chosen.door_id = d.door_id
JOIN Nodes en ON en.elevator_id = chosen.elevator_id
LEFT JOIN Paths p ON p.start_node = en.node_id AND p.end_node = dn.node_id
WHERE p.path_id IS NULL
  AND chosen.elevator_id IS NOT NULL;
```

This creates the reverse link so routes can traverse to and from elevators.

## Count how many door→elevator paths were added

```sql
SELECT COUNT(*) AS added_door_to_elevator_paths
FROM Paths p
JOIN Nodes s ON s.node_id = p.start_node
JOIN Nodes e ON e.node_id = p.end_node
WHERE s.type='door' AND e.type='elevator';
```

## Key SQL functions used (quick reference)

| Function | Description | Example | Result |
|---|---:|---|---|
| `TRIM()` | Removes leading/trailing spaces | `TRIM(' 1 ')` | `'1'` |
| `UPPER()` | Uppercases text for case-insensitive matching | `UPPER('g')` | `'G'` |
| `COALESCE(a, b)` | Returns the first non-NULL value (fallback) | `COALESCE(NULL, 'E1')` | `'E1'` |

## Running the script (recommended workflow)

1. Make sure the required tables are populated (see your team's schema instructions).
2. Run the preview query (the `SELECT` that shows `chosen_elevator`) and inspect results.
3. If preview looks correct, run the transactional insert block (START TRANSACTION … COMMIT) in a development DB.
4. Run the verification `COUNT(*)` query and inspect results. If anything looks wrong, `ROLLBACK` instead of `COMMIT`.

Example CLI steps (replace `<YourName>` or use your environment):

```text
mariadb -u root -p
USE campus_map;
SOURCE C:/Users/<YourName>/accessibility-map-team3/Database/add_door_elevator_paths.sql;
```

If sourcing the file fails you can either move the file to a different path or copy/paste the transaction block into the CLI.

## Tip — reset if needed

If you need to reset the database during development:

```sql
DROP DATABASE campus_map;
CREATE DATABASE campus_map;
USE campus_map;
```

Then re-run the schema and data load steps per your team's instructions.

## Verification queries — view sample connections

```sql
SELECT
  d.door_id AS door,
  e.elevator_id AS elevator,
  d.building_id AS building,
  d.floor AS door_floor,
  e.floor_reach AS elevator_floors
FROM Paths p
JOIN Nodes s ON p.start_node = s.node_id
JOIN Nodes t ON p.end_node = t.node_id
JOIN Doors d ON s.door_id = d.door_id
JOIN Elevators e ON t.elevator_id = e.elevator_id
WHERE s.type = 'door' AND t.type = 'elevator'
LIMIT 10;
```

### Example output

```
+-----------+-----------+----------+------------+-----------------+
| door      | elevator  | building | door_floor | elevator_floors |
+-----------+-----------+----------+------------+-----------------+
| admin_d2  | admin_e1  | admin    | 1          | B12345678910    |
| admin_d5  | admin_e1  | admin    | 1          | B12345678910    |
| aoklib_d1 | aoklib_e1 | aoklib   | 1          | 1234567         |
| aoklib_d2 | aoklib_e1 | aoklib   | G          | 1234567         |
| aoklib_d3 | aoklib_e1 | aoklib   | G          | 1234567         |
| biosci_d1 | biosci_e1 | biosci   | 1          | B1234           |
| biosci_d2 | biosci_e1 | biosci   | 1          | B1234           |
| biosci_d3 | biosci_e1 | biosci   | 1          | B1234           |
| biosci_d4 | biosci_e1 | biosci   | 1          | B1234           |
| comm_d1   | comm_e1   | commons  | 1          | 1LM23           |
+-----------+-----------+----------+------------+-----------------+
```

10 rows in set


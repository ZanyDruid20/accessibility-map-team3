CREATE DATABASE IF NOT EXISTS campus_map;
USE campus_map;

-- ===========================================================
-- BUILDINGS
-- ===========================================================
CREATE TABLE Buildings (
    building_id VARCHAR(100) PRIMARY KEY
);

-- ===========================================================
-- DOORS
-- ===========================================================
CREATE TABLE Doors (
    door_id VARCHAR(100) PRIMARY KEY,
    building_id VARCHAR(100) NOT NULL,
    floor VARCHAR(100),
    has_button BOOLEAN DEFAULT FALSE,
    has_ramp BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (building_id) REFERENCES Buildings(building_id)
        ON DELETE CASCADE
);

-- ===========================================================
-- ELEVATORS
-- ===========================================================
CREATE TABLE Elevators (
    elevator_id VARCHAR(100) PRIMARY KEY,
    building_id VARCHAR(100) NOT NULL,
    floor_reach VARCHAR(100),         -- e.g. "123"
    exit_floors VARCHAR(100),         -- e.g. "123"
    FOREIGN KEY (building_id) REFERENCES Buildings(building_id)
        ON DELETE CASCADE
);

-- ===========================================================
-- INTERSECTIONS
-- ===========================================================
CREATE TABLE Intersections (
    intersection_id VARCHAR(100) PRIMARY KEY
);

-- ===========================================================
-- NODES
-- ===========================================================
CREATE TABLE Nodes (
    node_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('door', 'elevator', 'intersection') NOT NULL,
    threshold INT DEFAULT 0,
    on_off BOOLEAN DEFAULT 1,
    door_id VARCHAR(100) DEFAULT NULL,
    elevator_id VARCHAR(100) DEFAULT NULL,
    intersection_id VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (door_id) REFERENCES Doors(door_id)
        ON DELETE CASCADE,
    FOREIGN KEY (elevator_id) REFERENCES Elevators(elevator_id)
        ON DELETE CASCADE,
    FOREIGN KEY (intersection_id) REFERENCES Intersections(intersection_id)
        ON DELETE CASCADE
);

-- ===========================================================
-- PATHS
-- ===========================================================
CREATE TABLE Paths (
    path_id INT AUTO_INCREMENT PRIMARY KEY,
    threshold FLOAT DEFAULT 0,
    on_off BOOLEAN DEFAULT 1,
    time_sec FLOAT,                     -- travel time or distance
    start_node INT NOT NULL,
    end_node INT NOT NULL,
    FOREIGN KEY (start_node) REFERENCES Nodes(node_id)
        ON DELETE CASCADE,
    FOREIGN KEY (end_node) REFERENCES Nodes(node_id)
        ON DELETE CASCADE
);

/* -----------------------------
DOORS → ELEVATORS mapping script
Add this after the CREATE TABLE ... PATHS section.
Preview first (run the PREVIEW query only), inspect results,
then run the transaction block manually (START TRANSACTION; ... COMMIT;).
This script does NOT change the schema.
----------------------------- */

START TRANSACTION;

SET @time_sec = 5;

-- Ensure elevators have nodes (they already do, but this is safe)
INSERT INTO Nodes (type, elevator_id)
SELECT 'elevator', e.elevator_id
FROM Elevators e
LEFT JOIN Nodes n ON n.elevator_id = e.elevator_id
WHERE n.elevator_id IS NULL;

-- Ensure doors have nodes (safe recheck)
INSERT INTO Nodes (type, door_id)
SELECT 'door', d.door_id
FROM Doors d
LEFT JOIN Nodes n ON n.door_id = d.door_id
WHERE n.door_id IS NULL;

-- Insert door → elevator paths
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

-- Insert elevator → door paths (reverse direction)
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

-- Check how many door-elevator paths were added
SELECT COUNT(*) AS added_door_to_elevator_paths
FROM Paths p
JOIN Nodes s ON s.node_id = p.start_node
JOIN Nodes e ON e.node_id = p.end_node
WHERE s.type='door' AND e.type='elevator';

COMMIT;

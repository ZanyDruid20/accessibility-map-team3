/* -----------------------------
DOORS → ELEVATORS mapping script
Add this after the CREATE TABLE ... PATHS section.
Preview first (run the PREVIEW query only), inspect results,
then run the transaction block manually (START TRANSACTION; ... COMMIT;).
This script does NOT change the schema.
----------------------------- */


USE campus_map;
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

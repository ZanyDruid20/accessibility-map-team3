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


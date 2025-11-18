# CAMPUS MAP DATABASE

The following is a description of the database used on this project and how to set it up on your local machines 
(Note: we all have to build it on each of computers because to access it remotely we need the database to be hosted on a server thats like 24/7 and accessible to the internet and we dont have that right now )

## SET_UP INSTRUCTION

### 1. Install MariaDB

This website gives a good run-down for any system: https://mariadb.com/get-started-with-mariadb/

I don't know about macOS or Linux but on windows you have to add MariaDB to your system path, here is how i did that:

1. Press Start, type environment variables, and open "Edit the system environment variables"
2. Click Environment Variables…
3. Under System variables, find and select Path, then click Edit…
4. Click New and paste your MariaDB bin path. (Usually its C:\Program Files\MariaDB 11.3\bin )
5. Click OK on all windows (DO THIS OR IT WONT SAVE)

During this process it will prompt you enter a password make sure you remember this


### 2. Create the database (I have windows so this is very windows-y, sorry.. )

1. Download all files from the github (the sql file, the two cvs files and the two .py files)
2. Open command prompt
3. Type "mariadb -u root -p" (input your password when prompted)
4. Type "CREATE DATABASE campus_map;"
5. Type "USE campus_map;"
6. Type "SOURCE /path/to/create_database_campus_map.sql;"
7. Type "SOURCE /path/to/admin_users.sql;"
8. Don't X out of this terminal we will need it later
NOTE: /path/to/ should be whereever in your computer you downloaded the .sql file


### 3. Upload all data

1. Adjust the parsers (campus_map_parser_doors_and_elevators.py and campus_map_parser_paths_and_intersections.py) to fit your setting
    - This should just be chnaging the "password" under DB_CONFIG to be your password
2. Make sure the parsers and the csv file are under the same folder
3. Exit maria db and cd into this folder
4. You may need to pip install pandas if getting a module not found error
5. Run campus_map_parser_door_and_elevator.py (MAKE SURE TO RUN THIS ONE FIRST OR IT WONT WORK)
6. Run campus_map_parser_paths_and_intersection.py
7. Go back to your mariaDB terminal and type "SOURCE /path/to/door_elevator_paths.sql;"
    (NOTE: This should be whereever in your computer you downloaded the .sql file)
8. You should get indicators of success printed on your console output (if not uhh.. contact me: Kaila)

Note: If you run into issues you can type "DROP DATABASE campus_map;" to delete the whole database and start over (start with number 2.4 since there is no need to reinstall mariadbor log back in)

## THE DATABASE DESCRIPTION

The database contains six main tables:

1. **Buildings** – stores each building on campus.  
2. **Doors** – represents doors associated with buildings.  
3. **Elevators** – represents elevators within buildings.  
4. **Intersections** – represents connection points outside buildings or between hallways.  
5. **Nodes** – a unified representation of all navigable points (doors, elevators, intersections).  
6. **Paths** – represents direct connections (edges) between two nodes, with travel time or distance.

## Table Descriptions

### **1. Buildings**
| `building_id` | `VARCHAR(100)` | **Primary Key.** A unique identifier for each building (e.g., `"ENGR"`, `"UC"`, `"ITE"`). |

**Purpose:**  
Defines all the buildings on campus. Other tables (like Doors and Elevators) reference this table to associate nodes with their building.

---

### **2. Doors**

| `door_id` | `VARCHAR(100)` | **Primary Key.** A unique identifier for each door (e.g., `"ENGR_101_Door1"`). |
| `building_id` | `VARCHAR(100)` | **Foreign Key → Buildings(building_id).** Indicates which building this door belongs to. |
| `floor` | `VARCHAR(100)` | The floor where the door is located (e.g., `"1"`, `"B"`, `"G"`). |
| `has_button` | `BOOLEAN` | Indicates if the door has an accessibility push button (`TRUE` or `FALSE`). |
| `has_ramp` | `BOOLEAN` | Indicates if the door is accessible via a ramp (`TRUE` or `FALSE`). |

**Purpose:**  
Represents entrances and exits for buildings, including accessibility details.

---

### **3. Elevators**

| `elevator_id` | `VARCHAR(100)` | **Primary Key.** A unique identifier for each elevator (e.g., `"ENGR_ELEV1"`). |
| `building_id` | `VARCHAR(100)` | **Foreign Key → Buildings(building_id).** Indicates which building the elevator belongs to. |
| `floor_reach` | `VARCHAR(100)` | Lists which floors the elevator can reach (e.g., `"1,2,3"`). |
| `exit_floors` | `VARCHAR(100)` | Lists which floors have exits from the elevator (e.g., `"1,3"`). |

**Purpose:**  
Models elevators, including their accessible floors and exits within buildings.

---

### **4. Intersections**

| `intersection_id` | `VARCHAR(100)` | **Primary Key.** A unique identifier for each intersection (e.g., `"purpleint_1"`, `"northpath_cross"`). |

**Purpose:**  
Represents non-building points — such as hallways, crosswalks, or outdoor intersections — where multiple paths meet.

---

### **5. Nodes**

| `node_id` | `INT` | **Primary Key (Auto Increment).** A unique internal numeric ID for each node. |
| `type` | `ENUM('door', 'elevator', 'intersection')` | Defines what kind of node this is. |
| `threshold` | `INT` | Represents number of user reports. |
| `on_off` | `BOOLEAN` | Indicates whether this node is active (`TRUE`) or disabled (`FALSE`). |
| `door_id` | `VARCHAR(100)` | **Foreign Key → Doors(door_id).** Non-null if this node represents a door. |
| `elevator_id` | `VARCHAR(100)` | **Foreign Key → Elevators(elevator_id).** Non-null if this node represents an elevator. |
| `intersection_id` | `VARCHAR(100)` | **Foreign Key → Intersections(intersection_id).** Non-null if this node represents an intersection. |

**Purpose:**  
Acts as a unified connection layer for all navigable points. Every door, elevator, or intersection becomes a node in this table, which allows the **Paths** table to connect them.

---

### **6. Paths**

| `path_id` | `INT` | **Primary Key (Auto Increment).** A unique ID for each path. |
| `threshold` | `FLOAT` | Represents number of user reports. |
| `on_off` | `BOOLEAN` | Indicates whether this path is currently usable (`TRUE`) or blocked (`FALSE`). |
| `time_sec` | `FLOAT` | Travel time (in seconds) between two nodes (e.g., `3.5` seconds). |
| `start_node` | `INT` | **Foreign Key → Nodes(node_id).** Starting point of the path. |
| `end_node` | `INT` | **Foreign Key → Nodes(node_id).** Ending point of the path. |

**Purpose:**  
Defines the connections between two nodes, enabling pathfinding or route analysis between buildings, intersections, and elevators.



## Basic commands to verify it works

1. SHOW TABLES; (shows all your tables)
2. DESCRIBE table_name; (describes attributes of your chosen table)
3. SELECT * FROM table_name; (outputs everything inserted into your chosen table)
4. SELECT * FROM table_name WHERE attribute_name LIKE 'example'; (outputs everything in your chosen table that matches the where condition )






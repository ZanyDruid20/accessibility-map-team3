# CAMPUS MAP BACKEND

The following is a description of the backend used in this project and how to set it up on your local machines 
(Note: We all have to run it on each of our individual computers bc we do not yet have a public server)

## SET UP INSTRUCTIONS

### 1. Have the database previously set-up (follow the database readme)

### 2. Setting up the back-end

1. Download all files in this folder and store it on a folder in your machine
2. Change the identification information in "database.py" to store your own password
3. run 'pip install fastapi uvicorn aiomysql'

### 3. Running the back-end

1. Navigate to the folder holding all relevant files in your terminal
2. run 'uvicorn main:app --reload'
3. Open your browser and run your request
    - ex: http://127.0.0.1:8000/shortest-path?start_building=A&end_building=B
    - NOTE: shortest-path is the only request that exists right now; replace A and B with the buildings you wish to navigate to and from
5. If you run into issues contact me (Kaila)

## BACKEND COMMANDS

### @app.get("/shortest-path") 
1. Purpose:
- Gets the shortest path from nuilding to building
2. Parameters: 
- start_building (str): name of the start building
- start_floor (str): the floor in the start_building
- start_building (str): name of the end building
- start_floor (str): the floor in the end_building
3. Output:
- {"path": [list of nodes]}
- Note: doors will be in the format of "door_id - floor#" (ie. "dhall_d2-1")

### @app.post("/report")
1. Purpose:
- Allows the user to submit a report and have it stored in the database
2. Parameters:
- report (str): The complaint that the user is reporting
3. Output:
- {"message": "Report submitted successfully"}
- The report will be stored in the database, attached with a unique INT ID (row#)

### @app.get("/reports")
1. Purpose:
- List all current unresolved reports
2. Parameters:
- None
3. Output:
- {"reports": [{"report_id": 1, "content": " blah blah " }, {"report_id": 2, "content": " blah blah " }, ...] }

### @app.post("/reports/{report_id}/resolve")
1. Purpose:
- Allows the admin to resolve reports, marking ti as resolved in the database, stopping it from being displayed in the website
2. Parameters:
- report_id (int): The id of the report
3. Output:
- {"message": f"Report {report_id} marked resolved"}
- The report is marked resolved in the database and won't be displayed with the /reports command

### @app.post("/nodes/toggle")
1. Purpose:
- Allows the admin to turn off or on a specific node, ressetting threshold to 0, changing its avaiablitlity for path finding
2. Parameters:
- node (str): a string with the unique id of the node (ex: aoklib_d1)
3. Output:
- {"message": f"Node: {node} on_off changed and threshold reset to 0"}
- The node's on_off is changed to its opposite and its threshold is now 0

### @router.post("/login")
1. Purpose:
- Allows an admin user to login
2. Parameters:
- LoginRequest (json file): A json file consisteing of the username and password
- Format: { "username": "string", "password": "string" }
3. Output:
- If admin exist in database: {"success": True, "message": "Login successful"}
- If admin does not exist: {"detail": "Invalid username or password"}
NOTE: Create new admin users by running create_admin.py

### @router.put("/update_threshold")
1. Purpose:
- Allows users to report a node as broken, adding one to the threshold count. Once threshold is greater than 3, the node will be turned off and not considered for path finding
2. Parameters:
- node_id (str): a string with the unique id of the node (ex: aoklib_d1)
3. Output:
- {"success": True, "node_id": node_id, "new_threshold": new_threshold, "on_off_status": on_off }





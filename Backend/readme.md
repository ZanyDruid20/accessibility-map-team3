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

### 1. @app.get("/shortest-path") 
#### Purpose:
- Gets the shortest path from nuilding to building
#### Parameters: 
- start_building (str): name of the start building
- start_floor (str): the floor in the start_building
- start_building (str): name of the end building
- start_floor (str): the floor in the end_building
#### Output:
- {"path": [list of nodes]}
- Note: doors will be in the format of "door_id - floor#" (ie. "dhall_d2-1")

### 2. @app.post("/report")
#### Purpose:
- Allows the user to submit a report and have it stored in the database
#### Parameters:
- report (str): The complaint that the user is reporting
#### Output:
- {"message": "Report submitted successfully"}
- The report will be stored in the database, attached with a unique INT ID (row#)

### 3. @app.get("/reports")
#### Purpose:
- List all current unresolved reports
#### Parameters:
- None
#### Output:
- {"reports": [{"report_id": 1, "content": " blah blah " }, {"report_id": 2, "content": " blah blah " }, ...] }

### 3. @app.post("/reports/{report_id}/resolve")
#### Purpose:
- Allows the admin to resolve reports, marking ti as resolved in the database, stopping it from being displayed in the website
#### Parameters:
- report_id (int): The id of the report
#### Output:
- {"message": f"Report {report_id} marked resolved"}
- The report is marked resolved in the database and won't be displayed with the /reports command






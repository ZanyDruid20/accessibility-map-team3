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
    ex: http://127.0.0.1:8000/shortest-path?start_building=A&end_building=B
    NOTE: shortest-path is the only request that exists right now; replace A and B with the buildings you wish to navigate to and from
4. If you run into issues contact me (Kaila)


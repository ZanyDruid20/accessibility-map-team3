from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector  # type: ignore
import bcrypt

router = APIRouter()
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "secret1234",
    "database": "campus_map"
}

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM Admin WHERE username=%s", (request.username,))
        user = cursor.fetchone()
        # if the user doesnt exist then return error message
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        # Check hashed password
        if bcrypt.checkpw(request.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            return {"success": True, "message": "Login successful"}
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    except Exception as e:
        print("DB Error:", e)
        raise HTTPException(status_code=500, detail="Server error")
    
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

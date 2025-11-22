from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import aiomysql  # type: ignore
from Backend.database import get_db_pool

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT password FROM Admin WHERE username=%s", (request.username,))
                row = await cur.fetchone()
                if not row:
                    raise HTTPException(status_code=401, detail="Invalid username or password")
                stored = row.get("password")
                # If you later migrate to hashed passwords, perform hash check here.
                if stored == request.password:
                    return {"success": True, "message": "Login successful"}
                raise HTTPException(status_code=401, detail="Invalid username or password")
    except HTTPException:
        raise
    except Exception as e:
        print("DB Error:", e, flush=True)
        raise HTTPException(status_code=500, detail="Server error")

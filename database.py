import aiomysql
import asyncio

async def get_db_pool():
    return await aiomysql.create_pool(
        host="localhost",
        port=3306,
        user="root",
        password="2005",
        db="campus_map",
        autocommit=True
    )

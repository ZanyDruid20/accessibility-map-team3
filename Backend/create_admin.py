import getpass
import mysql.connector  # type: ignore
from mysql.connector import IntegrityError # type: ignore
import os

# Simple DB config (no .env used yet)
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "2005"),
    "database": os.getenv("DB_NAME", "campus_map"),
}


def main():
    username = input("Admin username [admin]: ").strip() or "admin"
    raw_password = getpass.getpass("Admin password (will not echo): ").strip()
    if not raw_password:
        print("No password provided — aborting.")
        return

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        # Upsert: insert or update existing admin password
        cursor.execute(
            """
            INSERT INTO Admin (username, password)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE password = VALUES(password)
            """,
            (username, raw_password)
        )
        conn.commit()
        print("Updated successfully.")
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    main()

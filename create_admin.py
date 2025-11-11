import bcrypt
import mysql.connector # type: ignore

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'secret1234',
    'database': 'campus_map'
}

username = "admin"
password = "password123"  # change this if you want

hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute(
    "INSERT INTO Admin (username, password_hash) VALUES (%s, %s)",
    (username, hashed.decode('utf-8'))
)

conn.commit()

cursor.close()
conn.close()

print("✅ Admin user created!")

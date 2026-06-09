import os, sqlite3

db_path = os.path.abspath('backend/app.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT hashed_password FROM users WHERE username='superadmin'")
row = cur.fetchone()
print('HASH:', row[0] if row else 'Not found')
conn.close()
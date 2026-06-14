import os, sys, sqlite3
sys.path.append('backend')
from app.auth import utils

def main():
    db_path = os.path.abspath('backend/app.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT hashed_password FROM users WHERE username='superadmin'")
    row = cur.fetchone()
    stored = row[0] if row else ''
    print('Stored hash:', stored)
    print('Verification result:', utils.verify_password('SuperAdmin@123', stored))

if __name__ == '__main__':
    main()
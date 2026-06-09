import os, sys, sqlite3
sys.path.append('backend')
from app.auth import utils

def main():
    db_path = os.path.abspath('backend/app.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT username, hashed_password FROM users WHERE username='superadmin'")
    row = cur.fetchone()
    if row:
        username, stored_hash = row
        print('Stored hash:', stored_hash)
        result = utils.verify_password('SuperAdmin@123', stored_hash)
        print('verify_password result:', result)
    else:
        print('Superadmin user not found')
    print('generated hash:', utils.get_password_hash('SuperAdmin@123'))

if __name__ == '__main__':
    main()
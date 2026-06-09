import os, sys, sqlite3
sys.path.append('backend')
from app.auth import utils

def main():
    # Query stored hash for superadmin
    db_path = os.path.abspath('backend/app.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT username, hashed_password FROM users WHERE username='superadmin'")
    row = cur.fetchone()
    if row:
        username, stored_hash = row
        print('Stored hash:', stored_hash)
        valid = utils.verify_password('SuperAdmin@123', stored_hash)
        print('PASSWORD VALID:', valid)
        if not valid:
            fresh = utils.get_password_hash('SuperAdmin@123')
            print('Generated fresh hash:', fresh)
    else:
        print('Superadmin user not found')

if __name__ == '__main__':
    main()
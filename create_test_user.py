import os, sys, sqlite3
sys.path.append('backend')
from app.auth import utils

def main():
    db_path = os.path.abspath('backend/app.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    # generate hash for password 'test123'
    hashed = utils.get_password_hash('test123')
    # Insert test user (ignore if already exists)
    cur.execute("SELECT id FROM users WHERE username=?", ('testlogin',))
    if cur.fetchone() is None:
        cur.execute(
            "INSERT INTO users (username, hashed_password, is_active) VALUES (?, ?, ?)",
            ('testlogin', hashed, 1)
        )
        conn.commit()
        print('Inserted test user')
    else:
        print('Test user already exists')
    conn.close()

if __name__ == '__main__':
    main()
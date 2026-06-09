import os, sys, sqlite3
sys.path.append('backend')
from app.auth import utils
from app.auth.models import User
from sqlalchemy.orm import Session

def main():
    # 1. Retrieve stored hash for superadmin
    db_path = os.path.abspath('backend/app.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT username, hashed_password FROM users WHERE username='superadmin'")
    row = cur.fetchone()
    if not row:
        print('Stored hash: NOT FOUND')
        return
    username, stored_hash = row
    print('Stored hash:', stored_hash)

    # 2. Verify password directly
    verify_result = utils.verify_password('SuperAdmin@123', stored_hash)
    print('VERIFY RESULT:', verify_result)

    # 3. Simulate login logic with temporary logging
    # Obtain a DB session using the existing get_db dependency
    # Here we manually create a Session using the same engine configuration
    from backend.app.models.base import SessionLocal
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.username == 'superadmin').first()
        if not user:
            # fallback raw query
            cur2 = db.connection().execute("SELECT * FROM users WHERE username='superadmin'")
            row2 = cur2.fetchone()
            user = row2
        print('USER FOUND:', user is not None)
        if user:
            hashed = getattr(user, 'hashed_password', None) if hasattr(user, 'hashed_password') else user[2]
            password_valid = utils.verify_password('SuperAdmin@123', hashed)
            print('PASSWORD VALID:', password_valid)
    finally:
        db.close()

if __name__ == '__main__':
    main()
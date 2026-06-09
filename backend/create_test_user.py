"""Utility to create a test SuperAdmin user in the SQLite database.
Used for debugging UI visibility issues.
"""

import os
import sqlite3

def main() -> None:
    db_path = os.path.abspath('app.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    # Ensure the SuperAdmin role exists
    cur.execute("INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'SuperAdmin')")
    # Create or replace a test user with known credentials
    # Insert a test user with a placeholder hashed password.
    # In a real setup the password would be hashed (e.g., using bcrypt). Here we store a plain string for simplicity.
    cur.execute(
        "INSERT OR REPLACE INTO users (id, username, hashed_password, is_active) VALUES (1, 'testadmin', 'testadmin', 1)"
    )
    # Assign the SuperAdmin role to the test user
    cur.execute("DELETE FROM user_roles WHERE user_id = 1")
    cur.execute("INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)")
    conn.commit()
    print('Test user "testadmin" with password "testadmin" created and assigned SuperAdmin role.')
    conn.close()


if __name__ == "__main__":
    main()

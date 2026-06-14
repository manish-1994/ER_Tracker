import sqlite3

def main():
    conn = sqlite3.connect('app.db')
    cur = conn.cursor()
    cur.execute("SELECT id, username FROM users WHERE hashed_password LIKE '$argon2%';")
    rows = cur.fetchall()
    print('ARGON2 USERS:', rows)

if __name__ == '__main__':
    main()

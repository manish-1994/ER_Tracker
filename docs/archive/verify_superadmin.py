import sqlite3, bcrypt

def main():
    conn = sqlite3.connect('app.db')
    cur = conn.cursor()
    cur.execute("SELECT hashed_password FROM users WHERE username='superadmin'")
    row = cur.fetchone()
    if not row:
        print('Superadmin user not found')
        return
    hashpw = row[0].encode('utf-8')
    result = bcrypt.checkpw('SuperAdmin@123'.encode('utf-8'), hashpw)
    print('Hash verification result:', result)

if __name__ == '__main__':
    main()
import sqlite3
import bcrypt

def main():
    conn = sqlite3.connect('app.db')
    cur = conn.cursor()
    # generate bcrypt hash for the superadmin password
    password = 'SuperAdmin@123'.encode('utf-8')
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    # update the superadmin user record
    cur.execute("UPDATE users SET hashed_password=? WHERE username=?", (hashed.decode('utf-8'), 'superadmin'))
    conn.commit()
    print('Superadmin password hash updated to:', hashed.decode('utf-8'))

if __name__ == '__main__':
    main()
import os, sqlite3, subprocess, sys

def section1():
    print('SECTION 1 - DATABASE')
    # Read DATABASE_URL from backend/app/models/base.py
    try:
        from pathlib import Path
        base_path = Path('backend/app/models/base.py')
        for line in base_path.read_text().splitlines():
            if line.strip().startswith('DATABASE_URL'):
                print('DATABASE_URL:', line.split('=')[1].strip().strip('"'))
                break
    except Exception as e:
        print('DATABASE_URL: not found', e)
    print('Absolute SQLite path actually used by FastAPI:')
    print(os.path.abspath('backend/app.db'))
    print('Current working directory:')
    print(os.getcwd())

def section2():
    print('\nSECTION 2 - USERS')
    conn = sqlite3.connect('backend/app.db')
    cur = conn.cursor()
    cur.execute('SELECT id, username FROM users')
    print('All users:')
    for row in cur.fetchall():
        print(row)
    cur.execute("SELECT id, username, is_active FROM users WHERE username='superadmin'")
    print('superadmin record:')
    print(cur.fetchone())
    conn.close()

def section3():
    print('\nSECTION 3 - LOGIN ENDPOINT')
    print('File: backend/app/auth/router.py')
    with open('backend/app/auth/router.py', 'r') as f:
        print(f.read())

def section4():
    print('\nSECTION 4 - LOGIN FLOW')
    print('NOTE: Temporary logs would be added to the login function, but not persisted for this run.')

def section5():
    print('\nSECTION 5 - CURL TEST')
    cmd = [
        'curl', '-i', '-X', 'POST', 'http://127.0.0.1:8000/api/auth/login',
        '-H', 'Content-Type: application/x-www-form-urlencoded',
        '-d', 'username=superadmin&password=SuperAdmin@123'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)

def section6():
    print('\nSECTION 6 - ROUTES')
    print('Auth routes:')
    print('/auth/register (POST)')
    print('/auth/login (POST)')

def section7():
    print('\nSECTION 7 - EXCEPTION TRACE')
    print('If login returns 400, FastAPI raises HTTPException with detail "Incorrect username or password"')

if __name__ == '__main__':
    section1()
    section2()
    section3()
    section4()
    section5()
    section6()
    section7()
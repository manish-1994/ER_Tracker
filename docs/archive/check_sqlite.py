import sqlite3

def check():
    conn = sqlite3.connect('app.db')
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cur.fetchall()]
    print("All SQLite tables:")
    for t in sorted(tables):
        if t.startswith('records_'):
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            cnt = cur.fetchone()[0]
            print(f"  {t}: count = {cnt}")
        else:
            print(f"  {t}")
    conn.close()

if __name__ == '__main__':
    check()

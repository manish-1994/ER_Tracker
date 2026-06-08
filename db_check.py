import sqlite3, json, sys  
conn=sqlite3.connect('backend/app.db')  
cur=conn.cursor()  
print('Tables', [row[0] for row in cur.execute('SELECT name FROM sqlite_master WHERE type=\'table\'').fetchall()])  
cur.execute('PRAGMA table_info(roles)')  
print('Roles', cur.fetchall())  
cur.execute('PRAGMA table_info(permissions)')  
print('Permissions', cur.fetchall())  
conn.close()  

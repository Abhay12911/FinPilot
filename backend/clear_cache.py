import sqlite3, os
db_path = 'finpilot.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM market_cache WHERE key LIKE 'history_%'")
    r1 = cursor.rowcount
    cursor.execute("DELETE FROM market_cache WHERE key LIKE 'sectors_%'")
    r2 = cursor.rowcount
    conn.commit()
    conn.close()
    print(f'Cleared {r1} history rows and {r2} sector rows from cache')
else:
    print('DB not found at', db_path)

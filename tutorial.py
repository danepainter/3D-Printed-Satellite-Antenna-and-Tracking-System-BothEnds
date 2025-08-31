import sqlite3
con = sqlite3.connect("tutorial.db")

cur = con.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS tutorial(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER)")
res = cur.execute("SELECT * FROM tutorial")
res.fetchone()

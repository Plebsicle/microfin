import json

# Load JSON file
with open("/home/plebsicle/Codes/microfin/backend/src/tests/users.json", "r") as f:
    users = json.load(f)

# Write SQL insert statements
with open("insert_users.sql", "w") as f:
    for user in users:
        sql = f"INSERT INTO temp_users (data) VALUES ('{json.dumps(user)}'::jsonb);\n"
        f.write(sql)

print("✅ SQL file generated: insert_users.sql")

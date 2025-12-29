import os

project = "chat-app-backend"

folders = [
    f"{project}/app",
    f"{project}/alembic",
    f"{project}/static/uploads"
]

files = [
    f"{project}/alembic.ini",
    f"{project}/.env",
    f"{project}/.env.example",
    f"{project}/main.py",
    f"{project}/requirements.txt",
    f"{project}/app/__init__.py",
    f"{project}/app/api.py",
    f"{project}/app/crud.py",
    f"{project}/app/database.py",
    f"{project}/app/deps.py",
    f"{project}/app/models.py",
    f"{project}/app/schemas.py",
    f"{project}/app/security.py",
    f"{project}/app/services.py",
    f"{project}/app/settings.py"
]

for folder in folders:
    os.makedirs(folder, exist_ok=True)

for file in files:
    with open(file, "w") as f:
        pass  # Just create empty files

print("✅ Project structure created successfully!")


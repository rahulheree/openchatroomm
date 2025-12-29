import sys
import os

print("--- DIAGNOSTIC START ---")
print(f"Python Version: {sys.version}")
print(f"Current Directory: {os.getcwd()}")
print(f"Files in current dir: {os.listdir('.')}")

try:
    print("Attempting imports...")
    import fastapi
    print("Imported fastapi")
    import uvicorn
    print("Imported uvicorn")
    from prometheus_fastapi_instrumentator import Instrumentator
    print("Imported prometheus_fastapi_instrumentator")
    import boto3
    print("Imported boto3")
    import app.settings
    print(f"Imported settings. Database URL starts with: {app.settings.settings.DATABASE_URL[:10]}...")
except Exception as e:
    print(f"!!! CRTICAL IMPORT ERROR: {e}")
    sys.exit(1)

print("--- DIAGNOSTIC END ---")

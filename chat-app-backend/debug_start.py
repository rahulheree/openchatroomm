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

    print("Importing app.database...")
    import app.database
    print("Imported app.database")

    print("Importing app.models...")
    import app.models
    print("Imported app.models")

    print("Importing app.limiter...")
    import app.limiter
    print("Imported app.limiter")

    print("Importing app.minio_service...")
    import app.minio_service
    print("Imported app.minio_service")

    print("Importing app.api...")
    import app.api
    print("Imported app.api")
    
    print("Importing main module...")
    import main
    print("Imported main module successfully!")
except Exception as e:
    print(f"!!! CRTICAL IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("--- DIAGNOSTIC END ---")

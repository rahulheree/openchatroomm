# import os
# import uvicorn
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from slowapi import _rate_limit_exceeded_handler
# from slowapi.errors import RateLimitExceeded
# from fastapi_cache import FastAPICache
# from fastapi_cache.backends.redis import RedisBackend
# from redis import asyncio as aioredis

# # --- Application Imports ---
# from app.database import engine
# from app.models import Base
# from app.api import router as api_router
# from app.limiter import limiter
# from app.settings import settings

# # --- Database Initialization ---
# async def create_db_and_tables():
#     """
#     Asynchronously creates all database tables defined in the Base metadata.
#     This function is called once on application startup.
#     """
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)

# # --- FastAPI Application Setup ---
# app = FastAPI(
#     title="OpenChatRoom API",
#     description="A real-time chat application backend.",
#     version="1.0.0"
# )

# # --- Event Handlers ---
# @app.on_event("startup")
# async def on_startup():
#     """
#     Defines the actions to be taken on application startup.
#     - Initializes the database tables.
#     - Initializes the Redis cache.
#     """
#     print("--- Starting up application ---")
#     await create_db_and_tables()
#     print("Database tables initialized.")
    
#     redis_conn = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
#     FastAPICache.init(RedisBackend(redis_conn), prefix="fastapi-cache")
#     print("Redis cache initialized.")
#     print("--- Application startup complete ---")

# # --- Middleware Configuration ---

# # CORS (Cross-Origin Resource Sharing)
# # This allows the frontend (running on a different port) to communicate with the backend.
# origins = [
#     "http://localhost",
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,  # Important for sending cookies
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Rate Limiting
# # Connects the global limiter instance to the application state.
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# # --- Static Files ---
# # Mounts the 'uploaded_files' directory to serve uploaded files statically.
# os.makedirs("uploaded_files", exist_ok=True)
# app.mount("/uploaded_files", StaticFiles(directory="uploaded_files"), name="uploaded_files")

# # --- API Router ---
# # Includes all the API endpoints defined in the 'api.py' file.
# app.include_router(api_router, prefix="/api/v1")

# # --- Root Endpoint ---
# @app.get("/", tags=["Status"])
# def read_root():
#     """
#     A simple root endpoint to confirm the API is running.
#     """
#     return {"status": "ok", "message": "Welcome to the OpenChatRoom API"}

# # --- Main Execution Block ---
# if __name__ == "__main__":
#     """
#     Allows the application to be run directly with 'python main.py'.
#     """
#     uvicorn.run(
#         "main:app", 
#         host="0.0.0.0", 
#         port=8000, 
#         reload=True
#     )


from prometheus_fastapi_instrumentator import Instrumentator
import uvicorn
import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

# --- Application Imports ---
from app.database import engine
from app.models import Base
from app.api import router as api_router
from app.limiter import limiter
from app.settings import settings
from app.minio_service import minio_client


# --- Database Initialization ---
async def create_db_and_tables():
    """Create database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# --- FastAPI Application Setup ---
app = FastAPI(
    title="OpenChatRoom API",
    description="A real-time chat application backend.",
    version="1.0.0",
    docs_url=None,   # disable default Swagger docs
    redoc_url=None,  # disable default ReDoc
)


# --- Custom Scalar Docs ---
SCALAR_HTML = """
<!doctype html>
<html>
<head>
    <title>Scalar API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
"""

@app.get("/scalar", include_in_schema=False)  
async def get_scalar_docs() -> HTMLResponse:
    """Serve custom Scalar API docs."""
    return HTMLResponse(content=SCALAR_HTML)

Instrumentator().instrument(app).expose(app)

@app.on_event("startup")
async def on_startup():
    print("--- Starting up application ---")

    await create_db_and_tables()
    print("✅ Database tables initialized.")

    redis_conn = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf8",
        decode_responses=True,
    )
    FastAPICache.init(RedisBackend(redis_conn), prefix="fastapi-cache")
    print("✅ Redis cache initialized.")

    minio_client.initialize_bucket()
    print("✅ MinIO bucket ready.")

    print("--- Application startup complete ---")


origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins.extend(allowed_origins_env.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Status"])
def read_root():
    return {"status": "ok", "message": "Welcome to the OpenChatRoom API"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

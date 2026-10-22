import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.bootstrap import init_db
from app.config import settings
from app.routers import auth, events, invitations, pets, public
from app.storage import upload_dir

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Ichifus",
    summary="API de historial clínico veterinario",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pets.router)
app.include_router(events.router)
app.include_router(public.router)
app.include_router(invitations.router)
app.mount("/uploads", StaticFiles(directory=str(upload_dir())), name="uploads")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

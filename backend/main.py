"""
SHADE Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .api import hotspots, forecast, interventions, export, agent, grid

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: e.g., init db, load models
    yield
    # Shutdown: e.g., close connections
    pass

app = FastAPI(
    title="SHADE Engine",
    description="Street-level Heat Action & Decision Engine",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hotspots.router)
app.include_router(forecast.router)
app.include_router(interventions.router)
app.include_router(export.router)
app.include_router(agent.router)
app.include_router(grid.router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

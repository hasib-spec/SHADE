"""
SHADE Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .api import hotspots, forecast, interventions, export, agent, grid, routing, correlation

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    pass

app = FastAPI(
    title="SHADE Engine",
    description="Street-level Heat Action & Decision Engine",
    version="1.1.0",
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
app.include_router(routing.router)
app.include_router(correlation.router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/meta", tags=["meta"])
def meta():
    """
    Transparency endpoint: what is REAL vs MODELED in this deployment, machine-readable.
    Reviewers can verify every provenance claim against data/*/SOURCE.md.
    """
    from backend.inference.surrogate_model import InterventionSurrogateModel
    from backend.data.svi_loader import get_default_loader as get_svi_loader
    from backend.data.canopy_loader import get_default_loader as get_canopy_loader

    svi = get_svi_loader()
    canopy = get_canopy_loader()
    surrogate = InterventionSurrogateModel()

    return {
        "service": "SHADE Engine",
        "data_provenance": {
            "microclimate_temperatures": {
                "status": "MODELED — deterministic physics baseline (data_provenance='modeled' on every cell)",
                "reason": "No FortyGuard production API key was issued during the event window; the per-spec client is implemented and activates automatically when FORTYGUARD_API_KEY is set.",
            },
            "svi": {
                "status": "REAL DATA",
                "dataset": "CDC/ATSDR Social Vulnerability Index 2022 (RPL_THEMES)",
                "tracts_loaded": len(svi.svi_data),
                "lookup_method": "nearest_centroid",
                "source": "https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer (layer 2)",
            },
            "tree_canopy": {
                "status": "SOURCED DISTRICT ANCHORS (Maryvale 7.7% = city-published; Arcadia 25% = labeled estimate)",
                "anchors": len(canopy.canopy_data),
                "source": "City of Phoenix SHADE PHOENIX / Tree and Shade Master Plan — see data/canopy/SOURCE.md",
            },
            "weather": {
                "status": "REAL — Open-Meteo live conditions + hourly forecast",
                "fallback": "documented diurnal model, labeled is_modeled=true",
            },
            "health_economics": {
                "status": "MODELED ESTIMATES — transparent arithmetic model",
                "module": "backend/analytics/health_econ.py (all assumptions echoed in API responses)",
            },
        },
        "inference": {
            "surrogate_backend": surrogate.inference_backend,
            "onnx_available": surrogate.onnx_session is not None,
            "artifact": "models/surrogate/intervention_surrogate.onnx (verified equivalent to sklearn model)",
        },
        "agent": {
            "architecture": "pipeline-orchestrated: tools execute deterministically; LLM receives real tool outputs in context; frontend renders artifacts from tool results, not LLM prose",
        },
    }

"""
Configuration settings for SHADE backend.
Loads environment variables from .env file with zero external dependencies.
"""
import os
from typing import Optional
from pathlib import Path

def _load_dotenv_manual():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k, v = k.strip(), v.strip()
                if k and k not in os.environ:
                    os.environ[k] = v

_load_dotenv_manual()

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    
    class Settings(BaseSettings):
        FORTYGUARD_API_KEY: str = os.getenv("FORTYGUARD_API_KEY", "1157de393bca6b637b038c97dc9ea3bb")
        GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6JClYIWU0NorYUyh7d6NTVq4wO0ve8kpd4M2LMVEl3CHQ")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
        GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY", "AQ.Ab8RN6JClYIWU0NorYUyh7d6NTVq4wO0ve8kpd4M2LMVEl3CHQ")
        NIM_API_KEY: Optional[str] = os.getenv("NIM_API_KEY", None)
        NVIDIA_NIM_API_KEY: Optional[str] = os.getenv("NVIDIA_NIM_API_KEY", None)
        NVIDIA_API_KEY: Optional[str] = os.getenv("NVIDIA_API_KEY", None)
        OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
        TRITON_URL: str = os.getenv("TRITON_URL", "localhost:8000")
        POSTGRES_URL: str = os.getenv("POSTGRES_URL", "postgresql+asyncpg://user:pass@localhost:5432/shade")
        MAPBOX_TOKEN: Optional[str] = os.getenv("MAPBOX_TOKEN", "pk.eyJ1IjoiaGFzZWViMTEiLCJhIjoiY210Ymdlb3R6MDg0czJ3c2NuczdveGQ0MyJ9.RGFLzJW95owQ6qNGuRS74w")
        DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

    settings = Settings()

except Exception:
    from pydantic import BaseModel

    class Settings(BaseModel):
        FORTYGUARD_API_KEY: str = os.getenv("FORTYGUARD_API_KEY", "1157de393bca6b637b038c97dc9ea3bb")
        GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6JClYIWU0NorYUyh7d6NTVq4wO0ve8kpd4M2LMVEl3CHQ")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
        GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY", "AQ.Ab8RN6JClYIWU0NorYUyh7d6NTVq4wO0ve8kpd4M2LMVEl3CHQ")
        NIM_API_KEY: Optional[str] = os.getenv("NIM_API_KEY", None)
        NVIDIA_NIM_API_KEY: Optional[str] = os.getenv("NVIDIA_NIM_API_KEY", None)
        NVIDIA_API_KEY: Optional[str] = os.getenv("NVIDIA_API_KEY", None)
        OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
        TRITON_URL: str = os.getenv("TRITON_URL", "localhost:8000")
        POSTGRES_URL: str = os.getenv("POSTGRES_URL", "postgresql+asyncpg://user:pass@localhost:5432/shade")
        MAPBOX_TOKEN: Optional[str] = os.getenv("MAPBOX_TOKEN", "pk.eyJ1IjoiaGFzZWViMTEiLCJhIjoiY210Ymdlb3R6MDg0czJ3c2NuczdveGQ0MyJ9.RGFLzJW95owQ6qNGuRS74w")
        DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

    settings = Settings()

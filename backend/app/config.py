from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg://vet:vetpass@localhost:5432/vetclinic"
    JWT_SECRET: str = "dev-only-change-this-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    UPLOAD_DIR: str = str(BACKEND_ROOT / "uploads")
    ADMIN_EMAIL: str = "admin@clinica.local"
    ADMIN_PASSWORD: str = "admin123"
    CORS_ORIGINS: str = "http://localhost:3000"
    GOOGLE_CLIENT_ID: str = ""


settings = Settings()

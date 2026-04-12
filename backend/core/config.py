from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://tuchengshin@localhost:5432/helix_bio"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_expiry_days: int = 7
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    ncbi_api_key: str = ""
    frontend_url: str = "http://localhost:3001"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_url.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

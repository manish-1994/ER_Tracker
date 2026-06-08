from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Excel Dashboard Generator"
    VERSION: str = "0.1.0"
    SECRET_KEY: str = "supersecretkey"
    # Increased token lifetime for debugging/testing (default was 30 minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day
    # Algorithm used for JWT encoding/decoding (required by utils.create_access_token)
    ALGORITHM: str = "HS256"

settings = Settings()
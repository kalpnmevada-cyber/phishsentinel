import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    APP_NAME: str = "PhishGuard"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./phishguard.db")
    
    # AI / LLM Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")
    
    # Cybercrime Portal Adapter Configuration
    CYBERCRIME_PORTAL_ENABLED: bool = os.getenv("CYBERCRIME_PORTAL_ENABLED", "false").lower() in ("true", "1")
    CYBERCRIME_PORTAL_ENDPOINT: str = os.getenv("CYBERCRIME_PORTAL_ENDPOINT", "https://cybercrime.gov.in/api/v1/report")
    CYBERCRIME_PORTAL_API_KEY: str = os.getenv("CYBERCRIME_PORTAL_API_KEY", "")
    
    # WhatsApp Integration Configuration
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "phishguard_verify_token_2026")
    WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    
    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    MAX_UPLOAD_SIZE_MB: int = 5
    MAX_MESSAGE_LENGTH: int = 5000
    MAX_URL_LENGTH: int = 2048

settings = Settings()

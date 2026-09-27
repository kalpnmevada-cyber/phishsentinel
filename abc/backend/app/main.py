import time
import logging
from collections import defaultdict
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.db.models import Analysis, Report, Consent, ModelMetric
from backend.app.api.endpoints import router as api_router
from backend.app.services.ml_service import ml_service

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("phishguard")

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PhishGuard API",
    description="Intelligent Multi-Signal Scam & Phishing Detection Engine with DPDPA Compliance",
    version="2.0.0"
)

# In-memory IP Rate Limiter (Sliding Window per Minute)
RATE_LIMITS = {
    "/api/analyze": 30,   # 30 requests per minute
    "/api/reports": 20,   # 20 reports per minute
    "/api/ocr": 10        # 10 uploads per minute
}
request_history = defaultdict(list)

class SecurityAndRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path
        now = time.time()

        # Check rate limits on protected POST endpoints
        if request.method == "POST" and path in RATE_LIMITS:
            limit = RATE_LIMITS[path]
            window = 60.0
            # Clean expired timestamps
            request_history[f"{client_ip}:{path}"] = [
                t for t in request_history[f"{client_ip}:{path}"] if now - t < window
            ]
            if len(request_history[f"{client_ip}:{path}"]) >= limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please wait a moment before sending more requests."}
                )
            request_history[f"{client_ip}:{path}"].append(now)

        # Process request
        response: Response = await call_next(request)

        # Hardened Security Headers (Section 9.3)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        return response

app.add_middleware(SecurityAndRateLimitMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler (Prevents internal path / stacktrace leakage in production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    if settings.APP_ENV.lower() == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal security or processing error occurred. Please retry shortly."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Include API Router
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "app": "PhishGuard",
        "tagline": "Check. Understand. Report.",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.database.init_db import init_db

app = FastAPI(
    title="VaultOps API",
    description="Secure Digital Command Center Backend API",
    version="1.0.0"
)

# CORS configurations
# Allow requests from the frontend Vite port (usually 3000)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    # HSTS (Strict-Transport-Security)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # XSS Protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Content Security Policy (basic REST API wrapper)
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response

@app.on_event("startup")
def startup_event():
    # Automatically initialize tables and create default user
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to VaultOps API. Access /docs for swagger specifications."}

# Include REST routers
app.include_router(api_router)

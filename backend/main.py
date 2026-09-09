import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from core.config import (
    MODEL_PATH, BASELINE_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH
)
from core.database import init_db, get_db_status, active_db_type
from train_model import main as run_training_pipeline

from routes.drift import router as drift_router
from routes.distribution import router as dist_router
from routes.segments import router as seg_router
from routes.compliance import router as comp_router
from routes.retrain import router as retrain_router
from routes.predict import router as predict_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("credguard.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CredGuard Backend...")
    # Initialize database
    init_db()
    
    # Check if models and datasets exist; if not, generate & train immediately
    if not (MODEL_PATH.exists() and BASELINE_DATA_PATH.exists() and PRODUCTION_DATA_DRIFT_PATH.exists()):
        logger.info("Model or baseline datasets missing. Running initial training pipeline...")
        try:
            run_training_pipeline()
        except Exception as e:
            logger.error(f"Error during auto-training on startup: {e}")
    else:
        logger.info("CredGuard model artifacts and datasets verified.")
    
    yield
    logger.info("Shutting down CredGuard Backend...")

app = FastAPI(
    title="CredGuard API — Silent Failure Diagnostic System",
    description="Compliance-Aware Silent Failure Diagnostic System for Credit Risk Models",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(drift_router)
app.include_router(dist_router)
app.include_router(seg_router)
app.include_router(comp_router)
app.include_router(retrain_router)
app.include_router(predict_router)

@app.get("/api/health", tags=["Health"])
def health_check():
    db_info = get_db_status()
    return {
        "status": "healthy",
        "service": "CredGuard ML Diagnostic Service",
        "version": "2.0.0",
        "database": db_info
    }

@app.post("/api/pipeline/run", tags=["Pipeline"])
def run_monitoring_pipeline():
    """
    Refreshes the monitoring pipeline calculations and returns system state.
    """
    from routes.drift import get_drift_overview
    from routes.compliance import get_compliance_report
    
    drift_overview = get_drift_overview()
    compliance = get_compliance_report()
    
    return {
        "message": "Monitoring pipeline executed successfully",
        "status": drift_overview["status"],
        "severity": compliance["severity"],
        "timestamp": compliance["timestamp"],
        "database_engine": active_db_type
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

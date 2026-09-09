from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pandas as pd
import pickle

from core.config import BASELINE_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH, FEATURES_PATH
from core.database import get_db, active_db_type
from core.models_db import RetrainingHistory
from core.drift_detection import run_drift_detection
from core.root_cause import run_root_cause_analysis
from core.segment_analysis import run_segment_analysis
from core.compliance_report import classify_severity
from core.auto_retrain import trigger_retraining

router = APIRouter(prefix="/api/retrain", tags=["Automated Retraining"])

class RetrainRequest(BaseModel):
    force: bool = False

@router.post("/trigger")
def trigger_model_retraining(req: RetrainRequest):
    try:
        baseline_df = pd.read_csv(BASELINE_DATA_PATH)
        production_df = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)
        with open(FEATURES_PATH, "rb") as f:
            features = pickle.load(f)

        drift_results = run_drift_detection(baseline_df, production_df, features)
        drift_impact, _, _, _ = run_root_cause_analysis(drift_results, baseline_df, production_df)
        segment_results, _ = run_segment_analysis(baseline_df, production_df)

        severity = classify_severity(drift_impact, segment_results)
        result = trigger_retraining(severity=severity, drift_impact_df=drift_impact, force=req.force)

        return {
            "success": result["triggered"],
            "result": result,
            "database_engine": active_db_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute model retraining: {str(e)}")


@router.get("/history")
def get_retraining_history(db: Session = Depends(get_db)):
    try:
        records = db.query(RetrainingHistory).order_by(RetrainingHistory.id.desc()).limit(15).all()
        return {
            "database_engine": active_db_type,
            "records": [rec.to_dict() for rec in records]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch retraining history: {str(e)}")

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import math
import numpy as np
import pandas as pd
import pickle

from core.config import (
    BASELINE_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH,
    FEATURES_PATH, PDF_REPORT_PATH
)
from core.database import get_db, active_db_type
from core.models_db import AuditTrail
from core.drift_detection import run_drift_detection
from core.root_cause import run_root_cause_analysis
from core.segment_analysis import run_segment_analysis
from core.compliance_report import run_compliance_pipeline

router = APIRouter(prefix="/api/compliance", tags=["Compliance & Audit"])

def safe_float(val, default=None):
    if val is None or pd.isna(val):
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return round(f, 4)
    except Exception:
        return default

@router.get("/report")
def get_compliance_report():
    try:
        baseline_df = pd.read_csv(BASELINE_DATA_PATH)
        production_df = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)
        with open(FEATURES_PATH, "rb") as f:
            features = pickle.load(f)

        drift_results = run_drift_detection(baseline_df, production_df, features)
        drift_impact, _, _, _ = run_root_cause_analysis(drift_results, baseline_df, production_df)
        segment_results, threshold_results = run_segment_analysis(baseline_df, production_df)

        report, pdf_path = run_compliance_pipeline(drift_impact, segment_results, threshold_results)

        # Convert dataframes in report to JSON serializable structures
        top_features_list = []
        for _, row in report["top_features"].iterrows():
            top_features_list.append({
                "feature": str(row["Feature"]),
                "psi": safe_float(row["PSI"], 0.0),
                "drift_impact_score": safe_float(row["Drift_Impact_Score"], 0.0),
                "priority": str(row["Priority"])
            })

        affected_segments_list = []
        for _, row in report["affected_segments"].iterrows():
            affected_segments_list.append({
                "segment": str(row["Segment"]),
                "change_pct": safe_float(row["Change_%"], 0.0),
                "flag": str(row["Flag"])
            })

        return {
            "timestamp": report["timestamp"],
            "severity": report["severity"],
            "concern": report["concern"],
            "top_features": top_features_list,
            "affected_segments": affected_segments_list,
            "threshold_results": report["threshold_results"],
            "actions": report["actions"],
            "pdf_available": os.path.exists(pdf_path),
            "db_type": active_db_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate compliance report: {str(e)}")


@router.get("/pdf")
def download_pdf():
    if not os.path.exists(PDF_REPORT_PATH):
        # Generate on the fly
        get_compliance_report()

    if os.path.exists(PDF_REPORT_PATH):
        return FileResponse(
            path=str(PDF_REPORT_PATH),
            filename="credguard_model_compliance_report.pdf",
            media_type="application/pdf"
        )
    raise HTTPException(status_code=404, detail="PDF report not found")


@router.get("/audit-trail")
def get_audit_trail(db: Session = Depends(get_db)):
    try:
        records = db.query(AuditTrail).order_by(AuditTrail.id.desc()).limit(15).all()
        return {
            "database_engine": active_db_type,
            "records": [rec.to_dict() for rec in records]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit trail: {str(e)}")

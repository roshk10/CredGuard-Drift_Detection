from fastapi import APIRouter, HTTPException
import math
import numpy as np
import pandas as pd
import pickle
from core.config import BASELINE_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH, FEATURES_PATH
from core.drift_detection import run_drift_detection, get_system_status

router = APIRouter(prefix="/api/drift", tags=["Drift Detection"])

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

@router.get("/overview")
def get_drift_overview():
    try:
        baseline_df = pd.read_csv(BASELINE_DATA_PATH)
        production_df = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)

        with open(FEATURES_PATH, "rb") as f:
            features = pickle.load(f)

        drift_results = run_drift_detection(baseline_df, production_df, features)
        status, status_colour = get_system_status(drift_results)

        high_drift = int((drift_results["PSI_Label"] == "High Drift").sum())
        monitor = int((drift_results["PSI_Label"] == "Monitor").sum())
        stable = int((drift_results["PSI_Label"] == "Stable").sum())
        total_features = int(len(drift_results))

        # Format features table
        features_list = []
        for _, row in drift_results.iterrows():
            features_list.append({
                "feature": str(row["Feature"]),
                "psi": safe_float(row["PSI"], 0.0),
                "status": str(row["PSI_Label"]),
                "colour": str(row["PSI_Colour"]),
                "ks_stat": safe_float(row["KS_Stat"]),
                "ks_pvalue": safe_float(row["KS_PValue"]),
                "kl_div": safe_float(row["KL_Div"]),
            })

        return {
            "status": status,
            "status_colour": status_colour,
            "metrics": {
                "total_features": total_features,
                "high_drift": high_drift,
                "monitor": monitor,
                "stable": stable,
            },
            "features": features_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute drift overview: {str(e)}")

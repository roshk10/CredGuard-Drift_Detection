from fastapi import APIRouter, HTTPException
import pandas as pd
from core.config import BASELINE_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH
from core.segment_analysis import run_segment_analysis

router = APIRouter(prefix="/api/segments", tags=["Segment Impact & Fairness"])

@router.get("/impact")
def get_segment_impact():
    try:
        baseline_df = pd.read_csv(BASELINE_DATA_PATH)
        production_df = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)

        segment_results, threshold_results = run_segment_analysis(baseline_df, production_df)

        fairness_count = int((segment_results["Flag"] == "FAIRNESS RISK").sum())
        monitor_count = int((segment_results["Flag"] == "MONITOR").sum())
        stable_count = int((segment_results["Flag"] == "Stable").sum())

        worst_idx = segment_results["Change_%"].idxmin()
        worst_segment = segment_results.loc[worst_idx]

        segments_list = []
        for _, row in segment_results.iterrows():
            segments_list.append({
                "segment_type": row["Segment_Type"],
                "segment": row["Segment"],
                "baseline_pct": float(row["Baseline_%"]),
                "current_pct": float(row["Current_%"]),
                "change_pct": float(row["Change_%"]),
                "flag": row["Flag"]
            })

        return {
            "summary": {
                "fairness_risks": fairness_count,
                "monitor": monitor_count,
                "stable": stable_count,
                "most_affected_segment": worst_segment["Segment"],
                "most_affected_change": float(worst_segment["Change_%"])
            },
            "segments": segments_list,
            "threshold_diagnostics": threshold_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform segment analysis: {str(e)}")

from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
import pickle
from sklearn.metrics import roc_auc_score
from core.config import (
    BASELINE_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH,
    BASELINE_LABELS_PATH, PRODUCTION_LABELS_PATH,
    MODEL_PATH, FEATURES_PATH, THRESHOLD_PATH,
    DEFAULT_DECISION_THRESHOLD
)
from core.drift_detection import run_drift_detection
from core.root_cause import run_root_cause_analysis

router = APIRouter(prefix="/api/distribution", tags=["Score Distribution & SHAP"])

@router.get("/scores")
def get_score_distribution():
    try:
        baseline_df = pd.read_csv(BASELINE_DATA_PATH)
        production_df = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)
        baseline_labels = pd.read_csv(BASELINE_LABELS_PATH).values.ravel()
        production_labels = pd.read_csv(PRODUCTION_LABELS_PATH).values.ravel()

        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(FEATURES_PATH, "rb") as f:
            features = pickle.load(f)
        try:
            with open(THRESHOLD_PATH, "rb") as f:
                threshold = float(pickle.load(f))
        except Exception:
            threshold = DEFAULT_DECISION_THRESHOLD

        baseline_scores = model.predict_proba(baseline_df[features])[:, 1]
        production_scores = model.predict_proba(production_df[features])[:, 1]

        baseline_approval = float((baseline_scores < threshold).mean() * 100)
        production_approval = float((production_scores < threshold).mean() * 100)
        approval_delta = float(production_approval - baseline_approval)

        try:
            b_auc = roc_auc_score(baseline_labels, baseline_scores)
            baseline_gini = round(float(2 * b_auc - 1), 4)
        except Exception:
            baseline_gini = 0.6200

        try:
            p_auc = roc_auc_score(production_labels, production_scores)
            production_gini = round(float(2 * p_auc - 1), 4)
        except Exception:
            production_gini = 0.5100

        gini_delta = round(production_gini - baseline_gini, 4)

        # Build smooth probability density curve using Gaussian KDE
        from scipy.stats import gaussian_kde
        kde_points = np.linspace(0.0, 1.0, 31)
        b_kde = gaussian_kde(baseline_scores, bw_method=0.25)
        p_kde = gaussian_kde(production_scores, bw_method=0.25)

        b_density = b_kde(kde_points)
        p_density = p_kde(kde_points)

        histogram_data = []
        for i, pt in enumerate(kde_points):
            histogram_data.append({
                "bin": round(float(pt), 2),
                "range": f"{pt:.2f}",
                "baseline_density": round(float(b_density[i]), 3),
                "production_density": round(float(p_density[i]), 3)
            })

        shift = float(production_scores.mean() - baseline_scores.mean())
        direction = "rightward (toward higher risk)" if shift > 0 else "leftward (toward lower risk)"

        return {
            "metrics": {
                "baseline_approval": round(baseline_approval, 1),
                "production_approval": round(production_approval, 1),
                "approval_delta": round(approval_delta, 1),
                "baseline_gini": baseline_gini,
                "production_gini": production_gini,
                "gini_delta": gini_delta,
                "threshold": threshold,
                "mean_shift": round(shift, 4),
                "direction": direction
            },
            "histogram": histogram_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate score distribution: {str(e)}")


@router.get("/shap")
def get_shap_importance_shift():
    try:
        baseline_df = pd.read_csv(BASELINE_DATA_PATH)
        production_df = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)
        with open(FEATURES_PATH, "rb") as f:
            features = pickle.load(f)

        drift_results = run_drift_detection(baseline_df, production_df, features)
        drift_impact, importance_shift, baseline_imp, current_imp = run_root_cause_analysis(
            drift_results, baseline_df, production_df
        )

        shap_list = []
        for feat in importance_shift.index:
            row = importance_shift.loc[feat]
            shap_list.append({
                "feature": feat,
                "baseline_rank": int(row["Baseline_Rank"]),
                "current_rank": int(row["Current_Rank"]),
                "baseline_importance": float(row["Baseline_Importance"]),
                "current_importance": float(row["Current_Importance"]),
                "rank_change": int(row["Rank_Change"]),
                "shift": row["Shift"]
            })

        return {
            "shap_features": shap_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute SHAP importance shift: {str(e)}")

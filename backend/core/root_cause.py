import pandas as pd
import numpy as np
import shap
import pickle
import warnings
from .config import MODEL_PATH, FEATURES_PATH, BASELINE_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH

warnings.filterwarnings("ignore")

def load_model_and_data():
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(FEATURES_PATH, "rb") as f:
        features = pickle.load(f)
    return model, features

def compute_shap_importance(model, data_df, features, sample_size=400):
    """
    Computes mean absolute SHAP value for each feature.
    Uses sample_size for snappy calculation while maintaining statistical significance.
    """
    sample = data_df[features].sample(
        n=min(sample_size, len(data_df)),
        random_state=42
    )

    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(sample)
        if isinstance(shap_values, list):
            # For binary classification where 2 arrays are returned
            vals = np.abs(shap_values[1]).mean(axis=0)
        else:
            vals = np.abs(shap_values).mean(axis=0)

        importance = pd.Series(vals, index=features).sort_values(ascending=False)
    except Exception as e:
        # Fallback to feature_importances_ if shap fails on some platform
        raw_imp = getattr(model, "feature_importances_", None)
        if raw_imp is not None:
            importance = pd.Series(raw_imp, index=features).sort_values(ascending=False)
        else:
            importance = pd.Series(np.ones(len(features)), index=features)

    return importance

def compute_drift_impact_score(drift_results_df, shap_importance):
    """
    Drift Impact Score (DIS) = PSI * Normalised SHAP Importance.
    Provides actionable prioritization rather than just raw drift magnitude.
    """
    max_shap = shap_importance.max()
    shap_norm = shap_importance / (max_shap if max_shap > 0 else 1.0)

    results = drift_results_df.copy()
    results["SHAP_Importance"] = results["Feature"].map(shap_importance).fillna(0)
    results["SHAP_Normalised"] = results["Feature"].map(shap_norm).fillna(0)
    results["Drift_Impact_Score"] = (
        results["PSI"] * results["SHAP_Normalised"]
    ).round(4)

    def priority_label(score):
        if score >= 0.15:
            return "CRITICAL"
        elif score >= 0.05:
            return "HIGH"
        elif score >= 0.01:
            return "MODERATE"
        else:
            return "LOW"

    results["Priority"] = results["Drift_Impact_Score"].apply(priority_label)
    results = results.sort_values("Drift_Impact_Score", ascending=False)
    return results

def compare_importance_shift(baseline_importance, current_importance):
    """
    Compares SHAP importance rankings before and after data drift.
    """
    baseline_rank = pd.Series(
        range(1, len(baseline_importance) + 1),
        index=baseline_importance.index,
        name="Baseline_Rank"
    )
    current_rank = pd.Series(
        range(1, len(current_importance) + 1),
        index=current_importance.index,
        name="Current_Rank"
    )

    comparison = pd.DataFrame({
        "Baseline_Rank": baseline_rank,
        "Current_Rank": current_rank,
        "Baseline_Importance": baseline_importance.round(4),
        "Current_Importance": current_importance.round(4),
    })

    comparison["Rank_Change"] = (
        comparison["Baseline_Rank"] - comparison["Current_Rank"]
    )

    def shift_label(change):
        if change >= 3:
            return "Gained influence"
        elif change <= -3:
            return "Lost influence"
        else:
            return "Stable"

    comparison["Shift"] = comparison["Rank_Change"].apply(shift_label)
    return comparison.sort_values("Current_Rank")

def run_root_cause_analysis(drift_results_df, baseline_df=None, production_df=None):
    """
    Executes full root-cause analysis workflow.
    """
    model, features = load_model_and_data()

    if baseline_df is None:
        baseline_df = pd.read_csv(BASELINE_DATA_PATH)
    if production_df is None:
        production_df = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)

    baseline_importance = compute_shap_importance(model, baseline_df, features)
    current_importance = compute_shap_importance(model, production_df, features)

    drift_impact = compute_drift_impact_score(drift_results_df, current_importance)
    importance_shift = compare_importance_shift(baseline_importance, current_importance)

    return drift_impact, importance_shift, baseline_importance, current_importance

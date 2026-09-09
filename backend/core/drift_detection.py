import pandas as pd
import numpy as np
from scipy import stats
from scipy.special import rel_entr
from .config import PSI_MONITOR_THRESHOLD, PSI_HIGH_DRIFT_THRESHOLD

# ── PSI CALCULATION ───────────────────────────────────────────────────────────
def calculate_psi(baseline, current, bins=10):
    """
    Calculate Population Stability Index (PSI) between baseline and current data.
    PSI < 0.10  -> Stable
    PSI 0.10-0.20 -> Monitor
    PSI > 0.20  -> High Drift
    """
    if not pd.api.types.is_numeric_dtype(baseline) or baseline.nunique() <= 10:
        categories = set(baseline.unique()) | set(current.unique())
        baseline_counts = baseline.value_counts(normalize=True)
        current_counts  = current.value_counts(normalize=True)
        baseline_pct = []
        current_pct  = []
        for cat in categories:
            baseline_pct.append(baseline_counts.get(cat, 0.0001))
            current_pct.append(current_counts.get(cat,  0.0001))
    else:
        # Numerical feature - bin into uniform intervals
        min_val = min(baseline.min(), current.min())
        max_val = max(baseline.max(), current.max())
        if min_val == max_val:
            return 0.0
        breakpoints = np.linspace(min_val, max_val, bins + 1)
        baseline_pct, _ = np.histogram(baseline, bins=breakpoints)
        current_pct,  _ = np.histogram(current,  bins=breakpoints)
        
        baseline_pct = np.where(baseline_pct == 0, 0.0001, baseline_pct)
        current_pct  = np.where(current_pct  == 0, 0.0001, current_pct)
        baseline_pct = baseline_pct / baseline_pct.sum()
        current_pct  = current_pct  / current_pct.sum()

    baseline_pct = np.array(baseline_pct, dtype=float)
    current_pct  = np.array(current_pct,  dtype=float)

    # PSI formula: sum( (P - Q) * ln(P / Q) )
    psi_values = (current_pct - baseline_pct) * np.log(current_pct / baseline_pct)
    psi = np.sum(psi_values)
    return round(float(abs(psi)), 4)


# ── KS TEST ───────────────────────────────────────────────────────────────────
def calculate_ks(baseline, current):
    """
    Kolmogorov-Smirnov test for numerical features.
    Returns KS statistic and p-value.
    p-value < 0.05 means distributions are significantly different.
    """
    if not pd.api.types.is_numeric_dtype(baseline) or baseline.nunique() <= 10:
        return None, None
    try:
        ks_stat, p_value = stats.ks_2samp(baseline, current)
        return round(float(ks_stat), 4), round(float(p_value), 4)
    except Exception:
        return None, None


# ── KL DIVERGENCE ─────────────────────────────────────────────────────────────
def calculate_kl(baseline, current, bins=10):
    """
    Kullback-Leibler Divergence calculation.
    """
    if not pd.api.types.is_numeric_dtype(baseline) or baseline.nunique() <= 10:
        return None
    try:
        min_val = min(baseline.min(), current.min())
        max_val = max(baseline.max(), current.max())
        if min_val == max_val:
            return 0.0
        breakpoints = np.linspace(min_val, max_val, bins + 1)
        baseline_hist, _ = np.histogram(baseline, bins=breakpoints, density=True)
        current_hist,  _ = np.histogram(current,  bins=breakpoints, density=True)
        baseline_hist = np.where(baseline_hist == 0, 0.0001, baseline_hist)
        current_hist  = np.where(current_hist  == 0, 0.0001, current_hist)
        kl = np.sum(rel_entr(current_hist, baseline_hist))
        return round(abs(float(kl)), 4)
    except Exception:
        return None


# ── PSI LABEL ─────────────────────────────────────────────────────────────────
def psi_label(psi):
    if psi < PSI_MONITOR_THRESHOLD:
        return "Stable", "#27AE60"
    elif psi < PSI_HIGH_DRIFT_THRESHOLD:
        return "Monitor", "#FF8C00"
    else:
        return "High Drift", "#C00000"


# ── RUN FULL DRIFT DETECTION ──────────────────────────────────────────────────
def run_drift_detection(baseline_df, current_df, features):
    """
    Runs PSI, KS Test, and KL Divergence across all features.
    Returns sorted dataframe.
    """
    results = []

    for feature in features:
        if feature not in baseline_df.columns or feature not in current_df.columns:
            continue
        baseline_col = baseline_df[feature].dropna()
        current_col  = current_df[feature].dropna()

        psi              = calculate_psi(baseline_col, current_col)
        ks_stat, p_value = calculate_ks(baseline_col, current_col)
        kl               = calculate_kl(baseline_col, current_col)
        label, colour    = psi_label(psi)

        results.append({
            "Feature":    feature,
            "PSI":        psi,
            "PSI_Label":  label,
            "PSI_Colour": colour,
            "KS_Stat":    ks_stat,
            "KS_PValue":  p_value,
            "KL_Div":     kl,
        })

    results_df = pd.DataFrame(results).sort_values("PSI", ascending=False)
    return results_df


# ── SYSTEM STATUS ─────────────────────────────────────────────────────────────
def get_system_status(drift_results):
    """
    Determines overall system health based on worst drift signals.
    Returns (status_text, colour_code).
    """
    high_drift_count = (drift_results["PSI_Label"] == "High Drift").sum()
    monitor_count    = (drift_results["PSI_Label"] == "Monitor").sum()

    if high_drift_count >= 2:
        return "CRITICAL", "#C00000"
    elif high_drift_count == 1 or monitor_count >= 3:
        return "WARNING", "#FF8C00"
    else:
        return "STABLE", "#27AE60"

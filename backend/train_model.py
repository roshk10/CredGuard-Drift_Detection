import os
import sys
from pathlib import Path
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import roc_auc_score, classification_report
import xgboost as xgb

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from core.config import (
    DATA_DIR, MODELS_DIR,
    BASELINE_DATA_PATH, BASELINE_LABELS_PATH,
    PRODUCTION_DATA_PATH, PRODUCTION_DATA_DRIFT_PATH, PRODUCTION_LABELS_PATH,
    MODEL_PATH, FEATURES_PATH, THRESHOLD_PATH, ENCODERS_PATH,
    DEFAULT_DECISION_THRESHOLD
)
from core.data_generator import generate_synthetic_home_credit, simulate_production_drift
from core.database import init_db, active_db_type

def main():
    print("=" * 70)
    print(" CREDGUARD — MODEL INITIALIZATION & TRAINING PIPELINE")
    print("=" * 70)

    # Initialize PostgreSQL Database schema
    print(f"\n[1/6] Initializing database schema on {active_db_type}...")
    init_db()

    # Step 1: Check or generate data
    app_train_path = DATA_DIR / "application_train.csv"
    if app_train_path.exists():
        print(f"\n[2/6] Loading existing dataset from {app_train_path}...")
        df = pd.read_csv(app_train_path)
    else:
        print("\n[2/6] Generating realistic Home Credit Default Risk application dataset (10,000 records)...")
        df = generate_synthetic_home_credit(num_samples=10000, random_state=42)
        df.to_csv(app_train_path, index=False)
        print(f"  Dataset generated and cached at: {app_train_path}")

    features = [
        "AMT_INCOME_TOTAL",
        "AMT_CREDIT",
        "AMT_ANNUITY",
        "DAYS_BIRTH",
        "DAYS_EMPLOYED",
        "CNT_FAM_MEMBERS",
        "NAME_CONTRACT_TYPE",
        "NAME_INCOME_TYPE",
        "NAME_EDUCATION_TYPE",
        "NAME_FAMILY_STATUS",
        "NAME_HOUSING_TYPE",
        "REGION_RATING_CLIENT",
        "REG_REGION_NOT_WORK_REGION",
        "FLAG_OWN_CAR",
        "FLAG_OWN_REALTY",
    ]
    target = "TARGET"

    # Step 2: Prepare & Encode
    print("\n[3/6] Preprocessing and encoding features...")
    df_model = df[features + [target]].copy()

    for col in df_model.columns:
        if pd.api.types.is_numeric_dtype(df_model[col]):
            df_model[col] = df_model[col].fillna(df_model[col].median())
        else:
            df_model[col] = df_model[col].fillna("Unknown")

    label_encoders = {}
    categorical_cols = [c for c in features if not pd.api.types.is_numeric_dtype(df_model[c])]

    for col in categorical_cols:
        le = LabelEncoder()
        df_model[col] = le.fit_transform(df_model[col].astype(str))
        label_encoders[col] = le

    # Step 3: Split into baseline (70%) and production (30%)
    print("\n[4/6] Partitioning baseline training cohort (70%) and production monitoring cohort (30%)...")
    X = df_model[features]
    y = df_model[target]

    X_baseline, X_production, y_baseline, y_production = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X_baseline, y_baseline, test_size=0.20, random_state=42, stratify=y_baseline
    )

    print(f"  Baseline Training size:   {X_train.shape[0]} rows")
    print(f"  Baseline Validation size: {X_test.shape[0]} rows")
    print(f"  Production Cohort size:   {X_production.shape[0]} rows")

    # Step 4: Train Model
    print("\n[5/6] Training XGBoost Risk Model...")
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=8,
        min_child_weight=5,
        gamma=1,
        random_state=42,
        eval_metric="auc",
        verbosity=0
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"  Model ROC-AUC Score: {auc:.4f}")
    print(f"  Decision Threshold:  {DEFAULT_DECISION_THRESHOLD}")

    # Step 5: Save Model & Data
    print("\n[6/6] Saving models, encoders, datasets, and simulated drift data...")
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(ENCODERS_PATH, "wb") as f:
        pickle.dump(label_encoders, f)
    with open(FEATURES_PATH, "wb") as f:
        pickle.dump(features, f)
    with open(THRESHOLD_PATH, "wb") as f:
        pickle.dump(DEFAULT_DECISION_THRESHOLD, f)

    X_baseline.to_csv(BASELINE_DATA_PATH, index=False)
    y_baseline.to_csv(BASELINE_LABELS_PATH, index=False)
    X_production.to_csv(PRODUCTION_DATA_PATH, index=False)
    y_production.to_csv(PRODUCTION_LABELS_PATH, index=False)

    # Simulate drift on production cohort
    X_production_drift = simulate_production_drift(X_production)
    X_production_drift.to_csv(PRODUCTION_DATA_DRIFT_PATH, index=False)

    print("\n Artifacts Generated Successfully:")
    print(f"  - Model:     {MODEL_PATH}")
    print(f"  - Baseline:  {BASELINE_DATA_PATH}")
    print(f"  - Drifted:   {PRODUCTION_DATA_DRIFT_PATH}")
    print("=" * 70)

if __name__ == "__main__":
    main()

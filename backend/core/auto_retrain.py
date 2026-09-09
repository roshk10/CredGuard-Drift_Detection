import pandas as pd
import pickle
import os
import logging
from datetime import datetime
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import warnings

from .config import (
    MODEL_PATH, FEATURES_PATH,
    BASELINE_DATA_PATH, BASELINE_LABELS_PATH,
    PRODUCTION_DATA_DRIFT_PATH, PRODUCTION_LABELS_PATH,
    RETRAIN_LOG_PATH, MODELS_DIR
)
from .database import SessionLocal, active_db_type
from .models_db import RetrainingHistory

warnings.filterwarnings("ignore")
logger = logging.getLogger("credguard.retrain")

def trigger_retraining(severity="CRITICAL", drift_impact_df=None, force=False):
    """
    Retrains the XGBoost model on combined baseline + production data.
    Logs event into PostgreSQL database and CSV.
    """
    critical_count = 0
    if drift_impact_df is not None:
        critical_count = int((drift_impact_df["Priority"] == "CRITICAL").sum())

    if not force and severity != "CRITICAL":
        return {
            "triggered": False,
            "reason": "Severity below CRITICAL threshold — retraining not mandated",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    logger.info("Executing automated XGBoost model retraining...")

    baseline_df       = pd.read_csv(BASELINE_DATA_PATH)
    production_df     = pd.read_csv(PRODUCTION_DATA_DRIFT_PATH)
    baseline_labels   = pd.read_csv(BASELINE_LABELS_PATH)
    production_labels = pd.read_csv(PRODUCTION_LABELS_PATH)

    with open(FEATURES_PATH, "rb") as f:
        features = pickle.load(f)

    # Combine baseline + production cohorts
    combined_X = pd.concat([baseline_df[features], production_df[features]], ignore_index=True)
    combined_y = pd.concat([
        baseline_labels.squeeze(),
        production_labels.squeeze()
    ], ignore_index=True)

    # Train / validation split
    X_train, X_test, y_train, y_test = train_test_split(
        combined_X, combined_y,
        test_size=0.20, random_state=42, stratify=combined_y
    )

    # Train new XGBoost
    new_model = xgb.XGBClassifier(
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
    new_model.fit(X_train, y_train, verbose=False)

    y_pred_proba = new_model.predict_proba(X_test)[:, 1]
    new_auc = round(float(roc_auc_score(y_test, y_pred_proba)), 4)

    # Backup previous model
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"xgboost_model_backup_{timestamp}.pkl"
    backup_path = MODELS_DIR / backup_file
    if os.path.exists(MODEL_PATH):
        try:
            os.replace(MODEL_PATH, backup_path)
        except Exception:
            pass

    # Save new active model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(new_model, f)

    # Log to PostgreSQL Database
    db = SessionLocal()
    try:
        retrain_record = RetrainingHistory(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            trigger_reason=f"CRITICAL severity trigger ({critical_count} critical features)" if not force else "Manual Retrain Trigger",
            critical_features_count=critical_count,
            new_auc=new_auc,
            data_size=int(len(combined_X)),
            backup_model_file=backup_file
        )
        db.add(retrain_record)
        db.commit()
        logger.info(f"Retraining record saved to {active_db_type}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record retraining in database: {e}")
    finally:
        db.close()

    # Log to CSV for local redundancy
    log_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "trigger": "CRITICAL severity auto-trigger" if not force else "Manual trigger",
        "critical_features": critical_count,
        "new_auc": new_auc,
        "data_size": len(combined_X),
        "backup_model": backup_file
    }
    log_df = pd.DataFrame([log_entry])
    if os.path.exists(RETRAIN_LOG_PATH):
        try:
            existing = pd.read_csv(RETRAIN_LOG_PATH)
            log_df = pd.concat([existing, log_df], ignore_index=True)
        except Exception:
            pass
    log_df.to_csv(RETRAIN_LOG_PATH, index=False)

    return {
        "triggered": True,
        "reason": f"Retraining succeeded with new test AUC: {new_auc}",
        "new_auc": new_auc,
        "data_size": len(combined_X),
        "backup_model": backup_file,
        "timestamp": log_entry["timestamp"]
    }

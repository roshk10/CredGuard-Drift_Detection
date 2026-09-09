import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = DATA_DIR / "reports"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Database Configuration
# Default connects to PostgreSQL, with automatic fallback to local SQLite if PostgreSQL is unreachable
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "credguard_db")

DEFAULT_PG_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_PG_URL)

SQLITE_FALLBACK_URL = f"sqlite:///{DATA_DIR / 'credguard_audit.db'}"

# Key file paths
DB_PATH = DATA_DIR / "credguard_audit.db"
RETRAIN_LOG_PATH = DATA_DIR / "retraining_log.csv"
PDF_REPORT_PATH = DATA_DIR / "credguard_report.pdf"

BASELINE_DATA_PATH = DATA_DIR / "baseline_data.csv"
BASELINE_LABELS_PATH = DATA_DIR / "baseline_labels.csv"
PRODUCTION_DATA_PATH = DATA_DIR / "production_data.csv"
PRODUCTION_DATA_DRIFT_PATH = DATA_DIR / "production_data_drift.csv"
PRODUCTION_LABELS_PATH = DATA_DIR / "production_labels.csv"

MODEL_PATH = MODELS_DIR / "xgboost_model.pkl"
FEATURES_PATH = MODELS_DIR / "features.pkl"
THRESHOLD_PATH = MODELS_DIR / "threshold.pkl"
ENCODERS_PATH = MODELS_DIR / "label_encoders.pkl"

# Default Model Parameters
DEFAULT_DECISION_THRESHOLD = 0.30
PSI_MONITOR_THRESHOLD = 0.10
PSI_HIGH_DRIFT_THRESHOLD = 0.20

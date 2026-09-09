import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from .config import DATABASE_URL, SQLITE_FALLBACK_URL
from .models_db import Base

logger = logging.getLogger("credguard.database")

# Initialize database engine with PostgreSQL first, fallback to SQLite if needed
engine = None
active_db_type = "UNKNOWN"

def create_db_engine():
    global engine, active_db_type
    try:
        # Try PostgreSQL connection first
        pg_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 3} if "postgresql" in DATABASE_URL else {}
        )
        # Verify connection
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = pg_engine
        active_db_type = "PostgreSQL"
        logger.info(f"Successfully connected to PostgreSQL database at {DATABASE_URL}")
        return engine
    except Exception as e:
        logger.warning(f"PostgreSQL connection to {DATABASE_URL} failed ({e}). Falling back to SQLite: {SQLITE_FALLBACK_URL}")
        sqlite_engine = create_engine(
            SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        engine = sqlite_engine
        active_db_type = "SQLite (Fallback)"
        return engine

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables in the active database engine."""
    global engine
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database schema initialized on {active_db_type}")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")

def get_db_status():
    """Return current database connection status and dialect."""
    return {
        "status": "connected",
        "database_type": active_db_type,
        "url": str(engine.url).split("@")[-1] if "@" in str(engine.url) else str(engine.url)
    }

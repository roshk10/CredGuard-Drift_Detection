from sqlalchemy import Column, Integer, Float, String, Text, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class AuditTrail(Base):
    __tablename__ = "audit_trail"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"), index=True)
    severity = Column(String(20), nullable=False)
    critical_features = Column(Integer, default=0)
    fairness_risks = Column(Integer, default=0)
    approval_change = Column(Float, default=0.0)
    baseline_gini = Column(Float, nullable=True)
    current_gini = Column(Float, nullable=True)
    actions = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "severity": self.severity,
            "critical_features": self.critical_features,
            "fairness_risks": self.fairness_risks,
            "approval_change": self.approval_change,
            "baseline_gini": self.baseline_gini,
            "current_gini": self.current_gini,
            "actions": self.actions,
            "summary": self.summary
        }


class DriftMetricLog(Base):
    __tablename__ = "drift_metric_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"), index=True)
    feature_name = Column(String(100), nullable=False, index=True)
    psi_score = Column(Float, nullable=False)
    psi_status = Column(String(50), nullable=False)
    ks_statistic = Column(Float, nullable=True)
    ks_pvalue = Column(Float, nullable=True)
    kl_divergence = Column(Float, nullable=True)
    drift_impact_score = Column(Float, nullable=True)
    priority = Column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "feature_name": self.feature_name,
            "psi_score": self.psi_score,
            "psi_status": self.psi_status,
            "ks_statistic": self.ks_statistic,
            "ks_pvalue": self.ks_pvalue,
            "kl_divergence": self.kl_divergence,
            "drift_impact_score": self.drift_impact_score,
            "priority": self.priority
        }


class RetrainingHistory(Base):
    __tablename__ = "retraining_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"), index=True)
    trigger_reason = Column(String(255), nullable=False)
    critical_features_count = Column(Integer, default=0)
    new_auc = Column(Float, nullable=False)
    data_size = Column(Integer, nullable=False)
    backup_model_file = Column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "trigger_reason": self.trigger_reason,
            "critical_features_count": self.critical_features_count,
            "new_auc": self.new_auc,
            "data_size": self.data_size,
            "backup_model_file": self.backup_model_file
        }

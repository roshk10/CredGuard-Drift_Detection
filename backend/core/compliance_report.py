import pandas as pd
import numpy as np
from datetime import datetime
from fpdf import FPDF
import os
import logging
from .config import PDF_REPORT_PATH
from .database import SessionLocal, active_db_type
from .models_db import AuditTrail

logger = logging.getLogger("credguard.compliance")

def clean_text(text):
    """Sanitizes text for standard ASCII / PDF encoding."""
    if text is None:
        return ""
    return (
        str(text)
        .replace("—", "-")
        .replace("–", "-")
        .replace("’", "'")
        .replace("‘", "'")
        .replace('“', '"')
        .replace('”', '"')
        .replace("é", "e")
        .replace("à", "a")
        .replace("•", "*")
    )

def classify_severity(drift_impact_df, segment_results_df):
    """
    Classifies regulatory severity level:
    CRITICAL: >=2 critical features OR >=2 fairness risks OR drops <= -10%
    WARNING: 1 critical feature OR 1 fairness risk
    STABLE: within normal bounds
    """
    critical_features = (drift_impact_df["Priority"] == "CRITICAL").sum()
    fairness_risks = (segment_results_df["Flag"] == "FAIRNESS RISK").sum()
    large_drops = (segment_results_df["Change_%"] <= -10.0).sum()

    if critical_features >= 2 or fairness_risks >= 2 or large_drops >= 2:
        return "CRITICAL"
    elif critical_features == 1 or fairness_risks == 1 or large_drops == 1:
        return "WARNING"
    else:
        return "STABLE"

def generate_report_text(drift_impact_df, segment_results_df, threshold_results, severity):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    top_features = drift_impact_df[
        drift_impact_df["Priority"].isin(["CRITICAL", "HIGH"])
    ][["Feature", "PSI", "Drift_Impact_Score", "Priority"]].head(6)

    affected_segments = segment_results_df[
        segment_results_df["Flag"].isin(["FAIRNESS RISK", "MONITOR"])
    ][["Segment", "Change_%", "Flag"]].head(6)

    actions = []
    if severity == "CRITICAL":
        actions.append("Retrain model on recent production data immediately")
        actions.append("Recalibrate credit decision threshold")
        actions.append("Review fairness metrics across affected demographic segments")
        actions.append("Escalate diagnostic report to Model Risk Management committee")
        actions.append("Log findings in PostgreSQL compliance audit trail for regulatory inspection")
    elif severity == "WARNING":
        actions.append("Schedule proactive model retraining within next 2 weeks")
        actions.append("Monitor high-drift features on a daily frequency")
        actions.append("Review decision threshold boundary metrics")
        actions.append("Log findings for audit trail verification")
    else:
        actions.append("Continue standard automated drift surveillance")
        actions.append("Maintain routine audit logging")

    if severity == "CRITICAL":
        concern = (
            "Significant feature drift detected across multiple core underwriting variables. "
            "Model risk distribution has shifted materially, and specific borrower subgroups "
            "exhibit approval rate declines exceeding regulatory tolerance limits. "
            "Immediate remediation required under model governance guidelines."
        )
    elif severity == "WARNING":
        concern = (
            "Moderate feature drift observed in production scoring batches. "
            "Subgroup approval rates indicate emerging variances. Proactive intervention recommended."
        )
    else:
        concern = (
            "All underwriting features remain within acceptable baseline statistical bounds. "
            "No immediate intervention required."
        )

    return {
        "timestamp": timestamp,
        "severity": severity,
        "concern": concern,
        "top_features": top_features,
        "affected_segments": affected_segments,
        "threshold_results": threshold_results,
        "actions": actions,
    }

def save_to_audit_trail(report):
    """
    Persists compliance event into the active PostgreSQL/SQLite database.
    """
    db = SessionLocal()
    try:
        critical_count = len(report["top_features"])
        fairness_count = len(report["affected_segments"])
        approval_change = float(report["threshold_results"].get("Approval_Change_%", 0.0))
        baseline_gini = float(report["threshold_results"].get("Baseline_Gini", 0.0) or 0.0)
        current_gini = float(report["threshold_results"].get("Current_Gini", 0.0) or 0.0)

        entry = AuditTrail(
            timestamp=report["timestamp"],
            severity=report["severity"],
            critical_features=critical_count,
            fairness_risks=fairness_count,
            approval_change=approval_change,
            baseline_gini=baseline_gini,
            current_gini=current_gini,
            actions=" | ".join(report["actions"]),
            summary=report["concern"]
        )
        db.add(entry)
        db.commit()
        logger.info(f"Audit log successfully committed to {active_db_type}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to persist audit trail to database: {e}")
    finally:
        db.close()

def generate_pdf_report(report, output_path=str(PDF_REPORT_PATH)):
    """
    Generates a PDF compliance document.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf = FPDF()
    pdf.add_page()

    # Header Banner
    pdf.set_fill_color(26, 39, 68)
    pdf.rect(0, 0, 210, 32, "F")

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(10, 7)
    pdf.cell(190, 10, clean_text("CREDGUARD — MODEL RISK AUDIT REPORT"), align="C")

    pdf.set_font("Helvetica", "", 10)
    pdf.set_xy(10, 18)
    pdf.cell(190, 8, clean_text("Automated Silent Failure Diagnostic & Governance Suite"), align="C")

    # Severity Tag
    severity = report["severity"]
    if severity == "CRITICAL":
        pdf.set_fill_color(192, 0, 0)
    elif severity == "WARNING":
        pdf.set_fill_color(255, 140, 0)
    else:
        pdf.set_fill_color(39, 174, 96)

    pdf.set_xy(65, 36)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(80, 9, clean_text(f"SYSTEM SEVERITY: {severity}"), align="C", fill=True)

    # Sub-header details
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.set_xy(10, 48)
    pdf.cell(190, 6, clean_text(f"Generated: {report['timestamp']} | Storage: PostgreSQL Database | Model: XGBoost v1.2"), align="C")

    # Line separator
    pdf.set_draw_color(46, 117, 182)
    pdf.set_line_width(0.6)
    pdf.line(10, 56, 200, 56)

    # 1. Executive Summary & Concern
    pdf.set_xy(10, 60)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(26, 39, 68)
    pdf.cell(190, 6, clean_text("1. Compliance & Risk Diagnosis"))
    pdf.ln(7)

    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(50, 50, 50)
    pdf.set_fill_color(244, 247, 254)
    pdf.multi_cell(190, 5.5, clean_text(report["concern"]), fill=True)

    # 2. Affected Features (Drift Impact Score)
    y = pdf.get_y() + 6
    pdf.set_xy(10, y)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(26, 39, 68)
    pdf.cell(190, 6, clean_text("2. Drift Impact Prioritization (DIS = PSI x SHAP)"))
    pdf.ln(7)

    # Table Header
    pdf.set_fill_color(26, 39, 68)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.cell(80, 6, clean_text("Feature Name"), fill=True, border=1)
    pdf.cell(30, 6, clean_text("PSI Score"), fill=True, border=1, align="C")
    pdf.cell(40, 6, clean_text("Drift Impact Score"), fill=True, border=1, align="C")
    pdf.cell(40, 6, clean_text("Priority"), fill=True, border=1, align="C")
    pdf.ln()

    # Table Rows
    pdf.set_font("Helvetica", "", 8.5)
    fill = False
    for _, row in report["top_features"].iterrows():
        if row["Priority"] == "CRITICAL":
            pdf.set_text_color(192, 0, 0)
        else:
            pdf.set_text_color(60, 60, 60)
        bg = (245, 247, 250) if fill else (255, 255, 255)
        pdf.set_fill_color(*bg)
        pdf.cell(80, 5.5, clean_text(str(row["Feature"])), fill=True, border=1)
        pdf.cell(30, 5.5, clean_text(f"{row['PSI']:.4f}"), fill=True, border=1, align="C")
        pdf.cell(40, 5.5, clean_text(f"{row['Drift_Impact_Score']:.4f}"), fill=True, border=1, align="C")
        pdf.cell(40, 5.5, clean_text(str(row["Priority"])), fill=True, border=1, align="C")
        pdf.ln()
        fill = not fill

    # 3. Impacted Segments
    y = pdf.get_y() + 6
    pdf.set_xy(10, y)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(26, 39, 68)
    pdf.cell(190, 6, clean_text("3. Demographic Subgroup Impact"))
    pdf.ln(7)

    if len(report["affected_segments"]) > 0:
        pdf.set_fill_color(26, 39, 68)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.cell(90, 6, clean_text("Demographic Subgroup"), fill=True, border=1)
        pdf.cell(45, 6, clean_text("Approval Shift"), fill=True, border=1, align="C")
        pdf.cell(55, 6, clean_text("Fairness Flag"), fill=True, border=1, align="C")
        pdf.ln()

        pdf.set_font("Helvetica", "", 8.5)
        fill = False
        for _, row in report["affected_segments"].iterrows():
            if row["Flag"] == "FAIRNESS RISK":
                pdf.set_text_color(192, 0, 0)
            else:
                pdf.set_text_color(180, 100, 0)
            bg = (245, 247, 250) if fill else (255, 255, 255)
            pdf.set_fill_color(*bg)
            pdf.cell(90, 5.5, clean_text(str(row["Segment"])), fill=True, border=1)
            pdf.cell(45, 5.5, clean_text(f"{row['Change_%']:+.1f}%"), fill=True, border=1, align="C")
            pdf.cell(55, 5.5, clean_text(str(row["Flag"])), fill=True, border=1, align="C")
            pdf.ln()
            fill = not fill

    # 4. Recommended Actions
    y = pdf.get_y() + 6
    pdf.set_xy(10, y)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(26, 39, 68)
    pdf.cell(190, 6, clean_text("4. Mandatory Action Items"))
    pdf.ln(7)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(40, 40, 40)
    for idx, act in enumerate(report["actions"], 1):
        pdf.cell(8, 5.5, clean_text(f"{idx}."))
        pdf.cell(182, 5.5, clean_text(act))
        pdf.ln()

    pdf.output(output_path)
    return output_path

def run_compliance_pipeline(drift_impact_df, segment_results_df, threshold_results):
    """
    Executes compliance workflow: classifies severity, builds report, saves to DB, exports PDF.
    """
    severity = classify_severity(drift_impact_df, segment_results_df)
    report = generate_report_text(drift_impact_df, segment_results_df, threshold_results, severity)
    save_to_audit_trail(report)
    pdf_path = generate_pdf_report(report)
    return report, pdf_path

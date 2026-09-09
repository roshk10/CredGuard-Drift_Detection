from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import pickle
from typing import Optional

from core.config import MODEL_PATH, FEATURES_PATH, THRESHOLD_PATH, ENCODERS_PATH, DEFAULT_DECISION_THRESHOLD

router = APIRouter(prefix="/api/predict", tags=["Applicant Prediction & Scoring"])

class ApplicantData(BaseModel):
    AMT_INCOME_TOTAL: float = Field(default=150000.0, description="Annual Income")
    AMT_CREDIT: float = Field(default=500000.0, description="Credit Amount Requested")
    AMT_ANNUITY: float = Field(default=25000.0, description="Loan Annuity Payment")
    DAYS_BIRTH: int = Field(default=-14600, description="Age in negative days (e.g. -14600 = ~40 years)")
    DAYS_EMPLOYED: int = Field(default=-2000, description="Employment duration in negative days")
    CNT_FAM_MEMBERS: int = Field(default=2, description="Family members count")
    NAME_CONTRACT_TYPE: str = Field(default="Cash loans")
    NAME_INCOME_TYPE: str = Field(default="Working")
    NAME_EDUCATION_TYPE: str = Field(default="Secondary / secondary special")
    NAME_FAMILY_STATUS: str = Field(default="Married")
    NAME_HOUSING_TYPE: str = Field(default="House / apartment")
    REGION_RATING_CLIENT: int = Field(default=2)
    REG_REGION_NOT_WORK_REGION: int = Field(default=0)
    FLAG_OWN_CAR: str = Field(default="N")
    FLAG_OWN_REALTY: str = Field(default="Y")

@router.post("/applicant")
def score_applicant(applicant: ApplicantData):
    try:
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(FEATURES_PATH, "rb") as f:
            features = pickle.load(f)
        with open(ENCODERS_PATH, "rb") as f:
            encoders = pickle.load(f)
        try:
            with open(THRESHOLD_PATH, "rb") as f:
                threshold = float(pickle.load(f))
        except Exception:
            threshold = DEFAULT_DECISION_THRESHOLD

        data_dict = applicant.model_dump()
        row_df = pd.DataFrame([data_dict])

        # Encode categorical columns
        for col, le in encoders.items():
            if col in row_df.columns:
                val = str(row_df[col].iloc[0])
                if val in le.classes_:
                    row_df[col] = le.transform([val])[0]
                else:
                    row_df[col] = 0

        # Predict probability of default
        risk_score = float(model.predict_proba(row_df[features])[:, 1][0])
        is_approved = risk_score < threshold
        decision = "APPROVED" if is_approved else "REJECTED (HIGH RISK)"

        # Check drift warnings on this specific applicant
        drift_warnings = []
        if applicant.AMT_INCOME_TOTAL < 100000:
            drift_warnings.append("Low Income Shift: In high-drift regime, income below 100k elevates default odds significantly.")
        if applicant.DAYS_EMPLOYED > -365:
            drift_warnings.append("Employment Instability: Unstable employment tenure detected (high macro drift impact).")
        if (applicant.AMT_ANNUITY / (applicant.AMT_INCOME_TOTAL + 1)) > 0.25:
            drift_warnings.append("Debt Burden Ratio > 25%: Vulnerable to credit expansion drift.")

        return {
            "risk_score": round(risk_score, 4),
            "decision_threshold": threshold,
            "decision": decision,
            "is_approved": is_approved,
            "risk_grade": "A (Prime)" if risk_score < 0.15 else "B (Standard)" if risk_score < 0.30 else "C (Elevated)" if risk_score < 0.50 else "D (High Risk)",
            "drift_advisories": drift_warnings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to score applicant: {str(e)}")

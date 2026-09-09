import numpy as np
import pandas as pd
from pathlib import Path
from .config import DATA_DIR

def generate_synthetic_home_credit(num_samples=10000, random_state=42):
    """
    Generates a realistic synthetic Home Credit Default Risk application dataset.
    Matches all 15 key features used in CredGuard.
    """
    np.random.seed(random_state)
    
    # 1. Age (DAYS_BIRTH: -20 to -65 years in days)
    age_years = np.random.uniform(21, 65, size=num_samples)
    days_birth = -1 * (age_years * 365.25).astype(int)
    
    # 2. Income (AMT_INCOME_TOTAL: log-normal around 160,000)
    income_base = np.random.lognormal(mean=11.9, sigma=0.5, size=num_samples)
    amt_income_total = np.round(np.clip(income_base, 45000, 1500000), -2)
    
    # 3. Credit Amount (AMT_CREDIT: correlated with income, typically 2x to 5x income)
    credit_multiplier = np.random.uniform(1.8, 4.5, size=num_samples)
    amt_credit = np.round(np.clip(amt_income_total * credit_multiplier, 80000, 3000000), -2)
    
    # 4. Annuity (AMT_ANNUITY: typically 4-7% of credit amount)
    annuity_pct = np.random.uniform(0.042, 0.068, size=num_samples)
    amt_annuity = np.round(amt_credit * annuity_pct, -1)
    
    # 5. Employment Duration (DAYS_EMPLOYED: -1 to -25 years, or positive for pensioners)
    employed_years = np.random.exponential(scale=5.0, size=num_samples)
    employed_years = np.clip(employed_years, 0.1, age_years - 18)
    days_employed = -1 * (employed_years * 365.25).astype(int)
    
    # 6. Family members count
    cnt_fam_members = np.random.choice([1, 2, 3, 4, 5], size=num_samples, p=[0.25, 0.45, 0.18, 0.09, 0.03])
    
    # 7. Categoricals
    contract_types = np.random.choice(["Cash loans", "Revolving loans"], size=num_samples, p=[0.90, 0.10])
    income_types = np.random.choice(["Working", "Commercial associate", "Pensioner", "State servant"], 
                                    size=num_samples, p=[0.52, 0.23, 0.18, 0.07])
    education_types = np.random.choice(["Secondary / secondary special", "Higher education", "Incomplete higher", "Lower secondary"], 
                                      size=num_samples, p=[0.71, 0.24, 0.03, 0.02])
    family_statuses = np.random.choice(["Married", "Single / not married", "Civil marriage", "Separated", "Widow"], 
                                      size=num_samples, p=[0.64, 0.15, 0.10, 0.06, 0.05])
    housing_types = np.random.choice(["House / apartment", "With parents", "Municipal apartment", "Rented apartment"], 
                                     size=num_samples, p=[0.88, 0.05, 0.04, 0.03])
    
    region_rating = np.random.choice([1, 2, 3], size=num_samples, p=[0.15, 0.65, 0.20])
    reg_mismatch = np.random.choice([0, 1], size=num_samples, p=[0.82, 0.18])
    flag_car = np.random.choice(["Y", "N"], size=num_samples, p=[0.34, 0.66])
    flag_realty = np.random.choice(["Y", "N"], size=num_samples, p=[0.69, 0.31])
    
    # Calculate realistic default risk probability (TARGET)
    dti = (amt_annuity / (amt_income_total + 1))
    norm_income = (amt_income_total - 160000) / 100000
    norm_employed = (days_employed + 2000) / 1500
    norm_age = (days_birth + 15000) / 4000
    
    linear_predictor = (
        - 0.55 * norm_income
        + 1.40 * (dti * 10 - 1.8)
        - 0.65 * norm_employed
        - 0.35 * norm_age
        + 0.60 * (region_rating - 2)
        + 0.40 * reg_mismatch
        + np.where(education_types == "Lower secondary", 0.7, 0.0)
        + np.where(education_types == "Higher education", -0.6, 0.0)
        + np.where(income_types == "Pensioner", -0.4, 0.2)
        + np.random.normal(0, 0.4, size=num_samples)
    )
    
    # Calibrate probability so target rate is ~9%
    p_default = 1 / (1 + np.exp(-(linear_predictor - 1.6)))
    target = (np.random.uniform(0, 1, size=num_samples) < p_default).astype(int)
    
    df = pd.DataFrame({
        "AMT_INCOME_TOTAL": amt_income_total,
        "AMT_CREDIT": amt_credit,
        "AMT_ANNUITY": amt_annuity,
        "DAYS_BIRTH": days_birth,
        "DAYS_EMPLOYED": days_employed,
        "CNT_FAM_MEMBERS": cnt_fam_members,
        "NAME_CONTRACT_TYPE": contract_types,
        "NAME_INCOME_TYPE": income_types,
        "NAME_EDUCATION_TYPE": education_types,
        "NAME_FAMILY_STATUS": family_statuses,
        "NAME_HOUSING_TYPE": housing_types,
        "REGION_RATING_CLIENT": region_rating,
        "REG_REGION_NOT_WORK_REGION": reg_mismatch,
        "FLAG_OWN_CAR": flag_car,
        "FLAG_OWN_REALTY": flag_realty,
        "TARGET": target
    })
    
    return df


def simulate_production_drift(df_production, random_state=42):
    """
    Simulates macroeconomic and demographic drift on production data.
    """
    df_drift = df_production.copy()
    numeric_cols = df_drift.select_dtypes(include=[np.number]).columns
    df_drift[numeric_cols] = df_drift[numeric_cols].astype(float)
    
    rng = np.random.RandomState(random_state)
    
    # 1. Salary Drops 30% — macroeconomic shift post-inflation
    df_drift["AMT_INCOME_TOTAL"] = df_drift["AMT_INCOME_TOTAL"] * 0.70
    
    # 2. Employment Instability — 40% of applicants experience employment disruption
    mask_employment = rng.choice([True, False], size=len(df_drift), p=[0.40, 0.60])
    df_drift.loc[mask_employment, "DAYS_EMPLOYED"] = (
        df_drift.loc[mask_employment, "DAYS_EMPLOYED"] * 0.40
    )
    
    # 3. Credit Amount Increases 35% — applicants borrowing more
    df_drift["AMT_CREDIT"] = df_drift["AMT_CREDIT"] * 1.35
    
    # 4. Loan Annuity Increases 30% — higher repayment burden
    df_drift["AMT_ANNUITY"] = df_drift["AMT_ANNUITY"] * 1.30
    
    # 5. Region Rating increases (more applicants from higher risk regions)
    mask_region = rng.choice([True, False], size=len(df_drift), p=[0.45, 0.55])
    df_drift.loc[mask_region, "REGION_RATING_CLIENT"] = (
        df_drift.loc[mask_region, "REGION_RATING_CLIENT"] + 1
    ).clip(upper=3)
    
    return df_drift

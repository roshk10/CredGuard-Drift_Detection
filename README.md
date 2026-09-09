# 🛡️ CredGuard — Institutional AI Model Governance & Risk Intelligence Platform

CredGuard is an intelligent monitoring and governance platform designed for banks and financial institutions to detect **Silent Model Failure** in AI credit underwriting models.

---

## 📌 What is the Problem?

When banks use machine learning models (like XGBoost) to approve or reject loan applications:
1. **The World Changes**: Inflation, income shifts, and economic conditions change incoming borrower application data over time (**Data Drift**).
2. **Silent Failure**: The model continues to output predictions without showing any code errors or crashes, but its accuracy and approval rates silently drop.
3. **Unfair Impact**: Vulnerable borrower groups (e.g., low-income or short-term employed applicants) face unfair drops in loan approvals, leading to regulatory non-compliance and heavy fines.

---

## 🏗️ System Architecture

```text
 ┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
 │ Data Ingestion  │ ────> │ Drift Detection │ ────> │  Root Cause Analysis   │
 │ (Loan Data)     │       │ (Detect: PSI,KS)│       │ (Explainability: SHAP) │
 └─────────────────┘       └─────────────────┘       └────────────────────────┘
                                                                  │
                                                                  ▼
 ┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
 │    Dashboard    │ <──── │Report Generation│ <──── │    Segment Analysis    │
 │ (Visual Insights│       │ (Audit Summary) │       │(Analyse Affected Groups│
 └─────────────────┘       └─────────────────┘       └────────────────────────┘
```

### Explanation of the 6 Core Steps:
1. **Data Ingestion**: Ingests new loan applicant profiles and compares them against baseline training data.
2. **Drift Detection**: Uses **PSI (Population Stability Index)** and **KS (Kolmogorov-Smirnov) statistical tests** to detect if features have significantly shifted.
3. **Root Cause Analysis**: Uses **SHAP (Explainable AI)** to determine which factors (e.g., income, loan amount, employment length) caused the shift.
4. **Segment Analysis**: Identifies which borrower demographic groups (e.g., Low Income, Short-term Employed) are unfairly impacted.
5. **Report Generation**: Automatically creates a regulatory audit summary aligned with **RBI & US Federal Reserve SR 11-7** guidelines with one-click PDF download.
6. **Dashboard**: Provides risk officers with an institutional visual dashboard to view alerts, charts, and trigger automated model retraining.

---

## 🔄 End-to-End Data Flow

```text
┌────────┐      ┌──────────────┐      ┌─────────────────────────┐
│  User  │ ───> │  LOAN DATA   │ ───> │   HAS ANYTHING CHANGED? │
└────────┘      │ Bank receives│      │ CredGuard compares today│
     ▲          │ applications │      │ vs. original data       │
     │          └──────────────┘      └─────────────────────────┘
     │                                            │
     │                                            ▼
     │          ┌──────────────┐      ┌─────────────────────────┐
     │          │  DASHBOARD   │      │   WHY DID IT CHANGE?    │
     └───────── │ Risk team sees      │ (Root Cause Analysis:   │
                │ alerts & charts      │ Income, Credit, Reg)    │
                └──────────────┘      └─────────────────────────┘
                       ▲                          │
                       │                          ▼
                ┌──────────────┐      ┌─────────────────────────┐
                │WHAT TO DO?   │ <─── │    WHO IS AFFECTED?     │
                │(Compliance   │      │ (Segment Impact on      │
                │ Report & PDF)│      │ borrower subgroups)     │
                └──────────────┘      └─────────────────────────┘
```

---

## 🌟 Key Features

- **Real-Time Model Health Surveillance**: Supervisory risk alert banner with real-time status classifications (`CRITICAL RISK`, `MONITOR`, `STABLE`).
- **Statistical Dual-Engine Drift Diagnostics**: Continuous PSI and KS statistical testing on 15 core loan features.
- **Drift Impact Score ($DIS = \text{PSI} \times \text{SHAP}$)**: Multiplies statistical drift by feature importance to highlight only high-impact risk factors.
- **Smooth Probability Density Estimation**: Gaussian Kernel Density Estimation (KDE) curves highlighting portfolio approval shifts across the **0.30 Decision Cutoff**.
- **Fair Lending & Disparate Impact Tracking**: Continuous fairness checks ensuring demographic subgroups meet the **Four-Fifths (80%) Rule**.
- **Automated Model Retraining with Guardrails**: Safe retraining pipeline that trains a candidate model, compares ROC-AUC against champion, and safely promotes on performance gain.
- **One-Click Regulatory PDF Generation**: Downloadable formal audit reports built directly for RBI and US Fed SR 11-7 audit compliance.

---

## ⚙️ Backend Architecture & Features

Built using **Python 3.10+** and **FastAPI** with modular quantitative ML engines:

### 1. Statistical & Mathematical Engines (`backend/core/`)
- **Dual Drift Calculator (`drift_detection.py`)**:
  - `calculate_psi`: Binned numerical and frequency-weighted categorical **Population Stability Index** ($PSI < 0.10$ Stable, $0.10-0.20$ Monitor, $>0.20$ High Drift).
  - `calculate_ks`: Two-sample **Kolmogorov-Smirnov Test** returning max divergence $D$-statistic and asymptotic $p$-values.
- **Root Cause & Explainable AI (`root_cause.py`)**:
  - Computes TreeExplainer **SHAP values** across production applications.
  - Combines drift and SHAP into the **Drift Impact Score ($DIS = \text{PSI} \times \text{SHAP}$)** to rank-order variables by actual business risk.
- **Gaussian Kernel Density Estimation (`distribution.py`)**:
  - Evaluates Gaussian KDE probability densities over 31 continuous score points ($[0.00, 1.00]$) to generate smooth credit risk curves.
- **Subgroup Fairness & Disparate Impact Engine (`segment_analysis.py`)**:
  - Tags borrower profiles into demographic partitions (Income Segments, Employment Duration, Risk Regions).
  - Evaluates approval parity and flags violations of the **Four-Fifths (80%) Rule**.
- **Automated Retraining Pipeline (`auto_retrain.py`)**:
  - Automatically merges baseline training data with shifted production cohorts using stratified cross-validation.
  - Evaluates candidate XGBoost vs. champion model ROC-AUC and Gini discrimination before model promotion.
- **Regulatory PDF Generator (`compliance_report.py`)**:
  - Assembles audit summaries, top shifted signals, and mandatory action items into a formal, print-ready PDF using `fpdf2`.

### 2. Resilient Database Persistence (`backend/core/database.py`)
- **Dual-Engine Strategy**: Automatically connects to **PostgreSQL** in production environments and seamlessly falls back to a zero-configuration local **SQLite** database (`credguard_audit.db`).
- **ORM Tables (`models_db.py`)**:
  - `AuditTrail`: Immutable timestamped snapshots of model severity, approval drops, Gini delta, and drifted feature counts.
  - `RetrainingHistory`: Model lifecycle logs tracking champion AUC, candidate AUC, and promotion status.

### 3. REST API Routers (`backend/routes/`)
- `GET /api/health`: Database connection status and service health.
- `GET /api/drift/overview`: Full 15-feature PSI & KS statistics matrix.
- `GET /api/distribution/scores`: Smooth KDE curves and approval metrics.
- `GET /api/distribution/shap`: Baseline vs. production SHAP importance.
- `GET /api/segments/impact`: Subgroup approval rates and disparate impact flags.
- `GET /api/compliance/report`: RBI & SR 11-7 regulatory audit scorecard.
- `GET /api/compliance/audit-trail`: Historical audit logs.
- `GET /api/compliance/export-pdf`: Stream downloadable audit PDF report.
- `POST /api/retrain/run`: Trigger automated retraining execution.
- `GET /api/retrain/history`: Retraining logs and champion records.
- `POST /api/predict/applicant`: Live single-applicant credit scoring endpoint.

---

## 🎨 Frontend Architecture & Features

Built using **React 19** and **Vite** with an institutional banking aesthetic:

### 1. Design System & Typography
- **Financial Theme**: Dark institutional navy/slate palette (`#050a12`, `#0c1626`) with gold accents (`#f59e0b`).
- **Typography**: Google **Merriweather** for headings/labels and tabular numerals (`tabular-nums`) for aligned financial data.
- **Gold Currency Coin Transition**: Minimalist 3D flipping gold bank coin cycling through global currencies (`$`, `₹`, `€`, `£`, `¥`) on page navigation.

### 2. Six Dashboard Divisions (`frontend/src/views/`)
1. **Executive Overview (`/`)**: High-level KPI cards (approval delta, Gini drop, high drift counts), prioritized drift impact table, and mandatory action protocol checklist.
2. **Drift Surveillance (`/drift-monitoring`)**: Interactive 15-feature table with search bar, status filters (`HIGH DRIFT`, `MONITOR`, `STABLE`), and visual PSI / KS progress bars.
3. **Score & SHAP Drift (`/model-behaviour`)**: Smooth Gaussian KDE probability density area chart with clear **Decision Cutoff: 0.30** badge and SHAP importance shift bars.
4. **Subgroup Fairness (`/segment-impact`)**: Visual approval rate comparison across demographic classes (Income Tiers, Employment Duration, Risk Regions) with Disparate Impact flags.
5. **Regulatory Audit (`/compliance-report`)**: RBI / SR 11-7 compliance scorecard, dynamic mitigation recommendations, and one-click PDF export button.
6. **Model Governance (`/retraining`)**: Champion vs. Candidate model comparison card with one-click **"Run Retraining"** trigger and model lifecycle history.

---

## 💻 Tech Stack Summary

- **Backend**: FastAPI (Python 3.10+), Uvicorn, Pandas, NumPy, Scikit-Learn, XGBoost, SHAP, SciPy, FPDF2, SQLAlchemy, SQLite / PostgreSQL
- **Frontend**: React 19, Vite, Recharts, Lucide Icons, Axios, Vanilla CSS (Merriweather Typography)
- **Compliance Standards**: RBI Framework, US Federal Reserve SR 11-7, Basel III, EEOC Four-Fifths Rule

---

## ⚡ How to Run Locally

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**

---

### 2. Run Backend

```bash
# 1. Go to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### 3. Run Frontend

```bash
# 1. Open a new terminal and go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
- **CredGuard Web Dashboard**: `http://localhost:5173`

---

## 📂 Project Structure

```text
CredGuard/
├── backend/
│   ├── main.py                     # FastAPI backend entry point
│   ├── requirements.txt            # Python dependencies
│   ├── core/                       # Core ML & analytics engine
│   │   ├── drift_detection.py      # PSI & KS statistical drift calculators
│   │   ├── root_cause.py           # SHAP root cause & feature importance
│   │   ├── segment_analysis.py    # Demographic fairness & segment impact
│   │   ├── compliance_report.py    # SR 11-7 audit report & PDF generation
│   │   ├── auto_retrain.py         # Automated XGBoost retraining pipeline
│   │   ├── database.py             # SQLite / PostgreSQL database connection
│   │   └── models_db.py            # SQLAlchemy ORM schemas
│   └── routes/                     # API routes (drift, distribution, segments, compliance, retrain, predict)
└── frontend/
    ├── index.html                  # HTML entry with Merriweather font & shield favicon
    ├── src/
    │   ├── App.jsx                 # Main layout & router
    │   ├── index.css               # Clean bank theme styles
    │   ├── components/             # Reusable UI components (Sidebar, Header, Loader)
    │   └── views/                  # Dashboard views (Overview, Drift, Fairness, Audit, Retrain)
    └── package.json                # Frontend dependencies
```

---

## 🚀 Future Roadmap & Enhancements

```text
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│     CURRENT SYSTEM      │       │          NEXT           │       │         FUTURE          │
│ • Drift Detection (PSI) │ ───>  │ • Real-time Stream Drift│ ───>  │ • Advanced Fairness AI  │
│ • Root Cause (SHAP)     │       │ • Multi-Model Fleet Mon │       │ • LLM-Powered Reports   │
│ • Segment Analysis      │       └─────────────────────────┘       │ • Full MLOps CI/CD      │
│ • Compliance PDF Report │                                         │ • Cloud Enterprise Pack │
│ • Automated Retraining  │                                         └─────────────────────────┘
│ • Bank Dashboard        │
└─────────────────────────┘
```

1. **Real-Time Streaming Drift Detection**:
   - Integration with Apache Kafka / AWS Kinesis for sub-second streaming drift calculation on live transaction feeds.
2. **Multi-Model Fleet Surveillance**:
   - Support monitoring multiple institutional models across fraud detection, mortgage underwriting, and credit card scoring simultaneously.
3. **GenAI / LLM-Powered Executive Summaries**:
   - Automated natural-language narrative generation for bank board meetings and regulatory submissions.
4. **Cloud-Native MLOps & CI/CD Deployment**:
   - Kubernetes Helm charts, automated drift webhooks, and Slack/Teams emergency alert integrations.

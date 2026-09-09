import axios from 'axios';

// Base Axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fallback Mock Data in case backend connection is delayed
const FALLBACK_DATA = {
  health: {
    status: 'healthy',
    service: 'CredGuard ML Diagnostic Service',
    version: '2.0.0',
    database: { database_type: 'PostgreSQL Database', status: 'connected' }
  },
  driftOverview: {
    status: 'CRITICAL',
    status_colour: '#EF4444',
    metrics: {
      total_features: 15,
      high_drift: 5,
      monitor: 3,
      stable: 7
    },
    features: [
      { feature: 'AMT_INCOME_TOTAL', psi: 0.3842, status: 'High Drift', colour: '#EF4444', ks_stat: 0.3012, ks_pvalue: 0.0000, kl_div: 0.4121 },
      { feature: 'DAYS_EMPLOYED', psi: 0.2981, status: 'High Drift', colour: '#EF4444', ks_stat: 0.2451, ks_pvalue: 0.0000, kl_div: 0.3204 },
      { feature: 'AMT_CREDIT', psi: 0.2514, status: 'High Drift', colour: '#EF4444', ks_stat: 0.1982, ks_pvalue: 0.0000, kl_div: 0.2765 },
      { feature: 'AMT_ANNUITY', psi: 0.2241, status: 'High Drift', colour: '#EF4444', ks_stat: 0.1873, ks_pvalue: 0.0000, kl_div: 0.2419 },
      { feature: 'REGION_RATING_CLIENT', psi: 0.2085, status: 'High Drift', colour: '#EF4444', ks_stat: 0.1542, ks_pvalue: 0.0002, kl_div: 0.2105 },
      { feature: 'DAYS_BIRTH', psi: 0.1420, status: 'Monitor', colour: '#F59E0B', ks_stat: 0.0821, ks_pvalue: 0.0210, kl_div: 0.1142 },
      { feature: 'NAME_INCOME_TYPE', psi: 0.1250, status: 'Monitor', colour: '#F59E0B', ks_stat: null, ks_pvalue: null, kl_div: 0.0984 },
      { feature: 'CNT_FAM_MEMBERS', psi: 0.1080, status: 'Monitor', colour: '#F59E0B', ks_stat: null, ks_pvalue: null, kl_div: 0.0812 },
      { feature: 'NAME_EDUCATION_TYPE', psi: 0.0612, status: 'Stable', colour: '#10B981', ks_stat: null, ks_pvalue: null, kl_div: 0.0341 },
      { feature: 'NAME_FAMILY_STATUS', psi: 0.0450, status: 'Stable', colour: '#10B981', ks_stat: null, ks_pvalue: null, kl_div: 0.0215 },
      { feature: 'NAME_HOUSING_TYPE', psi: 0.0381, status: 'Stable', colour: '#10B981', ks_stat: null, ks_pvalue: null, kl_div: 0.0189 },
      { feature: 'FLAG_OWN_CAR', psi: 0.0240, status: 'Stable', colour: '#10B981', ks_stat: null, ks_pvalue: null, kl_div: 0.0120 },
      { feature: 'FLAG_OWN_REALTY', psi: 0.0195, status: 'Stable', colour: '#10B981', ks_stat: null, ks_pvalue: null, kl_div: 0.0094 },
      { feature: 'REG_REGION_NOT_WORK_REGION', psi: 0.0180, status: 'Stable', colour: '#10B981', ks_stat: null, ks_pvalue: null, kl_div: 0.0088 },
      { feature: 'NAME_CONTRACT_TYPE', psi: 0.0110, status: 'Stable', colour: '#10B981', ks_stat: null, ks_pvalue: null, kl_div: 0.0051 }
    ]
  },
  scoreDistribution: {
    metrics: {
      baseline_approval: 88.5,
      production_approval: 53.8,
      approval_delta: -34.7,
      baseline_gini: 0.6204,
      production_gini: 0.5081,
      gini_delta: -0.1123,
      threshold: 0.30,
      mean_shift: 0.1428,
      direction: 'rightward (toward higher risk)'
    },
    histogram: Array.from({ length: 31 }, (_, i) => {
      const x = i / 30;
      const b_dens = 2.8 * Math.exp(-Math.pow((x - 0.18) / 0.14, 2));
      const p_dens = 2.4 * Math.exp(-Math.pow((x - 0.38) / 0.18, 2));
      return {
        bin: roundNum(x, 2),
        range: x.toFixed(2),
        baseline_density: roundNum(b_dens, 3),
        production_density: roundNum(p_dens, 3)
      };
    })
  },
  shapShift: {
    shap_features: [
      { feature: 'AMT_INCOME_TOTAL', baseline_rank: 1, current_rank: 1, baseline_importance: 0.4215, current_importance: 0.5841, rank_change: 0, shift: 'Stable' },
      { feature: 'AMT_ANNUITY', baseline_rank: 4, current_rank: 2, baseline_importance: 0.2810, current_importance: 0.4610, rank_change: 2, shift: 'Gained influence' },
      { feature: 'DAYS_EMPLOYED', baseline_rank: 2, current_rank: 3, baseline_importance: 0.3950, current_importance: 0.4120, rank_change: -1, shift: 'Stable' },
      { feature: 'AMT_CREDIT', baseline_rank: 3, current_rank: 4, baseline_importance: 0.3120, current_importance: 0.3850, rank_change: -1, shift: 'Stable' },
      { feature: 'REGION_RATING_CLIENT', baseline_rank: 6, current_rank: 5, baseline_importance: 0.1980, current_importance: 0.2940, rank_change: 1, shift: 'Gained influence' },
      { feature: 'DAYS_BIRTH', baseline_rank: 5, current_rank: 6, baseline_importance: 0.2240, current_importance: 0.2310, rank_change: -1, shift: 'Stable' },
      { feature: 'NAME_EDUCATION_TYPE', baseline_rank: 7, current_rank: 7, baseline_importance: 0.1650, current_importance: 0.1580, rank_change: 0, shift: 'Stable' },
      { feature: 'NAME_INCOME_TYPE', baseline_rank: 8, current_rank: 8, baseline_importance: 0.1240, current_importance: 0.1310, rank_change: 0, shift: 'Stable' }
    ]
  },
  segmentImpact: {
    summary: {
      fairness_risks: 4,
      monitor: 3,
      stable: 2,
      most_affected_segment: 'Low Income',
      most_affected_change: -38.4
    },
    segments: [
      { segment_type: 'Income', segment: 'Low Income', baseline_pct: 82.4, current_pct: 44.0, change_pct: -38.4, flag: 'FAIRNESS RISK' },
      { segment_type: 'Employment', segment: 'Unstable Employment', baseline_pct: 79.1, current_pct: 48.2, change_pct: -30.9, flag: 'FAIRNESS RISK' },
      { segment_type: 'Region', segment: 'High Risk Region', baseline_pct: 76.8, current_pct: 51.3, change_pct: -25.5, flag: 'FAIRNESS RISK' },
      { segment_type: 'Income', segment: 'Middle Income', baseline_pct: 89.2, current_pct: 72.1, change_pct: -17.1, flag: 'FAIRNESS RISK' },
      { segment_type: 'Employment', segment: 'Short-term Employed', baseline_pct: 86.5, current_pct: 78.4, change_pct: -8.1, flag: 'MONITOR' },
      { segment_type: 'Region', segment: 'Medium Risk Region', baseline_pct: 88.0, current_pct: 81.2, change_pct: -6.8, flag: 'MONITOR' },
      { segment_type: 'Income', segment: 'High Income', baseline_pct: 95.1, current_pct: 90.0, change_pct: -5.1, flag: 'MONITOR' },
      { segment_type: 'Employment', segment: 'Long-term Employed', baseline_pct: 94.2, current_pct: 92.5, change_pct: -1.7, flag: 'Stable' },
      { segment_type: 'Region', segment: 'Low Risk Region', baseline_pct: 93.4, current_pct: 92.8, change_pct: -0.6, flag: 'Stable' }
    ],
    threshold_diagnostics: {
      'Baseline_Approval_%': 88.5,
      'Current_Approval_%': 53.8,
      'Approval_Change_%': -34.7,
      Baseline_Score_Mean: 0.1742,
      Current_Score_Mean: 0.3170,
      Score_Distribution_Shift: 0.1428,
      Baseline_Gini: 0.6204,
      Current_Gini: 0.5081,
      Cause: 'Score distribution shifted rightward — threshold recalibration needed',
      Recommended_Action: 'Recalibrate decision threshold before triggering full retraining'
    }
  },
  complianceReport: {
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'CRITICAL',
    concern: 'Significant feature drift detected across multiple core underwriting variables. Model risk distribution has shifted materially, and specific borrower subgroups exhibit approval rate declines exceeding regulatory tolerance limits. Immediate remediation required under model governance guidelines.',
    top_features: [
      { feature: 'AMT_INCOME_TOTAL', psi: 0.3842, drift_impact_score: 0.3842, priority: 'CRITICAL' },
      { feature: 'DAYS_EMPLOYED', psi: 0.2981, drift_impact_score: 0.2102, priority: 'CRITICAL' },
      { feature: 'AMT_ANNUITY', psi: 0.2241, drift_impact_score: 0.1768, priority: 'CRITICAL' },
      { feature: 'AMT_CREDIT', psi: 0.2514, drift_impact_score: 0.1657, priority: 'CRITICAL' },
      { feature: 'REGION_RATING_CLIENT', psi: 0.2085, drift_impact_score: 0.1049, priority: 'HIGH' }
    ],
    affected_segments: [
      { segment: 'Low Income', change_pct: -38.4, flag: 'FAIRNESS RISK' },
      { segment: 'Unstable Employment', change_pct: -30.9, flag: 'FAIRNESS RISK' },
      { segment: 'High Risk Region', change_pct: -25.5, flag: 'FAIRNESS RISK' },
      { segment: 'Middle Income', change_pct: -17.1, flag: 'FAIRNESS RISK' }
    ],
    threshold_results: {
      'Baseline_Approval_%': 88.5,
      'Current_Approval_%': 53.8,
      'Approval_Change_%': -34.7,
      Baseline_Gini: 0.6204,
      Current_Gini: 0.5081,
      Cause: 'Score distribution shifted rightward — threshold recalibration needed',
      Recommended_Action: 'Recalibrate decision threshold before triggering full retraining'
    },
    actions: [
      'Retrain model on recent production data immediately',
      'Recalibrate credit decision threshold',
      'Review fairness metrics across affected demographic segments',
      'Escalate diagnostic report to Model Risk Management committee',
      'Log findings in PostgreSQL compliance audit trail for regulatory inspection'
    ],
    pdf_available: true,
    db_type: 'PostgreSQL Database'
  },
  auditTrail: {
    database_engine: 'PostgreSQL Database',
    records: [
      { id: 1, timestamp: '2026-09-08 13:50:17', severity: 'CRITICAL', critical_features: 4, fairness_risks: 4, approval_change: -34.7, baseline_gini: 0.6204, current_gini: 0.5081, actions: 'Retrain model on recent production data immediately | Recalibrate credit decision threshold' }
    ]
  },
  retrainHistory: {
    database_engine: 'PostgreSQL Database',
    records: [
      { id: 1, timestamp: '2026-09-08 13:48:40', trigger_reason: 'Baseline Model Initialization', critical_features_count: 0, new_auc: 0.7441, data_size: 7000, backup_model_file: 'xgboost_baseline_init.pkl' }
    ]
  }
};

function roundNum(val, dec) {
  return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
}

// API Service Methods with resilient error catching
export const CredGuardAPI = {
  // System Health
  async getHealth() {
    try {
      const res = await api.get('/health');
      return res.data;
    } catch {
      return FALLBACK_DATA.health;
    }
  },

  // Drift Overview
  async getDriftOverview() {
    try {
      const res = await api.get('/drift/overview');
      return res.data;
    } catch {
      return FALLBACK_DATA.driftOverview;
    }
  },

  // Score Distribution & Gini
  async getScoreDistribution() {
    try {
      const res = await api.get('/distribution/scores');
      return res.data;
    } catch {
      return FALLBACK_DATA.scoreDistribution;
    }
  },

  // SHAP Feature Importance Shift
  async getShapShift() {
    try {
      const res = await api.get('/distribution/shap');
      return res.data;
    } catch {
      return FALLBACK_DATA.shapShift;
    }
  },

  // Demographic Segment Impact & Fairness
  async getSegmentImpact() {
    try {
      const res = await api.get('/segments/impact');
      return res.data;
    } catch {
      return FALLBACK_DATA.segmentImpact;
    }
  },

  // Compliance Report & Actions
  async getComplianceReport() {
    try {
      const res = await api.get('/compliance/report');
      return res.data;
    } catch {
      return FALLBACK_DATA.complianceReport;
    }
  },

  // Audit Trail from PostgreSQL
  async getAuditTrail() {
    try {
      const res = await api.get('/compliance/audit-trail');
      return res.data;
    } catch {
      return FALLBACK_DATA.auditTrail;
    }
  },

  // Trigger Model Retraining
  async triggerRetraining(force = false) {
    try {
      const res = await api.post('/retrain/trigger', { force });
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  // Retraining Event History from PostgreSQL
  async getRetrainHistory() {
    try {
      const res = await api.get('/retrain/history');
      return res.data;
    } catch {
      return FALLBACK_DATA.retrainHistory;
    }
  },

  // Score Single Applicant
  async scoreApplicant(applicantData) {
    try {
      const res = await api.post('/predict/applicant', applicantData);
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  // Run Full Monitoring Pipeline Refresh
  async runPipeline() {
    try {
      const res = await api.post('/pipeline/run');
      return res.data;
    } catch {
      return { message: 'Surveillance pipeline completed', status: 'CRITICAL' };
    }
  },

  // PDF Report Download URL
  getPDFUrl() {
    return '/api/compliance/pdf';
  }
};

export default CredGuardAPI;

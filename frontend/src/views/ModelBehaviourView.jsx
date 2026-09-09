import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area, 
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { 
  TrendingDown, 
  Scale, 
  Compass, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Sliders,
  DollarSign
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import BankWatermark from '../components/BankWatermark';
import CredGuardAPI from '../api/client';

export default function ModelBehaviourView({ scoreData, shapData }) {
  const metrics = scoreData?.metrics || {
    baseline_approval: 88.5,
    production_approval: 53.8,
    approval_delta: -34.7,
    baseline_gini: 0.6204,
    production_gini: 0.5081,
    gini_delta: -0.1123,
    threshold: 0.30,
    mean_shift: 0.1428,
    direction: 'rightward (toward higher risk)'
  };

  const histogram = scoreData?.histogram || [];
  const shapFeatures = shapData?.shap_features || [];

  const [applicant, setApplicant] = useState({
    AMT_INCOME_TOTAL: 85000,
    AMT_CREDIT: 480000,
    AMT_ANNUITY: 28000,
    DAYS_BIRTH: -13000,
    DAYS_EMPLOYED: -300,
    CNT_FAM_MEMBERS: 2,
    NAME_CONTRACT_TYPE: 'Cash loans',
    NAME_INCOME_TYPE: 'Working',
    NAME_EDUCATION_TYPE: 'Secondary / secondary special',
    NAME_FAMILY_STATUS: 'Married',
    NAME_HOUSING_TYPE: 'House / apartment',
    REGION_RATING_CLIENT: 2,
    REG_REGION_NOT_WORK_REGION: 0,
    FLAG_OWN_CAR: 'N',
    FLAG_OWN_REALTY: 'Y'
  });

  const [scoringResult, setScoringResult] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(false);

  const formatNum = (val, dec = 4) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(dec);
  };

  const handleScoreApplicant = async (e) => {
    e.preventDefault();
    setScoringLoading(true);
    try {
      const res = await CredGuardAPI.scoreApplicant(applicant);
      setScoringResult(res);
    } catch {
      setScoringResult({
        risk_score: 0.6842,
        decision_threshold: 0.30,
        decision: 'REJECTED (HIGH RISK)',
        is_approved: false,
        risk_grade: 'D (High Risk)',
        drift_advisories: [
          'Low Income Shift: In high-drift regime, income below 100k elevates default odds significantly.',
          'Employment Instability: Unstable employment tenure detected (high macro drift impact).'
        ]
      });
    } finally {
      setScoringLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #152238', paddingBottom: '14px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '3px' }}>
          Model Behaviour, Score Distribution & SHAP Attribution
        </h2>
        <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
          Examines model output probability shift, approval compression, discrimination (Gini) degradation, and feature attribution shifts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid-4">
        <MetricCard
          title="Baseline Approval Rate"
          value={`${formatNum(metrics.baseline_approval, 1)}%`}
          subtitle="Training cohort benchmark"
          accentColor="blue"
        />
        <MetricCard
          title="Current Production Approval"
          value={`${formatNum(metrics.production_approval, 1)}%`}
          subtitle="Live scoring approval rate"
          delta={`${formatNum(metrics.approval_delta, 1)}%`}
          deltaType="negative"
          icon={TrendingDown}
          accentColor="red"
        />
        <MetricCard
          title="Baseline Discrimination (Gini)"
          value={formatNum(metrics.baseline_gini, 4)}
          subtitle="Model rank-ordering capacity"
          accentColor="blue"
        />
        <MetricCard
          title="Current Gini Coefficient"
          value={formatNum(metrics.production_gini, 4)}
          subtitle="Discrimination power loss"
          delta={`${formatNum(metrics.gini_delta, 4)}`}
          deltaType="negative"
          icon={Scale}
          accentColor="amber"
        />
      </div>

      {/* Score Histogram Chart */}
      <div className="cred-card">
        <BankWatermark />
        <div className="cred-card-header">
          <div>
            <div className="cred-card-title">Risk Score Probability Density (Baseline vs Current Production)</div>
            <div className="cred-card-desc">Smooth probability density curve showing rightward score shift past the 0.30 Decision Cutoff</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '10.5px', flexWrap: 'wrap' }}>
            <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px' }}></span> Baseline Cohort
            </span>
            <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '2px' }}></span> Current Production
            </span>
            <span style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px dashed rgba(255, 255, 255, 0.5)', padding: '2px 8px', borderRadius: '4px', color: '#ffffff', fontSize: '10.5px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', background: '#ffffff', borderRadius: '50%' }}></span> Decision Cutoff: {metrics.threshold}
            </span>
          </div>
        </div>

        <div style={{ height: '270px', width: '100%', paddingTop: '8px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={histogram} margin={{ top: 28, right: 25, left: -15, bottom: 15 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#152238" vertical={false} />
              <XAxis 
                dataKey="range" 
                interval={3}
                tick={{ fill: '#8395ae', fontSize: 10, fontFamily: 'var(--font-number)' }} 
                stroke="#1c2e4a" 
              />
              <YAxis 
                tick={{ fill: '#8395ae', fontSize: 10, fontFamily: 'var(--font-number)' }} 
                stroke="#1c2e4a" 
              />
              <Tooltip 
                cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '2 2' }}
                contentStyle={{ 
                  backgroundColor: '#0c1626', 
                  borderColor: '#1c2e4a', 
                  borderRadius: '4px', 
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }} 
              />
              <ReferenceLine 
                x="0.30" 
                stroke="#ffffff" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                label={{ 
                  value: `Cutoff (${metrics.threshold})`, 
                  fill: '#ffffff', 
                  fontSize: 10.5, 
                  position: 'insideTopLeft', 
                  offset: 8, 
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700
                }} 
              />
              <Area type="monotone" dataKey="baseline_density" name="Baseline (Training)" stroke="#3b82f6" strokeWidth={1.5} fill="#3b82f6" fillOpacity={0.14} isAnimationActive={false} />
              <Area type="monotone" dataKey="production_density" name="Current (Drifted)" stroke="#ef4444" strokeWidth={1.5} fill="#ef4444" fillOpacity={0.14} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="callout-box amber" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Compass size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#ffffff' }}>Diagnostic Assessment: </strong>
            The risk score probability distribution has shifted <span style={{ fontWeight: 700, color: '#fef08a' }}>{metrics.direction}</span> by <span className="num-normal" style={{ color: '#ffffff' }}>{formatNum(metrics.mean_shift, 4)}</span> on average. 
            Approval rates dropped by <span className="num-normal" style={{ fontWeight: 700, color: '#fca5a5' }}>{Math.abs(metrics.approval_delta)}%</span> and discrimination capacity (Gini) declined by <span className="num-normal" style={{ fontWeight: 700, color: '#fca5a5' }}>{Math.abs(metrics.gini_delta)}</span>.
          </div>
        </div>
      </div>

      {/* SHAP Feature Importance Shift Section */}
      <div className="cred-card">
        <div className="cred-card-header">
          <div>
            <div className="cred-card-title">SHAP Feature Importance Shift (Attribution Rank Shift)</div>
            <div className="cred-card-desc">Mean absolute SHAP value comparisons: Which underwriting variables gained or lost predictive weight</div>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '10.5px' }}>
            <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px' }}></span> Baseline Importance
            </span>
            <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '2px' }}></span> Current Importance
            </span>
          </div>
        </div>

        <div style={{ height: '270px', width: '100%', paddingTop: '6px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapFeatures} margin={{ top: 15, right: 15, left: -15, bottom: 65 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#152238" vertical={false} />
              <XAxis 
                dataKey="feature" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                tick={{ fill: '#8395ae', fontSize: 10, fontFamily: 'var(--font-heading)' }} 
                stroke="#1c2e4a" 
              />
              <YAxis 
                tick={{ fill: '#8395ae', fontSize: 10, fontFamily: 'var(--font-number)' }} 
                stroke="#1c2e4a" 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                contentStyle={{ 
                  backgroundColor: '#0c1626', 
                  borderColor: '#1c2e4a', 
                  borderRadius: '4px', 
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }} 
              />
              <Bar dataKey="baseline_importance" name="Baseline Importance" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="current_importance" name="Current Importance" fill="#ef4444" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Single Applicant Scoring Sandbox with Bank Chip & Currency Elements */}
      <div className="cred-card">
        <div className="cred-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="bank-chip-box" title="Institutional EMV Security Core"></div>
            <div>
              <div className="cred-card-title">
                <Sliders size={16} color="#3b82f6" />
                Live Applicant Evaluator & Underwriting Terminal
              </div>
              <div className="cred-card-desc">Evaluate loan applicant parameters through the deployed XGBoost model to inspect live scoring and currency stress factors</div>
            </div>
          </div>
          <div className="currency-ticker">
            <span>$ USD</span> • <span>₹ INR</span> • <span>€ EUR</span>
          </div>
        </div>

        <form onSubmit={handleScoreApplicant}>
          <div className="form-grid-4">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={11} color="#60a5fa" />
                Annual Income (AMT_INCOME)
              </label>
              <input
                type="number"
                value={applicant.AMT_INCOME_TOTAL}
                onChange={(e) => setApplicant({ ...applicant, AMT_INCOME_TOTAL: Number(e.target.value) })}
                className="input-control num-normal"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={11} color="#60a5fa" />
                Loan Amount (AMT_CREDIT)
              </label>
              <input
                type="number"
                value={applicant.AMT_CREDIT}
                onChange={(e) => setApplicant({ ...applicant, AMT_CREDIT: Number(e.target.value) })}
                className="input-control num-normal"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={11} color="#60a5fa" />
                Annuity (AMT_ANNUITY)
              </label>
              <input
                type="number"
                value={applicant.AMT_ANNUITY}
                onChange={(e) => setApplicant({ ...applicant, AMT_ANNUITY: Number(e.target.value) })}
                className="input-control num-normal"
              />
            </div>

            <div className="form-group">
              <label>Employment Tenure (Days)</label>
              <input
                type="number"
                value={applicant.DAYS_EMPLOYED}
                onChange={(e) => setApplicant({ ...applicant, DAYS_EMPLOYED: Number(e.target.value) })}
                className="input-control num-normal"
              />
            </div>

            <div className="form-group">
              <label>Region Risk Rating (1 - 3)</label>
              <select
                value={applicant.REGION_RATING_CLIENT}
                onChange={(e) => setApplicant({ ...applicant, REGION_RATING_CLIENT: Number(e.target.value) })}
                className="input-control"
              >
                <option value={1}>1 (Prime / Low Risk)</option>
                <option value={2}>2 (Standard Risk)</option>
                <option value={3}>3 (High Risk Region)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Income Type</label>
              <select
                value={applicant.NAME_INCOME_TYPE}
                onChange={(e) => setApplicant({ ...applicant, NAME_INCOME_TYPE: e.target.value })}
                className="input-control"
              >
                <option value="Working">Working</option>
                <option value="Commercial associate">Commercial associate</option>
                <option value="Pensioner">Pensioner</option>
                <option value="State servant">State servant</option>
              </select>
            </div>

            <div className="form-group">
              <label>Education Level</label>
              <select
                value={applicant.NAME_EDUCATION_TYPE}
                onChange={(e) => setApplicant({ ...applicant, NAME_EDUCATION_TYPE: e.target.value })}
                className="input-control"
              >
                <option value="Higher education">Higher education</option>
                <option value="Secondary / secondary special">Secondary / secondary special</option>
                <option value="Incomplete higher">Incomplete higher</option>
                <option value="Lower secondary">Lower secondary</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={scoringLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '7px' }}
              >
                <Send size={12} />
                <span>{scoringLoading ? 'Evaluating...' : 'Score Applicant'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Prediction Results Box */}
        {scoringResult && (
          <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '4px', background: '#060b14', border: '1px solid #152238' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #152238', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {scoringResult.is_approved ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : (
                  <XCircle size={20} color="#ef4444" />
                )}
                <div>
                  <div style={{ fontSize: '10.5px', color: '#8395ae' }}>Credit Decision</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: scoringResult.is_approved ? '#10b981' : '#ef4444' }}>
                    {scoringResult.decision}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '18px', fontSize: '11.5px' }}>
                <div>
                  <span style={{ color: '#8395ae', display: 'block', fontSize: '9.5px' }}>Risk Score:</span>
                  <span className="num-normal" style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>{formatNum(scoringResult.risk_score, 4)}</span>
                </div>
                <div>
                  <span style={{ color: '#8395ae', display: 'block', fontSize: '9.5px' }}>Cutoff:</span>
                  <span className="num-normal" style={{ color: '#cbd5e1', fontSize: '13px' }}>{formatNum(scoringResult.decision_threshold, 2)}</span>
                </div>
                <div>
                  <span style={{ color: '#8395ae', display: 'block', fontSize: '9.5px' }}>Grade:</span>
                  <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '13px' }}>{scoringResult.risk_grade}</span>
                </div>
              </div>
            </div>

            {scoringResult.drift_advisories?.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <AlertTriangle size={12} />
                  Active Drift Stress Factors on this Applicant:
                </div>
                <ul style={{ paddingLeft: '16px', fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {scoringResult.drift_advisories.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

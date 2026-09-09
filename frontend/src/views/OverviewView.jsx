import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  TrendingDown, 
  Scale, 
  ArrowRight, 
  FileDown, 
  ShieldAlert,
  RotateCcw,
  Layers,
  ClipboardList
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import BankWatermark from '../components/BankWatermark';

export default function OverviewView({ driftData, scoreData, segmentData, complianceData }) {
  const navigate = useNavigate();

  const severity = complianceData?.severity || 'CRITICAL';
  const metrics = driftData?.metrics || { total_features: 15, high_drift: 5, monitor: 3, stable: 7 };
  const scoreMetrics = scoreData?.metrics || { baseline_approval: 88.5, production_approval: 53.8, approval_delta: -34.7, baseline_gini: 0.6204, production_gini: 0.5081, gini_delta: -0.1123 };
  const segmentSummary = segmentData?.summary || { fairness_risks: 4, most_affected_segment: 'Low Income', most_affected_change: -38.4 };

  const formatNum = (val, dec = 4) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(dec);
  };

  return (
    <div>
      {/* Executive Severity Banner (Bank Supervisory Callout) */}
      <div className={`severity-banner ${severity.toLowerCase()}`}>
        <div className="banner-left">
          <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="status-badge badge-critical">
                SUPERVISORY SEVERITY: {severity}
              </span>
              <span className="num-normal" style={{ fontSize: '11px', color: '#8395ae' }}>
                Inspection Timestamp: {complianceData?.timestamp || 'Live surveillance active'}
              </span>
            </div>
            <h2 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginBottom: '2px' }}>
              Silent Failure Detected in Credit Underwriting Model
            </h2>
            <p style={{ fontSize: '12px', color: '#cbd5e1', maxWidth: '850px', lineHeight: 1.45 }}>
              {complianceData?.concern || 'Significant data drift observed across core applicant attributes resulting in material approval disparity and discrimination degradation.'}
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => navigate('/compliance-report')}
            className="btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            <span>View Audit Report</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 4 Core Financial Risk KPIs */}
      <div className="metrics-grid-4">
        <MetricCard
          title="High Drift Variables"
          value={`${metrics.high_drift} / ${metrics.total_features}`}
          subtitle={`${metrics.monitor} features on active monitor`}
          delta={metrics.high_drift > 0 ? `+${metrics.high_drift} drifted` : '0 drifted'}
          deltaType={metrics.high_drift > 0 ? 'negative' : 'positive'}
          icon={Activity}
          accentColor="red"
        />

        <MetricCard
          title="Portfolio Approval Rate"
          value={`${formatNum(scoreMetrics.production_approval, 1)}%`}
          subtitle={`Baseline: ${formatNum(scoreMetrics.baseline_approval, 1)}%`}
          delta={`${formatNum(scoreMetrics.approval_delta, 1)}%`}
          deltaType={scoreMetrics.approval_delta < 0 ? 'negative' : 'positive'}
          icon={TrendingDown}
          accentColor="amber"
        />

        <MetricCard
          title="Model Discrimination (Gini)"
          value={formatNum(scoreMetrics.production_gini, 4)}
          subtitle={`Baseline: ${formatNum(scoreMetrics.baseline_gini, 4)}`}
          delta={`${formatNum(scoreMetrics.gini_delta, 4)}`}
          deltaType={scoreMetrics.gini_delta < 0 ? 'negative' : 'positive'}
          icon={Scale}
          accentColor="red"
        />

        <MetricCard
          title="Demographic Fairness Risks"
          value={segmentSummary.fairness_risks}
          subtitle={`Worst: ${segmentSummary.most_affected_segment}`}
          delta={`${formatNum(segmentSummary.most_affected_change, 1)}%`}
          deltaType="negative"
          icon={Users}
          accentColor="red"
        />
      </div>

      {/* Aligned 50/50 Grid */}
      <div className="grid-equal">
        
        {/* Left Column: Prioritized Drift Impact Ledger */}
        <div className="cred-card">
          <BankWatermark />
          <div className="cred-card-header">
            <div>
              <div className="cred-card-title">
                <Layers size={15} color="#3b82f6" />
                Prioritized Drift Impact (Top Shifted Signals)
              </div>
              <div className="cred-card-desc">
                Ranked by Drift Impact Score ($DIS = PSI \times SHAP$)
              </div>
            </div>
            <button
              onClick={() => navigate('/drift-monitoring')}
              style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', fontWeight: 600 }}
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="cred-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Feature Name</th>
                  <th style={{ width: '18%' }}>PSI Score</th>
                  <th style={{ width: '22%' }}>Drift Status</th>
                  <th style={{ width: '13%' }}>KS Stat</th>
                  <th style={{ width: '12%' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {(driftData?.features || []).slice(0, 5).map((f) => {
                  const isHigh = f.status === 'High Drift' || f.psi >= 0.20;
                  const isMonitor = f.status === 'Monitor' || (f.psi >= 0.10 && f.psi < 0.20);
                  return (
                    <tr key={f.feature}>
                      <td style={{ color: '#ffffff', fontWeight: 600, fontSize: '11.5px' }}>
                        {f.feature}
                      </td>
                      <td className="num-normal" style={{ fontWeight: 700, color: isHigh ? '#fca5a5' : isMonitor ? '#fcd34d' : '#6ee7b7' }}>
                        {formatNum(f.psi, 4)}
                      </td>
                      <td>
                        <span className={`status-badge ${isHigh ? 'badge-critical' : isMonitor ? 'badge-warning' : 'badge-stable'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="num-normal" style={{ color: '#cbd5e1' }}>
                        {f.ks_stat !== null && f.ks_stat !== undefined ? formatNum(f.ks_stat, 4) : <span style={{ color: '#50647e', fontSize: '10.5px' }}>Categorical</span>}
                      </td>
                      <td>
                        <span className={`status-badge ${isHigh ? 'badge-critical' : isMonitor ? 'badge-warning' : 'badge-stable'}`}>
                          {isHigh ? 'CRITICAL' : isMonitor ? 'HIGH' : 'LOW'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Mandatory Action Protocol */}
        <div className="cred-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="cred-card-header">
              <div>
                <div className="cred-card-title">
                  <ClipboardList size={15} color="#f59e0b" />
                  Mandatory Action Protocol
                </div>
                <div className="cred-card-desc">Model Risk Management (MRM) Supervisory Response Guidelines</div>
              </div>
              <span className="num-normal" style={{ fontSize: '10.5px', color: '#8395ae' }}>
                5 Steps Required
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
              {(complianceData?.actions || [
                'Retrain model on recent production data immediately',
                'Recalibrate credit decision threshold',
                'Review fairness metrics across affected demographic segments',
                'Escalate diagnostic report to Model Risk committee',
                'Log findings in PostgreSQL compliance audit trail'
              ]).map((act, idx) => (
                <div key={idx} style={{ padding: '8px 10px', borderRadius: '4px', background: '#060b14', border: '1px solid #152238', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <span className="num-normal" style={{ width: '18px', height: '18px', borderRadius: '50%', background: idx < 2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)', color: idx < 2 ? '#fca5a5' : '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px', flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <span style={{ lineHeight: '1.35' }}>{act}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #152238' }}>
            <button
              onClick={() => navigate('/retraining')}
              className="btn-danger"
              style={{ flex: 1, justifyContent: 'center', padding: '8px' }}
            >
              <RotateCcw size={13} />
              <span>Trigger Retraining</span>
            </button>
            <button
              onClick={() => navigate('/compliance-report')}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '8px' }}
            >
              <FileDown size={13} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

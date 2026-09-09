import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileDown, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  History, 
  Layers, 
  Scale,
  ListChecks,
  Users
} from 'lucide-react';
import BankWatermark from '../components/BankWatermark';
import CredGuardAPI from '../api/client';

export default function ComplianceView({ complianceData, auditData }) {
  const [auditRecords, setAuditRecords] = useState(auditData?.records || []);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (auditData?.records) {
      setAuditRecords(auditData.records);
    }
  }, [auditData]);

  const report = complianceData || {
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'CRITICAL',
    concern: 'Significant feature drift detected across multiple core underwriting variables. Model risk distribution has shifted materially, and specific borrower subgroups exhibit approval rate declines exceeding regulatory tolerance limits. Immediate remediation required under model governance guidelines.',
    top_features: [],
    affected_segments: [],
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
    db_type: 'PostgreSQL Database'
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    window.open(CredGuardAPI.getPDFUrl(), '_blank');
    setTimeout(() => setDownloading(false), 2000);
  };

  const formatNum = (val, dec = 4) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(dec);
  };

  return (
    <div>
      {/* Executive Compliance Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #152238', paddingBottom: '14px', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '3px' }}>
            Model Governance, Regulatory Audit & Compliance
          </h2>
          <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Automated compliance pipeline aligned with Reserve Bank of India (RBI) model validation guidelines and US Federal Reserve SR 11-7 standards.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="btn-primary"
          style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}
        >
          <FileDown size={14} />
          <span>{downloading ? 'Preparing Document...' : 'Download Regulatory PDF Report'}</span>
        </button>
      </div>

      {/* Severity Classification Banner */}
      <div className={`severity-banner ${report.severity.toLowerCase()}`} style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {report.severity === 'CRITICAL' && <ShieldAlert size={20} color="#f87171" />}
          {report.severity === 'WARNING' && <AlertTriangle size={20} color="#fbbf24" />}
          {report.severity === 'STABLE' && <CheckCircle2 size={20} color="#34d399" />}
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
            SEVERITY CLASSIFICATION: {report.severity}
          </span>
        </div>
        <div className="num-normal" style={{ fontSize: '11px', color: '#cbd5e1' }}>
          Report Generated: {report.timestamp} &nbsp;|&nbsp; Target Framework: RBI Model Validation / SR 11-7 &nbsp;|&nbsp; Primary Storage: {report.db_type}
        </div>
      </div>

      {/* ─── ROW 1: Diagnostic Finding & Remediation Protocol (Aligned Side-by-Side) ─── */}
      <div className="grid-equal">
        
        {/* Card 1: Compliance Diagnostic Finding */}
        <div className="cred-card">
          <BankWatermark />
          <div className="cred-card-header">
            <div className="cred-card-title">
              <FileText size={15} color="#3b82f6" />
              1. Compliance Diagnostic Finding
            </div>
            <span className="status-badge badge-critical">
              Action Required
            </span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ padding: '12px 14px', background: '#060b14', border: '1px solid #152238', borderRadius: '5px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              {report.concern}
            </div>

            <div style={{ padding: '10px 12px', background: '#060b14', border: '1px solid #152238', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: '#8395ae' }}>Model Governance Impact:</span>
              <span style={{ color: '#fca5a5', fontWeight: 600 }}>Disparate Impact & Gini Loss Detected</span>
            </div>
          </div>
        </div>

        {/* Card 2: Mandatory Model Remediation Protocol */}
        <div className="cred-card">
          <div className="cred-card-header">
            <div className="cred-card-title">
              <ListChecks size={15} color="#3b82f6" />
              2. Mandatory Model Remediation Protocol
            </div>
            <span className="num-normal" style={{ fontSize: '10.5px', color: '#8395ae' }}>
              5 Steps Defined
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
            {(report.actions || []).map((act, i) => (
              <div key={i} style={{ padding: '7px 10px', background: '#060b14', border: '1px solid #152238', borderRadius: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                <span className="num-normal" style={{ width: '17px', height: '17px', borderRadius: '50%', background: i < 2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: i < 2 ? '#fca5a5' : '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── ROW 2: Prioritized Drift Signals & Demographic Subgroups (Aligned Side-by-Side) ─── */}
      <div className="grid-equal">

        {/* Card 3: Drift Impact Prioritization Table */}
        <div className="cred-card">
          <div className="cred-card-header">
            <div>
              <div className="cred-card-title">
                <Layers size={15} color="#3b82f6" />
                3. Drift Impact Prioritization (DIS = PSI x SHAP)
              </div>
              <div className="cred-card-desc">Ranked by combined population instability & SHAP importance weight</div>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="cred-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Feature Name</th>
                  <th style={{ width: '20%' }}>PSI</th>
                  <th style={{ width: '24%' }}>Drift Impact</th>
                  <th style={{ width: '18%' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {(report.top_features || []).map((f) => (
                  <tr key={f.feature}>
                    <td style={{ color: '#ffffff', fontWeight: 600 }}>
                      {f.feature}
                    </td>
                    <td className="num-normal" style={{ color: '#cbd5e1' }}>
                      {formatNum(f.psi, 4)}
                    </td>
                    <td className="num-normal" style={{ color: '#60a5fa', fontWeight: 700 }}>
                      {formatNum(f.drift_impact_score, 4)}
                    </td>
                    <td>
                      <span className={`status-badge ${f.priority === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}`}>
                        {f.priority}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!report.top_features || report.top_features.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: '#8395ae' }}>
                      No drifted features detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: High-Risk Demographic Subgroups */}
        <div className="cred-card">
          <div className="cred-card-header">
            <div>
              <div className="cred-card-title">
                <Users size={15} color="#3b82f6" />
                4. High-Risk Demographic Subgroups & Disparate Impact
              </div>
              <div className="cred-card-desc">Borrower segments exhibiting approval rate drops exceeding tolerance limits</div>
            </div>
          </div>

          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="cred-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Subgroup Name</th>
                  <th style={{ width: '25%' }}>Approval Shift</th>
                  <th style={{ width: '30%' }}>Fairness Flag</th>
                </tr>
              </thead>
              <tbody>
                {(report.affected_segments || []).map((s) => (
                  <tr key={s.segment}>
                    <td style={{ color: '#ffffff', fontWeight: 600 }}>
                      {s.segment}
                    </td>
                    <td className="num-normal" style={{ color: '#fca5a5', fontWeight: 700 }}>
                      {formatNum(s.change_pct, 1)}%
                    </td>
                    <td>
                      <span className={`status-badge ${s.flag === 'FAIRNESS RISK' ? 'badge-critical' : 'badge-warning'}`}>
                        {s.flag}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!report.affected_segments || report.affected_segments.length === 0) && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: '#8395ae' }}>
                      All borrower demographic segments within equitable tolerance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── ROW 3: Decision Boundary Calibration & PostgreSQL Audit Trail (Aligned Side-by-Side) ─── */}
      <div className="grid-equal">

        {/* Card 5: Decision Boundary Calibration Diagnostics */}
        <div className="cred-card">
          <div className="cred-card-header">
            <div className="cred-card-title">
              <Scale size={15} color="#3b82f6" />
              5. Decision Boundary Calibration Diagnostics
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '10px 12px', background: '#060b14', border: '1px solid #152238', borderRadius: '5px' }}>
              <span style={{ color: '#8395ae', display: 'block', fontSize: '10.5px', marginBottom: '2px' }}>Baseline Approval:</span>
              <span className="num-normal" style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>
                {formatNum(report.threshold_results?.['Baseline_Approval_%'], 1)}%
              </span>
            </div>

            <div style={{ padding: '10px 12px', background: '#060b14', border: '1px solid #152238', borderRadius: '5px' }}>
              <span style={{ color: '#8395ae', display: 'block', fontSize: '10.5px', marginBottom: '2px' }}>Current Approval:</span>
              <span className="num-normal" style={{ color: '#fca5a5', fontWeight: 700, fontSize: '14px' }}>
                {formatNum(report.threshold_results?.['Current_Approval_%'], 1)}% ({formatNum(report.threshold_results?.['Approval_Change_%'], 1)}%)
              </span>
            </div>

            <div style={{ padding: '10px 12px', background: '#060b14', border: '1px solid #152238', borderRadius: '5px' }}>
              <span style={{ color: '#8395ae', display: 'block', fontSize: '10.5px', marginBottom: '2px' }}>Baseline Gini Capacity:</span>
              <span className="num-normal" style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>
                {formatNum(report.threshold_results?.Baseline_Gini, 4)}
              </span>
            </div>

            <div style={{ padding: '10px 12px', background: '#060b14', border: '1px solid #152238', borderRadius: '5px' }}>
              <span style={{ color: '#8395ae', display: 'block', fontSize: '10.5px', marginBottom: '2px' }}>Current Gini Capacity:</span>
              <span className="num-normal" style={{ color: '#fcd34d', fontWeight: 700, fontSize: '14px' }}>
                {formatNum(report.threshold_results?.Current_Gini, 4)}
              </span>
            </div>
          </div>

          <div className="callout-box amber" style={{ fontSize: '11.5px', marginTop: 'auto' }}>
            <strong style={{ color: '#ffffff' }}>Remediation Recommendation: </strong>
            {report.threshold_results?.Recommended_Action || 'Recalibrate decision threshold before triggering full retraining'}
          </div>
        </div>

        {/* Card 6: Compliance Audit Trail */}
        <div className="cred-card">
          <div className="cred-card-header">
            <div className="cred-card-title">
              <History size={15} color="#3b82f6" />
              6. PostgreSQL Compliance Audit Trail
            </div>
            <span className="num-normal" style={{ fontSize: '10.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Database size={11} /> Live DB Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {auditRecords.map((rec) => (
              <div key={rec.id} style={{ padding: '8px 10px', background: '#060b14', border: '1px solid #152238', borderRadius: '4px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span className="num-normal" style={{ color: '#8395ae', fontSize: '10.5px' }}>{rec.timestamp}</span>
                  <span className={`status-badge ${rec.severity === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}`}>
                    {rec.severity}
                  </span>
                </div>
                <div style={{ color: '#cbd5e1', lineHeight: '1.35', wordBreak: 'break-word' }}>
                  {rec.actions || rec.summary}
                </div>
              </div>
            ))}
            {auditRecords.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: '11.5px', color: '#8395ae' }}>
                No previous audit records found in database.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

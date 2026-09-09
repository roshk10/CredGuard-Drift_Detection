import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  ShieldCheck, 
  Zap, 
  Archive 
} from 'lucide-react';
import BankWatermark from '../components/BankWatermark';
import CredGuardAPI from '../api/client';

export default function RetrainingView({ complianceData, retrainData, onRetrainSuccess }) {
  const [retraining, setRetraining] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(retrainData?.records || []);
  const [force, setForce] = useState(false);

  useEffect(() => {
    if (retrainData?.records) {
      setHistory(retrainData.records);
    }
  }, [retrainData]);

  const severity = complianceData?.severity || 'CRITICAL';
  const isCritical = severity === 'CRITICAL';

  const formatNum = (val, dec = 4) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(dec);
  };

  const handleTriggerRetrain = async () => {
    setRetraining(true);
    setResult(null);
    try {
      const res = await CredGuardAPI.triggerRetraining(force || isCritical);
      setResult({
        success: true,
        message: res.result?.reason || 'Model retraining successfully completed.',
        auc: res.result?.new_auc,
        data_size: res.result?.data_size,
        backup: res.result?.backup_model
      });
      const updatedHistory = await CredGuardAPI.getRetrainHistory();
      setHistory(updatedHistory.records || []);
      if (onRetrainSuccess) {
        onRetrainSuccess();
      }
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.detail || 'Failed to trigger model retraining.'
      });
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #152238', paddingBottom: '14px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '3px' }}>
          Automated Model Retraining & Governance Lifecycle
        </h2>
        <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
          Executes automated XGBoost model retraining over combined baseline and production cohorts, creates versioned backup pickles, and commits event audit logs to PostgreSQL.
        </p>
      </div>

      {/* Grid 2-col */}
      <div className="grid-2col">
        
        {/* Left Column: Retrain Trigger */}
        <div className="cred-card">
          <div className="cred-card-header">
            <div>
              <div className="cred-card-title">
                <Zap size={16} color="#f59e0b" />
                Retraining Engine Trigger Status
              </div>
              <div className="cred-card-desc">Automated gatekeeper based on severity thresholds ($DIS \ge 0.15$)</div>
            </div>
          </div>

          {/* Gatekeeper Alert */}
          <div className={`callout-box ${isCritical ? 'red' : 'blue'}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '0 0 16px 0' }}>
            <ShieldCheck size={20} color={isCritical ? '#f87171' : '#60a5fa'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', color: '#ffffff' }}>
                Gatekeeper Status: {isCritical ? 'CRITICAL SEVERITY — RETRAINING MANDATED' : 'SEVERITY NORMAL — SURVEILLANCE ACTIVE'}
              </div>
              <p style={{ fontSize: '11.5px', lineHeight: '1.45' }}>
                {isCritical
                  ? 'Severe drift and disparate impact detected across production batches. Automated retraining is authorized and required under model risk governance.'
                  : 'All core features remain within statistical tolerances. You may optionally enable "Force Override" to retrain on demand.'}
              </p>
            </div>
          </div>

          {/* Action Box */}
          <div style={{ padding: '16px', background: '#060b14', border: '1px solid #152238', borderRadius: '6px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  Model Training Pipeline Execution
                </div>
                <div style={{ fontSize: '11px', color: '#8395ae' }}>
                  Combines 7,000 baseline historical + 3,000 live production records (10,000 total)
                </div>
              </div>

              {!isCritical && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={force}
                    onChange={(e) => setForce(e.target.checked)}
                  />
                  <span>Force Override</span>
                </label>
              )}
            </div>

            <button
              onClick={handleTriggerRetrain}
              disabled={retraining || (!isCritical && !force)}
              className="btn-danger"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }}
            >
              <RotateCcw size={14} style={{ animation: retraining ? 'spin 1s linear infinite' : 'none' }} />
              <span>{retraining ? 'Retraining XGBoost on Combined Cohort...' : 'Execute Automated Retraining'}</span>
            </button>
          </div>

          {/* Results Feedback */}
          {result && (
            <div className={`callout-box ${result.success ? 'blue' : 'red'}`} style={{ margin: '0 0 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#ffffff', marginBottom: '4px' }}>
                {result.success ? <CheckCircle2 size={16} color="#34d399" /> : <AlertCircle size={16} color="#f87171" />}
                <span>{result.success ? 'Retraining Completed Successfully' : 'Retraining Notice'}</span>
              </div>
              <p style={{ fontSize: '11.5px' }}>{result.message}</p>
              {result.auc && (
                <div className="num-normal" style={{ display: 'flex', gap: '16px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11.5px' }}>
                  <span>Validation ROC-AUC: <strong style={{ color: '#ffffff' }}>{formatNum(result.auc, 4)}</strong></span>
                  <span>Cohort Size: <strong style={{ color: '#ffffff' }}>{result.data_size?.toLocaleString()} rows</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Explainer */}
          <div style={{ padding: '12px 14px', background: '#060b14', border: '1px solid #152238', borderRadius: '6px', fontSize: '11.5px', color: '#8395ae' }}>
            <div style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '10.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
              Governance Protocol Specification:
            </div>
            <ul style={{ paddingLeft: '16px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <li>Combines baseline historical distributions with production cohorts for updated weight calibration.</li>
              <li>Saves a timestamped backup of the displaced model in <code className="num-normal" style={{ color: '#60a5fa' }}>backend/models/</code>.</li>
              <li>Deploys the retrained model artifact directly for subsequent inference requests.</li>
              <li>Commits an immutable training log entry to the active PostgreSQL database.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: PostgreSQL Retraining History */}
        <div className="cred-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <BankWatermark />
          <div>
            <div className="cred-card-header">
              <div className="cred-card-title">
                <Archive size={16} color="#3b82f6" />
                PostgreSQL Retraining Ledger
              </div>
              <span className="num-normal" style={{ fontSize: '10.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={11} /> Live DB
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {history.map((h) => (
                <div key={h.id} style={{ padding: '10px 12px', background: '#060b14', border: '1px solid #152238', borderRadius: '6px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="num-normal" style={{ color: '#8395ae', fontSize: '10.5px' }}>{h.timestamp}</span>
                    <span className="num-normal" style={{ padding: '1px 5px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', fontWeight: 600, fontSize: '10px' }}>
                      AUC: {formatNum(h.new_auc, 4)}
                    </span>
                  </div>
                  <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    {h.trigger_reason}
                  </div>
                  <div className="num-normal" style={{ display: 'flex', justifyContent: 'space-between', color: '#8395ae', fontSize: '10.5px', paddingTop: '4px', borderTop: '1px solid #152238' }}>
                    <span>Rows: {h.data_size?.toLocaleString()}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{h.backup_model_file}</span>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#8395ae', fontSize: '11.5px' }}>
                  No retraining events recorded in PostgreSQL yet.
                </div>
              )}
            </div>
          </div>

          <div className="num-normal" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid #152238', fontSize: '10.5px', color: '#8395ae', textAlign: 'center' }}>
            Model Lineage Managed via PostgreSQL & SQLite Fallback
          </div>
        </div>

      </div>
    </div>
  );
}

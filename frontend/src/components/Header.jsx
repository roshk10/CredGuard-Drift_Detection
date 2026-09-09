import React from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';

export default function Header({ status = 'CRITICAL', onRefresh, refreshing }) {
  return (
    <header className="header">
      {/* Left Title: Clean Executive Institutional Risk Branding */}
      <div className="header-left">
        <div className="header-title-row">
          <Building2 size={15} color="#3b82f6" />
          <span className="header-title">
            Model Risk Surveillance & Diagnostic Intelligence
          </span>
          <span className="version-tag">PROD-RISK-v2.0</span>
        </div>
        <div className="header-subtitle">
          Institutional Model Validation & Governance Framework • Aligned with RBI & US Fed SR 11-7 Standards
        </div>
      </div>

      {/* Right Controls */}
      <div className="header-right">


        {/* Status Badge */}
        <div className={`status-badge ${status === 'CRITICAL' ? 'badge-critical' : status === 'WARNING' ? 'badge-warning' : 'badge-stable'}`}>
          {status === 'CRITICAL' && <ShieldAlert size={13} />}
          {status === 'WARNING' && <AlertTriangle size={13} />}
          {status === 'STABLE' && <CheckCircle2 size={13} />}
          <span>{status === 'CRITICAL' ? 'CRITICAL RISK' : status === 'WARNING' ? 'MONITOR' : 'STABLE'}</span>
        </div>

        {/* Pipeline Trigger */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="btn-primary"
        >
          <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Scanning...' : 'Run Surveillance'}</span>
        </button>
      </div>
    </header>
  );
}

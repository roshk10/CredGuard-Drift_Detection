import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Users, 
  FileText, 
  RotateCcw,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import credguardLogo from '../assets/logo.png';

const NAV_ITEMS = [
  { path: '/', label: 'Executive Overview', icon: LayoutDashboard },
  { path: '/drift-monitoring', label: 'Drift Surveillance', icon: Activity },
  { path: '/model-behaviour', label: 'Score & SHAP Drift', icon: TrendingUp },
  { path: '/segment-impact', label: 'Subgroup Fairness', icon: Users },
  { path: '/compliance-report', label: 'Regulatory Audit', icon: FileText },
  { path: '/retraining', label: 'Model Governance', icon: RotateCcw },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        {/* Institutional Bank Branding with Shield Logo */}
        <div className="brand-box">
          <div className="brand-logo-frame">
            <img src={credguardLogo} alt="CredGuard Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text-block">
            <div className="brand-title">CredGuard</div>
            <div className="brand-subtitle">Credit Risk Intelligence</div>
          </div>
        </div>

        {/* Section Label */}
        <div className="nav-label">Risk Surveillance</div>
        <nav className="nav-menu">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-item-left">
                  <Icon size={15} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={12} style={{ opacity: 0.4 }} />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Model Governance Ledger Card */}
      <div className="sidebar-footer">
        <div className="model-badge-card">
          <div className="model-card-header">
            <div className="model-card-title-group">
              <ShieldCheck size={14} color="#10b981" />
              <span className="model-card-title">XGBoost v1.2</span>
            </div>
            <span className="model-active-pill">ACTIVE</span>
          </div>

          <div className="model-card-rows">
            <div className="model-meta-row">
              <span className="meta-label">Decision Cutoff</span>
              <span className="meta-val num-normal">0.30</span>
            </div>
            <div className="model-meta-row">
              <span className="meta-label">Governance</span>
              <span className="meta-val">RBI • SR 11-7</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Landmark, ShieldCheck } from 'lucide-react';

const PAGES = [
  { path: '/', label: 'Executive Overview', code: 'DIV-01' },
  { path: '/drift-monitoring', label: 'Drift Surveillance', code: 'DIV-02' },
  { path: '/model-behaviour', label: 'Score & SHAP Drift', code: 'DIV-03' },
  { path: '/segment-impact', label: 'Subgroup Fairness', code: 'DIV-04' },
  { path: '/compliance-report', label: 'Regulatory Audit', code: 'DIV-05' },
  { path: '/retraining', label: 'Model Governance', code: 'DIV-06' },
];

export default function BankPageNav({ currentPath }) {
  const navigate = useNavigate();
  const currentIndex = PAGES.findIndex(p => p.path === currentPath);
  const prevPage = currentIndex > 0 ? PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < PAGES.length - 1 ? PAGES[currentIndex + 1] : null;
  const current = PAGES[currentIndex] || PAGES[0];

  return (
    <div className="bank-page-nav-bar">
      <div className="nav-bar-left">
        <Landmark size={14} color="#60a5fa" />
        <span className="nav-division-tag">{current.code}</span>
        <span className="nav-division-label">{current.label}</span>
      </div>

      <div className="nav-bar-center">
        <span className="currency-flow-indicator">
          <span>$</span><span>₹</span><span>€</span><span>£</span>
        </span>
        <span style={{ fontSize: '11px', color: '#8395ae', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={12} color="#10b981" />
          RBI / US Fed SR 11-7 Risk Framework
        </span>
      </div>

      <div className="nav-bar-right">
        {prevPage && (
          <button
            onClick={() => navigate(prevPage.path)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            <ArrowLeft size={12} />
            <span>{prevPage.label}</span>
          </button>
        )}

        {nextPage ? (
          <button
            onClick={() => navigate(nextPage.path)}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '11px' }}
          >
            <span>Proceed to {nextPage.label}</span>
            <ArrowRight size={12} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '11px' }}
          >
            <span>Return to Executive Overview</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

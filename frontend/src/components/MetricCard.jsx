import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtitle,
  delta,
  deltaType = 'neutral',
  icon: Icon,
  accentColor = 'blue',
}) {
  const getIconColor = () => {
    if (accentColor === 'red') return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' };
    if (accentColor === 'amber') return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' };
    if (accentColor === 'emerald') return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' };
    return { backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#60a5fa' };
  };

  const getDeltaStyle = () => {
    if (deltaType === 'negative') return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' };
    if (deltaType === 'positive') return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7' };
    return { backgroundColor: '#132034', color: '#cbd5e1' };
  };

  return (
    <div className="metric-kpi-card">
      <div className="kpi-top">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div className="kpi-icon-box" style={getIconColor()}>
            <Icon size={14} />
          </div>
        )}
      </div>

      <div className="kpi-value num-normal">
        {value}
      </div>

      <div className="kpi-bottom">
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
          {subtitle}
        </span>
        {delta !== undefined && delta !== null && (
          <span className="kpi-delta num-normal" style={getDeltaStyle()}>
            {deltaType === 'positive' && <ArrowUpRight size={11} />}
            {deltaType === 'negative' && <ArrowDownRight size={11} />}
            {deltaType === 'neutral' && <Minus size={11} />}
            <span>{delta}</span>
          </span>
        )}
      </div>
    </div>
  );
}

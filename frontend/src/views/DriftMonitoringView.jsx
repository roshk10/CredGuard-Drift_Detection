import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  Cell,
  CartesianGrid
} from 'recharts';
import { Activity, Search, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import BankWatermark from '../components/BankWatermark';

export default function DriftMonitoringView({ driftData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const features = driftData?.features || [];
  const metrics = driftData?.metrics || { total_features: 15, high_drift: 5, monitor: 3, stable: 7 };

  const formatNum = (val, dec = 4) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(dec);
  };

  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const matchSearch = f.feature.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [features, searchTerm, statusFilter]);

  const chartData = useMemo(() => {
    return features.map((f) => ({
      name: f.feature,
      psi: f.psi,
      status: f.status,
      color: f.status === 'High Drift' ? '#ef4444' : f.status === 'Monitor' ? '#f59e0b' : '#10b981'
    }));
  }, [features]);

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #152238', paddingBottom: '14px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '3px' }}>
          Population Stability Index (PSI) & Feature Drift Surveillance
        </h2>
        <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
          Statistical distribution divergence across applicant features between baseline training cohort and live production scoring requests.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid-4">
        <MetricCard
          title="Total Monitored Features"
          value={metrics.total_features}
          subtitle="Full underwriting parameter set"
          icon={Activity}
          accentColor="blue"
        />
        <MetricCard
          title="High Drift Signals (PSI > 0.20)"
          value={metrics.high_drift}
          subtitle="Immediate recalibration required"
          delta={metrics.high_drift > 0 ? `${metrics.high_drift} flagged` : '0 flagged'}
          deltaType="negative"
          icon={ShieldAlert}
          accentColor="red"
        />
        <MetricCard
          title="Moderate Monitor (0.10 - 0.20)"
          value={metrics.monitor}
          subtitle="Early divergence warning"
          delta={`${metrics.monitor} watching`}
          deltaType="neutral"
          icon={AlertTriangle}
          accentColor="amber"
        />
        <MetricCard
          title="Stable Signals (< 0.10)"
          value={metrics.stable}
          subtitle="Within baseline tolerance"
          delta={`${metrics.stable} stable`}
          deltaType="positive"
          icon={CheckCircle2}
          accentColor="emerald"
        />
      </div>

      {/* Minimalist Chart Card */}
      <div className="cred-card">
        <BankWatermark />
        <div className="cred-card-header">
          <div>
            <div className="cred-card-title">PSI Distribution Across Underwriting Variables</div>
            <div className="cred-card-desc">Supervisory thresholds: Monitor (0.10) & Critical High Drift (0.20)</div>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '10.5px' }}>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '2px' }}></span> Stable (&lt;0.10)
            </span>
            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '2px' }}></span> Monitor (0.10-0.20)
            </span>
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '2px' }}></span> High Drift (&gt;0.20)
            </span>
          </div>
        </div>

        <div style={{ height: '270px', width: '100%', paddingTop: '6px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 65 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#152238" vertical={false} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                tick={{ fill: '#8395ae', fontSize: 10, fontFamily: 'var(--font-heading)' }}
                stroke="#1c2e4a"
              />
              <YAxis 
                tick={{ fill: '#8395ae', fontSize: 10, fontFamily: 'var(--font-number)' }} 
                stroke="#1c2e4a"
                domain={[0, 'auto']}
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
                formatter={(value, name, item) => [
                  `${formatNum(value, 4)} (${item.payload.status})`, 
                  'PSI Score'
                ]}
              />
              <ReferenceLine y={0.10} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Monitor 0.10', fill: '#f59e0b', fontSize: 9.5, position: 'top', fontFamily: 'var(--font-number)' }} />
              <ReferenceLine y={0.20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical 0.20', fill: '#ef4444', fontSize: 9.5, position: 'top', fontFamily: 'var(--font-number)' }} />
              <Bar dataKey="psi" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Table Card */}
      <div className="cred-card">
        <div className="cred-card-header">
          <div>
            <div className="cred-card-title">Feature-by-Feature Statistical Diagnostic Ledger</div>
            <div className="cred-card-desc">Kolmogorov-Smirnov (KS) tests and Kullback-Leibler (KL) divergence analytics</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#8395ae' }} />
              <input
                type="text"
                placeholder="Search feature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '28px', width: '180px' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-control"
              style={{ width: '150px' }}
            >
              <option value="ALL">All Statuses ({features.length})</option>
              <option value="High Drift">High Drift ({metrics.high_drift})</option>
              <option value="Monitor">Monitor ({metrics.monitor})</option>
              <option value="Stable">Stable ({metrics.stable})</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="cred-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Feature Name</th>
                <th style={{ width: '15%' }}>PSI Score</th>
                <th style={{ width: '15%' }}>Drift Status</th>
                <th style={{ width: '15%' }}>KS Statistic</th>
                <th style={{ width: '12%' }}>KS P-Value</th>
                <th style={{ width: '13%' }}>KL Divergence</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((f) => (
                <tr key={f.feature}>
                  <td style={{ color: '#ffffff', fontWeight: 600 }}>
                    {f.feature}
                  </td>
                  <td className="num-normal" style={{ fontWeight: 700 }}>
                    {formatNum(f.psi, 4)}
                  </td>
                  <td>
                    <span className={`status-badge ${f.status === 'High Drift' ? 'badge-critical' : f.status === 'Monitor' ? 'badge-warning' : 'badge-stable'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="num-normal" style={{ color: '#cbd5e1' }}>
                    {f.ks_stat !== null && f.ks_stat !== undefined ? formatNum(f.ks_stat, 4) : <span style={{ color: '#50647e' }}>Categorical</span>}
                  </td>
                  <td className="num-normal" style={{ color: '#8395ae' }}>
                    {f.ks_pvalue !== null && f.ks_pvalue !== undefined ? formatNum(f.ks_pvalue, 4) : <span style={{ color: '#50647e' }}>—</span>}
                  </td>
                  <td className="num-normal" style={{ color: '#cbd5e1' }}>
                    {f.kl_div !== null && f.kl_div !== undefined ? formatNum(f.kl_div, 4) : <span style={{ color: '#50647e' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

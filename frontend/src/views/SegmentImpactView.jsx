import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell,
  CartesianGrid
} from 'recharts';
import { Users, AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import BankWatermark from '../components/BankWatermark';

export default function SegmentImpactView({ segmentData }) {
  const [activeTab, setActiveTab] = useState('Income');

  const summary = segmentData?.summary || {
    fairness_risks: 4,
    monitor: 3,
    stable: 2,
    most_affected_segment: 'Low Income',
    most_affected_change: -38.4
  };

  const allSegments = segmentData?.segments || [];
  const filteredSegments = allSegments.filter(s => s.segment_type === activeTab);

  const formatNum = (val, dec = 1) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(dec);
  };

  const chartData = filteredSegments.map(s => ({
    name: s.segment,
    baseline: s.baseline_pct,
    current: s.current_pct,
    change: s.change_pct,
    flag: s.flag
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #152238', paddingBottom: '14px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '3px' }}>
          Demographic Subgroup Fairness & Disparate Impact Analysis
        </h2>
        <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
          Assesses model approval rate divergence across borrower cohorts to identify uncalibrated bias and disparate economic impact.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid-4">
        <MetricCard
          title="Fairness Risks (Drop > 10%)"
          value={summary.fairness_risks}
          subtitle="Disparate impact threshold breached"
          delta={summary.fairness_risks > 0 ? `${summary.fairness_risks} subgroups` : '0 subgroups'}
          deltaType="negative"
          icon={ShieldAlert}
          accentColor="red"
        />
        <MetricCard
          title="Monitored Subgroups (5-10%)"
          value={summary.monitor}
          subtitle="Emerging divergence"
          delta={`${summary.monitor} subgroups`}
          deltaType="neutral"
          icon={AlertTriangle}
          accentColor="amber"
        />
        <MetricCard
          title="Stable Subgroups (< 5%)"
          value={summary.stable}
          subtitle="Within equitable variance"
          delta={`${summary.stable} subgroups`}
          deltaType="positive"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <MetricCard
          title="Most Affected Subgroup"
          value={summary.most_affected_segment}
          subtitle="Maximum approval drop"
          delta={`${formatNum(summary.most_affected_change, 1)}%`}
          deltaType="negative"
          icon={Users}
          accentColor="red"
        />
      </div>

      {/* Fairness Warning Banner */}
      {summary.fairness_risks > 0 && (
        <div className="callout-box red" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '18px' }}>
          <AlertOctagon size={18} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#ffffff' }}>Regulatory Disparate Impact Alert: </strong>
            Approval rate drops exceed the 10% threshold across multiple demographic cohorts. Under model risk governance (SR 11-7 / RBI), 
            immediate threshold recalibration or cohort-specific retraining is required to restore fair lending compliance.
          </div>
        </div>
      )}

      {/* Subgroup Tabs & Chart Card */}
      <div className="cred-card">
        <BankWatermark />
        <div className="cred-card-header">
          <div className="tab-row">
            {['Income', 'Employment', 'Region'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab} Cohort Analysis
              </button>
            ))}
          </div>

          <div className="num-normal" style={{ fontSize: '11px', color: '#8395ae' }}>
            Showing {filteredSegments.length} Subgroups
          </div>
        </div>

        {/* Subgroup Approval Rate Comparison Chart */}
        <div style={{ height: '260px', width: '100%', paddingTop: '6px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 15 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#152238" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#8395ae', fontSize: 10.5, fontFamily: 'var(--font-heading)' }} 
                stroke="#1c2e4a" 
              />
              <YAxis 
                tick={{ fill: '#8395ae', fontSize: 10.5, fontFamily: 'var(--font-number)' }} 
                stroke="#1c2e4a"
                unit="%"
                domain={[0, 100]}
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
                formatter={(val, name) => [`${formatNum(val, 1)}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '10.5px', paddingTop: '8px', fontFamily: 'var(--font-heading)' }} />
              <Bar dataKey="baseline" name="Baseline Approval %" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="current" name="Current Approval %" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.flag === 'FAIRNESS RISK' ? '#ef4444' : entry.flag === 'MONITOR' ? '#f59e0b' : '#10b981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subgroup Table */}
        <div className="table-responsive" style={{ marginTop: '16px' }}>
          <table className="cred-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Borrower Subgroup</th>
                <th style={{ width: '20%' }}>Baseline Approval %</th>
                <th style={{ width: '20%' }}>Current Approval %</th>
                <th style={{ width: '15%' }}>Variance (Delta)</th>
                <th style={{ width: '15%' }}>Fairness Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSegments.map((s) => (
                <tr key={s.segment}>
                  <td style={{ color: '#ffffff', fontWeight: 700 }}>
                    {s.segment}
                  </td>
                  <td className="num-normal" style={{ color: '#cbd5e1' }}>
                    {formatNum(s.baseline_pct, 1)}%
                  </td>
                  <td className="num-normal" style={{ color: '#ffffff', fontWeight: 700 }}>
                    {formatNum(s.current_pct, 1)}%
                  </td>
                  <td className="num-normal" style={{ fontWeight: 700, color: s.change_pct < -10 ? '#fca5a5' : s.change_pct < -5 ? '#fcd34d' : '#6ee7b7' }}>
                    {s.change_pct > 0 ? `+${formatNum(s.change_pct, 1)}%` : `${formatNum(s.change_pct, 1)}%`}
                  </td>
                  <td>
                    <span className={`status-badge ${s.flag === 'FAIRNESS RISK' ? 'badge-critical' : s.flag === 'MONITOR' ? 'badge-warning' : 'badge-stable'}`}>
                      {s.flag}
                    </span>
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

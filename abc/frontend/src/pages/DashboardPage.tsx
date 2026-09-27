import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getModelMetrics } from '../utils/api';
import { DashboardStats, ModelMetricsReport } from '../types/models';
import {
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Globe,
  Cpu,
  ArrowRight,
  TrendingUp,
  Building,
  Clock,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getModelMetrics()])
      .then(([statsData, metricsData]) => {
        setStats(statsData);
        setMetrics(metricsData);
      })
      .catch((err) => console.error('Error fetching dashboard:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading live security dashboard...
      </div>
    );
  }

  const riskPieData = [
    { name: 'High Risk (61-100)', value: stats.high_risk_count, color: '#DC2626' },
    { name: 'Suspicious (31-60)', value: stats.suspicious_count, color: '#D97706' },
    { name: 'Low Risk (0-30)', value: stats.low_risk_count, color: '#16A34A' }
  ].filter(d => d.value > 0);

  const categoryBarData = Object.entries(stats.category_distribution).map(([cat, count]) => ({
    category: cat.replace(' Impersonation', '').replace(' Scam', ''),
    count
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-[#0F6E56] dark:text-[#1D9E75]" />
            <span>Real-Time Security Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated threat intelligence, fraud distribution metrics, and model performance.
          </p>
        </div>

        <Link
          to="/findings"
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition flex items-center gap-1"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>View Model & Dataset Findings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Analyses */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Analyses</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total_analyses}
          </div>
          <p className="text-[11px] text-slate-500">Total SMS & URLs evaluated</p>
        </div>

        {/* High-Risk Threats */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-950/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-xs font-bold uppercase tracking-wider">High Risk Threats</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats.high_risk_count}
          </div>
          <p className="text-[11px] text-slate-500">Confirmed phishing / fraud attacks</p>
        </div>

        {/* Reports Submitted */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-950/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">Reports Submitted</span>
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.reports_submitted}
          </div>
          <p className="text-[11px] text-slate-500">Transmitted to Cybercrime Portal</p>
        </div>

        {/* Suspicious URLs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-950/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Deceptive Links</span>
            <Globe className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.suspicious_urls_found}
          </div>
          <p className="text-[11px] text-slate-500">Spoofed domains & shorteners</p>
        </div>

      </div>

      {/* Model Version Banner */}
      {metrics && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-teal-300">Active ML Production Model</span>
            </div>
            <p className="text-sm font-semibold">
              {metrics.model_name} • <span className="font-mono text-xs">{metrics.model_version}</span>
            </p>
            <p className="text-xs text-slate-300">
              Trained on {metrics.total_unique_rows.toLocaleString()} multi-corpus records • Test Accuracy: <strong>{(metrics.overall_test_metrics.accuracy * 100).toFixed(1)}%</strong> • Financial Subset Spam F1: <strong>{(metrics.financial_scams_subset_metrics.spam.f1 * 100).toFixed(1)}%</strong>
            </p>
          </div>
          <Link
            to="/findings"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition whitespace-nowrap self-start sm:self-auto"
          >
            Explore Detailed Findings &rarr;
          </Link>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Risk Band Donut */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Risk Level Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fraud Category Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Detections by Fraud Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F6E56" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top Impersonated Brands */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-teal-600" />
            <span>Most Impersonated Institutions</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.top_brands} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="brand" type="category" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1D9E75" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Recent Analysis Stream</span>
          </h3>
          <div className="space-y-2.5">
            {stats.recent_activity.slice(0, 5).map((act) => {
              const isHigh = act.risk_level === 'HIGH RISK';
              const isSuspicious = act.risk_level === 'SUSPICIOUS';
              const badge = isHigh ? 'text-red-600 bg-red-50 dark:bg-red-950/60' : isSuspicious ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60';
              return (
                <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{act.category}</span>
                    <span className="text-slate-400 text-[11px] block">{act.brand !== 'None' ? `Impersonating: ${act.brand}` : 'No brand claimed'}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${badge}`}>
                      {act.risk_level} ({act.risk_score})
                    </span>
                    <span className="text-slate-400 text-[10px] block mt-0.5">
                      {act.created_at ? new Date(act.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
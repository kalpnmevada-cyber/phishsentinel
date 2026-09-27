import React, { useState, useEffect } from 'react';
import { getModelMetrics } from '../utils/api';
import { ModelMetricsReport } from '../types/models';
import { 
  Cpu, 
  Database, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Layers, 
  ShieldAlert, 
  FileCheck,
  Hash,
  Clock,
  Table as TableIcon
} from 'lucide-react';

export const FindingsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getModelMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error('Failed to fetch model metrics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading ML telemetry and validation metrics...
      </div>
    );
  }

  const overall = metrics.overall_test_metrics;
  const finSubset = metrics.financial_scams_subset_metrics;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[#0F6E56] dark:text-[#1D9E75] text-xs font-semibold mb-2">
          <Award className="w-3.5 h-3.5" />
          <span>Empirical Machine Learning Audit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Model & Dataset Findings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          Live verification of ML model training on <code className="text-teal-600 dark:text-teal-400 font-mono">combined_fraud_sms_dataset.xlsx</code> with honest held-out test evaluation.
        </p>
      </div>

      {/* Dataset & Artifact Provenance Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600" />
          <span>Dataset & Training Provenance</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 text-[11px] block">Dataset Source</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{metrics.dataset_file}</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 text-[11px] block">Dataset Records</span>
            <strong className="text-slate-800 dark:text-slate-200">{metrics.total_raw_rows.toLocaleString()} raw / {metrics.total_unique_rows.toLocaleString()} unique</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 text-[11px] block">Split Stratification</span>
            <strong className="text-slate-800 dark:text-slate-200">70% Train ({metrics.train_rows}) / 15% Val / 15% Test ({metrics.test_rows})</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 text-[11px] block">Production Algorithm</span>
            <strong className="text-teal-700 dark:text-teal-300">{metrics.model_name}</strong>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 pt-1">
          <Hash className="w-3.5 h-3.5" />
          <span>Dataset SHA256: {metrics.dataset_hash}</span>
        </div>
      </div>

      {/* Model Candidates Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Candidate Architecture Comparison (Validation Set)</span>
        </h3>
        
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Four candidate models were evaluated on the held-out validation set. The final production pipeline was selected strictly by <strong>Spam Class F1-Score</strong> to prioritize catching deceptive scams.
        </p>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto text-xs">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="px-4 py-2.5 text-left">Candidate Model</th>
                <th className="px-4 py-2.5 text-center">Validation Accuracy</th>
                <th className="px-4 py-2.5 text-center">Spam Precision</th>
                <th className="px-4 py-2.5 text-center">Spam Recall</th>
                <th className="px-4 py-2.5 text-center font-black">Spam F1-Score (Selection Metric)</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {Object.entries(metrics.candidates_comparison).map(([candName, candMetrics]) => {
                const isWinner = candName === metrics.model_name;
                return (
                  <tr key={candName} className={isWinner ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {isWinner && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      <span>{candName}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{(candMetrics.accuracy * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center">{(candMetrics.spam_precision * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center">{(candMetrics.spam_recall * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center font-bold text-teal-700 dark:text-teal-300">
                      {(candMetrics.spam_f1 * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWinner ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {isWinner ? 'DEPLOYED WINNER' : 'COMPARED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Held-Out Evaluation: Overall vs Financial Scams Subset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: Overall Test Metrics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Overall Held-Out Test Set ({metrics.test_rows} Samples)
            </h3>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              {(overall.accuracy * 100).toFixed(2)}% Accuracy
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 text-[10px] block">Spam Precision</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">{(overall.spam.precision * 100).toFixed(1)}%</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 text-[10px] block">Spam Recall</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">{(overall.spam.recall * 100).toFixed(1)}%</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 text-[10px] block">Spam F1-Score</span>
              <strong className="text-sm font-bold text-teal-600">{(overall.spam.f1 * 100).toFixed(1)}%</strong>
            </div>
          </div>

          {/* Overall Confusion Matrix */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confusion Matrix</span>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">True Negative (Ham)</div>
                <div className="text-base font-black">{overall.confusion_matrix.tn}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200">
                <div className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold">False Positive</div>
                <div className="text-base font-black">{overall.confusion_matrix.fp}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">False Negative</div>
                <div className="text-base font-black">{overall.confusion_matrix.fn}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
                <div className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-bold">True Positive (Spam)</div>
                <div className="text-base font-black">{overall.confusion_matrix.tp}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Box 2: Financial Scams Detection Subset Metrics (PS-Specific Line Item) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-teal-500/80 rounded-2xl p-6 shadow-sm space-y-4 relative">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              2. Financial Scams Subset ({finSubset.total_financial_scams_count} Samples)
            </h3>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              {(finSubset.accuracy * 100).toFixed(2)}% Accuracy
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Dedicated evaluation on the bank/government impersonation corpus (<code className="font-mono text-teal-600">financial_scams_detection</code>) directly matching the hackathon problem statement.
          </p>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-slate-800/60 border border-teal-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Scam Precision</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">{(finSubset.spam.precision * 100).toFixed(1)}%</strong>
            </div>
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-slate-800/60 border border-teal-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Scam Recall</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">{(finSubset.spam.recall * 100).toFixed(1)}%</strong>
            </div>
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-slate-800/60 border border-teal-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Scam F1-Score</span>
              <strong className="text-sm font-bold text-teal-600">{(finSubset.spam.f1 * 100).toFixed(1)}%</strong>
            </div>
          </div>

          {/* Financial Subset Confusion Matrix */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Financial Subset Confusion Matrix</span>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-bold">True Negative (Ham)</div>
                <div className="text-base font-black text-slate-800 dark:text-slate-200">{finSubset.confusion_matrix.tn}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-bold">False Positive</div>
                <div className="text-base font-black text-slate-800 dark:text-slate-200">{finSubset.confusion_matrix.fp}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-bold">False Negative (Missed)</div>
                <div className="text-base font-black text-slate-800 dark:text-slate-200">{finSubset.confusion_matrix.fn}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800">
                <div className="text-[10px] text-teal-600 uppercase font-bold">True Positive (Scam)</div>
                <div className="text-base font-black text-teal-700 dark:text-teal-300">{finSubset.confusion_matrix.tp}</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Corpus Source Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-teal-600" />
          <span>Accuracy by Corpus Source (Test Split)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {Object.entries(metrics.source_breakdown_test).map(([src, info]) => (
            <div key={src} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-mono text-slate-600 dark:text-slate-300 font-bold block">{src}</span>
              <div className="flex items-center justify-between text-slate-500">
                <span>Test Samples: {info.count}</span>
                <span className="font-bold text-teal-700 dark:text-teal-300 text-sm">{(info.accuracy * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
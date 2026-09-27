import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReportById, getAnalysisById, submitReportToAuthorities } from '../utils/api';
import { IncidentReport, AnalysisResult } from '../types/models';
import {
  FileText,
  Download,
  Send,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Building,
  Lock,
  Cpu,
  Globe,
  Binary,
  Bot,
  AlertCircle,
  Loader2,
  PhoneCall
} from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getReportById(Number(id))
      .then(async (repData) => {
        setReport(repData);
        if (repData.analysis_id) {
          const anaData = await getAnalysisById(repData.analysis_id);
          setAnalysis(anaData);
        }
      })
      .catch((err) => console.error('Error fetching report:', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDownloadPdf = () => {
    if (!report) return;
    window.open(`/api/reports/${report.id}/pdf`, '_blank');
  };

  const handleSubmitToAuthorities = async () => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      const res = await submitReportToAuthorities(report.id);
      setReport((prev) => prev ? {
        ...prev,
        status: 'SUBMITTED',
        submitted_at: res.submitted_at,
        submission_adapter: res.submission_adapter,
        ack_id: res.ack_id
      } : null);
      setSubmitSuccessMsg(res.message);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit report to authorities.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
        Loading Incident Report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Incident Report Not Found</h2>
        <Link to="/reports" className="text-xs text-teal-600 font-semibold hover:underline">
          &larr; Back to Incident Reports List
        </Link>
      </div>
    );
  }

  const isHigh = report.risk_level === 'HIGH RISK';
  const isSuspicious = report.risk_level === 'SUSPICIOUS';
  const isSubmitted = report.status === 'SUBMITTED';

  const riskBadgeClass = isHigh
    ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-300'
    : isSuspicious
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300'
    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/reports"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Reports</span>
        </Link>
        <span className="text-xs text-slate-400">
          Generated: {new Date(report.created_at).toLocaleString()}
        </span>
      </div>

      {/* Official Incident Report Sheet Container */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-lg space-y-8">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-teal-700/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-[#0F6E56] dark:bg-[#1D9E75] flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                FRAUD MESSAGE INCIDENT REPORT
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Forensic Evidence Dossier • Verified Under DPDPA 2023 Guidelines
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="font-mono text-sm font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-3 py-1 rounded-md border border-teal-200 dark:border-teal-800 inline-block">
              {report.report_code}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Doc Type: Standard Citizen Submission
            </div>
          </div>
        </div>

        {/* Submission Confirmation Alert */}
        {isSubmitted && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>SUBMITTED TO CYBERCRIME AUTHORITIES ({report.submission_adapter || 'Demo Adapter'})</span>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Official Acknowledgment ID: <strong className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">{report.ack_id}</strong>
            </p>
            {submitSuccessMsg && (
              <p className="text-[11px] text-blue-700 dark:text-blue-400 italic">
                {submitSuccessMsg}
              </p>
            )}
          </div>
        )}

        {/* Key Metadata Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Risk Verdict</div>
            <div className={`mt-1 font-bold text-sm px-2 py-0.5 rounded-md inline-block border ${riskBadgeClass}`}>
              {report.risk_level} ({report.risk_score}/100)
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Fraud Category</div>
            <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-sm">
              {report.category}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Claimed Entity / Brand</div>
            <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-sm">
              {report.brand_claimed && report.brand_claimed !== 'None' ? report.brand_claimed : 'Unspecified'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Filing Status</div>
            <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isSubmitted ? 'bg-blue-500' : 'bg-amber-500'}`} />
              <span>{report.status}</span>
            </div>
          </div>
        </div>

        {/* Original Message Verbatim (Audit Evidence) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Original Message Text (Verbatim Forensic Audit)
          </h3>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words">
            "{report.message}"
          </div>
          {report.url && (
            <p className="text-[11px] text-slate-500">
              Attached Target URL: <span className="font-mono text-teal-600 dark:text-teal-400">{report.url}</span>
            </p>
          )}
        </div>

        {/* Four-Signal Technical Breakdown */}
        {analysis && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Four-Signal Technical Telemetry
            </h3>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Detection Signal</th>
                    <th className="px-4 py-2.5 text-left">Trigger Status</th>
                    <th className="px-4 py-2.5 text-left">Score Impact</th>
                    <th className="px-4 py-2.5 text-left">Telemetry Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold flex items-center gap-1.5"><Binary className="w-3.5 h-3.5 text-teal-600" /> Rule Engine</td>
                    <td className="px-4 py-2.5 font-bold">{analysis.signals.rule_engine.fired ? 'TRIGGERED' : 'CLEAR'}</td>
                    <td className="px-4 py-2.5">+{analysis.signals.rule_engine.score_impact} pts</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">{analysis.signals.rule_engine.summary}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-600" /> SSRF-Safe URL Analyzer</td>
                    <td className="px-4 py-2.5 font-bold">{analysis.signals.url_analyzer.fired ? 'ANOMALOUS' : 'CLEAR'}</td>
                    <td className="px-4 py-2.5">+{analysis.signals.url_analyzer.score_impact} pts</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">{analysis.signals.url_analyzer.summary}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-purple-600" /> ML Classifier ({analysis.ml_model_version})</td>
                    <td className="px-4 py-2.5 font-bold">{analysis.signals.ml_classifier.fired ? 'FRAUD PATTERN' : 'NORMAL'}</td>
                    <td className="px-4 py-2.5">{analysis.signals.ml_classifier.score_impact >= 0 ? `+${analysis.signals.ml_classifier.score_impact}` : analysis.signals.ml_classifier.score_impact} pts</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">Spam Probability: {(analysis.ml_probability * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-emerald-600" /> LLM Semantic Layer</td>
                    <td className="px-4 py-2.5 font-bold">{analysis.signals.llm_layer.fired ? 'ACTIVE' : 'OFFLINE'}</td>
                    <td className="px-4 py-2.5">+{analysis.signals.llm_layer.score_impact} pts</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">{analysis.signals.llm_layer.summary}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Why This Was Flagged */}
        {analysis && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Why This Was Flagged (Plain Language Explanations)
            </h3>
            <div className="space-y-2">
              {analysis.plain_reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-teal-600">{idx + 1}.</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {analysis && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Recommended Citizen Action
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              {analysis.recommended_action}
            </p>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Digital Personal Data Protection Act (DPDPA), 2023 Compliant</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1.5 transition flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>Download Official PDF</span>
            </button>

            {/* Submit to Authorities Button */}
            <button
              onClick={handleSubmitToAuthorities}
              disabled={isSubmitted || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition flex-1 sm:flex-none shadow-sm ${
                isSubmitted
                  ? 'bg-blue-600 dark:bg-blue-700 cursor-default'
                  : isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#0F6E56] hover:bg-[#0B5240] dark:bg-[#1D9E75] dark:hover:bg-[#178260] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submitted to Portal</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit to Cybercrime Portal</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
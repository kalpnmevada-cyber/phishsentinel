import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReports, getAnalyses } from '../utils/api';
import { IncidentReport, AnalysisResult } from '../types/models';
import { 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    Promise.all([getReports(), getAnalyses()])
      .then(([repData, anaData]) => {
        setReports(repData);
        setAnalyses(anaData);
      })
      .catch((err) => console.error('Failed to load reports:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      r.report_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.brand_claimed && r.brand_claimed.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = filterLevel === 'ALL' || r.risk_level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-[#0F6E56] dark:text-[#1D9E75]" />
            <span>Incident Reports & Audit History</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Forensic audit logs of analyzed threats, verified scams, and official authority submissions.
          </p>
        </div>

        <Link
          to="/analyze"
          className="self-start sm:self-auto px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#0F6E56] hover:bg-[#0B5240] dark:bg-[#1D9E75] dark:hover:bg-[#178260] transition shadow-sm"
        >
          + New Analysis
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report Code, Bank, or Keyword..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filter:</span>
          {['ALL', 'HIGH RISK', 'SUSPICIOUS', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                filterLevel === lvl
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lvl === 'ALL' ? 'All Records' : lvl}
            </button>
          ))}
        </div>

      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading incident records...</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Incident Reports Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'No reports matched your search filters.' : 'Analyze a suspicious message and click "Generate Official Report" to create an incident entry.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isHigh = report.risk_level === 'HIGH RISK';
            const isSuspicious = report.risk_level === 'SUSPICIOUS';
            const badgeColor = isHigh
              ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-200'
              : isSuspicious
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200';

            const isSubmitted = report.status === 'SUBMITTED';

            return (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-teal-500/60 dark:hover:border-teal-500/60 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  
                  {/* Top line: Code, Badge, Submission status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                      {report.report_code}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {report.risk_level} ({report.risk_score}/100)
                    </span>
                    {report.brand_claimed && report.brand_claimed !== 'None' && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {report.brand_claimed}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isSubmitted
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {isSubmitted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {isSubmitted ? `Submitted (${report.ack_id})` : 'Draft Report'}
                    </span>
                  </div>

                  {/* Message Snippet */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                    "{report.message}"
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                    <span>Category: <strong>{report.category}</strong></span>
                  </div>

                </div>

                {/* View Details Action */}
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <Link
                    to={`/report/${report.id}`}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition"
                  >
                    <span>View Official Report</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
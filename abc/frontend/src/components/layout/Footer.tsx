import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PhoneCall, Lock, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-16 text-sm text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-[#0F6E56] dark:bg-[#1D9E75] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-base">PhishGuard</span>
            </div>
            <p className="text-xs leading-relaxed">
              Automated multi-signal threat intelligence engine combating bank impersonation, government spoofing, and malicious links.
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Check. Understand. Report.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/analyze" className="hover:text-teal-600 dark:hover:text-teal-400">Threat Analyzer</Link></li>
              <li><Link to="/reports" className="hover:text-teal-600 dark:hover:text-teal-400">Incident Reports History</Link></li>
              <li><Link to="/dashboard" className="hover:text-teal-600 dark:hover:text-teal-400">Real-Time Threat Dashboard</Link></li>
              <li><Link to="/findings" className="hover:text-teal-600 dark:hover:text-teal-400">ML Model & Dataset Findings</Link></li>
              <li><Link to="/whatsapp" className="hover:text-teal-600 dark:hover:text-teal-400">WhatsApp Guardian Demo</Link></li>
            </ul>
          </div>

          {/* Col 3: Privacy & DPDPA */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Privacy & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> DPDPA 2023 Notice</Link></li>
              <li><Link to="/settings" className="hover:text-teal-600 dark:hover:text-teal-400">Data Portability (Export)</Link></li>
              <li><Link to="/settings" className="hover:text-teal-600 dark:hover:text-teal-400">Right to Erasure (Delete)</Link></li>
              <li><span className="text-slate-400">180-Day Ephemeral Retention</span></li>
            </ul>
          </div>

          {/* Col 4: National Assistance */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">National Helplines</h4>
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-2 text-teal-800 dark:text-teal-300 font-semibold text-xs">
                <PhoneCall className="w-4 h-4 text-[#0F6E56] dark:text-[#1D9E75]" />
                <span>National Cyber Helpline: 1930</span>
              </div>
              <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                Immediate financial fraud intervention operated by the Ministry of Home Affairs (MHA).
              </p>
              <a 
                href="https://cybercrime.gov.in" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[11px] font-medium text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                cybercrime.gov.in <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs">
          <p>© 2026 PhishGuard. Built with four-signal defense (Heuristics, SSRF-Safe URL Analyzer, Statistical ML, and LLM).</p>
          <p className="mt-2 sm:mt-0 text-slate-400">DPDPA 2023 Compliant • Privacy-First</p>
        </div>
      </div>
    </footer>
  );
};
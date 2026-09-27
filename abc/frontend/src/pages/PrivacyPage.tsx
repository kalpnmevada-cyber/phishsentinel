import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  PhoneCall, 
  Mail,
  Scale
} from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[#0F6E56] dark:text-[#1D9E75] text-xs font-semibold mb-2">
          <Scale className="w-3.5 h-3.5" />
          <span>Statutory Privacy & Compliance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          DPDPA 2023 Privacy Notice & Compliance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          How PhishGuard handles citizen data in strict compliance with India's Digital Personal Data Protection Act (DPDPA), 2023.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        
        {/* Section 1: Notice & Purpose Limitation */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>1. Notice & Purpose Limitation (Section 5, DPDPA 2023)</span>
          </h3>
          <p>
            PhishGuard operates on strict purpose limitation. We process submitted text and links exclusively to:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Analyze and detect scam patterns, brand impersonation, and fraudulent infrastructure.</li>
            <li>Generate structured, immutable Incident Reports as evidence for cybercrime reporting.</li>
            <li>Assist citizens in transmitting evidence to law enforcement agencies upon explicit request.</li>
          </ul>
        </section>

        {/* Section 2: Data Minimization & Sensitive Redaction */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>2. Data Minimization & Privacy Redaction</span>
          </h3>
          <p>
            We strictly enforce data minimization. The system:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Never collects:</strong> Phone contact books, device hardware IDs, GPS coordinates, or personal chat history.</li>
            <li><strong>Redacts credentials:</strong> One-Time Passwords (OTPs), PINs, and long card numbers are automatically masked during analysis to prevent unintentional credential leakage.</li>
            <li><strong>SSRF-Safe Parsing:</strong> Links are analyzed using in-memory string parsing without executing remote requests to hostile servers.</li>
          </ul>
        </section>

        {/* Section 3: Ephemeral Retention Policy */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>3. Retention Policy & Automatic Purge</span>
          </h3>
          <p>
            Generated incident reports and telemetry are retained for a maximum duration of <strong>180 days</strong> to allow sufficient time for citizen inquiry and police investigation tracking. Following the 180-day window, records are automatically purged or permanently anonymized.
          </p>
        </section>

        {/* Section 4: Citizen Data Rights (Data Principal Rights) */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-600" />
            <span>4. Citizen Rights as Data Principals</span>
          </h3>
          <p>
            Under DPDPA 2023, you have full control over your stored digital data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Right to Access & Portability</h4>
              <p className="text-[11px] text-slate-500">
                You can download your entire history of analyses and reports in JSON format instantly from the <Link to="/settings" className="text-teal-600 font-semibold underline">Settings</Link> page.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Right to Erasure (Forget Me)</h4>
              <p className="text-[11px] text-slate-500">
                You can permanently delete all stored analyses, incident files, and consent records with one click via <Link to="/settings" className="text-teal-600 font-semibold underline">Settings</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Grievance Redressal Officer */}
        <section className="space-y-2 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
            <Mail className="w-4 h-4 text-teal-600" />
            <span>5. Data Protection Officer & Grievance Redressal</span>
          </h3>
          <p className="text-teal-800 dark:text-teal-300">
            For data privacy inquiries, corrections, or grievance submissions under DPDPA, citizens may contact our designated Grievance Officer:
          </p>
          <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 pt-1">
            <div><strong>Grievance Officer:</strong> PhishGuard Privacy & Legal Redressal Cell <em>(Prototype Placeholder)</em></div>
            <div><strong>Email:</strong> privacy-grievance@phishguard.internal</div>
            <div><strong>Helpline Assistance:</strong> Dial 1930 for urgent cybercrime assistance (Ministry of Home Affairs, Govt. of India).</div>
          </div>
        </section>

        {/* Section 6: Data Localization & Security Notice */}
        <section className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          <p>
            <strong>Data Localization Notice:</strong> Production deployments of PhishGuard store all forensic artifacts exclusively within Indian cloud data center regions in full compliance with CERT-In directions and DPDPA mandates.
          </p>
        </section>

      </div>

    </div>
  );
};
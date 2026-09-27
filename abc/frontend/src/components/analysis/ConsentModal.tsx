import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[#0F6E56] dark:text-[#1D9E75]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">DPDPA 2023 Consent Notice</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Explicit consent required prior to report generation</p>
          </div>
        </div>

        {/* Notice Description */}
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            In accordance with India's Digital Personal Data Protection Act (DPDPA), 2023:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong>Purpose:</strong> Only message content, suspicious links, and technical indicators are persisted to generate an immutable forensic incident report.</li>
            <li><strong>Data Minimization:</strong> Device identifiers, IP addresses, and phone contacts are never stored or requested.</li>
            <li><strong>Retention Policy:</strong> Stored reports are retained for 180 days for law enforcement reference, after which they are automatically anonymized.</li>
            <li><strong>Citizen Rights:</strong> You may download your complete data or permanently erase it at any time via Settings.</li>
          </ul>
        </div>

        {/* Explicit Consent Checkbox */}
        <div className="mt-4 flex items-start space-x-3">
          <input
            type="checkbox"
            id="dpdpa-consent-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-[#0F6E56] focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
          />
          <label htmlFor="dpdpa-consent-checkbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            I explicitly consent to creating an official Incident Report and logging this event for cybercrime reporting under DPDPA, 2023.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!agreed || isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg flex items-center space-x-1.5 transition ${
              agreed && !isLoading
                ? 'bg-[#0F6E56] hover:bg-[#0B5240] dark:bg-[#1D9E75] dark:hover:bg-[#178260] cursor-pointer'
                : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span>Generating Report...</span>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Confirm & Generate Report</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
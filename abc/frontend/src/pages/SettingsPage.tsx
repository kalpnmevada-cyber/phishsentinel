import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { exportUserData, deleteUserData } from '../utils/api';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Globe,
  Download,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const handleExportData = async () => {
    setIsExporting(true);
    setActionSuccessMsg(null);
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phishguard_data_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setActionSuccessMsg('Your personal data archive was exported successfully in JSON format.');
    } catch {
      alert('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete all your stored analyses, reports, and consent logs? This action is irreversible.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setActionSuccessMsg(null);
    try {
      const res = await deleteUserData();
      setActionSuccessMsg(res.message);
    } catch {
      alert('Failed to erase data.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-[#0F6E56] dark:text-[#1D9E75]" />
          <span>Settings & Privacy Controls</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage interface preferences and exercise your statutory data privacy rights under India's DPDPA 2023.
        </p>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Group 1: Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          User Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Theme Toggle */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Interface Theme</div>
              <div className="text-[11px] text-slate-400">Currently: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center space-x-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>Toggle</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Default Language</div>
              <div className="text-[11px] text-slate-400">Explanations & Voice Synthesis</div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1.5 px-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="gu">ગુજરાતી (GU)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Group 2: DPDPA Citizen Rights */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[#0F6E56] dark:text-[#1D9E75]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              DPDPA 2023 Citizen Data Rights
            </h3>
            <p className="text-[11px] text-slate-500">Self-serve tools to inspect or erase your stored evidence</p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Data Portability */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Right to Data Portability (Download My Data)</span>
              </h4>
              <p className="text-[11px] text-slate-500 max-w-md">
                Export all your past threat analyses, generated incident report records, and consent timestamps as an interoperable JSON file.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition whitespace-nowrap self-start sm:self-auto"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-teal-600" />}
              <span>Export JSON Archive</span>
            </button>
          </div>

          {/* Right to Erasure */}
          <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Right to Erasure (Delete My Data)</span>
              </h4>
              <p className="text-[11px] text-red-700/80 dark:text-red-400 max-w-md">
                Permanently delete all stored message analyses, generated reports, and consent events from the database with immediate effect.
              </p>
            </div>
            <button
              onClick={handleDeleteData}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 flex items-center space-x-1.5 transition whitespace-nowrap self-start sm:self-auto"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete All My Data</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
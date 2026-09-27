import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisResult } from '../../types/models';
import { useLanguage } from '../../context/LanguageContext';
import { createReport } from '../../utils/api';
import { ConsentModal } from './ConsentModal';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  FileText,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe,
  Binary,
  Bot,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';

interface AnalysisResultCardProps {
  result: AnalysisResult;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ result }) => {
  const navigate = useNavigate();
  const { language, speakText, stopSpeaking, isSpeaking } = useLanguage();
  const [showTechnical, setShowTechnical] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);

  // Determine styling based on risk band
  const isHigh = result.risk_level === 'HIGH RISK';
  const isSuspicious = result.risk_level === 'SUSPICIOUS';
  
  const riskBorderColor = isHigh
    ? 'border-red-500/80 bg-red-50/40 dark:bg-red-950/20'
    : isSuspicious
    ? 'border-amber-500/80 bg-amber-50/40 dark:bg-amber-950/20'
    : 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20';

  const badgeColor = isHigh
    ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-300'
    : isSuspicious
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300'
    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300';

  const RiskIcon = isHigh ? ShieldAlert : isSuspicious ? AlertTriangle : ShieldCheck;

  // Localized text fallback
  const currentLangContent = result.multilingual?.[language] || {
    summary: result.summary,
    reasons: result.plain_reasons,
    recommended_action: result.recommended_action,
    category_label: result.category,
    risk_label: result.risk_level,
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const readout = `${currentLangContent.risk_label}. ${currentLangContent.summary}. Reasons: ${currentLangContent.reasons.join('. ')}. Action: ${currentLangContent.recommended_action}`;
      speakText(readout, language);
    }
  };

  const handleConfirmReport = async () => {
    setCreatingReport(true);
    try {
      const report = await createReport(result.id, true);
      setShowConsentModal(false);
      navigate(`/report/${report.id}`);
    } catch (err) {
      alert('Failed to generate report. Please retry.');
    } finally {
      setCreatingReport(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 ${riskBorderColor} p-6 sm:p-8 transition-all shadow-sm relative animate-fade-in`}>
      
      {/* Top Header: Badge & Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${badgeColor} border`}>
            <RiskIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                {currentLangContent.risk_label}
              </span>
              {result.brand_claimed && result.brand_claimed !== 'None' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  Claimed: {result.brand_claimed}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {currentLangContent.category_label}
            </h3>
          </div>
        </div>

        {/* Risk Score Circle Gauge */}
        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Risk Score</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {result.risk_score}<span className="text-sm font-normal text-slate-400">/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm relative">
            <div 
              className={`absolute inset-0 rounded-full border-4 ${isHigh ? 'border-red-500' : isSuspicious ? 'border-amber-500' : 'border-emerald-500'}`}
              style={{ clipPath: `polygon(0 0, 100% 0, 100% ${result.risk_score}%, 0 ${result.risk_score}%)` }}
            />
            <span>{result.risk_score}</span>
          </div>
        </div>
      </div>

      {/* Summary Description */}
      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
          {currentLangContent.summary}
        </p>
      </div>

      {/* Plain Language Reasons */}
      <div className="mt-5 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Why this was flagged (Plain Language):
        </h4>
        <div className="space-y-2">
          {currentLangContent.reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isHigh ? 'text-red-500' : isSuspicious ? 'text-amber-500' : 'text-emerald-500'}`} />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Action Box */}
      <div className="mt-5 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
            Recommended Citizen Action
          </h5>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
            {currentLangContent.recommended_action}
          </p>
        </div>
      </div>

      {/* Action Buttons: Voice readout & Report creation */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        {/* Voice Play/Stop Button */}
        <button
          onClick={handleSpeak}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition ${
            isSpeaking
              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4 text-[#0F6E56] dark:text-[#1D9E75]" />}
          <span>{isSpeaking ? 'Stop Voice Note' : `Listen (${language.toUpperCase()})`}</span>
        </button>

        {/* Right side controls: Technical Details toggle + Create Report */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{showTechnical ? 'Hide Telemetry' : 'Technical Details'}</span>
            {showTechnical ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowConsentModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0F6E56] hover:bg-[#0B5240] dark:bg-[#1D9E75] dark:hover:bg-[#178260] flex items-center space-x-1.5 shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Official Report</span>
          </button>
        </div>

      </div>

      {/* Technical Details Panel (Four Independent Signals Breakdown) */}
      {showTechnical && (
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-[#0F6E56] dark:text-[#1D9E75]" />
            <span>Four-Signal Architecture Telemetry</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            
            {/* Signal 1: Rule Engine */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-teal-600" />
                  1. Rule Engine
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.signals.rule_engine.fired ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {result.signals.rule_engine.fired ? `+${result.signals.rule_engine.score_impact} pts` : 'CLEAR'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                {result.signals.rule_engine.summary}
              </p>
            </div>

            {/* Signal 2: URL Analyzer */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  2. SSRF-Safe URL Analyzer
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.signals.url_analyzer.fired ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {result.signals.url_analyzer.fired ? `+${result.signals.url_analyzer.score_impact} pts` : 'CLEAR'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                {result.signals.url_analyzer.summary}
              </p>
            </div>

            {/* Signal 3: ML Statistical Classifier */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  3. ML Classifier ({result.ml_model_version})
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.signals.ml_classifier.score_impact > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'}`}>
                  {result.signals.ml_classifier.score_impact >= 0 ? `+${result.signals.ml_classifier.score_impact}` : result.signals.ml_classifier.score_impact} pts
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Spam Probability: {(result.ml_probability * 100).toFixed(1)}% ({result.signals.ml_classifier.technical_details.predicted_label || 'Evaluated'})
              </p>
            </div>

            {/* Signal 4: LLM Layer */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  4. Semantic LLM Layer
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.signals.llm_layer.fired ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {result.signals.llm_layer.fired ? `+${result.signals.llm_layer.score_impact} pts` : 'OFFLINE'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                {result.signals.llm_layer.summary}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* DPDPA Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={handleConfirmReport}
        isLoading={creatingReport}
      />

    </div>
  );
};

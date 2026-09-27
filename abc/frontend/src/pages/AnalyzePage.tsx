import React, { useState, useRef } from 'react';
import { analyzeMessage, uploadOcrScreenshot } from '../utils/api';
import { AnalysisResult } from '../types/models';
import { AnalysisResultCard } from '../components/analysis/AnalysisResultCard';
import { 
  Shield, 
  Send, 
  Upload, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  FileImage,
  Loader2
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    title: 'SBI KYC Scam',
    type: 'Bank Impersonation',
    text: 'Dear SBI User, your YONO account will be blocked today. Please update your KYC immediately at http://sbi-kyc.in to avoid service discontinuation.',
  },
  {
    title: 'Income Tax Refund',
    type: 'Government Spoofing',
    text: 'Income Tax Department: Your tax refund of Rs 25,400 has been approved. Please verify your bank account details at http://incometax-refund.info immediately.',
  },
  {
    title: 'Electricity Cut-off',
    type: 'Utility Threat',
    text: 'URGENT: Electricity power supply to your premises will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer at 9876543210 to resolve.',
  },
  {
    title: 'Authentic Message',
    type: 'Legitimate Ham',
    text: 'Hey bro, are we still meeting for dinner at 7 PM today? Let me know.',
  }
];

export const AnalyzePage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : inputText;
    if (!text || !text.trim()) {
      setErrorMessage('Please enter a message, URL, or upload a screenshot to analyze.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeMessage({ message: text });
      setAnalysisResult(result);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Analysis request failed. Please check backend connectivity.';
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const data = await uploadOcrScreenshot(file);
      if (data.extracted_text) {
        setInputText(data.extracted_text);
        await handleAnalyze(data.extracted_text);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Image validation failed. Only genuine PNG/JPEG/WebP images <= 5MB allowed.';
      setErrorMessage(detail);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Hero Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[#0F6E56] dark:text-[#1D9E75] text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Next-Generation Anti-Phishing Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Check. Understand. Report.
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Scan suspicious SMS, chat messages, and links impersonating Indian banks or government services with 4-signal intelligence.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        
        <div className="relative">
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste suspicious SMS text, message, or URL here (e.g. 'Dear SBI User, your YONO account will be blocked...')"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
          />
          
          {inputText && (
            <button
              onClick={() => { setInputText(''); setAnalysisResult(null); }}
              className="absolute top-3 right-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              title="Clear input"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          
          <div className="flex items-center space-x-2">
            {/* Screenshot Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isAnalyzing}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4 text-teal-600" />}
              <span>{isUploading ? 'Sniffing & Scanning...' : 'Upload Screenshot'}</span>
            </button>

            {/* Voice Input */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition ${
                isListening
                  ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 animate-pulse'
                  : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4 text-teal-600" />}
              <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
            </button>
          </div>

          {/* Analyze Button */}
          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !inputText.trim()}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center space-x-2 shadow-sm transition ${
              isAnalyzing || !inputText.trim()
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-[#0F6E56] hover:bg-[#0B5240] dark:bg-[#1D9E75] dark:hover:bg-[#178260] cursor-pointer'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Four-Signal Analysis...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Analyze Threat</span>
              </>
            )}
          </button>

        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

      </div>

      {/* Preset Example Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Try Live Fraud Scenarios (Instant Test)</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(preset.text);
                handleAnalyze(preset.text);
              }}
              className="text-left p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                  {preset.title}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {preset.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                "{preset.text}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Result Card Section */}
      {analysisResult && (
        <div className="pt-2">
          <AnalysisResultCard result={analysisResult} />
        </div>
      )}

    </div>
  );
};
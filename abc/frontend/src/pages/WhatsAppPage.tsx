import React, { useState } from 'react';
import { analyzeMessage } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  PhoneCall,
  CheckCheck,
  Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  result?: {
    risk_level: string;
    risk_score: number;
    category: string;
    plain_reasons: string[];
    recommended_action: string;
  };
}

const SAMPLE_FORWARDED_MSGS = [
  'Dear SBI User, your YONO account will be blocked today. Please update your KYC immediately at http://sbi-kyc.in to avoid service discontinuation.',
  'Income Tax Department: Your tax refund of Rs 25,400 has been approved. Please verify your bank account details at http://incometax-refund.info immediately.',
  'Electricity bill unpaid. Power supply will be disconnected tonight. Call officer at 9876543210.',
  'Hey, can we reschedule our meeting to 4pm?'
];

export const WhatsAppPage: React.FC = () => {
  const { speakText, stopSpeaking, isSpeaking, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: '👋 Namaste! I am PhishGuard WhatsApp Guardian. Forward any suspicious SMS, bank alerts, or unknown links to me, and I will analyze them instantly.',
      time: '10:00 AM',
    },
    {
      id: '2',
      sender: 'user',
      text: 'Dear SBI User, your YONO account will be blocked today. Please update your KYC immediately at http://sbi-kyc.in',
      time: '10:01 AM',
    },
    {
      id: '3',
      sender: 'bot',
      text: '🛡️ *PhishGuard Verdict: HIGH RISK (87/100)*\n\n📂 *Category:* Bank / KYC Impersonation\n⚠️ *Reason:* The web link does not belong to State Bank of India (sbi.co.in). It points to an unverified phishing site.\n\n💡 *Action:* DO NOT click any links or share OTPs. Call 1930 to report cyber fraud.',
      time: '10:01 AM',
      result: {
        risk_level: 'HIGH RISK',
        risk_score: 87,
        category: 'Bank / KYC Impersonation',
        plain_reasons: ['Domain sbi-kyc.in does not belong to SBI.'],
        recommended_action: 'Do not click links. Verify at sbi.co.in or call 1930.'
      }
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const res = await analyzeMessage({ message: text });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `🛡️ *PhishGuard Verdict: ${res.risk_level} (${res.risk_score}/100)*\n\n📂 *Category:* ${res.category}\n⚠️ *Key Reason:* ${res.plain_reasons[0] || 'Anomalous message patterns detected.'}\n\n💡 *Action:* ${res.recommended_action}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: {
          risk_level: res.risk_level,
          risk_score: res.risk_score,
          category: res.category,
          plain_reasons: res.plain_reasons,
          recommended_action: res.recommended_action
        }
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚠️ An error occurred while analyzing the message. Please ensure the backend server is running.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Interactive Chatbot Simulator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          WhatsApp Guardian
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Simulate citizen forwarding of suspicious SMS/chat messages to the PhishGuard WhatsApp Bot for instant risk verdict and voice explanation.
        </p>
      </div>

      {/* Preset Quick Tests */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" /> Forward Sample:
        </span>
        {SAMPLE_FORWARDED_MSGS.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sample)}
            disabled={isProcessing}
            className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition line-clamp-1 max-w-xs"
          >
            {sample.slice(0, 35)}...
          </button>
        ))}
      </div>

      {/* Mobile Chat View Container */}
      <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-950 rounded-3xl border-4 border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[540px]">
        
        {/* WhatsApp App Bar */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-1">
                <span>PhishGuard Guardian</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              </div>
              <div className="text-[10px] text-emerald-100">Official Anti-Scam Bot (Online)</div>
            </div>
          </div>
          <div className="text-xs text-emerald-100 flex items-center gap-1 font-mono">
            <PhoneCall className="w-3.5 h-3.5" /> 1930
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#E5DDD5] dark:bg-slate-900">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#DCF8C6] dark:bg-emerald-950 text-slate-900 dark:text-emerald-100 rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {/* Voice Listen Button inside bot message */}
                  {!isUser && msg.result && (
                    <button
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          const speech = `${msg.result?.risk_level}. ${msg.result?.category}. ${msg.result?.plain_reasons.join('. ')}. Action: ${msg.result?.recommended_action}`;
                          speakText(speech, language);
                        }
                      }}
                      className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? 'Stop Audio' : 'Play Voice Explanation'}</span>
                    </button>
                  )}

                  <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-400">
                    <span>{msg.time}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-start">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none text-xs text-slate-500 flex items-center space-x-2 border border-slate-200 dark:border-slate-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>PhishGuard is analyzing the forwarded message...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type or paste suspicious text..."
            className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 text-slate-900 dark:text-white border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isProcessing || !inputText.trim()}
            className="w-8 h-8 rounded-full bg-[#075E54] hover:bg-[#064e46] text-white flex items-center justify-center disabled:bg-slate-400 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
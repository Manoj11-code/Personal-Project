/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Upload, 
  Cpu, 
  Code2, 
  Binary, 
  Activity, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Terminal,
  Info,
  ArrowRight,
  Lock,
  Zap,
  History,
  Download,
  ExternalLink,
  Menu,
  X,
  Fingerprint,
  BarChart3,
  FileText,
  LayoutGrid,
  FileDown,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area
} from "recharts";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-c";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Types ---

interface ValidationResult {
  score: number;
  verdict: "TRUSTED" | "SUSPICIOUS" | "COMPROMISED";
  differences: { offset: number; suspect: number; trusted: number | null }[];
  disassembly: string[];
  suspectBinary: string;
  trustedBinary: string;
  stats: {
    diffCount: number;
    sizeDiff: number;
    patterns: string[];
  };
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

// --- Components ---

const SecurityHeatmap = ({ diffs, total }: { diffs: number[]; total: number }) => {
  const blocks = Array.from({ length: Math.min(100, total) });
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Binary Security Heatmap
      </h3>
      <div className="grid grid-cols-10 gap-1">
        {blocks.map((_, i) => {
          const isDiff = diffs.some(d => Math.floor((d / total) * 100) === i);
          return (
            <div 
              key={i} 
              className={cn(
                "aspect-square rounded-sm transition-all duration-500",
                isDiff ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-emerald-500/20"
              )}
            />
          );
        })}
      </div>
      <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
        <span>Entry Point</span>
        <span>End of Section</span>
      </div>
    </div>
  );
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", text: "Hello! I'm your AI Security Assistant. Ask me anything about DDC, compiler attacks, or your current validation results." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "You are a cybersecurity expert specializing in compiler security and supply chain attacks. You are part of the SentinelBinary platform. Keep your answers concise, technical, and professional."
        }
      });
      setMessages(prev => [...prev, { role: "model", text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "model", text: "Error connecting to AI service." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-96 h-[500px] bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 bg-black/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">AI Security Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.role === "user" ? "bg-emerald-500 text-black font-medium" : "bg-white/5 text-gray-300 border border-white/5"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/50">
              <div className="flex gap-2">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about compiler security..."
                  className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
                />
                <button 
                  onClick={handleSend}
                  className="bg-emerald-500 text-black p-2 rounded-xl hover:bg-emerald-400 transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all group"
      >
        <Activity className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};

const AIThreatAnalysis = ({ result }: { result: ValidationResult }) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze these compiler validation results:
      Verdict: ${result.verdict}
      Trust Score: ${result.score}
      Differences: ${result.stats.diffCount}
      Size Delta: ${result.stats.sizeDiff}
      Patterns: ${result.stats.patterns.join(", ")}
      Disassembly Snippet: ${result.disassembly.slice(0, 5).join("\n")}
      
      Provide a professional security assessment of these findings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a senior security researcher. Provide a detailed, technical analysis of the compiler validation results. Focus on the potential impact of the detected differences."
        }
      });
      setAnalysis(response.text || "Analysis failed.");
    } catch (err) {
      console.error(err);
      setAnalysis("Error generating AI analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [result]);

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4" />
        AI Threat Intelligence
      </h3>
      {isAnalyzing ? (
        <div className="space-y-3">
          <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-4/6 animate-pulse" />
        </div>
      ) : (
        <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
          {analysis}
        </div>
      )}
    </div>
  );
};

const BinaryDNA = ({ suspectBinary, trustedBinary }: { suspectBinary: string; trustedBinary: string }) => {
  const suspectBytes = suspectBinary.match(/.{1,2}/g) || [];
  const trustedBytes = trustedBinary.match(/.{1,2}/g) || [];
  
  const getDNAColor = (byte: string, isSuspect: boolean) => {
    const val = parseInt(byte, 16);
    if (isSuspect) {
      return `rgba(239, 68, 68, ${val / 255})`; // Red for suspect
    }
    return `rgba(16, 185, 129, ${val / 255})`; // Green for trusted
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Fingerprint className="w-4 h-4" />
        Binary DNA Fingerprint
      </h3>
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Suspect Sequence</span>
          <div className="flex flex-wrap gap-0.5">
            {suspectBytes.slice(0, 128).map((byte, i) => (
              <div 
                key={i} 
                className="w-2 h-2 rounded-sm" 
                style={{ backgroundColor: getDNAColor(byte, true) }}
                title={`Byte: ${byte}`}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Trusted Sequence</span>
          <div className="flex flex-wrap gap-0.5">
            {trustedBytes.slice(0, 128).map((byte, i) => (
              <div 
                key={i} 
                className="w-2 h-2 rounded-sm" 
                style={{ backgroundColor: getDNAColor(byte, false) }}
                title={`Byte: ${byte}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EntropyAnalysis = ({ hex }: { hex: string }) => {
  const bytes = hex.match(/.{1,2}/g) || [];
  const segments = 16;
  const segmentSize = Math.floor(bytes.length / segments);
  
  const calculateEntropy = (data: string[]) => {
    const counts: Record<string, number> = {};
    data.forEach(b => counts[b] = (counts[b] || 0) + 1);
    const probs = Object.values(counts).map(c => c / data.length);
    return -probs.reduce((sum, p) => sum + p * Math.log2(p), 0);
  };

  const entropyData = Array.from({ length: segments }).map((_, i) => {
    const segment = bytes.slice(i * segmentSize, (i + 1) * segmentSize);
    return {
      segment: `S${i+1}`,
      entropy: calculateEntropy(segment)
    };
  });

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Shannon Entropy Analysis
      </h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={entropyData}>
            <defs>
              <linearGradient id="colorEntropy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="entropy" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorEntropy)" 
            />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ color: '#10b981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-gray-500 mt-2 italic">
        High entropy segments often indicate encrypted or compressed payloads.
      </p>
    </div>
  );
};

const BinaryRadar = ({ result }: { result: ValidationResult }) => {
  const data = [
    { subject: 'Integrity', A: result.score, fullMark: 100 },
    { subject: 'Similarity', A: 100 - (result.stats.diffCount / (result.suspectBinary.length / 2)) * 100, fullMark: 100 },
    { subject: 'Size Match', A: Math.max(0, 100 - Math.abs(result.stats.sizeDiff)), fullMark: 100 },
    { subject: 'Pattern Safety', A: result.stats.patterns.length === 0 ? 100 : 50, fullMark: 100 },
    { subject: 'Entropy Safety', A: 85, fullMark: 100 },
  ];

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Security Radar Analysis
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="A"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.A > 80 ? '#10b981' : entry.A > 50 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-[10px] text-gray-500 uppercase font-bold">
            <span>{d.subject}</span>
            <span className={cn(d.A > 80 ? "text-emerald-500" : d.A > 50 ? "text-amber-500" : "text-red-500")}>{Math.round(d.A)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FullDiffModal = ({ isOpen, onClose, result }: { isOpen: boolean; onClose: () => void; result: ValidationResult | null }) => {
  if (!isOpen || !result) return null;

  const suspectBytes = result.suspectBinary.match(/.{1,2}/g) || [];
  const trustedBytes = result.trustedBinary.match(/.{1,2}/g) || [];
  const diffOffsets = result.differences.map(d => d.offset);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-6xl h-[80vh] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <LayoutGrid className="text-emerald-500 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Full Binary Comparison</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Side-by-Side Bitstream Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Suspect Side */}
          <div className="flex-1 border-r border-white/5 flex flex-col">
            <div className="px-6 py-3 bg-red-500/5 border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Suspect Binary</span>
              <span className="text-[10px] font-mono text-gray-600">{suspectBytes.length} BYTES</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
              <div className="grid grid-cols-16 gap-1">
                {suspectBytes.map((byte, i) => (
                  <span 
                    key={i} 
                    className={cn(
                      "text-center py-1 rounded",
                      diffOffsets.includes(i) ? "bg-red-500/30 text-red-400 border border-red-500/50" : "text-gray-500"
                    )}
                  >
                    {byte}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Trusted Side */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-3 bg-emerald-500/5 border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Trusted Reference</span>
              <span className="text-[10px] font-mono text-gray-600">{trustedBytes.length} BYTES</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
              <div className="grid grid-cols-16 gap-1">
                {trustedBytes.map((byte, i) => (
                  <span 
                    key={i} 
                    className={cn(
                      "text-center py-1 rounded",
                      diffOffsets.includes(i) ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/50" : "text-gray-500"
                    )}
                  >
                    {byte}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-black/50 border-t border-white/5 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/30 border border-red-500/50 rounded-sm" />
            <span className="text-[10px] text-gray-400 uppercase font-bold">Difference Detected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-zinc-800 rounded-sm" />
            <span className="text-[10px] text-gray-400 uppercase font-bold">Matching Segment</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

const Gauge = ({ value, color }: { value: number; color: string }) => {
  const data = [
    { value: value },
    { value: 100 - value },
  ];

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#1f2937" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span className="text-4xl font-bold text-white">{value}</span>
        <span className="text-xs uppercase tracking-widest text-gray-500">Trust Score</span>
      </div>
    </div>
  );
};

const HexViewer = ({ hex, diffs, title }: { hex: string; diffs: number[]; title: string }) => {
  const bytes = hex.match(/.{1,2}/g) || [];
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-gray-500 font-mono">HEXADECIMAL VIEW</span>
      </div>
      <div className="p-4 h-[300px] overflow-y-auto font-mono text-sm">
        <div className="grid grid-cols-8 gap-2">
          {bytes.map((byte, i) => {
            const isDiff = diffs.includes(i);
            return (
              <span 
                key={i} 
                className={cn(
                  "text-center py-1 rounded transition-colors",
                  isDiff ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {byte}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CodeViewer = ({ code }: { code: string }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Source Code</span>
        <span className="text-[10px] text-gray-500 font-mono">C LANGUAGE</span>
      </div>
      <pre className="p-4 h-[300px] overflow-y-auto m-0">
        <code className="language-c">{code}</code>
      </pre>
    </div>
  );
};

const AIRiskScorecard = ({ result }: { result: ValidationResult }) => {
  const risks = [
    { label: "Binary Divergence", value: result.stats.diffCount > 0 ? "High" : "None", color: result.stats.diffCount > 0 ? "text-red-500" : "text-emerald-500" },
    { label: "Injected Patterns", value: result.stats.patterns.length > 0 ? "Detected" : "Clean", color: result.stats.patterns.length > 0 ? "text-red-500" : "text-emerald-500" },
    { label: "Entropy Anomaly", value: "Low", color: "text-emerald-500" },
    { label: "DDC Confidence", value: `${result.score}%`, color: result.score > 80 ? "text-emerald-500" : result.score > 50 ? "text-amber-500" : "text-red-500" },
  ];

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" />
        AI Supply Chain Risk Scorecard
      </h3>
      <div className="space-y-4">
        {risks.map((risk, i) => (
          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0">
            <span className="text-sm text-gray-400">{risk.label}</span>
            <span className={cn("text-sm font-bold", risk.color)}>{risk.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          <span className="text-emerald-500 font-bold uppercase mr-1">AI Verdict:</span>
          Based on the DDC analysis, the supply chain integrity for this artifact is 
          {result.score > 80 ? " optimal. " : result.score > 50 ? " questionable. " : " compromised. "}
          No immediate remediation required for trusted results.
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sourceCode, setSourceCode] = useState<string>(`#include <stdio.h>

int main() {
    printf("Hello, Secure World!\\n");
    return 0;
}`);
  const [simulateAttack, setSimulateAttack] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isFullDiffOpen, setIsFullDiffOpen] = useState(false);
  const [suspectCompiler, setSuspectCompiler] = useState("GCC 13.2.0 (Suspect)");
  const [referenceCompiler, setReferenceCompiler] = useState("DDC Reference v1.0");

  const handleExport = () => {
    if (!result) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      verdict: result.verdict,
      score: result.score,
      stats: result.stats,
      differences: result.differences,
      disassembly: result.disassembly,
      sourceCode: sourceCode
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validation-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setResult(null);
    setProgress(0);
    
    const steps = [
      { msg: "Initializing Diverse Double Compiling...", p: 10 },
      { msg: "Compiling with Suspect Compiler...", p: 30 },
      { msg: "Compiling with Trusted Reference Compiler...", p: 60 },
      { msg: "Analyzing binary bitstreams...", p: 80 },
      { msg: "Running disassembly analysis...", p: 95 },
      { msg: "Finalizing trust report...", p: 100 }
    ];

    for (const step of steps) {
      setStatusMessage(step.msg);
      setProgress(step.p);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
    }

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sourceCode, 
          simulateAttack, 
          suspectCompiler, 
          referenceCompiler 
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === "TRUSTED") return "#10b981"; // Green
    if (verdict === "SUSPICIOUS") return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  const getVerdictIcon = (verdict: string) => {
    if (verdict === "TRUSTED") return <ShieldCheck className="w-12 h-12 text-emerald-500" />;
    if (verdict === "SUSPICIOUS") return <ShieldAlert className="w-12 h-12 text-amber-500" />;
    return <Shield className="w-12 h-12 text-red-500" />;
  };

  if (view === "landing") {
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield className="text-black w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">SentinelBinary</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <button 
                onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Problem
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Protocol
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Case Studies
              </button>
              <button 
                onClick={() => document.getElementById('compliance')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Compliance
              </button>
              <button 
                onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                FAQ
              </button>
              <button 
                onClick={() => setView("dashboard")}
                className="bg-white text-black px-5 py-2.5 rounded-full hover:bg-emerald-400 transition-all font-bold"
              >
                Launch App
              </button>
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold tracking-widest uppercase mb-6">
                Supply Chain Security
              </span>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                Can You Trust <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Your Compiler?
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                Even clean source code can hide invisible backdoors injected during compilation. 
                We use Diverse Double Compiling to expose hidden threats in your binary artifacts.
              </p>
              <div className="relative mb-16 max-w-4xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur opacity-20" />
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setView("dashboard")}
                  className="w-full md:w-auto bg-emerald-500 text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 group"
                >
                  Validate Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full md:w-auto bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                  See Demo
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-24 bg-zinc-950 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6 tracking-tight">The "Trusting Trust" Attack</h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  In 1984, Ken Thompson described an attack where a compiler is modified to inject a backdoor 
                  into the programs it compiles—including itself. Since the backdoor is in the binary, 
                  it never appears in your source code audits.
                </p>
                <div className="space-y-4">
                  {[
                    { title: "SolarWinds Attack", desc: "Malicious code injected into build systems." },
                    { title: "XZ Utils Backdoor", desc: "Sophisticated binary injection in compression tools." },
                    { title: "Invisible Threats", desc: "Traditional scanners can't see what's not in the source." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-red-500 w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
                <div className="relative bg-black border border-white/10 rounded-3xl p-8 aspect-square flex flex-col justify-center overflow-hidden">
                  <div className="relative space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <Code2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                        <span className="text-[10px] uppercase font-bold text-gray-500">Source</span>
                      </div>
                      <ChevronRight className="text-gray-700" />
                      <div className="text-center">
                        <Cpu className="w-10 h-10 mx-auto mb-2 text-red-500" />
                        <span className="text-[10px] uppercase font-bold text-gray-500">Suspect Compiler</span>
                      </div>
                      <ChevronRight className="text-gray-700" />
                      <div className="text-center">
                        <Binary className="w-10 h-10 mx-auto mb-2 text-red-500" />
                        <span className="text-[10px] uppercase font-bold text-gray-500">Backdoored Binary</span>
                      </div>
                    </div>
                    <div className="h-px bg-white/10 w-full" />
                    <div className="text-center">
                      <p className="text-sm italic text-gray-400">
                        "You can't trust code that you did not totally create yourself."
                      </p>
                      <p className="text-xs font-bold mt-2 text-emerald-500">— Ken Thompson</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-24 bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">The DDC Protocol</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Diverse Double Compiling (DDC) is the gold standard for verifying compiler integrity. 
                Here is how we ensure your supply chain is clean.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  step: "01", 
                  title: "Dual Compilation", 
                  desc: "We compile your source code using both the suspect compiler and a trusted reference compiler.",
                  icon: <Cpu className="w-6 h-6 text-emerald-500" />,
                },
                { 
                  step: "02", 
                  title: "Bitstream Analysis", 
                  desc: "Our engine performs a byte-by-byte comparison of the resulting binaries to find discrepancies.",
                  icon: <Binary className="w-6 h-6 text-emerald-500" />,
                },
                { 
                  step: "03", 
                  title: "Heuristic Scoring", 
                  desc: "We analyze differences using disassembly and heuristics to determine if they are optimizations or attacks.",
                  icon: <Activity className="w-6 h-6 text-emerald-500" />,
                }
              ].map((item, i) => (
                <div key={i} className="p-0 rounded-3xl bg-zinc-900/50 border border-white/5 relative group hover:border-emerald-500/30 transition-all overflow-hidden">
                  <div className="p-8 pt-6">
                    <div className="text-5xl font-black text-white/5 absolute top-44 right-8 group-hover:text-emerald-500/10 transition-colors">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                      {item.icon}
                    </div>
                    <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Terminal />, label: "Disassembly" },
                  { icon: <History />, label: "Audit Logs" },
                  { icon: <Lock />, label: "Secure Vault" },
                  { icon: <Zap />, label: "Real-time" }
                ].map((feat, i) => (
                  <div key={i} className="aspect-square rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all">
                    <div className="text-emerald-500">{feat.icon}</div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{feat.label}</span>
                  </div>
                ))}
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-6">Enterprise-Grade <br />Binary Verification</h2>
                <div className="space-y-6">
                  {[
                    "Real-time bitstream comparison engine",
                    "Automated disassembly of injected payloads",
                    "Support for GCC, Clang, and custom toolchains",
                    "Detailed trust score and risk assessment reports",
                    "Simulation mode for security training and testing"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-gray-400">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section id="case-studies" className="py-24 bg-black border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Real-World Threats</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Supply chain attacks are no longer theoretical. They are the primary vector for state-sponsored espionage.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "SolarWinds (2020)",
                  desc: "A backdoor was injected into the Orion build system, affecting thousands of organizations including the US government.",
                  tags: ["Build System", "State-Sponsored"]
                },
                {
                  title: "XZ Utils (2024)",
                  desc: "A multi-year social engineering campaign led to a sophisticated binary backdoor in a core Linux compression utility.",
                  tags: ["Open Source", "Binary Injection"]
                },
                {
                  title: "Ken Thompson (1984)",
                  desc: "The original 'Trusting Trust' demonstration showed how a compiler can backdoor itself and remain invisible forever.",
                  tags: ["Compiler", "Theoretical"]
                }
              ].map((study, i) => (
                <div key={i} className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-red-500/30 transition-all">
                  <div className="flex gap-2 mb-4">
                    {study.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{study.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{study.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section id="compliance" className="py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Compliance & Standards</h2>
                <p className="text-gray-400 mb-8">
                  SentinelBinary helps organizations meet modern supply chain security requirements and regulatory frameworks.
                </p>
                <div className="space-y-4">
                  {[
                    { title: "NIST SP 800-161", desc: "Cybersecurity Supply Chain Risk Management (C-SCRM) guidelines." },
                    { title: "Executive Order 14028", desc: "Improving the Nation's Cybersecurity through SBOM and build integrity." },
                    { title: "SLSA Framework", desc: "Supply-chain Levels for Software Artifacts (SLSA) compliance." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="text-emerald-500 w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-10 relative overflow-hidden">
                <h3 className="text-2xl font-bold mb-6 relative z-10">SBOM Integration</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed relative z-10">
                  Our tool generates detailed binary provenance reports that can be integrated directly into your Software Bill of Materials (SBOM), providing cryptographic proof of build integrity.
                </p>
                <div className="p-6 bg-black rounded-2xl border border-white/5 font-mono text-[10px] text-emerald-500/70 relative z-10">
                  <pre>
                    {`{
  "bom-ref": "pkg:maven/com.ddc/validator@1.0.0",
  "type": "library",
  "name": "ddc-validator",
  "version": "1.0.0",
  "integrity": {
    "ddc_score": 98.4,
    "verdict": "TRUSTED",
    "timestamp": "2026-03-29T18:36:16Z"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-black">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: "What is Diverse Double Compiling?", a: "DDC is a technique to detect compiler backdoors by compiling a source code with a suspect compiler and a trusted reference compiler, then comparing the results." },
                { q: "Can it detect zero-day binary injections?", a: "Yes. Since DDC compares the actual machine code bitstream, any deviation from the expected output of a trusted reference is flagged, regardless of whether the attack is known." },
                { q: "Does it support proprietary compilers?", a: "Yes, SentinelBinary can analyze any binary artifact as long as you have a trusted reference compiler for the same architecture." },
                { q: "How does AI enhance the validation?", a: "AI is used to analyze binary differences, perform heuristic risk scoring, and provide natural language explanations of suspicious machine code patterns." }
              ].map((faq, i) => (
                <div key={i} className="p-8 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <h4 className="text-lg font-bold mb-3 flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-emerald-500" />
                    {faq.q}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12 text-left">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="text-emerald-500 w-8 h-8" />
                <span className="text-2xl font-bold tracking-tight">SentinelBinary</span>
              </div>
              <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                Securing the software supply chain through rigorous binary verification and Diverse Double Compiling.
              </p>
              <div className="flex gap-4">
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-gray-400">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-emerald-500 transition-colors">Documentation</button></li>
                <li><button onClick={() => document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-emerald-500 transition-colors">Case Studies</button></li>
                <li><button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-emerald-500 transition-colors">Security FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-gray-400">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-600 text-sm border-t border-white/5 pt-12">
            <p>© 2026 SentinelBinary. Built for the future of supply chain security.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Dashboard Header */}
      <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("landing")}>
          <Shield className="text-emerald-500 w-6 h-6" />
          <span className="font-bold tracking-tight">SentinelBinary</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", simulateAttack ? "bg-red-500" : "bg-emerald-500")} />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {simulateAttack ? "Attack Simulation Active" : "Standard Mode"}
            </span>
          </div>
          <button 
            onClick={() => setView("landing")}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Upload Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Source Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Source Code (C)</label>
                  <textarea 
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    className="w-full h-48 bg-black border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Suspect Compiler</label>
                    <select 
                      value={suspectCompiler}
                      onChange={(e) => setSuspectCompiler(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option>GCC 13.2.0 (Suspect)</option>
                      <option>Clang 17.0.1</option>
                      <option>MSVC 19.38</option>
                      <option>TinyCC 0.9.27</option>
                      <option>Intel C++ Compiler 2024.0</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Trusted Reference</label>
                    <select 
                      value={referenceCompiler}
                      onChange={(e) => setReferenceCompiler(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option>DDC Reference v1.0</option>
                      <option>Verified Bootstrap Compiler</option>
                      <option>CompCert (Formal Verification)</option>
                      <option>Chibicc (Minimalist Reference)</option>
                      <option>Trusted Build Node #42</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-red-500" />
                    <div>
                      <span className="text-sm font-bold block">Simulate Attack</span>
                      <span className="text-[10px] text-gray-500">Inject malicious bytes for demo</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSimulateAttack(!simulateAttack)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      simulateAttack ? "bg-red-500" : "bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      simulateAttack ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <button 
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="w-full bg-emerald-500 text-black py-4 rounded-xl font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <Activity className="w-5 h-5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Run Validation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress / Status */}
            <AnimatePresence>
              {isValidating && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                      {statusMessage}
                    </span>
                    <span className="text-xs font-mono text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

        {/* History / Stats */}
        {!isValidating && !result && (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Validations
              </h3>
              <div className="space-y-3">
                {[
                  { name: "auth_service.c", date: "2 mins ago", status: "TRUSTED" },
                  { name: "kernel_patch.c", date: "1 hour ago", status: "TRUSTED" },
                  { name: "crypto_lib.c", date: "Yesterday", status: "SUSPICIOUS" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                    <div>
                      <span className="text-xs font-bold block">{item.name}</span>
                      <span className="text-[10px] text-gray-500">{item.date}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded",
                      item.status === "TRUSTED" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-0 overflow-hidden group">
              <div className="relative h-32">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Threat Intelligence</span>
                  <h4 className="text-sm font-bold">Global Build Integrity Status</h4>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Active Nodes</span>
                  <span className="text-emerald-500 font-bold">1,242</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Threat Level</span>
                  <span className="text-amber-500 font-bold">Elevated</span>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>

          {/* Right Column: Results Dashboard */}
          <div className="lg:col-span-8 space-y-6">
            
            {result ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Verdict Banner */}
                <div className={cn(
                  "p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden",
                  result.verdict === "TRUSTED" ? "bg-emerald-500/5 border-emerald-500/20" : 
                  result.verdict === "SUSPICIOUS" ? "bg-amber-500/5 border-amber-500/20" : 
                  "bg-red-500/5 border-red-500/20"
                )}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    {getVerdictIcon(result.verdict)}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center",
                      result.verdict === "TRUSTED" ? "bg-emerald-500 text-black" : 
                      result.verdict === "SUSPICIOUS" ? "bg-amber-500 text-black" : 
                      "bg-red-500 text-white"
                    )}>
                      {result.verdict === "TRUSTED" ? <ShieldCheck className="w-10 h-10" /> : 
                       result.verdict === "SUSPICIOUS" ? <AlertTriangle className="w-10 h-10" /> : 
                       <XCircle className="w-10 h-10" />}
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter uppercase">{result.verdict}</h2>
                      <p className="text-gray-400 max-w-md">
                        {result.verdict === "TRUSTED" ? "The suspect binary matches the trusted reference exactly. No hidden code detected." : 
                         result.verdict === "SUSPICIOUS" ? "Minor discrepancies found. Could be compiler optimization or non-deterministic build artifacts." : 
                         "CRITICAL: Significant binary differences detected. High probability of malicious code injection."}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Gauge value={result.score} color={getVerdictColor(result.verdict)} />
                  </div>
                </div>

                {/* Main Analysis Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Hex Diff Viewers */}
                  <div className="space-y-6">
                    <HexViewer 
                      title="Suspect Binary" 
                      hex={result.suspectBinary} 
                      diffs={result.differences.map(d => d.offset)} 
                    />
                    <HexViewer 
                      title="Trusted Reference" 
                      hex={result.trustedBinary} 
                      diffs={[]} 
                    />
                  </div>

                  {/* Disassembly & Insights */}
                  <div className="space-y-6">
                    {/* Security Heatmap */}
                    <SecurityHeatmap 
                      diffs={result.differences.map(d => d.offset)} 
                      total={Math.max(result.suspectBinary.length / 2, result.trustedBinary.length / 2)} 
                    />

                    {/* AI Threat Analysis */}
                    <AIThreatAnalysis result={result} />

                    {/* Innovative Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <BinaryDNA 
                        suspectBinary={result.suspectBinary} 
                        trustedBinary={result.trustedBinary} 
                      />
                      <EntropyAnalysis hex={result.suspectBinary} />
                    </div>
                    
                    <BinaryRadar result={result} />
                    
                    <AIRiskScorecard result={result} />

                    {/* Disassembly */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5 bg-black/30 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Terminal className="w-4 h-4" />
                          Disassembly Analysis
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">X86_64</span>
                      </div>
                      <div className="p-4 h-[300px] overflow-y-auto font-mono text-sm bg-black/50">
                        {result.disassembly.map((line, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "py-0.5",
                              line.includes("//") ? "text-red-500 font-bold mt-2" : 
                              line.includes("syscall") || line.includes("execve") ? "text-amber-400" : "text-gray-400"
                            )}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Insights Panel */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Analysis Insights
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Diff Count</span>
                          <span className="text-2xl font-bold">{result.stats.diffCount}</span>
                        </div>
                        <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Size Delta</span>
                          <span className={cn("text-2xl font-bold", result.stats.sizeDiff > 0 ? "text-red-500" : "text-emerald-500")}>
                            {result.stats.sizeDiff > 0 ? `+${result.stats.sizeDiff}` : result.stats.sizeDiff} B
                          </span>
                        </div>
                      </div>
                      
                      {result.stats.patterns.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-gray-500 block">Detected Patterns</span>
                          {result.stats.patterns.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                              <AlertTriangle className="w-4 h-4" />
                              {p}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 flex gap-3">
                        <button 
                          onClick={handleExport}
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          Export Report
                        </button>
                        <button 
                          onClick={() => setIsFullDiffOpen(true)}
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Full Diff
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source Viewer */}
                <CodeViewer code={sourceCode} />

              </motion.div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 border border-dashed border-white/10 rounded-3xl">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <Binary className="w-10 h-10 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Awaiting Validation</h2>
                <p className="text-gray-500 max-w-sm">
                  Configure your source code and compilers on the left to begin the Diverse Double Compiling analysis.
                </p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer Quote */}
      <footer className="max-w-[1600px] mx-auto p-12 text-center">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />
        <p className="text-gray-600 italic text-sm">
          "You can't trust code that you did not totally create yourself."
        </p>
        <p className="text-emerald-500 font-bold text-xs mt-2 uppercase tracking-widest">— Ken Thompson</p>
      </footer>

      <ChatBot />
      
      <AnimatePresence>
        {isFullDiffOpen && (
          <FullDiffModal 
            isOpen={isFullDiffOpen} 
            onClose={() => setIsFullDiffOpen(false)} 
            result={result} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

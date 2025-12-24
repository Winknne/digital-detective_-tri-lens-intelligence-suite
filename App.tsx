
import React, { useState, useEffect } from 'react';
import { AppState, AnalysisResult } from './types';
import { analyzeNarrative } from './services/geminiService';
import VerdictStamp from './components/VerdictStamp';
import LiveScanner from './components/LiveScanner';

const LensCard: React.FC<{ 
  title: string; 
  status: 'PASS' | 'BREACHED'; 
  children: React.ReactNode 
}> = ({ title, status, children }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[750px] transition-all hover:shadow-md">
    <div className={`px-8 py-5 flex items-center justify-between border-b ${status === 'PASS' ? 'bg-emerald-50/40' : 'bg-rose-50/40'}`}>
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
        status === 'PASS' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white animate-pulse shadow-sm'
      }`}>
        {status === 'PASS' ? 'Reliable' : 'Breached'}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Audit...');

  useEffect(() => {
    let interval: number;
    if (state === AppState.ANALYZING) {
      const msgs = ['Atomizing Claims...', 'Scrubbing Metadata...', 'Cross-referencing Global Data...', 'Calculating Logic Coherence...'];
      let i = 0;
      interval = window.setInterval(() => {
        setLoadingMessage(msgs[i % msgs.length]);
        i++;
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [state]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setState(AppState.ANALYZING);
    try {
      const res = await analyzeNarrative(input);
      setResult(res);
      setState(AppState.RESULT);
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Protocol interrupted.");
      setState(AppState.IDLE);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-slate-700 font-sans antialiased">
      <header className="h-20 bg-white border-b border-slate-100 flex items-center px-10 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-sm shadow-lg shadow-slate-200">
            <i className="fa-solid fa-microscope"></i>
          </div>
          <div>
            <h1 className="font-black text-xs tracking-[0.4em] uppercase text-slate-800">Detective Engine</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Disinformation Audit Suite</p>
          </div>
        </div>
        <button onClick={() => setShowLive(true)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">
          Live Interface
        </button>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 md:p-12">
        {state !== AppState.RESULT ? (
          <div className="max-w-2xl mx-auto mt-20 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Input Narrative Intelligence</h2>
              <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">Submit the target text for exhaustive atomization and real-time truth-grounding.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste the statement or article here for forensic verification..."
                disabled={state === AppState.ANALYZING}
                className="w-full h-80 p-12 text-lg focus:outline-none placeholder-slate-200 leading-relaxed resize-none border-none bg-transparent"
              />
              <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mono">Search Grounding: Active</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={state === AppState.ANALYZING || !input.trim()}
                  className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-4 disabled:bg-slate-200 disabled:shadow-none"
                >
                  {state === AppState.ANALYZING ? (
                    <><i className="fa-solid fa-compass animate-spin"></i> {loadingMessage}</>
                  ) : (
                    "Deploy Protocol"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : result && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Dossier Header */}
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
               {/* Decorative elements */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
              
              <div className="flex-1 space-y-8 relative z-10">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Case ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 leading-relaxed italic max-w-3xl">"{result.summary}"</h2>
                
                <div className="flex gap-16 border-t border-slate-50 pt-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Confidence Level</p>
                    <p className={`text-5xl font-black ${result.score > 70 ? 'text-emerald-500' : 'text-rose-500'}`}>{result.score}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Atomic Evidence Count</p>
                    <p className="text-5xl font-black text-slate-900">{result.lensB_Fact.claims.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col items-center gap-6 relative z-10">
                <VerdictStamp verdict={result.verdict} />
                <button onClick={() => {setState(AppState.IDLE); setInput('');}} className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">New Investigation</button>
              </div>
            </div>

            {/* REAL-TIME GROUNDING LINKS */}
            {result.groundingSources && result.groundingSources.length > 0 && (
              <div className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <i className="fa-solid fa-globe text-blue-500"></i>
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Verified Intelligence Registry (Live Web)</h4>
                </div>
                <div className="flex flex-wrap gap-4">
                  {result.groundingSources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      className="flex items-center gap-3 px-5 py-3 bg-white border border-blue-100 rounded-2xl hover:border-blue-400 transition-all hover:shadow-lg group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-600 truncate max-w-xs">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* THE TRI-LENS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* LENS A */}
              <LensCard title="Lens A: Source Identity" status={result.lensA_Source.status}>
                <div className="space-y-10">
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-3 tracking-widest">Reliability Audit</p>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">{result.lensA_Source.overallRating}</p>
                  </div>
                  <div className="space-y-8">
                    {result.lensA_Source.entities.map((ent, i) => (
                      <div key={i} className="group">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-black text-xs text-slate-800 uppercase tracking-wide">{ent.name}</span>
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                            ent.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>{ent.status}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">"{ent.reason}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </LensCard>

              {/* LENS B */}
              <LensCard title="Lens B: Atomic Fact Check" status={result.lensB_Fact.status}>
                <div className="space-y-10">
                  {result.lensB_Fact.claims.map((claim, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center text-[11px] font-black shrink-0 transition-all ${
                          claim.verdict === 'refuted' ? 'border-rose-500 text-rose-500 bg-rose-50' : 
                          claim.verdict === 'verified' ? 'border-emerald-500 text-emerald-500 bg-emerald-50' : 
                          'border-slate-100 text-slate-300 bg-white'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="w-px h-full bg-slate-100 mt-2 group-last:hidden"></div>
                      </div>
                      <div className="pb-10 space-y-4 flex-1">
                        <h4 className="text-sm font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{claim.text}</h4>
                        <div className={`p-6 rounded-2xl border text-[11px] leading-relaxed font-medium ${
                           claim.verdict === 'refuted' ? 'bg-rose-50/20 border-rose-100 text-rose-700' : 'bg-slate-50/30 border-slate-100 text-slate-500'
                        }`}>
                          {claim.evidence}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </LensCard>

              {/* LENS C */}
              <LensCard title="Lens C: Logic & Emotion" status={result.lensC_Logic.status}>
                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-widest">Sentimental Tone</p>
                      <p className="text-xs font-black text-slate-700">{result.lensC_Logic.emotionalTone}</p>
                    </div>
                    <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-widest">Coherence Score</p>
                      <p className="text-xs font-black text-slate-700">{result.lensC_Logic.reasoningRating}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Logical Anomalies</p>
                    {result.lensC_Logic.fallacies.map((f, i) => (
                      <div key={i} className="p-6 bg-rose-50/50 border-l-4 border-rose-500 rounded-r-2xl">
                        <p className="text-[11px] font-black text-rose-700 uppercase mb-2 tracking-wide">{f.name}</p>
                        <p className="text-[11px] text-rose-600/80 leading-relaxed font-medium">{f.explanation}</p>
                      </div>
                    ))}
                    {result.lensC_Logic.fallacies.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                        <i className="fa-solid fa-check-double text-slate-200 text-3xl mb-4"></i>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Logic: 100% Coherent</p>
                      </div>
                    )}
                  </div>
                </div>
              </LensCard>

            </div>
          </div>
        )}
      </main>

      {showLive && <LiveScanner onClose={() => setShowLive(false)} />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        ::selection { background: #BFDBFE; color: #1E40AF; }
      `}</style>
    </div>
  );
};

export default App;

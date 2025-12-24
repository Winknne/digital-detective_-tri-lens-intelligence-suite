
import React, { useState, useRef, useEffect } from 'react';
import { Message, Suspect } from '../types';
import { getSuspectResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  suspect: Suspect;
  history: Message[];
  onNewMessage: (suspectId: string, message: Message) => void;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ suspect, history, onNewMessage, onBack }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input.trim() };
    onNewMessage(suspect.id, userMessage);
    setInput('');
    setIsLoading(true);

    const responseText = await getSuspectResponse(suspect.systemPrompt, history, userMessage.text);
    const modelMessage: Message = { role: 'model', text: responseText };
    onNewMessage(suspect.id, modelMessage);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 bg-stone-800 border-b border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-stone-700 rounded-full text-stone-400 hover:text-white transition-colors">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="flex items-center gap-3">
            <img src={suspect.image} alt="" className="w-10 h-10 rounded-full object-cover border border-amber-900/50" />
            <div>
              <h4 className="font-bold text-white leading-tight">{suspect.name}</h4>
              <p className="text-xs text-amber-500 font-medium uppercase tracking-tighter">{suspect.role}</p>
            </div>
          </div>
        </div>
        <div className="text-xs text-stone-500 italic hidden sm:block">Interrogation in Progress...</div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"
      >
        {history.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-500 italic">Break the ice. Ask Arthur where he was at midnight...</p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-amber-700 text-white rounded-tr-none' 
                  : 'bg-stone-800 text-stone-200 border border-stone-700 rounded-tl-none'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-800 border border-stone-700 rounded-2xl rounded-tl-none p-4 animate-pulse">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-stone-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-stone-600 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-stone-600 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-stone-900 border-t border-stone-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-700/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-amber-700 hover:bg-amber-600 disabled:bg-stone-800 disabled:text-stone-600 text-white rounded-xl px-6 py-3 font-bold transition-all shadow-lg active:scale-95"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;

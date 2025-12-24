
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { LIVE_SYSTEM_PROMPT } from '../constants';
import { encodeBase64, decodeBase64, decodeAudioData } from '../services/geminiService';

const LiveScanner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let scriptProcessor: ScriptProcessorNode;
    let microphone: MediaStreamAudioSourceNode;
    let mediaStream: MediaStream;

    const startSession = async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            microphone = audioContextRef.current!.createMediaStreamSource(mediaStream);
            scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            microphone.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscript(prev => [...prev.slice(-4), `Hub: ${msg.serverContent?.outputTranscription?.text}`]);
            }
            if (msg.serverContent?.inputTranscription) {
              setTranscript(prev => [...prev.slice(-4), `User: ${msg.serverContent?.inputTranscription?.text}`]);
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              const buffer = await decodeAudioData(decodeBase64(audioData), outputContextRef.current, 24000, 1);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => console.error("Live Error", e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: LIVE_SYSTEM_PROMPT,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }
        }
      });
    };

    startSession();

    return () => {
      mediaStream?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
      outputContextRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-8">
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Live Neural Interface</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full border-4 border-blue-50 flex items-center justify-center transition-all ${isActive ? 'bg-blue-600' : 'bg-slate-100'}`}>
              <i className={`fa-solid fa-microphone-lines text-4xl ${isActive ? 'text-white' : 'text-slate-300'}`}></i>
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-full border border-blue-600/30 animate-[pulse-ring_2s_infinite]"></div>
                  <div className="absolute inset-0 rounded-full border border-blue-600/30 animate-[pulse-ring_2s_infinite_1s]"></div>
                </>
              )}
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-slate-50 rounded-3xl p-6 min-h-[200px] flex flex-col justify-end gap-3">
              {transcript.length === 0 && <p className="text-center text-slate-300 text-sm italic">Listening for neural patterns...</p>}
              {transcript.map((line, i) => (
                <div key={i} className={`text-xs mono ${line.startsWith('User') ? 'text-slate-500' : 'text-blue-600 font-bold'}`}>
                  {line}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold mono uppercase tracking-widest">
                Agent: Charon // Protocol Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScanner;

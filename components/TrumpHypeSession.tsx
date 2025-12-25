
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { TRUMP_SYSTEM_INSTRUCTION } from '../services/geminiService';
import { TranscriptionItem } from '../types';

export const TrumpHypeSession: React.FC<{ onStop: (data: any) => void }> = ({ onStop }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionItem[]>([]);
  const [statusMessage, setStatusMessage] = useState('Ready to Rock');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const startSession = async () => {
    try {
      setRecordedAudioUrl(null);
      chunksRef.current = [];
      setStatusMessage('Connecting to Trump...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      outputAudioContextRef.current = outAudioCtx;

      // Setup Recording Destination
      const dest = outAudioCtx.createMediaStreamDestination();
      destinationRef.current = dest;

      // Connect Mic to recording destination only (avoiding feedback loop to speakers)
      const micSourceForRecording = outAudioCtx.createMediaStreamSource(stream);
      micSourceForRecording.connect(dest);

      // Setup MediaRecorder
      const recorder = new MediaRecorder(dest.stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      };
      recorder.start();
      recorderRef.current = recorder;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session Opened');
            const source = audioCtx.createMediaStreamSource(stream);
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
            setIsActive(true);
            setStatusMessage('Trump is Listening!');
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => [
                ...prev,
                { speaker: 'Trump', text: msg.serverContent!.outputTranscription!.text, timestamp: Date.now() }
              ]);
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && destinationRef.current) {
              const ctx = outputAudioContextRef.current;
              const recDest = destinationRef.current;
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              
              // Play to speakers
              source.connect(ctx.destination);
              // Send to recorder
              source.connect(recDest);
              
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
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => console.log('Session Closed'),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: TRUMP_SYSTEM_INSTRUCTION,
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setStatusMessage('Error starting session');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (recorderRef.current) recorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    
    setIsActive(false);
    setStatusMessage('Session Ended');
    onStop({ transcription });
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-6 bg-slate-800 rounded-3xl shadow-2xl border-4 border-gold-500">
      <div className="relative w-48 h-48 rounded-full overflow-hidden border-8 border-red-600 shadow-lg group">
        <img 
          src="https://picsum.photos/seed/trump/400/400" 
          alt="Trump Hype" 
          className={`w-full h-full object-cover transition-transform duration-500 ${isActive ? 'scale-110 animate-pulse' : 'grayscale'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-red-600/50 to-transparent flex items-end justify-center pb-4">
          <span className="font-bold text-white tracking-widest uppercase">Hype Mode</span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter mb-2">{statusMessage}</h2>
        <p className="text-gray-400 font-medium">Trump is ready to tell the world how great your music is!</p>
      </div>

      <div className="w-full max-w-lg h-64 overflow-y-auto bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-inner custom-scrollbar">
        {transcription.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 italic">
            Trump is waiting for the best rock and roll riffs...
          </div>
        ) : (
          transcription.map((t, idx) => (
            <div key={idx} className={`mb-3 flex ${t.speaker === 'User' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm font-bold shadow-md ${
                t.speaker === 'User' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white border-2 border-yellow-400'
              }`}>
                {t.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col w-full items-center space-y-4">
        {!isActive ? (
          <button 
            onClick={startSession}
            className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-12 rounded-full text-xl shadow-xl transform transition hover:scale-105 active:scale-95 uppercase tracking-widest border-b-4 border-red-900 w-full md:w-auto"
          >
            <i className="fas fa-play mr-2"></i> Start Hype
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="bg-gray-700 hover:bg-gray-800 text-white font-black py-4 px-12 rounded-full text-xl shadow-xl transform transition hover:scale-105 active:scale-95 uppercase tracking-widest border-b-4 border-black w-full md:w-auto"
          >
            <i className="fas fa-stop mr-2"></i> Stop & Generate Album
          </button>
        )}

        {recordedAudioUrl && !isActive && (
          <div className="animate-in fade-in slide-in-from-top-4 flex flex-col items-center space-y-4 w-full">
            <div className="w-full max-w-md bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-lg">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Session Recording</p>
              <audio src={recordedAudioUrl} controls className="w-full" />
            </div>
            <a 
              href={recordedAudioUrl} 
              download="tremendous_rock_hype.webm"
              className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-8 rounded-full text-sm shadow-lg transition-transform hover:scale-105 uppercase tracking-widest flex items-center"
            >
              <i className="fas fa-download mr-2"></i> Download Recording
            </a>
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { AppSection } from './types';
import { TrumpHypeSession } from './components/TrumpHypeSession';
import { AlbumCoverGenerator } from './components/AlbumCoverGenerator';
import { VeoStudio } from './components/VeoStudio';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HYPE_SESSION);
  const [sessionContext, setSessionContext] = useState<any>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      setHasApiKey(true); // Fallback for local testing if env var exists
    }
  };

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const onHypeStop = (data: any) => {
    setSessionContext(data);
    setCurrentSection(AppSection.ALBUM_GENERATOR);
  };

  if (!hasApiKey && (currentSection === AppSection.VEO_STUDIO || currentSection === AppSection.ALBUM_GENERATOR)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-black text-red-500 mb-4 uppercase">API Key Required</h1>
        <p className="text-gray-400 mb-8 max-w-md">For high-quality image and video generation, you must select a paid Google Cloud Project API Key.</p>
        <button 
          onClick={handleOpenSelectKey}
          className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-12 rounded-full text-xl shadow-xl transition-transform hover:scale-105"
        >
          Select Tremendous Key
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-6 text-blue-500 hover:underline">Learn about billing</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b-4 border-red-600 shadow-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl italic">T</div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Rock <span className="text-red-500">Hype</span></h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => setCurrentSection(AppSection.HYPE_SESSION)}
            className={`font-black uppercase tracking-widest text-sm transition-colors ${currentSection === AppSection.HYPE_SESSION ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}
          >
            Live Hype
          </button>
          <button 
            onClick={() => setCurrentSection(AppSection.VEO_STUDIO)}
            className={`font-black uppercase tracking-widest text-sm transition-colors ${currentSection === AppSection.VEO_STUDIO ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}
          >
            Veo Studio
          </button>
          {sessionContext && (
            <button 
              onClick={() => setCurrentSection(AppSection.ALBUM_GENERATOR)}
              className={`font-black uppercase tracking-widest text-sm transition-colors ${currentSection === AppSection.ALBUM_GENERATOR ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}
            >
              Album Gen
            </button>
          )}
        </div>

        <button 
          className="md:hidden text-white text-2xl"
          onClick={() => {}} // Mobile menu toggle logic
        >
          <i className="fas fa-bars"></i>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {currentSection === AppSection.HYPE_SESSION && (
            <div className="animate-in slide-in-from-bottom-10 duration-700">
               <TrumpHypeSession onStop={onHypeStop} />
            </div>
          )}

          {currentSection === AppSection.ALBUM_GENERATOR && (
            <div className="animate-in zoom-in-95 duration-700">
              <AlbumCoverGenerator context={sessionContext} />
            </div>
          )}

          {currentSection === AppSection.VEO_STUDIO && (
            <div className="animate-in fade-in duration-700">
              <VeoStudio />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6 border-t border-slate-800 text-center">
        <p className="text-slate-600 font-bold uppercase tracking-[0.2em] mb-4">Make Rock Great Again</p>
        <div className="flex justify-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-blue-600"></div>
          <div className="w-8 h-8 rounded-full bg-white"></div>
          <div className="w-8 h-8 rounded-full bg-red-600"></div>
        </div>
      </footer>
    </div>
  );
};

export default App;

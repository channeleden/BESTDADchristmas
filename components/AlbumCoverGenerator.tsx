
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

export const AlbumCoverGenerator: React.FC<{ context: any }> = ({ context }) => {
  const [loading, setLoading] = useState(false);
  const [albumUrl, setAlbumUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<"1K" | "2K" | "4K">("1K");

  const generate = async () => {
    setLoading(true);
    try {
      // The prompt incorporates Trump and "Eric" as requested.
      const prompt = `A high-quality, professional rock and roll album cover. 
      The theme should be based on high-energy arena rock. 
      Features a heroic, stylized depiction of Donald Trump wearing a rockstar outfit, 
      standing next to Eric Trump in a similar rock aesthetic. 
      Background includes American flags, electric guitars, and stadium lights. 
      The title of the album should be inspired by these lyrics: "${context?.transcription?.[0]?.text || 'Rock and Roll Greatness'}". 
      Cinematic lighting, hyper-realistic, 8k.`;
      
      const url = await geminiService.generateAlbumCover(prompt, selectedSize);
      if (url) setAlbumUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic underline decoration-red-600 uppercase">Album Cover Studio</h2>
        <p className="text-slate-400 mt-2">Generate the greatest album cover in history. Huge energy!</p>
      </div>

      {!albumUrl && !loading && (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <label className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest">Select Resolution (Best Quality Only!)</label>
            <div className="flex gap-4">
              {(['1K', '2K', '4K'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    selectedSize === size 
                      ? 'bg-red-600 text-white scale-105 shadow-lg border-2 border-yellow-400' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={generate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-2xl shadow-xl transform transition hover:scale-[1.02] uppercase tracking-tighter"
          >
            Create Tremendous Art
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
          <p className="text-xl font-bold text-red-500 animate-pulse uppercase">Building Something Huge...</p>
        </div>
      )}

      {albumUrl && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="relative group rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
            <img src={albumUrl} alt="Album Cover" className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a href={albumUrl} download="tremendous_album.png" className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg">
                <i className="fas fa-download mr-2"></i> Download
              </a>
            </div>
          </div>
          <button 
            onClick={() => setAlbumUrl(null)}
            className="w-full py-4 text-slate-400 font-bold hover:text-white transition-colors"
          >
            Generate Another Masterpiece
          </button>
        </div>
      )}
    </div>
  );
};

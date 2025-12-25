
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { blobToBase64 } from '../utils/audioUtils';

export const VeoStudio: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImageFile(e.target.files[0]);
  };

  const generate = async () => {
    if (!prompt) return alert('Enter a prompt!');
    setLoading(true);
    try {
      let base64Image;
      if (imageFile) {
        base64Image = await blobToBase64(imageFile);
      }
      const url = await geminiService.generateVeoVideo(prompt, aspectRatio, base64Image);
      if (url) setVideoUrl(url);
    } catch (err) {
      console.error(err);
      alert('Video generation failed. Ensure your billing is enabled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl font-black text-red-500 uppercase tracking-tighter italic">Veo Video Studio</h2>
        <p className="text-slate-400">Cinematic motion, tremendously fast.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Visual Prompt</label>
          <textarea 
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none"
            placeholder="Describe the cinematic action..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Aspect Ratio</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
            >
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Animate Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center space-y-4">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-500"></div>
             <p className="text-red-500 font-bold uppercase animate-pulse">Rendering Greatness...</p>
          </div>
        ) : (
          <button 
            onClick={generate}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-[1.01]"
          >
            Generate Video
          </button>
        )}
      </div>

      {videoUrl && (
        <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800">
          <video src={videoUrl} controls className="w-full h-auto" autoPlay loop />
        </div>
      )}
    </div>
  );
};

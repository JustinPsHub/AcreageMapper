import React, { useState, useEffect } from 'react';

interface CalibrationDialogProps {
  isOpen: boolean;
  onConfirm: (distance: number) => void;
  onCancel: () => void;
  pixelDistance: number;
}

const CalibrationDialog: React.FC<CalibrationDialogProps> = ({ isOpen, onConfirm, onCancel, pixelDistance }) => {
  const [distance, setDistance] = useState<string>('');

  useEffect(() => {
    if(isOpen) setDistance('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(distance);
    if (!isNaN(val) && val > 0) {
      onConfirm(val);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm transform transition-all scale-100 ring-1 ring-white/10">
        <h3 className="text-xl font-bold text-white mb-2">Calibrate Scale</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You drew a line of <strong className="text-sky-400">{pixelDistance.toFixed(1)} pixels</strong>. 
          <br/>
          What is the real-world distance in feet?
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-8 relative group">
            <input 
              type="number" 
              autoFocus
              step="any"
              value={distance} 
              onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g. 100"
              className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-sky-500/50 focus:bg-white/5 outline-none text-xl font-medium transition-all placeholder-slate-600"
            />
            <span className="absolute right-5 top-5 text-slate-500 font-medium text-sm group-focus-within:text-sky-500 transition-colors">ft</span>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!distance || parseFloat(distance) <= 0}
              className="px-8 py-3 rounded-xl bg-sky-500 text-white hover:bg-sky-400 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 active:scale-95 text-sm"
            >
              Set Scale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalibrationDialog;
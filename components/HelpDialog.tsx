import React from 'react';
import { X } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="glass-panel w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl ring-1 ring-white/10">
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight">Help & Controls</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <section>
            <h3 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-4">Mouse & Touch</h3>
            <div className="grid grid-cols-1 gap-3">
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-200 text-sm font-medium">Draw / Select</span>
                  <span className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Left Click</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-200 text-sm font-medium">Finish Shape</span>
                  <span className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Right Click</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-200 text-sm font-medium">Zoom</span>
                  <span className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Scroll / Pinch</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-slate-200 text-sm font-medium">Pan Map</span>
                  <span className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Drag / Middle Click</span>
               </div>
            </div>
          </section>
          <section>
            <h3 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-4">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <span className="text-slate-200 text-sm font-medium">Delete</span>
                 <kbd className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Del</kbd>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <span className="text-slate-200 text-sm font-medium">Cancel</span>
                 <kbd className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <span className="text-slate-200 text-sm font-medium">Undo</span>
                 <kbd className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Ctrl+Z</kbd>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <span className="text-slate-200 text-sm font-medium">Save</span>
                 <kbd className="text-xs text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">Ctrl+S</kbd>
              </div>
            </div>
          </section>
          <section>
            <h3 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-4">Quick Start</h3>
             <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-sky-400 font-bold border border-white/10 text-sm">1</div>
                    <p className="text-sm text-slate-300 pt-1.5">Upload a map image or screenshot of your property.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-sky-400 font-bold border border-white/10 text-sm">2</div>
                    <div className="text-sm text-slate-300 pt-1.5">
                        Select the <span className="text-white font-semibold">Scale</span> tool. Draw a line over a known distance (e.g., a 10ft gate) and enter "10".
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-sky-400 font-bold border border-white/10 text-sm">3</div>
                    <p className="text-sm text-slate-300 pt-1.5">Draw Zones (Polygons) for acres and Fences (Polylines) for length.</p>
                 </div>
             </div>
          </section>
        </div>
        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpDialog;
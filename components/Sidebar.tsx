import React from 'react';
import { MapObject, MapObjectType } from '../types';
import { Trash2, Eye, EyeOff, Layers, MousePointer2 } from 'lucide-react';

interface SidebarProps {
  objects: MapObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MapObject>) => void;
  onDelete: (id: string) => void;
  isCalibrated: boolean;
  pixelsPerFoot: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  objects, selectedId, onSelect, onUpdate, onDelete, isCalibrated, pixelsPerFoot 
}) => {
  const selectedObject = objects.find(o => o.id === selectedId);

  return (
    <div className="absolute top-6 left-6 bottom-6 w-80 z-20 flex flex-col pointer-events-none">
      <div className="flex-1 bg-black/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden pointer-events-auto transition-all duration-300">
        <div className="p-5 border-b border-white/5 bg-white/5">
          <h1 className="text-lg font-bold text-white flex items-center tracking-tight">
            <Layers className="mr-3 text-sky-400" size={20}/> 
            Acreage Mapper
          </h1>
          <div className={`text-[11px] font-semibold mt-2 px-3 py-1 rounded-full inline-flex items-center gap-2 ${isCalibrated ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isCalibrated ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
            {isCalibrated ? `Scale: 1 ft = ${(pixelsPerFoot).toFixed(3)} px` : 'Scale Not Calibrated'}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layers</h2>
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400">{objects.length}</span>
          </div>
          {objects.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 border border-dashed border-white/10 rounded-2xl bg-white/5 mx-1">
              <MousePointer2 size={24} className="mb-2 opacity-50"/>
              <p className="text-xs font-medium">No objects drawn</p>
            </div>
          )}
          {objects.map(obj => (
            <div 
              key={obj.id}
              onClick={() => onSelect(obj.id)}
              className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 border ${
                selectedId === obj.id 
                  ? 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center overflow-hidden gap-3">
                <div 
                  className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-transform duration-300 ${selectedId === obj.id ? 'scale-110 ring-2 ring-sky-500/30' : ''}`}
                  style={{ backgroundColor: obj.color }}
                />
                <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-medium truncate transition-colors ${selectedId === obj.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {obj.name}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                      {obj.type === 'POLYGON' ? 'Zone' : obj.type === 'POLYLINE' ? 'Fence' : 'Point'}
                    </span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdate(obj.id, { visible: !obj.visible }); }}
                className={`p-2 rounded-xl transition-all ${
                  obj.visible 
                    ? 'text-slate-500 hover:text-white hover:bg-white/10' 
                    : 'text-slate-600 bg-black/20'
                }`}
              >
                {obj.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
        </div>
        {selectedObject && (
          <div className="p-5 border-t border-white/10 bg-black/20 backdrop-blur-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Properties</h2>
              <button 
                onClick={() => onDelete(selectedObject.id)}
                className="text-red-400 hover:text-white p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete Object"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase">Name</label>
                <input 
                  type="text" 
                  value={selectedObject.name} 
                  onChange={(e) => onUpdate(selectedObject.id, { name: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:bg-white/5 outline-none transition-all placeholder-slate-600 font-medium"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase">Color</label>
                  <div className="relative w-full h-10 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors bg-black/20">
                      <input 
                      type="color" 
                      value={selectedObject.color} 
                      onChange={(e) => onUpdate(selectedObject.id, { color: e.target.value })}
                      className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 border-0"
                      />
                  </div>
                </div>
                <div className="flex-1">
                   <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase">Opacity</label>
                   <input 
                    type="number" 
                    min="0" max="1" step="0.1"
                    value={selectedObject.opacity} 
                    onChange={(e) => onUpdate(selectedObject.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:bg-white/5 outline-none font-medium"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-2">
                 {selectedObject.type === 'POLYGON' && (
                   <>
                     <div className="flex justify-between text-sm items-center p-2.5 bg-black/20 rounded-xl border border-white/5">
                        <span className="text-slate-400 text-xs">Area (sq ft)</span>
                        <span className="text-white font-mono font-medium">{selectedObject.areaSqFt?.toLocaleString() ?? '-'}</span>
                     </div>
                     <div className="flex justify-between text-sm items-center p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <span className="text-emerald-400/80 font-medium text-xs">Acres</span>
                        <span className="text-emerald-400 font-mono font-bold">{selectedObject.areaAcres?.toLocaleString(undefined, { maximumFractionDigits: 3 }) ?? '-'}</span>
                     </div>
                   </>
                 )}
                 {(selectedObject.type === 'POLYLINE' || selectedObject.type === 'POLYGON') && (
                   <div className="flex justify-between text-sm items-center p-2.5 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-slate-400 text-xs">Length (ft)</span>
                      <span className="text-white font-mono font-medium">{selectedObject.lengthFt?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '-'}</span>
                   </div>
                 )}
                 {selectedObject.type === 'POINT' && (
                   <div className="text-xs text-slate-500 italic text-center py-2">Location marker</div>
                 )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
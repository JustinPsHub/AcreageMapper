
import React, { useState } from 'react';
import { MapObject, MapObjectType, Material } from '../types';
import { Trash2, Eye, EyeOff, Layers, MousePointer2, ChevronDown, ChevronUp, DollarSign, ScrollText, Waves } from 'lucide-react';

interface SidebarProps {
  objects: MapObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MapObject>) => void;
  onDelete: (id: string) => void;
  isCalibrated: boolean;
  pixelsPerFoot: number;
  materials: Material[];
  onOpenMaterials: () => void;
  onExportBOM: () => void;
  showWaterFlow: boolean;
  onToggleWaterFlow: (show: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  objects, selectedId, onSelect, onUpdate, onDelete, isCalibrated, pixelsPerFoot,
  materials, onOpenMaterials, onExportBOM, showWaterFlow, onToggleWaterFlow
}) => {
  const selectedObject = objects.find(o => o.id === selectedId);
  const [showCostSummary, setShowCostSummary] = useState(true);

  // Calculate Totals
  const totalCost = objects.reduce((sum, obj) => sum + (obj.totalCost || 0), 0);
  const totalAcres = objects.filter(o => o.type === MapObjectType.POLYGON).reduce((sum, o) => sum + (o.areaAcres || 0), 0);
  const totalFenceFt = objects.filter(o => o.type === MapObjectType.POLYLINE).reduce((sum, o) => sum + (o.lengthFt || 0), 0);

  const handleMaterialChange = (objId: string, matId: string) => {
    if (matId === '') {
      onUpdate(objId, { materialId: undefined, unitCost: 0 });
      return;
    }
    const mat = materials.find(m => m.id === matId);
    if (mat) {
      onUpdate(objId, { 
        materialId: mat.id, 
        unitCost: mat.unitCost,
        color: mat.color 
      });
    }
  };

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

        {/* Object List */}
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
                      {obj.type === MapObjectType.POLYGON ? 'Zone' : 
                       obj.type === MapObjectType.POLYLINE ? 'Fence' : 
                       obj.type === MapObjectType.SLOPE ? 'Slope' : 'Point'}
                      {obj.totalCost ? ` • $${obj.totalCost.toLocaleString()}` : ''}
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

        {/* Project Summary */}
        <div className="px-4 pb-2">
            <button 
                onClick={() => setShowCostSummary(!showCostSummary)}
                className="w-full flex items-center justify-between p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
            >
                <span>Project Budget & Analysis</span>
                {showCostSummary ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
            </button>
            {showCostSummary && (
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 space-y-2 mb-2">
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Est. Total</span>
                        <span className="text-emerald-400 font-bold font-mono">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                     </div>
                     <div className="w-full h-px bg-white/10"></div>
                     <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Total Acres</span>
                        <span>{totalAcres.toLocaleString(undefined, { maximumFractionDigits: 2 })} ac</span>
                     </div>
                     <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Total Fence</span>
                        <span>{totalFenceFt.toLocaleString(undefined, { maximumFractionDigits: 0 })} ft</span>
                     </div>
                     
                     <div className="w-full h-px bg-white/10"></div>
                     <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                             <Waves size={12} className="text-blue-400"/> Water Flow Viz
                        </span>
                        <button 
                           onClick={() => onToggleWaterFlow(!showWaterFlow)}
                           className={`w-8 h-4 rounded-full transition-colors relative ${showWaterFlow ? 'bg-blue-500' : 'bg-slate-700'}`}
                        >
                            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${showWaterFlow ? 'left-4.5' : 'left-0.5'}`}></span>
                        </button>
                     </div>

                     <button 
                        onClick={onExportBOM}
                        className="w-full mt-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                     >
                        <ScrollText size={14}/> Shopping List
                     </button>
                </div>
            )}
        </div>

        {/* Selected Object Properties */}
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

              {/* Material Preset Selector - Hide for Slope */}
              {selectedObject.type !== MapObjectType.SLOPE && (
              <div>
                 <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase">Material Preset</label>
                    <button onClick={onOpenMaterials} className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">Manage</button>
                 </div>
                 <select
                    value={selectedObject.materialId || ''}
                    onChange={(e) => handleMaterialChange(selectedObject.id, e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-sky-500/50 outline-none appearance-none"
                 >
                    <option value="">Custom / None</option>
                    {materials
                      .filter(m => {
                          if (selectedObject.type === MapObjectType.POLYLINE) return m.type === 'linear';
                          if (selectedObject.type === MapObjectType.POLYGON) return m.type === 'area';
                          return m.type === 'item';
                      })
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.name} (${m.unitCost})</option>
                    ))}
                 </select>
              </div>
              )}
              
              {/* Cost Estimator Input - Hide for Slope */}
              {selectedObject.type !== MapObjectType.SLOPE && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase flex items-center justify-between">
                    <span>
                        {selectedObject.type === MapObjectType.POLYGON ? 'Cost per Acre' : 
                         selectedObject.type === MapObjectType.POLYLINE ? 'Cost per Ft' : 'Item Cost'}
                    </span>
                    <DollarSign size={10} className="text-emerald-500"/>
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
                    <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedObject.unitCost || ''} 
                    placeholder="0.00"
                    onChange={(e) => onUpdate(selectedObject.id, { unitCost: parseFloat(e.target.value), materialId: undefined })} // Clear preset if manual override
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-6 pr-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:bg-white/5 outline-none font-mono"
                    />
                </div>
              </div>
              )}

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
                 {selectedObject.type === MapObjectType.POLYGON && (
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
                 {(selectedObject.type === MapObjectType.POLYLINE || selectedObject.type === MapObjectType.POLYGON) && (
                   <div className="flex justify-between text-sm items-center p-2.5 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-slate-400 text-xs">Length (ft)</span>
                      <span className="text-white font-mono font-medium">{selectedObject.lengthFt?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '-'}</span>
                   </div>
                 )}
                 
                 {/* Total Cost Display for Object */}
                 {selectedObject.totalCost ? (
                     <div className="flex justify-between text-sm items-center p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                        <span className="text-sky-400/80 font-medium text-xs">Est. Cost</span>
                        <span className="text-sky-400 font-mono font-bold">${selectedObject.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                     </div>
                 ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

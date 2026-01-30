
import React, { useState } from 'react';
import { Material } from '../types';
import { Plus, Trash2, X } from 'lucide-react';

interface MaterialManagerProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  setMaterials: (m: Material[]) => void;
}

const MaterialManager: React.FC<MaterialManagerProps> = ({ isOpen, onClose, materials, setMaterials }) => {
  const [newMat, setNewMat] = useState<Partial<Material>>({
    name: '',
    type: 'linear',
    unitCost: 0,
    color: '#ffffff'
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newMat.name) return;
    const mat: Material = {
      id: Date.now().toString(),
      name: newMat.name,
      type: newMat.type as 'linear' | 'area' | 'item',
      unitCost: Number(newMat.unitCost),
      color: newMat.color || '#ffffff'
    };
    setMaterials([...materials, mat]);
    setNewMat({ name: '', type: 'linear', unitCost: 0, color: '#ffffff' });
  };

  const handleDelete = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-2xl rounded-3xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Materials Library</h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Add New */}
          <div className="grid grid-cols-12 gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5 items-end">
            <div className="col-span-4">
              <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Name</label>
              <input 
                value={newMat.name}
                onChange={e => setNewMat({...newMat, name: e.target.value})}
                placeholder="e.g. Woven Wire"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
              />
            </div>
            <div className="col-span-3">
              <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Type</label>
              <select 
                value={newMat.type}
                onChange={e => setNewMat({...newMat, type: e.target.value as any})}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
              >
                <option value="linear">Linear (Fence)</option>
                <option value="area">Area (Seed/Fert)</option>
                <option value="item">Item (Gate/Post)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Cost ($)</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={newMat.unitCost}
                onChange={e => setNewMat({...newMat, unitCost: parseFloat(e.target.value)})}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
              />
            </div>
             <div className="col-span-1">
              <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Color</label>
              <input 
                type="color"
                value={newMat.color}
                onChange={e => setNewMat({...newMat, color: e.target.value})}
                className="w-full h-[38px] bg-black/30 border border-white/10 rounded-lg cursor-pointer p-0"
              />
            </div>
            <div className="col-span-2">
              <button 
                onClick={handleAdd}
                className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <Plus size={16}/> Add
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            {materials.map(m => (
              <div key={m.id} className="grid grid-cols-12 gap-3 items-center p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-colors group">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: m.color}}></div>
                  <span className="text-sm font-medium text-slate-200">{m.name}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-black/30 text-slate-400 border border-white/5">
                    {m.type === 'linear' ? 'Per Foot' : m.type === 'area' ? 'Per Acre' : 'Per Item'}
                  </span>
                </div>
                <div className="col-span-4 font-mono text-sm text-emerald-400">
                  ${m.unitCost.toFixed(2)}
                </div>
                <div className="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(m.id)} className="text-slate-500 hover:text-red-400">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
            {materials.length === 0 && (
              <p className="text-center text-slate-500 py-8 italic text-sm">No materials defined.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialManager;

import React from 'react';
import { MapObject, MapObjectType } from '../types';
import { Trash2, Eye, EyeOff, Layers } from 'lucide-react';

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
    <div className="absolute top-4 left-4 bottom-4 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col z-20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h1 className="text-lg font-bold text-white flex items-center">
          <Layers className="mr-2" size={20}/> Acreage Mapper
        </h1>
        <div className={`text-xs mt-1 ${isCalibrated ? 'text-green-400' : 'text-yellow-500'}`}>
          {isCalibrated ? `Scale: 1 ft = ${(pixelsPerFoot).toFixed(4)} px` : '⚠ Map not calibrated'}
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2">Layers</h2>
        {objects.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">No objects drawn yet.</div>
        )}
        {objects.map(obj => (
          <div 
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              selectedId === obj.id ? 'bg-blue-900 border border-blue-700' : 'bg-gray-700 hover:bg-gray-600 border border-transparent'
            }`}
          >
            <div className="flex items-center overflow-hidden">
              <div 
                className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                style={{ backgroundColor: obj.color }}
              />
              <span className="text-sm text-white truncate">{obj.name}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdate(obj.id, { visible: !obj.visible }); }}
              className="text-gray-400 hover:text-white p-1"
            >
              {obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        ))}
      </div>

      {/* Properties Panel */}
      {selectedObject && (
        <div className="p-4 border-t border-gray-700 bg-gray-750">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-white">Properties</h2>
            <button 
              onClick={() => onDelete(selectedObject.id)}
              className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/30 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input 
                type="text" 
                value={selectedObject.name} 
                onChange={(e) => onUpdate(selectedObject.id, { name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Color</label>
                <input 
                  type="color" 
                  value={selectedObject.color} 
                  onChange={(e) => onUpdate(selectedObject.id, { color: e.target.value })}
                  className="w-full h-8 bg-gray-900 border border-gray-600 rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                 <label className="block text-xs text-gray-400 mb-1">Opacity</label>
                 <input 
                  type="number" 
                  min="0" max="1" step="0.1"
                  value={selectedObject.opacity} 
                  onChange={(e) => onUpdate(selectedObject.id, { opacity: parseFloat(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                />
              </div>
            </div>

            {/* Computed Metrics */}
            <div className="mt-4 pt-4 border-t border-gray-600">
               {selectedObject.type === MapObjectType.POLYGON && (
                 <>
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Area (sq ft):</span>
                      <span className="text-white font-mono">{selectedObject.areaSqFt?.toLocaleString() ?? '-'}</span>
                   </div>
                   <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Acres:</span>
                      <span className="text-green-400 font-mono font-bold">{selectedObject.areaAcres?.toLocaleString(undefined, { maximumFractionDigits: 3 }) ?? '-'}</span>
                   </div>
                 </>
               )}
               {(selectedObject.type === MapObjectType.POLYLINE || selectedObject.type === MapObjectType.POLYGON) && (
                 <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Length (ft):</span>
                    <span className="text-white font-mono">{selectedObject.lengthFt?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '-'}</span>
                 </div>
               )}
               {selectedObject.type === MapObjectType.POINT && (
                 <div className="text-xs text-gray-500 italic text-center">Location marker</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
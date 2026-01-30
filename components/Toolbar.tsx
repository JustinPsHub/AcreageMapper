import React from 'react';
import { MousePointer2, Move, Hexagon, Activity, MapPin, Ruler, Download, Upload, Image as ImageIcon } from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onSave: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onSelectTool, onSave, onLoad, onImageUpload }) => {
  
  const tools = [
    { id: ToolType.SELECT, icon: MousePointer2, label: 'Select' },
    { id: ToolType.PAN, icon: Move, label: 'Pan' },
    { id: ToolType.DRAW_POLYGON, icon: Hexagon, label: 'Zone' },
    { id: ToolType.DRAW_POLYLINE, icon: Activity, label: 'Fence' },
    { id: ToolType.DRAW_POINT, icon: MapPin, label: 'Point' },
    { id: ToolType.CALIBRATE, icon: Ruler, label: 'Scale' },
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-2 flex items-center space-x-2 z-20">
      <div className="flex space-x-1 mr-4 border-r border-gray-600 pr-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`p-2 rounded transition-colors flex flex-col items-center group relative ${
              activeTool === tool.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title={tool.label}
          >
            <tool.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="flex space-x-2">
        <label className="p-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors" title="Upload Map Image">
            <ImageIcon size={20} />
            <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
        </label>
        
        <button onClick={onSave} className="p-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Save Project">
          <Download size={20} />
        </button>
        
        <label className="p-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors" title="Load Project">
            <Upload size={20} />
            <input type="file" accept=".json" onChange={onLoad} className="hidden" />
        </label>
      </div>
    </div>
  );
};

export default Toolbar;
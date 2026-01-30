
import React, { useState } from 'react';
import { MousePointer2, Move, Hexagon, Activity, MapPin, Ruler, Download, Upload, Image as ImageIcon, HelpCircle, FlaskConical, FileJson, Sun, Package, Globe, TrendingDown } from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onSave: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleHelp: () => void;
  onLoadDemoProject: () => void;
  onLoadSampleMap: () => void;
  onOpenMaterials: () => void;
  onOpenOSM: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, onSelectTool, onSave, onLoad, onImageUpload, onToggleHelp,
  onLoadDemoProject, onLoadSampleMap, onOpenMaterials, onOpenOSM
}) => {
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  
  const tools = [
    { id: ToolType.SELECT, icon: MousePointer2, label: 'Select' },
    { id: ToolType.PAN, icon: Move, label: 'Pan' },
  ];

  const drawTools = [
    { id: ToolType.DRAW_POLYGON, icon: Hexagon, label: 'Zone' },
    { id: ToolType.DRAW_POLYLINE, icon: Activity, label: 'Fence' },
    { id: ToolType.DRAW_POINT, icon: MapPin, label: 'Point' },
    { id: ToolType.DRAW_SLOPE, icon: TrendingDown, label: 'Slope' },
  ];

  const ToolButton = ({ tool }: { tool: { id: ToolType, icon: any, label: string } }) => (
    <button
      onClick={() => onSelectTool(tool.id)}
      className={`relative p-2 rounded-full transition-all duration-300 flex items-center justify-center group
        ${activeTool === tool.id 
          ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)] ring-1 ring-sky-400' 
          : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
    >
      <tool.icon size={20} strokeWidth={activeTool === tool.id ? 2.5 : 2} />
      <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
        {tool.label}
      </span>
    </button>
  );

  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-black/20">
        <div className="flex gap-1 pl-1">
          {tools.map(tool => <ToolButton key={tool.id} tool={tool} />)}
        </div>
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        <div className="flex gap-1">
          {drawTools.map(tool => <ToolButton key={tool.id} tool={tool} />)}
        </div>
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        <div className="flex gap-1 items-center pr-1">
            <ToolButton tool={{ id: ToolType.SUN_ANALYSIS, icon: Sun, label: 'Solar' }} />
            <button onClick={onOpenMaterials} className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors group">
                <Package size={20} />
                <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
                    Materials
                </span>
            </button>
            <ToolButton tool={{ id: ToolType.CALIBRATE, icon: Ruler, label: 'Scale' }} />
            
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            
            <button onClick={onOpenOSM} className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors group">
                <Globe size={20} />
                <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
                    Web Map Import
                </span>
            </button>

            <label className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors group">
                <ImageIcon size={20} />
                <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
                 <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
                    Upload File
                </span>
            </label>
            
            <div className="relative">
                <button 
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className={`p-2 rounded-full transition-colors group ${showDemoMenu ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <FlaskConical size={20} />
                  <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
                        Demos
                    </span>
                </button>
                
                {showDemoMenu && (
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl p-1 flex flex-col gap-1 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => { onLoadSampleMap(); setShowDemoMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                    >
                      <ImageIcon size={14} className="text-sky-400"/>
                      Sample Map Only
                    </button>
                    <button 
                      onClick={() => { onLoadDemoProject(); setShowDemoMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                    >
                      <FileJson size={14} className="text-emerald-400"/>
                      Full Demo Project
                    </button>
                  </div>
                )}
            </div>

            <button onClick={onSave} className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors group">
              <Download size={20} />
               <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
                    Save (Ctrl+S)
                </span>
            </button>
            <label className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors group">
                <Upload size={20} />
                <input type="file" accept=".json" onChange={onLoad} className="hidden" />
                 <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
                    Load Project
                </span>
            </label>
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            <button onClick={onToggleHelp} className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors group">
              <HelpCircle size={20} />
               <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 border border-white/10 backdrop-blur-md">
                    Help
                </span>
            </button>
        </div>
      </div>
      {showDemoMenu && <div className="fixed inset-0 z-40" onClick={() => setShowDemoMenu(false)}></div>}
    </div>
  );
};

export default Toolbar;

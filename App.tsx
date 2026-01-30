
import React, { useState, useEffect } from 'react';
import MapCanvas from './components/MapCanvas';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import CalibrationDialog from './components/CalibrationDialog';
import HelpDialog from './components/HelpDialog';
import MaterialManager from './components/MaterialManager';
import OSMDialog from './components/OSMDialog';
import { MapObject, ToolType, CalibrationData, ProjectState, Coordinate, MapObjectType, Material, SunConfig } from './types';
import { calculatePolygonArea, calculatePolylineLength } from './utils/geometry';

const App: React.FC = () => {
  const [history, setHistory] = useState<MapObject[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const objects = history[historyIndex];
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.PAN);
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isOSMDialogOpen, setIsOSMDialogOpen] = useState(false);
  const [showWaterFlow, setShowWaterFlow] = useState(false);
  
  // Sun State
  const [sunConfig, setSunConfig] = useState<SunConfig>({
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      latitude: 40.0, // Default to ~Middle US
      objectHeightFt: 15
  });

  const [calibration, setCalibration] = useState<CalibrationData>({
    isCalibrated: false,
    pixelsPerFoot: 1,
    point1: null,
    point2: null,
    distanceFt: 0
  });
  const [isCalibDialogOpen, setIsCalibDialogOpen] = useState(false);
  const [pendingCalibPixelDist, setPendingCalibPixelDist] = useState(0);

  // Auto-Save: Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('acreage_mapper_autosave');
    if (saved) {
      try {
        const state = JSON.parse(saved) as ProjectState;
        if (state.objects) setHistory([state.objects]);
        if (state.calibration) setCalibration(state.calibration);
        if (state.backgroundImageSrc) setBackgroundImageSrc(state.backgroundImageSrc);
        if (state.materials) setMaterials(state.materials);
      } catch (e) {
        console.error("Failed to load autosave", e);
      }
    }
  }, []);

  // Calculate Metrics and Cost
  const objectsWithMetrics = objects.map(obj => {
     let updated = { ...obj };
     
     if (calibration.isCalibrated) {
        const ppf = calibration.pixelsPerFoot;
        if (obj.type === MapObjectType.POLYGON) {
            const areaPx = calculatePolygonArea(obj.points);
            const areaSqFt = areaPx / (ppf * ppf);
            const areaAcres = areaSqFt / 43560;
            const lenPx = calculatePolylineLength([...obj.points, obj.points[0]]);
            updated = { ...updated, areaSqFt, areaAcres, lengthFt: lenPx / ppf };
        } else if (obj.type === MapObjectType.POLYLINE) {
            const lenPx = calculatePolylineLength(obj.points);
            updated = { ...updated, lengthFt: lenPx / ppf };
        }
     }

     // Calculate Cost
     if (obj.unitCost && obj.unitCost > 0) {
        if (obj.type === MapObjectType.POLYGON && updated.areaAcres) {
            updated.totalCost = updated.areaAcres * obj.unitCost;
        } else if (obj.type === MapObjectType.POLYLINE && updated.lengthFt) {
            updated.totalCost = updated.lengthFt * obj.unitCost;
        } else if (obj.type === MapObjectType.POINT) {
            updated.totalCost = obj.unitCost;
        }
     } else {
        updated.totalCost = 0;
     }

     return updated;
  });

  // Auto-Save: Save to local storage on change
  useEffect(() => {
    const timeout = setTimeout(() => {
        const state: ProjectState = { objects, materials, calibration, backgroundImageSrc };
        localStorage.setItem('acreage_mapper_autosave', JSON.stringify(state));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [objects, materials, calibration, backgroundImageSrc]);

  const pushToHistory = (newObjects: MapObject[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newObjects);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
    }
  };

  const handleObjectCreated = (newObj: MapObject) => {
    pushToHistory([...objects, newObj]);
    // For slope, stay in slope tool to draw multiple arrows easily? No, standard is revert to select.
    if (newObj.type === MapObjectType.SLOPE) {
         // Maybe keep tool active for slopes?
         // setActiveTool(ToolType.DRAW_SLOPE); 
         // Let's stick to standard behavior
         setActiveTool(ToolType.SELECT);
    } else {
        setActiveTool(ToolType.SELECT); 
    }
    setSelectedId(newObj.id);
  };

  const handleUpdateObject = (id: string, updates: Partial<MapObject>) => {
    const newObjects = objects.map(o => o.id === id ? { ...o, ...updates } : o);
    pushToHistory(newObjects);
  };

  const handleDeleteObject = (id: string) => {
    const newObjects = objects.filter(o => o.id !== id);
    pushToHistory(newObjects);
    if (selectedId === id) setSelectedId(null);
  };

  const handleCalibrationComplete = (p1: Coordinate, p2: Coordinate, pixels: number) => {
     setCalibration(prev => ({ ...prev, point1: p1, point2: p2 }));
     setPendingCalibPixelDist(pixels);
     setIsCalibDialogOpen(true);
  };

  const finalizeCalibration = (feet: number) => {
      setCalibration(prev => ({
          ...prev,
          distanceFt: feet,
          pixelsPerFoot: pendingCalibPixelDist / feet,
          isCalibrated: true
      }));
      setIsCalibDialogOpen(false);
      setActiveTool(ToolType.SELECT);
  };

  const handleSave = () => {
      const state: ProjectState = { objects, materials, calibration, backgroundImageSrc };
      const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acreage-map-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const state = JSON.parse(evt.target?.result as string) as ProjectState;
              if (state.objects) {
                setHistory([state.objects]);
                setHistoryIndex(0);
              }
              if (state.materials) setMaterials(state.materials);
              if (state.calibration) setCalibration(state.calibration);
              if (state.backgroundImageSrc) setBackgroundImageSrc(state.backgroundImageSrc);
          } catch (err) {
              alert('Failed to load project file');
          }
      };
      reader.readAsText(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          setBackgroundImageSrc(evt.target?.result as string);
          // Reset calibration on new manual upload
          setCalibration(prev => ({ ...prev, isCalibrated: false }));
      };
      reader.readAsDataURL(file);
  };

  // OSM Import Handler
  const handleOSMImport = (imageSrc: string, pixelsPerFoot: number) => {
      if (objects.length > 0 && !confirm('Importing a new map will overwrite the current background. Objects will remain. Continue?')) return;
      
      setBackgroundImageSrc(imageSrc);
      setCalibration({
          isCalibrated: true,
          pixelsPerFoot: pixelsPerFoot,
          point1: null,
          point2: null,
          distanceFt: 0
      });
  };

  const handleLoadDemoProject = async () => {
    if (objects.length > 0 && !confirm('This will overwrite your current project. Continue?')) return;
    try {
      const response = await fetch('./demo-project.json');
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      const data = await response.json();
      
      if (data.objects) {
          setHistory([data.objects]);
          setHistoryIndex(0);
      }
      if (data.materials) setMaterials(data.materials || []);
      if (data.calibration) setCalibration(data.calibration);
      if (data.backgroundImageSrc) setBackgroundImageSrc(data.backgroundImageSrc);
      
      setSelectedId(null);
      setActiveTool(ToolType.SELECT);
    } catch (e) {
      console.error("Failed to load demo project", e);
      alert("Could not load demo project.");
    }
  };

  const handleLoadSampleMap = () => {
      if (objects.length > 0 && !confirm('This will overwrite your current project. Continue?')) return;
      
      setHistory([[]]);
      setHistoryIndex(0);
      setCalibration({
        isCalibrated: false,
        pixelsPerFoot: 1,
        point1: null,
        point2: null,
        distanceFt: 0
      });
      setBackgroundImageSrc('./sample-map.svg');
      setSelectedId(null);
      setActiveTool(ToolType.SELECT);
  };

  const handleExportBOM = () => {
    let html = `
      <html>
      <head>
        <title>Acreage Mapper - Shopping List</title>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          h1 { border-bottom: 2px solid #ccc; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
          th { background: #f9f9f9; }
          .total { font-weight: bold; font-size: 1.2em; text-align: right; padding-top: 20px; }
          .print-btn { background: #0ea5e9; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; float: right; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Print List</button>
        <h1>Project Materials List</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>Material / Item</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Est. Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Group by Material Name
    const summary: Record<string, { type: string, qty: number, unit: string, unitCost: number, total: number }> = {};
    
    objectsWithMetrics.forEach(obj => {
        // Use material name if linked, otherwise generic object name
        const matName = obj.materialId ? materials.find(m => m.id === obj.materialId)?.name : null;
        const name = matName || obj.name;
        
        if (!summary[name]) {
            summary[name] = { type: '', qty: 0, unit: '', unitCost: obj.unitCost || 0, total: 0 };
        }

        if (obj.type === MapObjectType.POLYLINE) {
            summary[name].type = 'Linear Fence';
            summary[name].qty += obj.lengthFt || 0;
            summary[name].unit = 'ft';
        } else if (obj.type === MapObjectType.POLYGON) {
            summary[name].type = 'Area';
            summary[name].qty += obj.areaAcres || 0;
            summary[name].unit = 'acres';
        } else if (obj.type === MapObjectType.POINT) {
            summary[name].type = 'Item';
            summary[name].qty += 1;
            summary[name].unit = 'units';
        }
        summary[name].total += obj.totalCost || 0;
    });

    let grandTotal = 0;
    Object.keys(summary).forEach(name => {
        const item = summary[name];
        grandTotal += item.total;
        html += `
            <tr>
                <td>${name}</td>
                <td>${item.type}</td>
                <td>${item.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${item.unit}</td>
                <td>$${item.unitCost.toFixed(2)}</td>
                <td>$${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    });

    html += `
          </tbody>
        </table>
        <div class="total">Grand Total: $${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedId) handleDeleteObject(selectedId);
        }
        if (e.key === 'Escape') {
             setActiveTool(ToolType.SELECT);
             setSelectedId(null);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyIndex, objects, calibration, backgroundImageSrc]);

  return (
    <div className="relative w-full h-full bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 font-sans selection:bg-sky-500/30">
      <Toolbar 
        activeTool={activeTool} 
        onSelectTool={setActiveTool} 
        onSave={handleSave}
        onLoad={handleLoad}
        onImageUpload={handleImageUpload}
        onToggleHelp={() => setIsHelpOpen(true)}
        onLoadDemoProject={handleLoadDemoProject}
        onLoadSampleMap={handleLoadSampleMap}
        onOpenMaterials={() => setIsMaterialsOpen(true)}
        onOpenOSM={() => setIsOSMDialogOpen(true)}
      />
      
      {/* Sun Config Panel - Only visible when tool is active */}
      {activeTool === ToolType.SUN_ANALYSIS && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-4 z-40 shadow-xl items-center animate-in fade-in slide-in-from-top-4">
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                <input 
                    type="date" 
                    value={sunConfig.date}
                    onChange={(e) => setSunConfig({...sunConfig, date: e.target.value})}
                    className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
                />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time</label>
                <input 
                    type="time" 
                    value={sunConfig.time}
                    onChange={(e) => setSunConfig({...sunConfig, time: e.target.value})}
                    className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
                />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Obj Height (ft)</label>
                <input 
                    type="number" 
                    value={sunConfig.objectHeightFt}
                    onChange={(e) => setSunConfig({...sunConfig, objectHeightFt: Number(e.target.value)})}
                    className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-sky-500 w-20"
                />
             </div>
        </div>
      )}

      <Sidebar 
        objects={objectsWithMetrics} 
        selectedId={selectedId} 
        onSelect={setSelectedId}
        onUpdate={handleUpdateObject}
        onDelete={handleDeleteObject}
        isCalibrated={calibration.isCalibrated}
        pixelsPerFoot={calibration.pixelsPerFoot}
        materials={materials}
        onOpenMaterials={() => setIsMaterialsOpen(true)}
        onExportBOM={handleExportBOM}
        showWaterFlow={showWaterFlow}
        onToggleWaterFlow={setShowWaterFlow}
      />
      <MapCanvas 
        tool={activeTool}
        objects={objectsWithMetrics}
        backgroundImageSrc={backgroundImageSrc}
        selectedId={selectedId}
        onObjectCreated={handleObjectCreated}
        onSelectObject={setSelectedId}
        onCalibrationComplete={handleCalibrationComplete}
        pixelsPerFoot={calibration.pixelsPerFoot}
        isCalibrated={calibration.isCalibrated}
        sunConfig={sunConfig}
        showWaterFlow={showWaterFlow}
      />
      <CalibrationDialog 
        isOpen={isCalibDialogOpen}
        pixelDistance={pendingCalibPixelDist}
        onConfirm={finalizeCalibration}
        onCancel={() => setIsCalibDialogOpen(false)}
      />
      <HelpDialog 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />
      <MaterialManager 
        isOpen={isMaterialsOpen}
        onClose={() => setIsMaterialsOpen(false)}
        materials={materials}
        setMaterials={setMaterials}
      />
      <OSMDialog 
        isOpen={isOSMDialogOpen}
        onClose={() => setIsOSMDialogOpen(false)}
        onImport={handleOSMImport}
      />
    </div>
  );
};

export default App;

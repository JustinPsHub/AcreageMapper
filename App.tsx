import React, { useState, useEffect } from 'react';
import MapCanvas from './components/MapCanvas';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import CalibrationDialog from './components/CalibrationDialog';
import HelpDialog from './components/HelpDialog';
import { MapObject, ToolType, CalibrationData, ProjectState, Coordinate, MapObjectType } from './types';
import { calculatePolygonArea, calculatePolylineLength } from './utils/geometry';

const App: React.FC = () => {
  const [history, setHistory] = useState<MapObject[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const objects = history[historyIndex];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.PAN);
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [calibration, setCalibration] = useState<CalibrationData>({
    isCalibrated: false,
    pixelsPerFoot: 1,
    point1: null,
    point2: null,
    distanceFt: 0
  });
  const [isCalibDialogOpen, setIsCalibDialogOpen] = useState(false);
  const [pendingCalibPixelDist, setPendingCalibPixelDist] = useState(0);

  const objectsWithMetrics = objects.map(obj => {
     if (!calibration.isCalibrated) return obj;
     const ppf = calibration.pixelsPerFoot;
     if (obj.type === MapObjectType.POLYGON) {
         const areaPx = calculatePolygonArea(obj.points);
         const areaSqFt = areaPx / (ppf * ppf);
         const areaAcres = areaSqFt / 43560;
         const lenPx = calculatePolylineLength([...obj.points, obj.points[0]]);
         return { ...obj, areaSqFt, areaAcres, lengthFt: lenPx / ppf };
     } else if (obj.type === MapObjectType.POLYLINE) {
         const lenPx = calculatePolylineLength(obj.points);
         return { ...obj, lengthFt: lenPx / ppf };
     }
     return obj;
  });

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
    setActiveTool(ToolType.SELECT); 
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
      const state: ProjectState = { objects, calibration, backgroundImageSrc };
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
      };
      reader.readAsDataURL(file);
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
      />
      <Sidebar 
        objects={objectsWithMetrics} 
        selectedId={selectedId} 
        onSelect={setSelectedId}
        onUpdate={handleUpdateObject}
        onDelete={handleDeleteObject}
        isCalibrated={calibration.isCalibrated}
        pixelsPerFoot={calibration.pixelsPerFoot}
      />
      <MapCanvas 
        tool={activeTool}
        objects={objectsWithMetrics}
        backgroundImageSrc={backgroundImageSrc}
        calibration={calibration}
        selectedId={selectedId}
        onObjectCreated={handleObjectCreated}
        onSelectObject={setSelectedId}
        onCalibrationComplete={handleCalibrationComplete}
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
    </div>
  );
};

export default App;
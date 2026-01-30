import React, { useState, useEffect, useCallback } from 'react';
import MapCanvas from './components/MapCanvas';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import CalibrationDialog from './components/CalibrationDialog';
import { MapObject, ToolType, CalibrationData, ProjectState, Coordinate, MapObjectType } from './types';
import { calculatePolygonArea, calculatePolylineLength } from './utils/geometry';

const App: React.FC = () => {
  // State
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.PAN);
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string | null>(null);
  
  const [calibration, setCalibration] = useState<CalibrationData>({
    isCalibrated: false,
    pixelsPerFoot: 1,
    point1: null,
    point2: null,
    distanceFt: 0
  });

  // Calibration Dialog State
  const [isCalibDialogOpen, setIsCalibDialogOpen] = useState(false);
  const [pendingCalibPixelDist, setPendingCalibPixelDist] = useState(0);

  // Recalculate metrics when calibration or objects change
  const objectsWithMetrics = objects.map(obj => {
     if (!calibration.isCalibrated) return obj;
     const ppf = calibration.pixelsPerFoot;
     
     if (obj.type === MapObjectType.POLYGON) {
         const areaPx = calculatePolygonArea(obj.points);
         const areaSqFt = areaPx / (ppf * ppf);
         const areaAcres = areaSqFt / 43560;
         const lenPx = calculatePolylineLength([...obj.points, obj.points[0]]); // Perimeter
         return { ...obj, areaSqFt, areaAcres, lengthFt: lenPx / ppf };
     } else if (obj.type === MapObjectType.POLYLINE) {
         const lenPx = calculatePolylineLength(obj.points);
         return { ...obj, lengthFt: lenPx / ppf };
     }
     return obj;
  });

  // Handlers
  const handleObjectCreated = (newObj: MapObject) => {
    setObjects(prev => [...prev, newObj]);
    setActiveTool(ToolType.SELECT); // Auto-switch to select after draw? optional.
    setSelectedId(newObj.id);
  };

  const handleUpdateObject = (id: string, updates: Partial<MapObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleDeleteObject = (id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
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
      const state: ProjectState = {
          objects,
          calibration,
          backgroundImageSrc
      };
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
              if (state.objects) setObjects(state.objects);
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedId) handleDeleteObject(selectedId);
        }
        if (e.key === 'Escape') {
             setActiveTool(ToolType.SELECT);
             setSelectedId(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <Toolbar 
        activeTool={activeTool} 
        onSelectTool={setActiveTool} 
        onSave={handleSave}
        onLoad={handleLoad}
        onImageUpload={handleImageUpload}
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
    </div>
  );
};

export default App;
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Coordinate, MapObject, ToolType, MapObjectType } from '../types';
import { isPointInPolygon, isPointNearPolyline, calculateDistance } from '../utils/geometry';

interface MapCanvasProps {
  tool: ToolType;
  objects: MapObject[];
  backgroundImageSrc: string | null;
  selectedId: string | null;
  onObjectCreated: (obj: MapObject) => void;
  onSelectObject: (id: string | null) => void;
  onCalibrationComplete: (p1: Coordinate, p2: Coordinate, pixels: number) => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({
  tool, objects, backgroundImageSrc, selectedId,
  onObjectCreated, onSelectObject, onCalibrationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Coordinate>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Coordinate>({ x: 0, y: 0 });
  const [draftPoints, setDraftPoints] = useState<Coordinate[]>([]);
  const [cursorPos, setCursorPos] = useState<Coordinate | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (backgroundImageSrc) {
      const img = new Image();
      img.src = backgroundImageSrc;
      img.onload = () => {
        setBgImage(img);
        if (containerRef.current) {
           const cx = (containerRef.current.clientWidth - img.width) / 2;
           const cy = (containerRef.current.clientHeight - img.height) / 2;
           setOffset({ x: cx, y: cy });
        }
      };
    } else {
        setBgImage(null);
    }
  }, [backgroundImageSrc]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - offset.x) / scale,
      y: (sy - offset.y) / scale
    };
  }, [offset, scale]);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    return {
      x: (wx * scale) + offset.x,
      y: (wy * scale) + offset.y
    };
  }, [offset, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    if (bgImage) {
        const screenPos = worldToScreen(0, 0);
        ctx.drawImage(bgImage, screenPos.x, screenPos.y, bgImage.width * scale, bgImage.height * scale);
    } else {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        const gridSize = 50 * scale;
        const offsetX = offset.x % gridSize;
        const offsetY = offset.y % gridSize;
        ctx.beginPath();
        for (let x = offsetX; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = offsetY; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    }

    objects.forEach(obj => {
        if (!obj.visible) return;
        ctx.beginPath();
        if (obj.points.length === 0) return;
        const start = worldToScreen(obj.points[0].x, obj.points[0].y);
        ctx.moveTo(start.x, start.y);

        if (obj.type === MapObjectType.POINT) {
            ctx.arc(start.x, start.y, 6 * scale, 0, Math.PI * 2);
            ctx.fillStyle = obj.color;
            ctx.fill();
            if (obj.id === selectedId) {
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        } else {
            obj.points.forEach((p) => {
                const sp = worldToScreen(p.x, p.y);
                ctx.lineTo(sp.x, sp.y);
            });
            if (obj.type === MapObjectType.POLYGON) {
                ctx.closePath();
                ctx.globalAlpha = obj.opacity;
                ctx.fillStyle = obj.color;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = Math.max(1, Math.min(5, (obj.id === selectedId ? 4 : 2) * scale));
            if (obj.id === selectedId) {
                ctx.strokeStyle = '#0ea5e9';
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    if (draftPoints.length > 0) {
        ctx.beginPath();
        const start = worldToScreen(draftPoints[0].x, draftPoints[0].y);
        ctx.moveTo(start.x, start.y);
        draftPoints.forEach(p => {
            const sp = worldToScreen(p.x, p.y);
            ctx.lineTo(sp.x, sp.y);
        });
        if (cursorPos) {
            const sp = worldToScreen(cursorPos.x, cursorPos.y);
            ctx.lineTo(sp.x, sp.y);
        }
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
        draftPoints.forEach(p => {
            const sp = worldToScreen(p.x, p.y);
            ctx.beginPath();
            ctx.fillStyle = '#FFF';
            ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.stroke();
        });
    }
    ctx.restore();
  }, [scale, offset, objects, draftPoints, cursorPos, bgImage, selectedId]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, scale * (1 + delta)), 20);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld(x, y);
    const newOffset = {
        x: x - worldPos.x * newScale,
        y: y - worldPos.y * newScale
    };
    setScale(newScale);
    setOffset(newOffset);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld(x, y);

    if (tool === ToolType.PAN || (e.button === 1)) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        return;
    }

    if (tool === ToolType.SELECT) {
        let foundId: string | null = null;
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (obj.type === MapObjectType.POINT) {
                const dist = calculateDistance(worldPos, obj.points[0]);
                if (dist < 10 / scale) { foundId = obj.id; break; }
            } else if (obj.type === MapObjectType.POLYGON) {
                if (isPointInPolygon(worldPos, obj.points)) { foundId = obj.id; break; }
            } else if (obj.type === MapObjectType.POLYLINE) {
                if (isPointNearPolyline(worldPos, obj.points, 5 / scale)) { foundId = obj.id; break; }
            }
        }
        onSelectObject(foundId);
    }
    
    if (tool === ToolType.DRAW_POINT) {
        onObjectCreated({
            id: Date.now().toString(),
            type: MapObjectType.POINT,
            name: `Point ${objects.filter(o => o.type === MapObjectType.POINT).length + 1}`,
            points: [worldPos],
            color: '#ef4444',
            opacity: 1,
            visible: true
        });
    }

    if ([ToolType.DRAW_POLYGON, ToolType.DRAW_POLYLINE, ToolType.CALIBRATE].includes(tool)) {
        if (e.button === 0) {
            setDraftPoints(prev => [...prev, worldPos]);
        } else if (e.button === 2) {
             finishDrawing();
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld(x, y);
    setCursorPos(worldPos);
    if (isDragging) {
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const finishDrawing = () => {
      if (draftPoints.length === 0) return;
      if (tool === ToolType.CALIBRATE) {
          if (draftPoints.length >= 2) {
             const p1 = draftPoints[0];
             const p2 = draftPoints[draftPoints.length - 1];
             const distPixels = calculateDistance(p1, p2);
             onCalibrationComplete(p1, p2, distPixels);
          }
      } else if (tool === ToolType.DRAW_POLYGON && draftPoints.length >= 3) {
          onObjectCreated({
              id: Date.now().toString(),
              type: MapObjectType.POLYGON,
              name: `Zone ${objects.filter(o => o.type === MapObjectType.POLYGON).length + 1}`,
              points: [...draftPoints],
              color: '#10b981',
              opacity: 0.4,
              visible: true
          });
      } else if (tool === ToolType.DRAW_POLYLINE && draftPoints.length >= 2) {
          onObjectCreated({
              id: Date.now().toString(),
              type: MapObjectType.POLYLINE,
              name: `Fence ${objects.filter(o => o.type === MapObjectType.POLYLINE).length + 1}`,
              points: [...draftPoints],
              color: '#f59e0b',
              opacity: 1,
              visible: true
          });
      }
      setDraftPoints([]);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      finishDrawing();
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 overflow-hidden relative cursor-crosshair">
       <canvas
         ref={canvasRef}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onWheel={handleWheel}
         onContextMenu={handleContextMenu}
         className={`block touch-none ${tool === ToolType.PAN || isDragging ? 'cursor-move' : 'cursor-crosshair'}`}
       />
       <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-medium px-4 py-2 rounded-full border border-slate-700/50 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            {tool === ToolType.SELECT && "Click object to select"}
            {tool === ToolType.PAN && "Drag to pan • Scroll to zoom"}
            {(tool === ToolType.DRAW_POLYGON || tool === ToolType.DRAW_POLYLINE) && "Click to add point • Right-click to finish"}
            {tool === ToolType.CALIBRATE && "Draw line between known points • Right-click to finish"}
            {tool === ToolType.DRAW_POINT && "Click to place marker"}
          </div>
       </div>
    </div>
  );
};

export default MapCanvas;

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Coordinate, MapObject, ToolType, MapObjectType, SunConfig } from '../types';
import { isPointInPolygon, isPointNearPolyline, calculateDistance, findNearestPoint } from '../utils/geometry';
import { calculateSunPosition, calculateShadowLength } from '../utils/sun';

interface MapCanvasProps {
  tool: ToolType;
  objects: MapObject[];
  backgroundImageSrc: string | null;
  selectedId: string | null;
  onObjectCreated: (obj: MapObject) => void;
  onSelectObject: (id: string | null) => void;
  onCalibrationComplete: (p1: Coordinate, p2: Coordinate, pixels: number) => void;
  pixelsPerFoot: number;
  isCalibrated: boolean;
  sunConfig?: SunConfig;
  showWaterFlow: boolean;
}

const MapCanvas: React.FC<MapCanvasProps> = ({
  tool, objects, backgroundImageSrc, selectedId,
  onObjectCreated, onSelectObject, onCalibrationComplete,
  pixelsPerFoot, isCalibrated, sunConfig, showWaterFlow
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
  const [snappedPoint, setSnappedPoint] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (backgroundImageSrc) {
      const img = new Image();
      img.src = backgroundImageSrc;
      img.onload = () => {
        setBgImage(img);
        if (containerRef.current) {
           const containerW = containerRef.current.clientWidth;
           const containerH = containerRef.current.clientHeight;
           const scaleX = containerW / img.width;
           const scaleY = containerH / img.height;
           const newScale = Math.min(scaleX, scaleY, 1) * 0.95; 
           const cx = (containerW - img.width * newScale) / 2;
           const cy = (containerH - img.height * newScale) / 2;
           setScale(newScale);
           setOffset({ x: cx, y: cy });
        }
      };
    } else {
        setBgImage(null);
        setOffset({ x: 0, y: 0 });
        setScale(1);
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
    
    // Draw Background
    if (bgImage) {
        const screenPos = worldToScreen(0, 0);
        ctx.drawImage(bgImage, screenPos.x, screenPos.y, bgImage.width * scale, bgImage.height * scale);
    } else {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        const gridSize = 50 * scale;
        const startX = offset.x % gridSize;
        const startY = offset.y % gridSize;
        ctx.beginPath();
        for (let x = startX; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = startY; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    }

    // Prepare Slope Vectors for Flow Viz
    const slopeObjects = objects.filter(o => o.type === MapObjectType.SLOPE);

    // Draw Objects
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
        } else if (obj.type === MapObjectType.SLOPE) {
            if (obj.points.length < 2) return;
            const end = worldToScreen(obj.points[1].x, obj.points[1].y);
            // Draw Arrow
            ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = '#3b82f6'; // Blue
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Arrowhead
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const headLen = 15;
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(end.x, end.y);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();

            // Text Label "DOWN"
            ctx.fillStyle = '#60a5fa';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('DOWN', (start.x + end.x)/2 + 5, (start.y + end.y)/2);

        } else {
            // Polygon or Polyline
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

            // Water Flow Viz
            if (showWaterFlow && obj.type === MapObjectType.POLYLINE && slopeObjects.length > 0) {
                 // Calculate nearest slope vector
                 // Simply use the center of the polyline to find the nearest slope object center
                 const midX = (obj.points[0].x + obj.points[obj.points.length - 1].x) / 2;
                 const midY = (obj.points[0].y + obj.points[obj.points.length - 1].y) / 2;
                 let nearestSlope: MapObject | null = null;
                 let minSlopeDist = Infinity;

                 slopeObjects.forEach(s => {
                     const sMidX = (s.points[0].x + s.points[1].x) / 2;
                     const sMidY = (s.points[0].y + s.points[1].y) / 2;
                     const d = Math.sqrt(Math.pow(midX - sMidX, 2) + Math.pow(midY - sMidY, 2));
                     if (d < minSlopeDist) {
                         minSlopeDist = d;
                         nearestSlope = s;
                     }
                 });

                 if (nearestSlope) {
                     // Get flow direction angle
                     const sP1 = nearestSlope.points[0];
                     const sP2 = nearestSlope.points[1];
                     const flowAngle = Math.atan2(sP2.y - sP1.y, sP2.x - sP1.x);

                     // Draw small flow arrows along the fence line
                     for (let i=0; i < obj.points.length - 1; i++) {
                         const p1 = obj.points[i];
                         const p2 = obj.points[i+1];
                         const cx = (p1.x + p2.x) / 2;
                         const cy = (p1.y + p2.y) / 2;
                         const sc = worldToScreen(cx, cy);
                         
                         // Draw flow arrow at center
                         const fLen = 10;
                         const fx = sc.x + Math.cos(flowAngle) * fLen;
                         const fy = sc.y + Math.sin(flowAngle) * fLen;
                         
                         ctx.beginPath();
                         ctx.moveTo(sc.x - Math.cos(flowAngle)*fLen/2, sc.y - Math.sin(flowAngle)*fLen/2);
                         ctx.lineTo(fx, fy);
                         ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blueish
                         ctx.lineWidth = 2;
                         ctx.stroke();

                         // Arrowhead
                         const headSize = 4;
                         ctx.beginPath();
                         ctx.moveTo(fx, fy);
                         ctx.lineTo(fx - headSize * Math.cos(flowAngle - Math.PI / 6), fy - headSize * Math.sin(flowAngle - Math.PI / 6));
                         ctx.lineTo(fx - headSize * Math.cos(flowAngle + Math.PI / 6), fy - headSize * Math.sin(flowAngle + Math.PI / 6));
                         ctx.closePath();
                         ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
                         ctx.fill();
                     }
                 }
            }
        }
    });

    // Draw Draft (Current Drawing)
    if (draftPoints.length > 0) {
        ctx.beginPath();
        const start = worldToScreen(draftPoints[0].x, draftPoints[0].y);
        ctx.moveTo(start.x, start.y);
        draftPoints.forEach(p => {
            const sp = worldToScreen(p.x, p.y);
            ctx.lineTo(sp.x, sp.y);
        });
        
        // Draw elastic line to cursor/snapped point
        const activePos = snappedPoint || cursorPos;
        if (activePos) {
            const sp = worldToScreen(activePos.x, activePos.y);
            ctx.lineTo(sp.x, sp.y);
        }
        
        ctx.strokeStyle = tool === ToolType.DRAW_SLOPE ? '#3b82f6' : '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw vertices of draft
        draftPoints.forEach(p => {
            const sp = worldToScreen(p.x, p.y);
            ctx.beginPath();
            ctx.fillStyle = '#FFF';
            ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = tool === ToolType.DRAW_SLOPE ? '#3b82f6' : '#fbbf24';
            ctx.stroke();
        });

        // Live Measurement Label
        if (activePos && isCalibrated && tool !== ToolType.DRAW_SLOPE) {
            const lastPoint = draftPoints[draftPoints.length - 1];
            const distPx = calculateDistance(lastPoint, activePos);
            const distFt = distPx / pixelsPerFoot;
            const sp = worldToScreen(activePos.x, activePos.y);
            
            ctx.font = 'bold 12px Inter, sans-serif';
            const text = `${distFt.toFixed(1)} ft`;
            const textMetrics = ctx.measureText(text);
            
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.roundRect(sp.x + 10, sp.y - 25, textMetrics.width + 12, 20, 4);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.fillText(text, sp.x + 16, sp.y - 11);
        }
    }

    // Draw Snap Indicator
    if (snappedPoint) {
        const sp = worldToScreen(snappedPoint.x, snappedPoint.y);
        ctx.beginPath();
        ctx.strokeStyle = '#ec4899'; // Pink snap
        ctx.lineWidth = 2;
        ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Solar Analysis Overlay
    if (tool === ToolType.SUN_ANALYSIS && sunConfig && isCalibrated) {
        const date = new Date(`${sunConfig.date}T${sunConfig.time}`);
        const sunPos = calculateSunPosition(date, sunConfig.latitude);
        const shadowLenFt = calculateShadowLength(sunConfig.objectHeightFt, sunPos.altitude);
        const shadowLenPx = shadowLenFt * pixelsPerFoot;
        
        // Draw Compass Rose in top right (relative to canvas space, but absolute screen pos is easier)
        const roseX = canvas.width - 60;
        const roseY = 60;
        
        ctx.save();
        ctx.translate(roseX, roseY);
        
        // Compass Circle
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // N/S/E/W
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('N', 0, -50); 
        
        // Sun Direction Arrow
        const sunRad = (sunPos.azimuth - 90) * (Math.PI / 180);
        const sunX = Math.cos(sunRad) * 30;
        const sunY = Math.sin(sunRad) * 30;
        
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(sunX, sunY);
        ctx.strokeStyle = '#fbbf24'; // Yellow Sun
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sunX, sunY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();

        ctx.restore();

        // Draw Shadow Projection from Center Screen (or mouse if we wanted)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Shadow is opposite to sun
        const shadowRad = (sunPos.azimuth - 90 + 180) * (Math.PI / 180);
        const tipX = centerX + Math.cos(shadowRad) * (shadowLenPx * scale);
        const tipY = centerY + Math.sin(shadowRad) * (shadowLenPx * scale);

        // Draw Object base
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Draw Shadow
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 10 * scale; // wide shadow
        ctx.lineCap = 'round';
        ctx.stroke();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Shadow: ${shadowLenFt.toFixed(1)}ft @ ${sunConfig.time}`, centerX + 10, centerY + 20);
    }

    ctx.restore();
  }, [scale, offset, objects, draftPoints, cursorPos, bgImage, selectedId, snappedPoint, tool, sunConfig, isCalibrated, pixelsPerFoot, showWaterFlow]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.05, scale * (1 + delta)), 20);
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
    let worldPos = screenToWorld(x, y);

    // Use snapped point if available
    if (snappedPoint) {
        worldPos = snappedPoint;
    }

    if (tool === ToolType.PAN || tool === ToolType.SUN_ANALYSIS || (e.button === 1)) {
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
                if (dist < 15 / scale) { foundId = obj.id; break; }
            } else if (obj.type === MapObjectType.POLYGON) {
                if (isPointInPolygon(worldPos, obj.points)) { foundId = obj.id; break; }
            } else if (obj.type === MapObjectType.POLYLINE) {
                if (isPointNearPolyline(worldPos, obj.points, 10 / scale)) { foundId = obj.id; break; }
            } else if (obj.type === MapObjectType.SLOPE) {
                 // Check if near slope vector
                 const dist = calculateDistance(worldPos, obj.points[0]) + calculateDistance(worldPos, obj.points[1]);
                 const length = calculateDistance(obj.points[0], obj.points[1]);
                 if (dist - length < 10 / scale) { foundId = obj.id; break; }
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

    if ([ToolType.DRAW_POLYGON, ToolType.DRAW_POLYLINE, ToolType.CALIBRATE, ToolType.DRAW_SLOPE].includes(tool)) {
        if (e.button === 0) {
            // For Slope: Click once to start, second click finishes
            setDraftPoints(prev => [...prev, worldPos]);
            // If Slope and 2 points, finish automatically
            if (tool === ToolType.DRAW_SLOPE && draftPoints.length === 1) {
                // We will finish in next render logic implicitly, or better handle in mouse up/move or here immediately
                // but draftPoints update is async. Let's rely on finishDrawing called manually or via right click?
                // Actually let's make slope drag-to-create or click-click. Click-Click matches others.
            }
        } else if (e.button === 2) {
             finishDrawing();
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging) {
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    } else {
        const worldPos = screenToWorld(x, y);
        setCursorPos(worldPos);

        // Snapping Logic
        if ([ToolType.DRAW_POLYGON, ToolType.DRAW_POLYLINE, ToolType.CALIBRATE].includes(tool)) {
            const allPoints = objects.flatMap(o => o.points).concat(draftPoints);
            // Snap threshold 15px in screen space
            const threshold = 15 / scale; 
            const nearest = findNearestPoint(worldPos, allPoints, threshold);
            setSnappedPoint(nearest);
        } else {
            setSnappedPoint(null);
        }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    // Auto-finish slope after 2 points
    if (tool === ToolType.DRAW_SLOPE && draftPoints.length === 1 && e.button === 0) {
       // Wait for the second point to be added then finish.
       // Since React state is async, we can check this in the next click or use a different mechanism.
       // simpler: Let user click start, then click end.
       // Logic handled in MouseDown. But if we want to finish immediately after 2nd click:
       // We can trigger finish inside MouseDown if we knew state.
       // Let's rely on effect or just let user right click to finish like others to be consistent,
       // OR check draftPoints in render.
    }
  };

  // Effect to auto-finish slope
  useEffect(() => {
     if (tool === ToolType.DRAW_SLOPE && draftPoints.length === 2) {
         finishDrawing();
     }
  }, [draftPoints, tool]);


  const finishDrawing = () => {
      if (draftPoints.length === 0) return;
      // If we are finishing, check if we snap to the first point of the draft (closure)
      let finalPoints = [...draftPoints];
      
      // If closing a polygon, ensure we capture the snapped closing point if intended
      if (tool === ToolType.DRAW_POLYGON && snappedPoint && draftPoints.length > 2) {
         if (calculateDistance(snappedPoint, draftPoints[0]) < 0.001) {
             // We are snapping to start, just close it naturally
         } else {
             finalPoints.push(snappedPoint);
         }
      } else if (snappedPoint) {
          finalPoints.push(snappedPoint);
      }

      if (tool === ToolType.CALIBRATE) {
          if (finalPoints.length >= 2) {
             const p1 = finalPoints[0];
             const p2 = finalPoints[finalPoints.length - 1];
             const distPixels = calculateDistance(p1, p2);
             onCalibrationComplete(p1, p2, distPixels);
          }
      } else if (tool === ToolType.DRAW_SLOPE) {
           if (finalPoints.length >= 2) {
               onObjectCreated({
                   id: Date.now().toString(),
                   type: MapObjectType.SLOPE,
                   name: 'Slope Vector',
                   points: [finalPoints[0], finalPoints[1]],
                   color: '#3b82f6',
                   opacity: 1,
                   visible: true
               });
           }
      } else if (tool === ToolType.DRAW_POLYGON && finalPoints.length >= 3) {
          onObjectCreated({
              id: Date.now().toString(),
              type: MapObjectType.POLYGON,
              name: `Zone ${objects.filter(o => o.type === MapObjectType.POLYGON).length + 1}`,
              points: finalPoints,
              color: '#10b981',
              opacity: 0.4,
              visible: true
          });
      } else if (tool === ToolType.DRAW_POLYLINE && finalPoints.length >= 2) {
          onObjectCreated({
              id: Date.now().toString(),
              type: MapObjectType.POLYLINE,
              name: `Fence ${objects.filter(o => o.type === MapObjectType.POLYLINE).length + 1}`,
              points: finalPoints,
              color: '#f59e0b',
              opacity: 1,
              visible: true
          });
      }
      setDraftPoints([]);
      setSnappedPoint(null);
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
         className={`block touch-none ${tool === ToolType.PAN || tool === ToolType.SUN_ANALYSIS || isDragging ? 'cursor-move' : 'cursor-crosshair'}`}
       />
       <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-medium px-4 py-2 rounded-full border border-slate-700/50 shadow-lg flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${tool === ToolType.SELECT ? 'bg-sky-500' : 'bg-emerald-500'}`}></span>
            {tool === ToolType.SELECT && "Click object to select"}
            {tool === ToolType.PAN && "Drag to pan • Scroll to zoom"}
            {(tool === ToolType.DRAW_POLYGON || tool === ToolType.DRAW_POLYLINE) && "Click to add point • Near points snap • Right-click to finish"}
            {tool === ToolType.CALIBRATE && "Draw line between known points • Right-click to finish"}
            {tool === ToolType.DRAW_POINT && "Click to place marker"}
            {tool === ToolType.DRAW_SLOPE && "Click Top of hill -> Click Bottom of hill"}
            {tool === ToolType.SUN_ANALYSIS && "Visualize sun and shadows based on time of day"}
          </div>
       </div>
    </div>
  );
};

export default MapCanvas;


import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { X, Search, Check, Loader2, Layers, Mountain, Map as MapIcon, Satellite } from 'lucide-react';

interface OSMDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (imageSrc: string, pixelsPerFoot: number) => void;
}

type BaseLayerType = 'standard' | 'satellite';

const OSMDialog: React.FC<OSMDialogProps> = ({ isOpen, onClose, onImport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.TileLayer | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('standard');
  const [showTopo, setShowTopo] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
           attributionControl: false,
           zoomControl: false,
           preferCanvas: true
        }).setView([37.0902, -95.7129], 4);

        mapInstanceRef.current = map;
        updateLayers(map, 'standard', false);
        
        setTimeout(() => map.invalidateSize(), 100);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Update Layers when state changes
  useEffect(() => {
      if (mapInstanceRef.current) {
          updateLayers(mapInstanceRef.current, baseLayer, showTopo);
      }
  }, [baseLayer, showTopo]);

  const updateLayers = (map: L.Map, type: BaseLayerType, topo: boolean) => {
      // Remove existing layers
      if (layerRef.current) map.removeLayer(layerRef.current);
      if (overlayRef.current) map.removeLayer(overlayRef.current);

      let url = '';
      if (type === 'standard') {
          url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      } else {
          // Esri World Imagery
          url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      }

      const newLayer = L.tileLayer(url, {
          maxZoom: 19,
          crossOrigin: true // Critical for html2canvas
      });
      
      newLayer.addTo(map);
      layerRef.current = newLayer;

      if (topo) {
          // OpenTopoMap Overlay
          const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
              maxZoom: 17,
              opacity: 0.6, // Semi-transparent overlay
              crossOrigin: true
          });
          topoLayer.addTo(map);
          overlayRef.current = topoLayer;
      }
  };

  // Cleanup map on unmount/close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        mapInstanceRef.current?.setView([parseFloat(lat), parseFloat(lon)], 16); // Zoom closer
      } else {
        alert('Location not found');
      }
    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCapture = async () => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    
    setIsCapturing(true);

    try {
        // 1. Calculate Scale
        const center = mapInstanceRef.current.getCenter();
        const zoom = mapInstanceRef.current.getZoom();
        const latRad = center.lat * Math.PI / 180;
        const metersPerPixel = (156543.03 * Math.cos(latRad)) / Math.pow(2, zoom);
        const feetPerPixel = metersPerPixel * 3.28084;
        const pixelsPerFoot = 1 / feetPerPixel;

        // 2. Capture Image
        // Note: useCORS is essential for Esri/OSM tiles
        const canvas = await html2canvas(mapContainerRef.current, {
            useCORS: true,
            allowTaint: true,
            logging: false,
            scale: 1,
            ignoreElements: (element) => element.classList.contains('exclude-capture')
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        onImport(dataUrl, pixelsPerFoot);
        onClose();
    } catch (err) {
        console.error("Capture failed", err);
        alert("Failed to capture map image. Note: Satellite servers sometimes block automated capture. Try the Standard map if Satellite fails.");
    } finally {
        setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl overflow-hidden relative border border-white/20 shadow-2xl">
        
        {/* Header / Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2 pointer-events-none">
            <div className="flex-1 flex gap-2 pointer-events-auto">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search location (e.g. '123 Main St, Austin TX')"
                            className="w-full bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 shadow-xl focus:border-sky-500 outline-none"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isSearching}
                        className="bg-sky-500 hover:bg-sky-400 text-white px-5 rounded-xl font-medium transition-colors shadow-lg disabled:opacity-50"
                    >
                        {isSearching ? <Loader2 className="animate-spin" /> : 'Go'}
                    </button>
                </form>
            </div>
            <button 
                onClick={onClose}
                className="bg-slate-900/90 text-slate-400 hover:text-white p-3 rounded-xl border border-white/20 shadow-lg pointer-events-auto"
            >
                <X size={20} />
            </button>
        </div>

        {/* Layer Controls - Custom UI Overlay */}
        <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2 exclude-capture">
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-xl flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Base Layer</label>
                <button 
                   onClick={() => setBaseLayer('standard')}
                   className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${baseLayer === 'standard' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                >
                    <MapIcon size={14} /> Standard
                </button>
                <button 
                   onClick={() => setBaseLayer('satellite')}
                   className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${baseLayer === 'satellite' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                >
                    <Satellite size={14} /> Satellite
                </button>
                
                <div className="w-full h-px bg-white/10 my-1"></div>
                
                <label className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Overlay</label>
                <button 
                   onClick={() => setShowTopo(!showTopo)}
                   className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showTopo ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                >
                    <Mountain size={14} /> Topography
                </button>
            </div>
        </div>

        {/* Map Container */}
        <div ref={mapContainerRef} className="flex-1 w-full bg-slate-800 relative z-0" id="osm-map-container">
           {/* Crosshair to show center */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none opacity-50 exclude-capture">
             <PlusIcon />
           </div>
        </div>

        {/* Footer / Action */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 w-full px-4 exclude-capture pointer-events-none">
             <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl text-xs text-slate-300 border border-white/10 mb-3 pointer-events-auto">
                <span className="text-sky-400 font-bold">Tip:</span> Turn on "Topography" to see elevation contours before capturing.
             </div>
             <button 
                onClick={handleCapture}
                disabled={isCapturing}
                className="pointer-events-auto bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait ring-1 ring-white/20"
            >
                {isCapturing ? (
                    <>
                        <Loader2 className="animate-spin" /> Capturing View...
                    </>
                ) : (
                    <>
                        <Check size={24} /> Import Map
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

// Simple SVG Crosshair
const PlusIcon = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="2" style={{filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'}}>
        <path d="M20 10V30 M10 20H30" />
    </svg>
);

export default OSMDialog;

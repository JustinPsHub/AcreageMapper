
export enum ToolType {
  SELECT = 'SELECT',
  PAN = 'PAN',
  DRAW_POLYGON = 'DRAW_POLYGON',
  DRAW_POLYLINE = 'DRAW_POLYLINE',
  DRAW_POINT = 'DRAW_POINT',
  DRAW_SLOPE = 'DRAW_SLOPE',
  CALIBRATE = 'CALIBRATE',
  SUN_ANALYSIS = 'SUN_ANALYSIS'
}

export interface Coordinate {
  x: number;
  y: number;
}

export enum MapObjectType {
  POLYGON = 'POLYGON',
  POLYLINE = 'POLYLINE',
  POINT = 'POINT',
  SLOPE = 'SLOPE'
}

export interface Material {
  id: string;
  name: string;
  type: 'linear' | 'area' | 'item'; // linear for fence, area for seed/fert, item for gates
  unitCost: number;
  color: string;
}

export interface MapObject {
  id: string;
  type: MapObjectType;
  name: string;
  points: Coordinate[];
  color: string;
  opacity: number;
  visible: boolean;
  // Metrics
  areaSqFt?: number;
  areaAcres?: number;
  lengthFt?: number;
  // Costing
  materialId?: string; // Link to a preset
  unitCost?: number; // Override or manual
  totalCost?: number;
}

export interface CalibrationData {
  isCalibrated: boolean;
  pixelsPerFoot: number;
  point1: Coordinate | null;
  point2: Coordinate | null;
  distanceFt: number;
}

export interface SunConfig {
  date: string; // ISO Date string
  time: string; // HH:mm
  latitude: number;
  objectHeightFt: number; // For shadow calc
}

export interface ProjectState {
  objects: MapObject[];
  materials: Material[];
  calibration: CalibrationData;
  backgroundImageSrc: string | null;
}

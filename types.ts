export enum ToolType {
  SELECT = 'SELECT',
  PAN = 'PAN',
  DRAW_POLYGON = 'DRAW_POLYGON',
  DRAW_POLYLINE = 'DRAW_POLYLINE',
  DRAW_POINT = 'DRAW_POINT',
  CALIBRATE = 'CALIBRATE'
}

export interface Coordinate {
  x: number;
  y: number;
}

export enum MapObjectType {
  POLYGON = 'POLYGON',
  POLYLINE = 'POLYLINE',
  POINT = 'POINT'
}

export interface MapObject {
  id: string;
  type: MapObjectType;
  name: string;
  points: Coordinate[];
  color: string;
  opacity: number;
  visible: boolean;
  areaSqFt?: number;
  areaAcres?: number;
  lengthFt?: number;
}

export interface CalibrationData {
  isCalibrated: boolean;
  pixelsPerFoot: number;
  point1: Coordinate | null;
  point2: Coordinate | null;
  distanceFt: number;
}

export interface ProjectState {
  objects: MapObject[];
  calibration: CalibrationData;
  backgroundImageSrc: string | null;
}
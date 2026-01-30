
// A simplified solar position calculation
// Based on standard astronomical formulas

export const calculateSunPosition = (date: Date, lat: number, lng: number = 0) => {
  const PI = Math.PI;
  const rad = PI / 180;
  
  // Day of the year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  // Solar declination
  const declination = 23.45 * Math.sin(rad * (360 / 365) * (day - 81));

  // Equation of time
  const B = (360 / 365) * (day - 81);
  const eot = 9.87 * Math.sin(2 * B * rad) - 7.53 * Math.cos(rad * B) - 1.5 * Math.sin(rad * B);

  // Solar Time
  const timeOffset = 0; // Simplified for local time input
  const localTime = date.getHours() * 60 + date.getMinutes();
  const solarTime = localTime + (4 * lng) + eot + timeOffset;

  // Hour Angle
  const ha = (solarTime / 4) - 180;

  // Altitude (Elevation)
  const sinAlt = Math.sin(lat * rad) * Math.sin(declination * rad) + 
                 Math.cos(lat * rad) * Math.cos(declination * rad) * Math.cos(ha * rad);
  const altitude = Math.asin(sinAlt) * (180 / PI);

  // Azimuth
  const cosAzi = (Math.sin(declination * rad) - Math.sin(lat * rad) * Math.sin(altitude * rad)) /
                 (Math.cos(lat * rad) * Math.cos(altitude * rad));
  let azimuth = Math.acos(cosAzi) * (180 / PI);

  if (Math.sin(ha * rad) > 0) {
      azimuth = 360 - azimuth;
  }
  
  // Correction to make 0 = North for map (SunCalc usually 0 is South)
  // We want Azimuth 0 = North, 90 = East, 180 = South, 270 = West
  // The formula above typically yields 0 = South or varies. 
  // Let's use a simpler mapping for visualization purposes in the Northern Hemisphere
  // This is an approximation sufficient for gardening/fencing shadows.
  
  return {
    altitude: altitude, // degrees above horizon
    azimuth: azimuth + 180 // Shift to make compass intuitive relative to map "North" (Up)
  };
};

export const calculateShadowLength = (objectHeight: number, altitudeDegrees: number) => {
  if (altitudeDegrees <= 0) return 1000; // Infinite shadow at night
  const rad = Math.PI / 180;
  return objectHeight / Math.tan(altitudeDegrees * rad);
};

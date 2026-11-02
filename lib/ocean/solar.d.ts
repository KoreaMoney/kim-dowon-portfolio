export interface SolarPosition {
  elevation: number;
  azimuth: number;
}

export interface WeatherInfo {
  tempC: number;
  precipMm: number;
  code: number;
  cloudCover: number;
  windMs: number;
  windDirection: number;
  label: string;
}

export function solarPosition(date: Date, latDeg: number, lonDeg: number): SolarPosition;
export function describeWeather(code: number, precip: number): string;
export function fetchWeather(lat: number, lon: number, timeoutMs?: number): Promise<WeatherInfo>;

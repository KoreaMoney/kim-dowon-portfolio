export interface OceanOptions {
  view?: string;
  onReady?: () => void;
  coords?: { lat: number; lon: number };
  bench?: boolean;
}

export interface OceanWeather {
  cloudCover: number;
  windMs: number;
  windDirection: number;
  precipMm: number;
  tempC: number;
}

export interface OceanHandle {
  views: string[];
  setView(name: string): void;
  setWaterPreset(name: string): void;
  setWeather(weather: OceanWeather | null): void;
  pause(): void;
  resume(): void;
  dispose(): void;
}

export function createOcean(container: HTMLElement, options?: OceanOptions): OceanHandle;

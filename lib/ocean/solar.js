// Real-sky mode: sun elevation/azimuth for a place and time (compact NOAA-style
// math, ~1 arcminute accurate), plus a tiny Open-Meteo fetch for current weather.

const D2R = Math.PI / 180, R2D = 180 / Math.PI;

export function solarPosition(date, latDeg, lonDeg) {
  const jday = date.getTime() / 864e5 + 2440587.5;
  const n = jday - 2451545.0;
  const L = ((280.46 + 0.9856474 * n) % 360 + 360) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360 + 360) % 360 * D2R;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R;
  const eps = (23.439 - 0.0000004 * n) * D2R;
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
  // equation of time (minutes) — keeps the azimuth honest through the seasons
  const B = 2 * Math.PI * (n - 81) / 364;
  const eqTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const solarMin = utcMin + eqTime + 4 * lonDeg;
  const ha = (solarMin / 4 - 180) * D2R;
  const lat = latDeg * D2R;
  const elevation = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha)) * R2D;
  let azimuth = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) * R2D + 180;
  azimuth = ((azimuth % 360) + 360) % 360;
  return { elevation, azimuth };
}

// WMO weather codes → a label + whether it precipitates
export function describeWeather(code, precip) {
  if (precip > 0) {
    if (code >= 95) return "thunderstorm";
    if (code >= 71 && code <= 86) return "snow";
    return "rain";
  }
  if (code <= 1) return "clear";
  if (code <= 3) return "partly cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "showers";
  if (code >= 95) return "thunderstorm";
  return "cloudy";
}

export async function fetchWeather(lat, lon, timeoutMs = 6000) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day`
    + `&wind_speed_unit=ms&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const { current } = await res.json();
  return {
    tempC: current.temperature_2m,
    precipMm: current.precipitation ?? 0,
    code: current.weather_code ?? 0,
    cloudCover: (current.cloud_cover ?? 30) / 100,
    windMs: current.wind_speed_10m ?? 5,
    windDirection: current.wind_direction_10m ?? 205,
    label: describeWeather(current.weather_code ?? 0, current.precipitation ?? 0),
  };
}

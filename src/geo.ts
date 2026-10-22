import type { Space, SpaceWithDistance } from './types';

export interface LatLng { lat: number; lng: number }

/** Great-circle distance in kilometers. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function withDistance(spaces: Space[], from: LatLng | null): SpaceWithDistance[] {
  return spaces.map((s) => ({
    ...s,
    distanceKm: from ? haversineKm(from, { lat: s.lat, lng: s.lng }) : null,
  }));
}

export function formatDistance(km: number | null, units: 'mi' | 'km' = 'mi'): string {
  if (km === null) return '';
  if (units === 'mi') {
    const mi = km * 0.621371;
    if (mi < 0.1) return `${Math.round(mi * 5280)} ft`;
    return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  }
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export interface GeocodeResult extends LatLng { label: string }

/**
 * Forward geocode via Nominatim (OpenStreetMap). Free, no key, 1 req/s.
 * Only used when the user explicitly submits a place search.
 */
export async function geocode(query: string): Promise<GeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

/** Browser geolocation wrapped in a promise. Rejects on denial/timeout. */
export function locateUser(timeoutMs = 8000): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}

import type { LatLng } from '../geo';
import type { MapController, MapFactory, MapOptions } from './types';
import { createLeafletMap } from './leaflet';

export type { MapController, MapOptions } from './types';

/**
 * Registered map adapters. To add one (for example MapLibre GL):
 *   1. write `src/map/maplibre.ts` exporting a `MapFactory`,
 *   2. add it here,
 *   3. set `VITE_MAP_PROVIDER=maplibre` at build time (or change DEFAULT_PROVIDER).
 * The rest of the app never imports a map library directly.
 */
const PROVIDERS: Record<string, MapFactory> = {
  leaflet: createLeafletMap,
};

const DEFAULT_PROVIDER = 'leaflet';

export const BOSTON: LatLng = { lat: 42.3601, lng: -71.0589 };

export function createMap(el: HTMLElement, opts: MapOptions = { center: BOSTON, zoom: 12 }): MapController {
  const name = (import.meta.env.VITE_MAP_PROVIDER as string | undefined) ?? DEFAULT_PROVIDER;
  const factory = PROVIDERS[name];
  if (!factory) throw new Error(`Unknown map provider "${name}". Known: ${Object.keys(PROVIDERS).join(', ')}`);
  return factory(el, opts);
}

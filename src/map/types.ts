import type { LatLng } from '../geo';
import type { Space } from '../types';

/**
 * Everything the app needs from a map library. `src/main.ts` only talks to
 * this interface, so swapping Leaflet for MapLibre (or anything else) means
 * writing one new adapter in this folder and registering it in `index.ts`.
 * Nothing outside `src/map/` may import a map library directly.
 */
export interface MapController {
  /** Show exactly these spaces as pins (adds new ones, removes missing ones). */
  setSpaces(spaces: Space[]): void;
  /** Visually emphasize one pin, or none. */
  highlight(id: string | null): void;
  /** Show (or clear, with null) the user's own position. */
  setUser(pos: LatLng | null): void;
  /** Animate to a point. */
  flyTo(pos: LatLng, zoom?: number): void;
  /** Fit the view to a set of spaces, optionally including an extra point. */
  fitSpaces(spaces: Space[], around?: LatLng | null): void;
  /** Current zoom level, in web-mercator zoom units (0 = whole world). */
  getZoom(): number;
  /** Re-read the current light/dark theme and restyle the basemap. */
  refreshTheme(): void;
  /** A pin was tapped or activated by keyboard. */
  onSelect(cb: (id: string) => void): void;
  /** The empty map background was tapped. */
  onBackgroundClick(cb: () => void): void;
  /** Tear down the map and release resources. */
  destroy(): void;
}

export interface MapOptions {
  center: LatLng;
  zoom: number;
}

export type MapFactory = (el: HTMLElement, opts: MapOptions) => MapController;

/** Tile attribution shared by every adapter. */
export const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * OpenStreetMap's standard raster tiles: no key, no watermark. Light use on a
 * small site is within their tile usage policy. There is no dark variant, so
 * adapters darken the light tiles with the `.tiles-dark` CSS filter instead.
 */
export const RASTER_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
} as const;

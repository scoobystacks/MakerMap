import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from './geo';
import type { Space } from './types';
import { currentTheme, type Theme } from './theme';

const TILES: Record<Theme, string> = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const BOSTON: LatLng = { lat: 42.3601, lng: -71.0589 };

export interface MapController {
  map: L.Map;
  setSpaces(spaces: Space[]): void;
  highlight(id: string | null): void;
  setUser(pos: LatLng | null): void;
  flyTo(pos: LatLng, zoom?: number): void;
  fitSpaces(spaces: Space[], around?: LatLng | null): void;
  refreshTheme(): void;
  onSelect(cb: (id: string) => void): void;
}

export function createMap(el: HTMLElement): MapController {
  const map = L.map(el, {
    center: [BOSTON.lat, BOSTON.lng],
    zoom: 12,
    zoomControl: true,
    attributionControl: true,
    tap: false,
  } as L.MapOptions);
  map.zoomControl.setPosition('bottomright');

  let tiles = L.tileLayer(TILES[currentTheme()], { attribution: ATTRIBUTION, maxZoom: 19, subdomains: 'abcd' }).addTo(map);

  const markers = new Map<string, L.Marker>();
  let activeId: string | null = null;
  let userMarker: L.Marker | null = null;
  let selectCb: ((id: string) => void) | null = null;

  const icon = (space: Space, active: boolean) =>
    L.divIcon({
      className: 'pin-wrap',
      html: `<div class="pin ${space.access}${active ? ' active' : ''}" role="img" aria-label="${escapeAttr(space.name)}"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24],
    });

  function setSpaces(spaces: Space[]) {
    const keep = new Set(spaces.map((s) => s.id));
    for (const [id, m] of markers) {
      if (!keep.has(id)) {
        m.remove();
        markers.delete(id);
      }
    }
    for (const s of spaces) {
      if (markers.has(s.id)) continue;
      const m = L.marker([s.lat, s.lng], {
        icon: icon(s, s.id === activeId),
        title: s.name,
        keyboard: true,
        riseOnHover: true,
      });
      m.bindTooltip(`<b>${escapeHtml(s.name)}</b>${escapeHtml(s.city)}`, { direction: 'top', offset: [0, -24], opacity: 0.95 });
      m.on('click', () => selectCb?.(s.id));
      m.on('keypress', (e) => {
        const ke = (e as unknown as { originalEvent: KeyboardEvent }).originalEvent;
        if (ke.key === 'Enter' || ke.key === ' ') selectCb?.(s.id);
      });
      m.addTo(map);
      markers.set(s.id, m);
      (m as unknown as { _space: Space })._space = s;
    }
  }

  function highlight(id: string | null) {
    if (activeId && markers.has(activeId)) {
      const m = markers.get(activeId)!;
      m.setIcon(icon((m as unknown as { _space: Space })._space, false));
      m.setZIndexOffset(0);
    }
    activeId = id;
    if (id && markers.has(id)) {
      const m = markers.get(id)!;
      m.setIcon(icon((m as unknown as { _space: Space })._space, true));
      m.setZIndexOffset(1000);
    }
  }

  function setUser(pos: LatLng | null) {
    if (userMarker) {
      userMarker.remove();
      userMarker = null;
    }
    if (!pos) return;
    userMarker = L.marker([pos.lat, pos.lng], {
      icon: L.divIcon({ className: 'you-wrap', html: '<div class="you-marker" role="img" aria-label="Your location"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
      interactive: false,
      zIndexOffset: 500,
    }).addTo(map);
  }

  function flyTo(pos: LatLng, zoom = 13) {
    map.flyTo([pos.lat, pos.lng], zoom, { duration: 0.6 });
  }

  function fitSpaces(spaces: Space[], around: LatLng | null = null) {
    const pts: L.LatLngExpression[] = spaces.map((s) => [s.lat, s.lng]);
    if (around) pts.push([around.lat, around.lng]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
  }

  function refreshTheme() {
    const url = TILES[currentTheme()];
    tiles.remove();
    tiles = L.tileLayer(url, { attribution: ATTRIBUTION, maxZoom: 19, subdomains: 'abcd' }).addTo(map);
  }

  return {
    map,
    setSpaces,
    highlight,
    setUser,
    flyTo,
    fitSpaces,
    refreshTheme,
    onSelect: (cb) => { selectCb = cb; },
  };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

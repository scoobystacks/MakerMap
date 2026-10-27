import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../geo';
import type { Space } from '../types';
import { currentTheme } from '../theme';
import { escapeHtml } from '../html';
import { ATTRIBUTION, RASTER_TILES, type MapController, type MapOptions } from './types';

/** Leaflet adapter. See `./types.ts` for the contract. */
export function createLeafletMap(el: HTMLElement, opts: MapOptions): MapController {
  const map = L.map(el, {
    center: [opts.center.lat, opts.center.lng],
    zoom: opts.zoom,
    zoomControl: true,
    attributionControl: true,
    tap: false,
  } as L.MapOptions);
  map.zoomControl.setPosition('bottomright');

  const makeTiles = () =>
    L.tileLayer(RASTER_TILES.url, {
      attribution: ATTRIBUTION,
      maxZoom: RASTER_TILES.maxZoom,
      className: currentTheme() === 'dark' ? 'tiles-dark' : '',
    });
  let tiles = makeTiles().addTo(map);

  interface Entry { marker: L.Marker; space: Space }
  const entries = new Map<string, Entry>();
  let activeId: string | null = null;
  let userMarker: L.Marker | null = null;
  let selectCb: ((id: string) => void) | null = null;

  const icon = (space: Space, active: boolean) =>
    L.divIcon({
      className: 'pin-wrap',
      html: `<div class="pin ${space.access}${active ? ' active' : ''}" role="img" aria-label="${escapeHtml(space.name)}"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24],
    });

  function setSpaces(spaces: Space[]) {
    const keep = new Set(spaces.map((s) => s.id));
    for (const [id, e] of entries) {
      if (!keep.has(id)) {
        e.marker.remove();
        entries.delete(id);
      }
    }
    for (const s of spaces) {
      if (entries.has(s.id)) continue;
      const marker = L.marker([s.lat, s.lng], {
        icon: icon(s, s.id === activeId),
        title: s.name,
        keyboard: true,
        riseOnHover: true,
      });
      marker.bindTooltip(`<b>${escapeHtml(s.name)}</b>${escapeHtml(s.city)}`, {
        direction: 'top',
        offset: [0, -24],
        opacity: 0.95,
      });
      marker.on('click', () => selectCb?.(s.id));
      marker.on('keypress', (e) => {
        const ke = (e as unknown as { originalEvent: KeyboardEvent }).originalEvent;
        if (ke.key === 'Enter' || ke.key === ' ') selectCb?.(s.id);
      });
      marker.addTo(map);
      entries.set(s.id, { marker, space: s });
    }
  }

  function highlight(id: string | null) {
    const prev = activeId ? entries.get(activeId) : undefined;
    if (prev) {
      prev.marker.setIcon(icon(prev.space, false));
      prev.marker.setZIndexOffset(0);
    }
    activeId = id;
    const next = id ? entries.get(id) : undefined;
    if (next) {
      next.marker.setIcon(icon(next.space, true));
      next.marker.setZIndexOffset(1000);
    }
  }

  function setUser(pos: LatLng | null) {
    userMarker?.remove();
    userMarker = null;
    if (!pos) return;
    userMarker = L.marker([pos.lat, pos.lng], {
      icon: L.divIcon({
        className: 'you-wrap',
        html: '<div class="you-marker" role="img" aria-label="Your location"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
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
    tiles.remove();
    tiles = makeTiles().addTo(map);
  }

  return {
    setSpaces,
    highlight,
    setUser,
    flyTo,
    fitSpaces,
    getZoom: () => map.getZoom(),
    refreshTheme,
    onSelect: (cb) => { selectCb = cb; },
    onBackgroundClick: (cb) => { map.on('click', cb); },
    destroy: () => map.remove(),
  };
}

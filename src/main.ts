import './style.css';
import rawSpaces from '../data/spaces.json';
import { BOSTON, createMap } from './map/index';
import { geocode, locateUser, withDistance, type LatLng } from './geo';
import { activeFilterCount, applyFilters, emptyFilters, type FilterState, type SortKey } from './filters';
import { initTheme, onSystemThemeChange, toggleTheme } from './theme';
import { REPO_URL, suggestSpaceUrl } from './links';
import {
  $,
  accessCounts,
  renderAccessFilters,
  renderDetail,
  renderEquipmentFilters,
  renderResults,
  renderVenueFilters,
  toast,
} from './ui';
import type { AccessType, EquipmentCategory, Space, SpaceWithDistance, VenueType } from './types';

const spaces = rawSpaces as Space[];
const MI_TO_KM = 1.609344;
const RADIUS_ANY = 51; // slider max means "any distance"

initTheme();

// ---------- State ----------
type RefSource = 'you' | 'search' | 'default';
let refPoint: LatLng = BOSTON;
let refSource: RefSource = 'default';
let refLabel = 'downtown Boston';
const filters: FilterState = emptyFilters();
let activeId: string | null = null;
let visible: SpaceWithDistance[] = [];

// ---------- Elements ----------
const els = {
  map: $('#map'),
  results: $('#results'),
  count: $('#result-count'),
  sort: $<HTMLSelectElement>('#sort'),
  search: $<HTMLInputElement>('#search'),
  locate: $('#locate'),
  filters: $('#filters'),
  filtersToggle: $('#filters-toggle'),
  filtersClose: $('#filters-close'),
  filtersClear: $('#filters-clear'),
  filterCount: $('#filter-count'),
  accessFs: $('#filter-access'),
  equipmentFs: $('#filter-equipment'),
  venueFs: $('#filter-venue'),
  radius: $<HTMLInputElement>('#filter-radius'),
  radiusOut: $('#radius-out'),
  list: $('#list'),
  listToggle: $('#list-toggle'),
  listToggleLabel: $('#list-toggle-label'),
  detail: $('#detail'),
  detailBody: $('#detail-body'),
  detailClose: $('#detail-close'),
  theme: $('#theme-toggle'),
  about: $('#about'),
  aboutLink: $('#about-link'),
  aboutClose: $('#about-close'),
  suggest: $<HTMLAnchorElement>('#suggest-link'),
  source: $<HTMLAnchorElement>('#source-link'),
};

els.suggest.href = suggestSpaceUrl();
els.source.href = REPO_URL;

// ---------- Map ----------
const mapCtl = createMap(els.map);
mapCtl.onSelect((id) => select(id, { pan: false }));

// ---------- Filters UI ----------
renderAccessFilters(els.accessFs, accessCounts(spaces));
renderEquipmentFilters(els.equipmentFs, new Set(spaces.flatMap((s) => s.equipmentCategories)));
renderVenueFilters(els.venueFs, new Set(spaces.map((s) => s.venueType)));

els.filters.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.type !== 'checkbox') return;
  const set =
    input.name === 'access' ? (filters.access as Set<string>)
    : input.name === 'equipment' ? (filters.equipment as Set<string>)
    : input.name === 'venue' ? (filters.venue as Set<string>)
    : null;
  if (!set) return;
  if (input.checked) set.add(input.value);
  else set.delete(input.value);
  update();
});

els.radius.addEventListener('input', () => {
  const v = Number(els.radius.value);
  filters.radiusKm = v >= RADIUS_ANY ? null : v * MI_TO_KM;
  els.radiusOut.textContent = v >= RADIUS_ANY ? 'any distance' : `${v} mi`;
  update();
});

els.filtersToggle.addEventListener('click', () => setFiltersOpen(els.filters.hidden));
els.filtersClose.addEventListener('click', () => setFiltersOpen(false));
els.filtersClear.addEventListener('click', () => {
  filters.access.clear();
  filters.equipment.clear();
  filters.venue.clear();
  filters.radiusKm = null;
  els.radius.value = String(RADIUS_ANY);
  els.radiusOut.textContent = 'any distance';
  els.filters.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((c) => { c.checked = false; });
  update();
});

function setFiltersOpen(open: boolean) {
  els.filters.hidden = !open;
  els.filtersToggle.setAttribute('aria-expanded', String(open));
  if (open) closeDetail();
}

// ---------- Sort & search ----------
els.sort.addEventListener('change', () => {
  filters.sort = els.sort.value as SortKey;
  update();
});

let searchTimer: number | undefined;
els.search.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    filters.query = els.search.value;
    update();
    if (filters.query && window.innerWidth < 800) setListOpen(true);
  }, 120);
});
els.search.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  const q = els.search.value.trim();
  if (!q) return;
  // If the text already matches a space, treat Enter as "pick the first match".
  filters.query = q;
  const matches = applyFilters(withDistance(spaces, refPoint), { ...filters, radiusKm: null });
  if (matches.length > 0) {
    update();
    select(matches[0].id, { pan: true });
    return;
  }
  // Otherwise treat it as a place name: geocode and move the reference point.
  els.search.disabled = true;
  try {
    const hit = await geocode(q);
    if (!hit) {
      toast(`Couldn't find "${q}".`);
      return;
    }
    filters.query = '';
    els.search.value = '';
    setReference(hit, 'search', hit.label.split(',').slice(0, 2).join(','));
    update();
    mapCtl.flyTo(hit, 12);
    toast(`Showing spaces near ${refLabel}.`);
  } catch {
    toast('Place search is unavailable right now.');
  } finally {
    els.search.disabled = false;
    els.search.focus();
  }
});

// ---------- Location ----------
els.locate.addEventListener('click', () => requestLocation(true));

async function requestLocation(fromUser: boolean) {
  els.locate.classList.add('active');
  try {
    const pos = await locateUser();
    setReference(pos, 'you', 'your location');
    update();
    mapCtl.setUser(pos);
    focusAround(pos);
    if (fromUser) toast('Centered on your location.');
  } catch {
    if (fromUser) toast('Location unavailable. Check your browser permissions.');
    else toast('Showing Boston. Tap the target icon to use your location.', 4500);
    if (refSource !== 'you') {
      setReference(BOSTON, 'default', 'downtown Boston');
      update();
      focusAround(BOSTON);
    }
  } finally {
    els.locate.classList.toggle('active', refSource === 'you');
  }
}

function setReference(pos: LatLng, source: RefSource, label: string) {
  refPoint = pos;
  refSource = source;
  refLabel = label;
  if (source !== 'you') mapCtl.setUser(null);
}

/** Fit the map to the nearest handful of visible spaces plus the reference point. */
function focusAround(pos: LatLng) {
  const nearest = visible.slice().sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)).slice(0, 6);
  if (nearest.length) mapCtl.fitSpaces(nearest, pos);
  else mapCtl.flyTo(pos, 12);
}

// ---------- Render ----------
function update() {
  visible = applyFilters(withDistance(spaces, refPoint), filters);
  mapCtl.setSpaces(visible);
  renderResults(els.results, visible, activeId);
  const n = activeFilterCount(filters);
  els.filterCount.hidden = n === 0;
  els.filterCount.textContent = String(n);
  const from = refSource === 'default' ? 'Distances from downtown Boston' : `Distances from ${refLabel}`;
  els.count.textContent = `${visible.length} of ${spaces.length} space${spaces.length === 1 ? '' : 's'} · ${from}`;
  if (activeId && !visible.some((s) => s.id === activeId)) closeDetail();
}

els.results.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.result');
  if (btn?.dataset.id) select(btn.dataset.id, { pan: true });
});

// ---------- Detail panel ----------
function select(id: string, opts: { pan: boolean }) {
  const s = visible.find((x) => x.id === id) ?? withDistance(spaces, refPoint).find((x) => x.id === id);
  if (!s) return;
  activeId = id;
  mapCtl.highlight(id);
  renderDetail(els.detailBody, s);
  els.detail.hidden = false;
  els.detail.querySelector('.detail-inner')?.scrollTo(0, 0);
  els.results.querySelectorAll('.result').forEach((b) => {
    const on = (b as HTMLElement).dataset.id === id;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  if (window.innerWidth < 800) setListOpen(false);
  setFiltersOpen(false);
  if (opts.pan) mapCtl.flyTo({ lat: s.lat, lng: s.lng }, Math.max(mapCtl.getZoom(), 14));
  history.replaceState(null, '', `#space=${encodeURIComponent(id)}`);
}

function closeDetail() {
  if (els.detail.hidden) return;
  els.detail.hidden = true;
  activeId = null;
  mapCtl.highlight(null);
  els.results.querySelectorAll('.result.active').forEach((b) => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  history.replaceState(null, '', location.pathname + location.search);
}
els.detailClose.addEventListener('click', closeDetail);
mapCtl.onBackgroundClick(closeDetail);

// ---------- Mobile list sheet ----------
function setListOpen(open: boolean) {
  els.list.classList.toggle('open', open);
  els.listToggle.setAttribute('aria-expanded', String(open));
  els.listToggleLabel.textContent = open ? 'Show map' : 'Show list';
  if (open) closeDetail();
}
els.listToggle.addEventListener('click', () => setListOpen(!els.list.classList.contains('open')));

// ---------- Theme ----------
els.theme.addEventListener('click', () => {
  toggleTheme();
  mapCtl.refreshTheme();
});
onSystemThemeChange(() => mapCtl.refreshTheme());

// ---------- About ----------
els.aboutLink.addEventListener('click', (e) => {
  e.preventDefault();
  els.about.hidden = false;
  els.aboutClose.focus();
});
els.aboutClose.addEventListener('click', () => { els.about.hidden = true; });
els.about.addEventListener('click', (e) => {
  if (e.target === els.about) els.about.hidden = true;
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!els.about.hidden) els.about.hidden = true;
  else if (!els.filters.hidden) setFiltersOpen(false);
  else if (!els.detail.hidden) closeDetail();
});

// ---------- Boot ----------
update();
const hashId = new URLSearchParams(location.hash.slice(1)).get('space');
if (hashId && spaces.some((s) => s.id === hashId)) {
  select(hashId, { pan: true });
  // Still fetch location for distances, but don't move the map away from the linked space.
  locateUser().then((pos) => {
    setReference(pos, 'you', 'your location');
    mapCtl.setUser(pos);
    els.locate.classList.add('active');
    update();
  }).catch(() => { /* keep default */ });
} else {
  mapCtl.fitSpaces(visible, BOSTON);
  requestLocation(false);
}

// Keep TypeScript aware of the narrow string unions used in the filter sets.
export type { AccessType, EquipmentCategory, VenueType };

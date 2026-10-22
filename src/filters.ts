import type { AccessType, EquipmentCategory, SpaceWithDistance, VenueType } from './types';

export type SortKey = 'distance' | 'name' | 'access';

export interface FilterState {
  access: Set<AccessType>;
  equipment: Set<EquipmentCategory>;
  venue: Set<VenueType>;
  /** Max distance in km, or null for unlimited. */
  radiusKm: number | null;
  query: string;
  sort: SortKey;
}

export function emptyFilters(): FilterState {
  return {
    access: new Set(),
    equipment: new Set(),
    venue: new Set(),
    radiusKm: null,
    query: '',
    sort: 'distance',
  };
}

export function activeFilterCount(f: FilterState): number {
  return (
    (f.access.size ? 1 : 0) +
    (f.equipment.size ? 1 : 0) +
    (f.venue.size ? 1 : 0) +
    (f.radiusKm !== null ? 1 : 0)
  );
}

const ACCESS_ORDER: Record<AccessType, number> = { free: 0, paid: 1, restricted: 2 };

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesQuery(s: SpaceWithDistance, q: string): boolean {
  if (!q) return true;
  const hay = normalize(
    [s.name, s.city, s.address, s.affiliation ?? '', s.description, ...s.equipment, ...s.equipmentCategories].join(' '),
  );
  return q.split(/\s+/).every((term) => hay.includes(term));
}

export function applyFilters(spaces: SpaceWithDistance[], f: FilterState): SpaceWithDistance[] {
  const q = normalize(f.query.trim());
  const out = spaces.filter((s) => {
    if (f.access.size && !f.access.has(s.access)) return false;
    if (f.venue.size && !f.venue.has(s.venueType)) return false;
    if (f.equipment.size && !s.equipmentCategories.some((c) => f.equipment.has(c))) return false;
    if (f.radiusKm !== null && s.distanceKm !== null && s.distanceKm > f.radiusKm) return false;
    if (!matchesQuery(s, q)) return false;
    return true;
  });
  out.sort((a, b) => {
    switch (f.sort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'access':
        return ACCESS_ORDER[a.access] - ACCESS_ORDER[b.access] || cmpDistance(a, b) || a.name.localeCompare(b.name);
      case 'distance':
      default:
        return cmpDistance(a, b) || a.name.localeCompare(b.name);
    }
  });
  return out;
}

function cmpDistance(a: SpaceWithDistance, b: SpaceWithDistance): number {
  if (a.distanceKm === null && b.distanceKm === null) return 0;
  if (a.distanceKm === null) return 1;
  if (b.distanceKm === null) return -1;
  return a.distanceKm - b.distanceKm;
}

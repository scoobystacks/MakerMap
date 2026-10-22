import type { Space } from './types';

export const REPO_URL = 'https://github.com/scoobystacks/MakerMap';

export function suggestSpaceUrl(): string {
  return `${REPO_URL}/issues/new?template=suggest-space.yml&labels=new-space`;
}

export function reportCorrectionUrl(space: Space): string {
  const u = new URL(`${REPO_URL}/issues/new`);
  u.searchParams.set('template', 'report-correction.yml');
  u.searchParams.set('labels', 'correction');
  u.searchParams.set('title', `Correction: ${space.name}`);
  u.searchParams.set('space', `${space.name} (${space.id})`);
  return u.toString();
}

export function googleMapsUrl(space: Space): string {
  if (space.googleMapsUrl) return space.googleMapsUrl;
  const q = encodeURIComponent(`${space.name}, ${space.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function directionsUrl(space: Space): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(space.address)}`;
}

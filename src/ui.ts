import { formatDistance } from './geo';
import { escapeHtml } from './html';
import { directionsUrl, googleMapsUrl, reportCorrectionUrl } from './links';
import {
  ACCESS_DESCRIPTIONS,
  ACCESS_LABELS,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_LABELS,
  VENUE_LABELS,
  type AccessType,
  type EquipmentCategory,
  type Space,
  type SpaceWithDistance,
  type VenueType,
} from './types';

export function $<T extends HTMLElement = HTMLElement>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element ${sel}`);
  return el;
}

function tag(label: string): string {
  return `<span class="tag">${escapeHtml(label)}</span>`;
}

export function renderResults(list: HTMLElement, spaces: SpaceWithDistance[], activeId: string | null): void {
  if (spaces.length === 0) {
    list.innerHTML = `<li class="empty">No spaces match. Try widening the distance or clearing a filter.</li>`;
    return;
  }
  list.innerHTML = spaces
    .map((s) => {
      const cats = s.equipmentCategories.slice(0, 4).map((c) => tag(EQUIPMENT_LABELS[c])).join('');
      const more = s.equipmentCategories.length > 4 ? tag(`+${s.equipmentCategories.length - 4}`) : '';
      const meta = [ACCESS_LABELS[s.access], s.affiliation ?? VENUE_LABELS[s.venueType], s.city].filter(Boolean).join(' · ');
      return `<li>
        <button class="result${s.id === activeId ? ' active' : ''}" type="button" data-id="${s.id}" aria-pressed="${s.id === activeId}">
          <span class="dot dot-${s.access}" aria-hidden="true"></span>
          <span>
            <span class="result-name">${escapeHtml(s.name)}</span>
            <span class="result-meta">${escapeHtml(meta)}</span>
            <span class="result-tags">${cats}${more}</span>
          </span>
          <span class="result-dist">${formatDistance(s.distanceKm)}</span>
        </button>
      </li>`;
    })
    .join('');
}

function link(href: string, label: string, cls = ''): string {
  return `<a class="${cls}" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

export function renderDetail(body: HTMLElement, s: SpaceWithDistance): void {
  const now = new Date().getFullYear();
  const operating =
    s.founded !== null
      ? `Since ${s.founded}${now - s.founded >= 1 ? ` (about ${now - s.founded} year${now - s.founded === 1 ? '' : 's'})` : ''}${s.foundedNote ? ` <small class="muted">· ${escapeHtml(s.foundedNote)}</small>` : ''}`
      : 'Unknown';
  const who = s.affiliation ? `${escapeHtml(s.affiliation)} · ` : '';
  const dist = s.distanceKm !== null ? ` · ${formatDistance(s.distanceKm)} away` : '';
  const cats = s.equipmentCategories.map((c) => tag(EQUIPMENT_LABELS[c])).join('');
  const equipment = s.equipment.length
    ? `<ul class="equip">${s.equipment.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
    : '<em>Not listed. Check the website.</em>';
  const contact = [
    s.phone ? `<a href="tel:${escapeHtml(s.phone.replace(/[^+\d]/g, ''))}">${escapeHtml(s.phone)}</a>` : '',
    s.email ? `<a href="mailto:${escapeHtml(s.email)}">${escapeHtml(s.email)}</a>` : '',
  ].filter(Boolean).join(' · ');

  body.innerHTML = `
    <h2 id="detail-title">${escapeHtml(s.name)}</h2>
    <div class="subtitle">${who}${escapeHtml(VENUE_LABELS[s.venueType])} · ${escapeHtml(s.city)}, ${escapeHtml(s.state)}${dist}</div>
    <div class="pills">
      <span class="access-pill ${s.access}"><span class="dot dot-${s.access}" style="border-color:transparent;box-shadow:none"></span>${ACCESS_LABELS[s.access]}</span>
    </div>
    <p>${escapeHtml(s.description)}</p>
    <div class="actions">
      ${link(s.website, 'Website', 'btn btn-sm btn-primary')}
      ${link(googleMapsUrl(s), 'Google Maps', 'btn btn-sm')}
      ${link(directionsUrl(s), 'Directions', 'btn btn-sm')}
    </div>
    <dl>
      <div>
        <dt>How to get access</dt>
        <dd>${escapeHtml(s.accessSummary)}${s.eligibility ? `<br><small class="muted">Who: ${escapeHtml(s.eligibility)}</small>` : ''}${s.accessUrl ? `<br>${link(s.accessUrl, 'Access details →')}` : ''}</dd>
      </div>
      <div>
        <dt>Equipment</dt>
        <dd><div class="result-tags" style="margin:0 0 6px">${cats}</div>${equipment}${s.equipmentUrl ? `<div>${link(s.equipmentUrl, 'Full equipment list →')}</div>` : ''}</dd>
      </div>
      <div>
        <dt>Hours</dt>
        <dd>${s.hours ? escapeHtml(s.hours) : 'See website'}${s.hoursUrl ? `<br>${link(s.hoursUrl, 'Current hours →')}` : ''}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>${escapeHtml(s.address)}</dd>
      </div>
      <div>
        <dt>Operating</dt>
        <dd>${operating}</dd>
      </div>
      ${contact ? `<div><dt>Contact</dt><dd>${contact}</dd></div>` : ''}
    </dl>
    <div class="footer">
      Last verified ${escapeHtml(s.lastVerified)}. Hours and prices change; confirm before visiting.<br>
      ${link(reportCorrectionUrl(s), 'Report a correction')}
      ${s.sources.length ? `<details><summary>Sources</summary><ul>${s.sources.map((u) => `<li>${link(u, shortUrl(u))}</li>`).join('')}</ul></details>` : ''}
    </div>`;
}

function shortUrl(u: string): string {
  try {
    const x = new URL(u);
    const path = x.pathname.length > 40 ? x.pathname.slice(0, 38) + '…' : x.pathname;
    return x.hostname.replace(/^www\./, '') + (path === '/' ? '' : path);
  } catch {
    return u;
  }
}

export function renderAccessFilters(fs: HTMLElement, counts: Record<AccessType, number>): void {
  const html = (Object.keys(ACCESS_LABELS) as AccessType[])
    .map(
      (a) => `<label class="check">
        <input type="checkbox" name="access" value="${a}">
        <span class="dot dot-${a}" aria-hidden="true"></span>
        <span><strong>${ACCESS_LABELS[a]}</strong> <span class="muted">(${counts[a] ?? 0})</span><small>${ACCESS_DESCRIPTIONS[a]}</small></span>
      </label>`,
    )
    .join('');
  fs.insertAdjacentHTML('beforeend', html);
}

export function renderEquipmentFilters(fs: HTMLElement, present: Set<EquipmentCategory>): void {
  const cats = EQUIPMENT_CATEGORIES.filter((c) => present.has(c));
  const html = `<div class="chips">${cats
    .map((c) => `<label class="chip"><input type="checkbox" name="equipment" value="${c}">${EQUIPMENT_LABELS[c]}</label>`)
    .join('')}</div>`;
  fs.insertAdjacentHTML('beforeend', html);
}

export function renderVenueFilters(fs: HTMLElement, present: Set<VenueType>): void {
  const kinds = (Object.keys(VENUE_LABELS) as VenueType[]).filter((v) => present.has(v));
  const html = `<div class="chips">${kinds
    .map((v) => `<label class="chip"><input type="checkbox" name="venue" value="${v}">${VENUE_LABELS[v]}</label>`)
    .join('')}</div>`;
  fs.insertAdjacentHTML('beforeend', html);
}

export function accessCounts(spaces: Space[]): Record<AccessType, number> {
  const c: Record<AccessType, number> = { free: 0, paid: 0, restricted: 0 };
  for (const s of spaces) c[s.access]++;
  return c;
}

let toastTimer: number | undefined;
export function toast(msg: string, ms = 3500): void {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.hidden = true; }, ms);
}

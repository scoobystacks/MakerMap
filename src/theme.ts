export type Theme = 'light' | 'dark';

const KEY = 'maker-map-theme';

export function currentTheme(): Theme {
  const forced = document.documentElement.dataset.theme as Theme | undefined;
  if (forced === 'light' || forced === 'dark') return forced;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function initTheme(): void {
  let saved: string | null = null;
  try { saved = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch { /* storage blocked */ }
  return next;
}

export function onSystemThemeChange(cb: () => void): void {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!document.documentElement.dataset.theme) cb();
  });
}

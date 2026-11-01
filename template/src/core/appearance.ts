import { APPEARANCE_KEY, type Appearance } from './storage';

function applyAppearance(value: Appearance): void {
  if (value === 'system') {
    delete document.documentElement.dataset.appearance;
  } else {
    document.documentElement.dataset.appearance = value;
  }
}

export async function initializeAppearance(): Promise<void> {
  const stored = await chrome.storage.local.get(APPEARANCE_KEY);
  const initial = stored[APPEARANCE_KEY] as Appearance | undefined;
  applyAppearance(initial === 'dark' || initial === 'light' ? initial : 'system');

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[APPEARANCE_KEY]) return;
    const value = changes[APPEARANCE_KEY].newValue as Appearance;
    applyAppearance(value === 'light' || value === 'dark' ? value : 'system');
  });
}

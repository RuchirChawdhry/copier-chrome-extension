import type { SavedItem } from './items';

export const ITEMS_KEY = 'savedItems';
export const APPEARANCE_KEY = 'appearance';

export type Appearance = 'system' | 'light' | 'dark';

export async function getItems(): Promise<SavedItem[]> {
  const record = await chrome.storage.local.get(ITEMS_KEY);
  return (record[ITEMS_KEY] as SavedItem[] | undefined) ?? [];
}

export async function setItems(items: SavedItem[]): Promise<void> {
  await chrome.storage.local.set({ [ITEMS_KEY]: items });
}

export function subscribeToItems(onChange: () => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[ITEMS_KEY]) onChange();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

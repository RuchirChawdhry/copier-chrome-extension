export interface SavedItem {
  id: string;
  url: string;
  title: string;
  createdAt: number;
}

export function addItem(
  items: SavedItem[],
  input: { url: string; title?: string },
  id: string,
  now: number
): SavedItem[] {
  const url = new URL(input.url).href;
  if (!['http:', 'https:'].includes(new URL(url).protocol)) {
    throw new Error('Only HTTP(S) links can be saved');
  }
  if (items.some((item) => item.url === url)) return items;
  return [{ id, url, title: input.title?.trim() || url, createdAt: now }, ...items];
}

export function removeItem(items: SavedItem[], id: string): SavedItem[] {
  return items.filter((item) => item.id !== id);
}

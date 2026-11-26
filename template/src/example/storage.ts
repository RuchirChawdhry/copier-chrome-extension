import { isRecord } from '../core/messages';
import { createStorage } from '../core/storage';
import type { SavedItem } from './items';

function isSavedItem(value: unknown): value is SavedItem {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.url !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.createdAt !== 'number' ||
    !Number.isFinite(value.createdAt)
  )
    return false;
  try {
    return ['http:', 'https:'].includes(new URL(value.url).protocol);
  } catch {
    return false;
  }
}

export const exampleStorage = createStorage<{ 'example.links': SavedItem[] }>({
  'example.links': {
    default: () => [],
    validate: (value): value is SavedItem[] =>
      Array.isArray(value) && value.every(isSavedItem),
  },
});

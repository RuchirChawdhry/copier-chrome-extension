import { createClient } from '../core/client';
import type { SavedItem } from './items';

export type AddItem = { url: string; title?: string };
export type RemoveItem = { id: string };

export type ExampleContract = {
  'items.add': { input: AddItem; output: SavedItem[] };
  'items.remove': { input: RemoveItem; output: SavedItem[] };
  'items.list': { input: null; output: SavedItem[] };
};

export const send = createClient<ExampleContract>();

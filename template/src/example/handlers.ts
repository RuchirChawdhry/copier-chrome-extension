import { createLogger } from '../core/logger';
import { isRecord } from '../core/messages';
import { createQueue } from '../core/queue';
import { createRouter, route } from '../core/router';
import { addItem, removeItem } from './items';
import type { AddItem, ExampleContract, RemoveItem } from './messages';
import { exampleStorage } from './storage';

const enqueue = createQueue();

export function saveItem(input: AddItem) {
  return enqueue(async () => {
    const previous = await exampleStorage.get('savedItems');
    const next = addItem(previous, input, crypto.randomUUID(), Date.now());
    if (next !== previous) await exampleStorage.set('savedItems', next);
    return next;
  });
}

export function deleteItem(input: RemoveItem) {
  return enqueue(async () => {
    const next = removeItem(await exampleStorage.get('savedItems'), input.id);
    await exampleStorage.set('savedItems', next);
    return next;
  });
}

export const dispatchExample = createRouter<ExampleContract>(
  {
    'items.add': route(
      (value): value is AddItem =>
        isRecord(value) &&
        typeof value.url === 'string' &&
        (value.title === undefined || typeof value.title === 'string'),
      saveItem,
    ),
    'items.remove': route(
      (value): value is RemoveItem =>
        isRecord(value) && typeof value.id === 'string',
      deleteItem,
    ),
    'items.list': route(
      (value): value is null => value === null,
      () => enqueue(() => exampleStorage.get('savedItems')),
    ),
  },
  createLogger('worker:rpc'),
);

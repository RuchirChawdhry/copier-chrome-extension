import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createStorage } from '../../src/core/storage';

const storage = createStorage<{ count: number }>({
  count: { default: () => 0, validate: (value): value is number => typeof value === 'number' },
});
type Listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;
const listeners = new Set<Listener>();
const get = vi.fn();
const set = vi.fn();
function emit(value: unknown, area = 'local') {
  for (const listener of listeners) listener({ count: { newValue: value } }, area);
}

beforeEach(() => {
  get.mockReset().mockResolvedValue({});
  set.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal('chrome', { storage: {
    local: { get, set },
    onChanged: { addListener: (listener: Listener) => listeners.add(listener), removeListener: (listener: Listener) => listeners.delete(listener) },
  } });
});
afterEach(() => { listeners.clear(); vi.unstubAllGlobals(); });

describe('typed storage', () => {
  it('uses defaults for missing or invalid data and validates writes', async () => {
    expectTypeOf(storage.get<'count'>).returns.toEqualTypeOf<Promise<number>>();
    expect(await storage.get('count')).toBe(0);
    get.mockResolvedValue({ count: 'invalid' });
    expect(await storage.get('count')).toBe(0);
    await storage.set('count', 7);
    expect(set).toHaveBeenCalledWith({ count: 7 });
  });

  it('consumes event values without rereading, resets removed keys, and unsubscribes', () => {
    const update = vi.fn();
    const stop = storage.subscribe('count', update);
    emit(5, 'sync');
    emit(6);
    emit(undefined);
    stop();
    emit(7);
    expect(update.mock.calls).toEqual([[6], [0]]);
    expect(get).not.toHaveBeenCalled();
    expect(listeners.size).toBe(0);
  });

  it('never overwrites a newer change with a stale initial read', async () => {
    let finish!: (value: { count: number }) => void;
    get.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const update = vi.fn();
    const stop = storage.observe('count', update, vi.fn());
    emit(9);
    finish({ count: 1 });
    await Promise.resolve();
    await Promise.resolve();
    expect(update.mock.calls).toEqual([[9]]);
    stop();
  });
});

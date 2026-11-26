import { describe, expect, it } from 'vitest';
import { addItem, removeItem } from '../../src/core/items';

describe('saved item operations', () => {
  const sample = { url: 'https://example.com/watch?v=1', title: 'Example' };

  it('adds the newest entry first', () => {
    const entries = addItem([], sample, 'id-1', 123);
    expect(entries).toEqual([{
      id: 'id-1', url: sample.url, title: 'Example', createdAt: 123
    }]);
  });

  it('deduplicates canonical URLs', () => {
    const original = addItem([], sample, 'id-1', 123);
    expect(addItem(original, sample, 'id-2', 456)).toBe(original);
  });

  it('removes only the selected item', () => {
    const entries = addItem([], sample, 'id-1', 123);
    expect(removeItem(entries, 'id-1')).toEqual([]);
  });

  it('rejects non-web schemes', () => {
    expect(() => addItem([], { url: 'javascript:alert(1)' }, 'id', 123)).toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { createQueue } from '../../src/core/queue';

describe('serialized mutation queue', () => {
  it('preserves ordering and continues after a failure', async () => {
    const enqueue = createQueue();
    const events: number[] = [];
    const first = enqueue(async () => { await Promise.resolve(); events.push(1); throw new Error('failed'); });
    const second = enqueue(async () => { events.push(2); return 2; });
    await expect(first).rejects.toThrow('failed');
    await expect(second).resolves.toBe(2);
    expect(events).toEqual([1, 2]);
  });
});

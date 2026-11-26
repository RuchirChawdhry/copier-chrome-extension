import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createClient } from '../../src/core/client';
import { createLogger } from '../../src/core/logger';
import { RPC_CHANNEL } from '../../src/core/messages';
import { createRouter, route } from '../../src/core/router';

type Demo = { double: { input: number; output: number } };
const logger = createLogger('test', false);
const dispatch = createRouter<Demo>(
  {
    double: route(
      (value): value is number => typeof value === 'number',
      (value) => value * 2,
    ),
  },
  logger,
);

describe('typed RPC', () => {
  it('infers result and validates requests', async () => {
    const send = createClient<Demo>();
    expectTypeOf(send<'double'>)
      .parameter(1)
      .toEqualTypeOf<number>();
    expectTypeOf(send<'double'>).returns.toEqualTypeOf<Promise<number>>();
    expect(
      await dispatch({ channel: RPC_CHANNEL, method: 'double', params: 4 }),
    ).toEqual({ ok: true, value: 8 });
    expect(
      await dispatch({ channel: RPC_CHANNEL, method: 'double', params: '4' }),
    ).toMatchObject({ ok: false });
    expect(
      await dispatch({
        channel: RPC_CHANNEL,
        method: 'constructor',
        params: 4,
      }),
    ).toMatchObject({ ok: false });
  });

  it('handles typed responses and failures at the client boundary', async () => {
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: 8 })
      .mockResolvedValueOnce({ ok: false, error: 'Rejected' })
      .mockResolvedValueOnce(null);
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    try {
      const send = createClient<Demo>();
      expect(await send('double', 4)).toBe(8);
      expect(sendMessage).toHaveBeenCalledWith({
        channel: RPC_CHANNEL,
        method: 'double',
        params: 4,
      });
      await expect(send('double', 4)).rejects.toThrow('Rejected');
      await expect(send('double', 4)).rejects.toThrow(
        'Invalid extension RPC response',
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

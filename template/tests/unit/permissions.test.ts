import { describe, expect, it, vi } from 'vitest';
import { observePermission, permissions } from '../../src/core/permissions';

describe('optional permissions', () => {
  it('requests synchronously, handles denial and removes access', async () => {
    const request = vi.fn().mockResolvedValue(false);
    const remove = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('chrome', { permissions: { request, remove } });
    try {
      const permission: chrome.permissions.Permissions = { permissions: ['notifications'] };
      const result = permissions.request(permission);
      expect(request).toHaveBeenCalledWith(permission);
      await expect(result).resolves.toBe(false);
      await expect(permissions.remove(permission)).resolves.toBe(true);
    } finally { vi.unstubAllGlobals(); }
  });
  it('refreshes grants and revocations, then unsubscribes', async () => {
    const listeners = new Set<() => void>();
    const event = { addListener: (listener: () => void) => listeners.add(listener), removeListener: (listener: () => void) => listeners.delete(listener) };
    const contains = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.stubGlobal('chrome', { permissions: { contains, onAdded: event, onRemoved: event } });
    try {
      const update = vi.fn();
      const stop = observePermission({ permissions: ['notifications'] }, update, vi.fn());
      await Promise.resolve();
      for (const listener of listeners) listener();
      await Promise.resolve();
      for (const listener of listeners) listener();
      await Promise.resolve();
      expect(update.mock.calls).toEqual([[false], [true], [false]]);
      stop();
      expect(listeners.size).toBe(0);
    } finally { vi.unstubAllGlobals(); }
  });
});

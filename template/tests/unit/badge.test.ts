import { describe, expect, it, vi } from 'vitest';
import { badgeText, setCountBadge } from '../../src/core/badge';

describe('toolbar badge', () => {
  it('clears zero and caps long counts', () => {
    expect(badgeText(0)).toBe('');
    expect(badgeText(12)).toBe('12');
    expect(badgeText(1000)).toBe('999+');
  });
  it('updates native action badge', async () => {
    const setBadgeText = vi.fn().mockResolvedValue(undefined);
    const setBadgeBackgroundColor = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('chrome', { action: { setBadgeText, setBadgeBackgroundColor } });
    try {
      await setCountBadge(4);
      expect(setBadgeText).toHaveBeenCalledWith({ text: '4' });
      expect(setBadgeBackgroundColor).toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});

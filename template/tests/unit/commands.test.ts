import { describe, expect, it, vi } from 'vitest';
import { registerExampleCommands } from '../../src/example/commands';
import { saveItem } from '../../src/example/handlers';

vi.mock('../../src/example/handlers', () => ({
  saveItem: vi.fn().mockResolvedValue([]),
}));

describe('keyboard command handler', () => {
  it('saves the active page only for the registered command', () => {
    const addListener = vi.fn();
    vi.stubGlobal('chrome', { commands: { onCommand: { addListener } } });
    try {
      registerExampleCommands();
      const listener = addListener.mock.calls[0][0];
      listener('other', { url: 'https://example.com/' });
      listener('save-active-page', undefined);
      expect(saveItem).not.toHaveBeenCalled();
      listener('save-active-page', {
        url: 'https://example.com/',
        title: 'Example',
      });
      expect(saveItem).toHaveBeenCalledWith({
        url: 'https://example.com/',
        title: 'Example',
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

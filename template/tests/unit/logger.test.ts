import { describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../src/core/logger';

describe('context-aware logger', () => {
  it('suppresses production debug/info and retains warnings and errors', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const production = createLogger('popup', false);
      production.debug('hidden');
      production.info('hidden');
      production.warn('warning');
      production.error('failure');
      expect(debug).not.toHaveBeenCalled();
      expect(info).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[popup] WARN'), 'warning');
      expect(error).toHaveBeenCalledWith(expect.stringContaining('[popup] ERROR'), 'failure');
      createLogger('worker', true).debug('started');
      expect(debug).toHaveBeenCalledWith(expect.stringContaining('[worker] DEBUG'), 'started');
    } finally { vi.restoreAllMocks(); }
  });
});

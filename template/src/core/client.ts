import { type Contract, isRecord, RPC_CHANNEL } from './messages';

export function createClient<C extends Contract>() {
  return async function send<K extends keyof C & string>(
    method: K,
    params: C[K]['input'],
  ): Promise<C[K]['output']> {
    const response: unknown = await chrome.runtime.sendMessage({
      channel: RPC_CHANNEL,
      method,
      params,
    });
    if (isRecord(response)) {
      if (response.ok === true && 'value' in response)
        return response.value as C[K]['output'];
      if (response.ok === false && typeof response.error === 'string')
        throw new Error(response.error);
    }
    throw new Error('Invalid extension RPC response');
  };
}

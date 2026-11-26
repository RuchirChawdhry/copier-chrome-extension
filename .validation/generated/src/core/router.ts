import { errorMessage, type Logger } from './logger';
import { type Contract, isRecord, type Result, RPC_CHANNEL } from './messages';

type Route<I, O> = {
  validate: (value: unknown) => value is I;
  handle: (input: I) => O | Promise<O>;
  invoke: (input: unknown) => Promise<O>;
};

export function route<I, O>(
  validate: (value: unknown) => value is I,
  handle: (input: I) => O | Promise<O>,
): Route<I, O> {
  return {
    validate,
    handle,
    async invoke(input) {
      if (!validate(input)) throw new Error('Invalid request parameters');
      return handle(input);
    },
  };
}

export function createRouter<C extends Contract>(
  routes: { [K in keyof C]: Route<C[K]['input'], C[K]['output']> },
  logger: Logger,
) {
  return async (message: unknown): Promise<Result<unknown>> => {
    if (
      !isRecord(message) ||
      message.channel !== RPC_CHANNEL ||
      typeof message.method !== 'string' ||
      !Object.hasOwn(routes, message.method)
    )
      return { ok: false, error: 'Unknown extension request' };

    try {
      const result = await routes[message.method as keyof C].invoke(
        message.params,
      );
      return { ok: true, value: result };
    } catch (error) {
      logger.warn('RPC request rejected');
      return { ok: false, error: errorMessage(error) };
    }
  };
}

export function registerRouter(
  dispatch: (message: unknown) => Promise<Result<unknown>>,
) {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, respond) => {
    if (!isRecord(message) || message.channel !== RPC_CHANNEL) return false;
    void dispatch(message).then(respond);
    return true;
  });
}

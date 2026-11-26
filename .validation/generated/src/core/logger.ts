export function createLogger(
  context: string,
  development = typeof __DEV__ !== 'undefined' && __DEV__,
) {
  const prefix = (level: string) =>
    `${new Date().toISOString()} [${context}] ${level}`;
  return {
    debug: (message: string) => {
      if (development) console.debug(prefix('DEBUG'), message);
    },
    info: (message: string) => {
      if (development) console.info(prefix('INFO'), message);
    },
    warn: (message: string) => console.warn(prefix('WARN'), message),
    error: (message: string) => console.error(prefix('ERROR'), message),
  };
}

export type Logger = ReturnType<typeof createLogger>;

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

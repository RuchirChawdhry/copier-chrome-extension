type Field<T> = {
  default: () => T;
  validate: (value: unknown) => value is T;
};

export function createStorage<S extends Record<string, unknown>>(
  schema: { [K in keyof S]: Field<S[K]> },
) {
  function decode<K extends keyof S & string>(key: K, value: unknown): S[K] {
    const field = schema[key];
    return field.validate(value) ? value : field.default();
  }

  async function get<K extends keyof S & string>(key: K): Promise<S[K]> {
    const record = await chrome.storage.local.get(key);
    return decode(key, record[key]);
  }

  async function set<K extends keyof S & string>(
    key: K,
    value: S[K],
  ): Promise<void> {
    if (!schema[key].validate(value))
      throw new Error(`Invalid storage value: ${key}`);
    await chrome.storage.local.set({ [key]: value });
  }

  function subscribe<K extends keyof S & string>(
    key: K,
    onChange: (value: S[K]) => void,
  ): () => void {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && Object.hasOwn(changes, key))
        onChange(decode(key, changes[key].newValue));
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  // Subscribe before reading; never let an older initial read replace a newer event.
  function observe<K extends keyof S & string>(
    key: K,
    onChange: (value: S[K]) => void,
    onError: (error: unknown) => void,
  ): () => void {
    let active = true;
    let changed = false;
    const unsubscribe = subscribe(key, (value) => {
      changed = true;
      onChange(value);
    });
    void get(key).then(
      (value) => {
        if (active && !changed) onChange(value);
      },
      (error: unknown) => {
        if (active && !changed) onError(error);
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }

  return {
    get,
    set,
    subscribe,
    observe,
    defaultValue: <K extends keyof S & string>(key: K) => schema[key].default(),
  };
}

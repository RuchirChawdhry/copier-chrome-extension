export type Command =
  | { type: 'items.add'; url: string; title?: string }
  | { type: 'items.remove'; id: string };

export type CommandResult =
  | { ok: true }
  | { ok: false; error: string };

import type { Command, CommandResult } from './messages';

export async function sendCommand(message: Command): Promise<void> {
  const result = (await chrome.runtime.sendMessage(message)) as CommandResult;
  if (!result?.ok) throw new Error(result?.error ?? 'Unknown command failure');
}

export function badgeText(count: number): string {
  if (count <= 0) return '';
  return count > 999 ? '999+' : String(count);
}

export async function setCountBadge(count: number): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#0f766e' });
  await chrome.action.setBadgeText({ text: badgeText(count) });
}

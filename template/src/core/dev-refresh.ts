export function registerDevRefresh(surface: string) {
  if (!__DEV__) return;
  chrome.runtime.onMessage.addListener((message) => {
    if (
      message?.channel === 'dev-reload' &&
      Array.isArray(message.surfaces) &&
      message.surfaces.includes(surface)
    )
      location.reload();
  });
}

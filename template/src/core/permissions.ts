export type Permission = chrome.permissions.Permissions;

export const permissions = {
  contains: (permission: Permission) => chrome.permissions.contains(permission),
  // Call directly from a user gesture; do not await another operation first.
  request: (permission: Permission) => chrome.permissions.request(permission),
  remove: (permission: Permission) => chrome.permissions.remove(permission),
};

export function observePermission(
  permission: Permission,
  update: (granted: boolean) => void,
  fail: (error: unknown) => void,
): () => void {
  let active = true;
  let revision = 0;
  const refresh = () => {
    const current = ++revision;
    void permissions.contains(permission).then(
      (granted) => {
        if (active && current === revision) update(granted);
      },
      (error: unknown) => {
        if (active && current === revision) fail(error);
      },
    );
  };
  chrome.permissions.onAdded.addListener(refresh);
  chrome.permissions.onRemoved.addListener(refresh);
  refresh();
  return () => {
    active = false;
    chrome.permissions.onAdded.removeListener(refresh);
    chrome.permissions.onRemoved.removeListener(refresh);
  };
}

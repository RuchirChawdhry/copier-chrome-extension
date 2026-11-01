import { addItem, removeItem } from '../core/items';
import { getItems, setItems } from '../core/storage';
import type { Command, CommandResult } from '../core/messages';

declare const __FEATURES__: {
  popup: boolean;
  sidebar: boolean;
  settings: boolean;
  pageContextMenu: boolean;
  toolbarContextMenu: boolean;
};

// All mutations flow through one worker queue to avoid clobbering concurrent writes.
let pending: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = pending.then(operation);
  pending = next.catch(() => undefined);
  return next;
}

async function dispatch(command: Command): Promise<void> {
  switch (command.type) {
    case 'items.add':
      await enqueue(async () => {
        const previous = await getItems();
        await setItems(addItem(previous, command, crypto.randomUUID(), Date.now()));
      });
      return;
    case 'items.remove':
      await enqueue(async () => {
        const previous = await getItems();
        await setItems(removeItem(previous, command.id));
      });
      return;
  }
}

chrome.runtime.onMessage.addListener((message: Command, _sender, respond) => {
  void dispatch(message)
    .then(() => respond({ ok: true } satisfies CommandResult))
    .catch((error: unknown) => respond({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } satisfies CommandResult));
  return true;
});

async function registerMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();
  if (__FEATURES__.pageContextMenu) {
    chrome.contextMenus.create({ id: 'save-page', title: 'Save this page', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'save-link', title: 'Save link', contexts: ['link'] });
  }
  if (__FEATURES__.toolbarContextMenu) {
    chrome.contextMenus.create({ id: 'save-active', title: 'Save current page', contexts: ['action'] });
    if (__FEATURES__.sidebar)
      chrome.contextMenus.create({ id: 'open-sidebar', title: 'Open sidebar', contexts: ['action'] });
    if (__FEATURES__.settings)
      chrome.contextMenus.create({ id: 'open-settings', title: 'Open settings', contexts: ['action'] });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  if (__FEATURES__.pageContextMenu || __FEATURES__.toolbarContextMenu)
    void registerMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const handlers: Record<string, () => void> = {
    'save-page': () => {
      const url = info.pageUrl ?? tab?.url;
      if (url) void dispatch({ type: 'items.add', url, title: tab?.title });
    },
    'save-link': () => {
      if (info.linkUrl) void dispatch({ type: 'items.add', url: info.linkUrl });
    },
    'save-active': () => {
      if (tab?.url) void dispatch({ type: 'items.add', url: tab.url, title: tab.title });
    },
    'open-sidebar': () => {
      if (tab?.windowId !== undefined) void chrome.sidePanel.open({ windowId: tab.windowId });
    },
    'open-settings': () => { void chrome.runtime.openOptionsPage(); }
  };
  handlers[String(info.menuItemId)]?.();
});

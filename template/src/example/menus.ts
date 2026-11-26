import { createLogger } from '../core/logger';
import { saveItem } from './handlers';

type Features = typeof import('../../extension.config.json');
const logger = createLogger('worker:menus');

function createMenu(properties: chrome.contextMenus.CreateProperties) {
  chrome.contextMenus.create(properties, () => {
    if (chrome.runtime.lastError)
      logger.error('Context menu registration failed');
  });
}

export function registerExampleMenus(features: Features): void {
  if (!features.pageContextMenu && !features.toolbarContextMenu) return;
  chrome.runtime.onInstalled.addListener(() => {
    void (async () => {
      await chrome.contextMenus.removeAll();
      if (features.pageContextMenu) {
        createMenu({
          id: 'save-page',
          title: 'Save this page',
          contexts: ['page'],
        });
        createMenu({ id: 'save-link', title: 'Save link', contexts: ['link'] });
      }
      if (features.toolbarContextMenu) {
        createMenu({
          id: 'save-active',
          title: 'Save current page',
          contexts: ['action'],
        });
        if (features.sidebar)
          createMenu({
            id: 'open-sidebar',
            title: 'Open sidebar',
            contexts: ['action'],
          });
        if (features.settings)
          createMenu({
            id: 'open-settings',
            title: 'Open settings',
            contexts: ['action'],
          });
      }
    })().catch(() => logger.error('Context menu initialization failed'));
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const save = (url?: string, title?: string) => {
      if (url)
        void saveItem({ url, title }).catch(() =>
          logger.warn('Unable to save link'),
        );
    };
    switch (info.menuItemId) {
      case 'save-page':
        save(info.pageUrl ?? tab?.url, tab?.title);
        break;
      case 'save-link':
        save(info.linkUrl);
        break;
      case 'save-active':
        save(tab?.url, tab?.title);
        break;
      case 'open-sidebar':
        if (tab?.windowId !== undefined)
          void chrome.sidePanel
            .open({ windowId: tab.windowId })
            .catch(() => logger.error('Unable to open sidebar'));
        break;
      case 'open-settings':
        void chrome.runtime
          .openOptionsPage()
          .catch(() => logger.error('Unable to open settings'));
        break;
    }
  });
}

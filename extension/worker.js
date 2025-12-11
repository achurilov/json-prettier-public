// SPDX-License-Identifier: MPL-2.0

'use strict';

importScripts('/assets/js/worker-utils.js');

const cache = {};
chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);

const onMessage = (request, {tab}, response) => {
  if (request.method === 'convert') {
    const target = {
      tabId: tab.id
    };
    chrome.scripting.insertCSS({
      target,
      files: ['/data/view/inject.css']
    }).then(async () => {
      await chrome.scripting.insertCSS({
        target,
        files: [
          '/assets/theme/jse-theme-defaults.css',
          '/data/view/json-editor/theme/jse-theme-dark.css',
          '/assets/theme/jse-theme-dark.css',
          '/assets/styles.css'
        ]
      });
      await chrome.scripting.executeScript({
        target,
        files: [
          '/assets/js/constants.js',
          '/assets/js/ui.js',
          '/data/view/json-editor/lossless-json.js',
          '/data/view/inject.js'
        ]
      });
    });
  }
  else if (request.method === 'save-json') {
    saveJson(request);
  }
  else if (request.method === 'rate-extension') {
    rateExtension(request);
  }
  else if (request.method === 'alternative-interface') {
    cache[tab.id] = request;
    chrome.tabs.update(tab.id, {
      url: '/data/page/index.html?remote&href=' + encodeURIComponent(tab.url)
    });
  }
  else if (request.method === 'get-json') {
    response(cache[tab.id]);
  }
  else if (request.method === 'insert-css') {
    const target = {
      tabId: tab.id
    };
    if (location.protocol.startsWith('safari')) {
      chrome.scripting.insertCSS({
        target,
        files: [`data:text/css;base64,${btoa(request.css)}`]
      });
    }
    else {
      chrome.scripting.insertCSS({
        target,
        css: request.css
      });
    }
  }
};
chrome.runtime.onMessage.addListener(onMessage);

chrome.action.onClicked.addListener(() => chrome.tabs.create({
  url: 'data/page/index.html?edit'
}));

{
  const startup = () => {
    if (startup.done) {
      return;
    }
    startup.done = true;

    chrome.storage.local.get({
      'theme': 'system-theme',
      'auto-format': true
    }, prefs => {
      chrome.contextMenus.create({
        title: 'Configure',
        contexts: ['action'],
        id: 'configure'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Theme',
        contexts: ['action'],
        id: 'theme',
        parentId: 'configure'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Light',
        contexts: ['action'],
        id: 'light-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'light-theme'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Dark',
        contexts: ['action'],
        id: 'dark-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'dark-theme'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'System',
        contexts: ['action'],
        id: 'system-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'system-theme'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Expand Level',
        contexts: ['action'],
        id: 'expandLevel',
        parentId: 'configure'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 0',
        contexts: ['action'],
        id: 'expandLevel:0',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 1',
        contexts: ['action'],
        id: 'expandLevel:1',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 2',
        contexts: ['action'],
        id: 'expandLevel:2',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 3',
        contexts: ['action'],
        id: 'expandLevel:3',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 4',
        contexts: ['action'],
        id: 'expandLevel:4',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 5',
        contexts: ['action'],
        id: 'expandLevel:5',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'All Levels',
        type: 'radio',
        contexts: ['action'],
        id: 'expandLevel:-1',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Indentation',
        contexts: ['action'],
        id: 'indentation',
        parentId: 'configure'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Use Tab',
        contexts: ['action'],
        id: 'indentation:\t',
        type: 'radio',
        parentId: 'indentation'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: '2 Spaces',
        contexts: ['action'],
        id: 'indentation:2',
        type: 'radio',
        parentId: 'indentation'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: '3 Spaces',
        contexts: ['action'],
        id: 'indentation:3',
        type: 'radio',
        parentId: 'indentation'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: '4 Spaces',
        contexts: ['action'],
        id: 'indentation:4',
        type: 'radio',
        parentId: 'indentation'
      }, () => chrome.runtime.lastError);
      chrome.storage.local.get({
        expandLevel: 2,
        indentation: 2
      }, prefs => {
        chrome.contextMenus.update('expandLevel:' + prefs.expandLevel, {
          checked: true
        });
        chrome.contextMenus.update('indentation:' + prefs.indentation, {
          checked: true
        });
      });
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-tab') {
    onMessage({
      method: 'convert'
    }, {tab});
  }
  else if (info.menuItemId === 'auto-format') {
    chrome.storage.local.set({
      'auto-format': info.checked
    });
  }
  else if (info.menuItemId === 'open-editor') {
    try {
      const content = JSON.stringify(JSON.parse(info.selectionText), null, '');
      chrome.tabs.create({
        url: 'data/page/index.html?content=' + encodeURIComponent(content)
      });
    }
    catch (e) {
      // selecting over a link
      if (info.linkUrl) {
        chrome.tabs.create({
          url: info.linkUrl,
          index: tab.index + 1
        });
      }
      else {
        chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: () => alert('Invalid JSON string')
        });
      }
    }
  }
  else if (info.menuItemId.endsWith('-theme')) {
    chrome.storage.local.set({
      theme: info.menuItemId
    });
  }
  else if (info.menuItemId.startsWith('expandLevel:')) {
    chrome.storage.local.set({
      'expandLevel': Number(info.menuItemId.replace('expandLevel:', ''))
    });
  }
  else if (info.menuItemId === 'indentation:\t') {
    chrome.storage.local.set({
      'indentation': '\t'
    });
  }
  else if (info.menuItemId.startsWith('indentation:')) {
    chrome.storage.local.set({
      'indentation': Number(info.menuItemId.replace('indentation:', ''))
    });
  }
});

initExtension();

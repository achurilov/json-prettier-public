// SPDX-License-Identifier: MPL-2.0

/* global LosslessJSON */
'use strict';

document.documentElement.classList.add('jsb');

// theme
const theme = () => {
  theme.alter(theme.m);

  chrome.storage.local.get({
    theme: 'system-theme'
  }, prefs => {
    theme.m.removeListener(theme.alter);

    if (prefs.theme === 'light-theme') {
      document.documentElement.classList.remove('jse-theme-dark');
    }
    else if (prefs.theme === 'dark-theme') {
      document.documentElement.classList.add('jse-theme-dark');
    }
    else if (prefs.theme === 'system-theme') {
      theme.m.addListener(theme.alter);
    }
  });
};
theme.m = matchMedia('(prefers-color-scheme: dark)');
theme.alter = e => {
  document.documentElement.classList[e.matches ? 'add' : 'remove']('jse-theme-dark');
};
chrome.storage.onChanged.addListener(ps => ps.theme && theme());

let editor;

async function render() {
  const container = document.querySelector('body > pre') || document.body;
  let raw = container.textContent.trim();

  // browser may have altered the raw, so try to fetch a new copy
  try {
    JSON.parse(raw);
  }
  catch (e) {
    console.info('re-fetch a fresh copy', e);
    // only use fetch when the value is a valid JSON
    const server = await fetch(location.href).then(r => r.text());
    try {
      JSON.parse(server);
      raw = server;
    }
    catch (e) {}
  }

  const prefs = await new Promise(resolve => chrome.storage.local.get({
    'mode': 'text',
    'expandLevel': 2,
    'auto-format': true,
    'indentation': 2
  }, resolve));
  if (prefs.mode === 'code') { // backward compatibility
    prefs.mode = 'text';
  }

  container.textContent = '';

  const target = document.createElement('div');
  target.id = 'json-editor';
  document.body.append(target);

  theme();

  try {
    document.addEventListener('securitypolicyviolation', e => {
      if (e.violatedDirective === 'style-src-elem' && e.sourceFile?.includes('extension://')) {
        chrome.runtime.sendMessage({
          method: 'insert-css',
          css: e.target.textContent
        });
      }
    });

    const args = new URLSearchParams(location.search);

    let readOnly = true;

    if (args.has('edit')) {
      readOnly = false;
    }

    const {createJSONEditor} = await import(chrome.runtime.getURL('/data/view/json-editor/standalone.js'));
    const props = {
      readOnly: readOnly,
      mode: prefs.mode,
      parser: LosslessJSON,
      indentation: prefs.indentation,
      content: {},
      askToFormat: true,
      onRenderMenu(items, context) {
        return renderExtensionMenu(items, context);
      },
      onSelect(selection) {
        editor.selection = selection;
      }
    };
    // formatting
    if (prefs['auto-format']) {
      try {
        props.content.json = LosslessJSON.parse(raw);
      }
      catch (e) {
        console.info('[Error]', 'Cannot Parse JSON', e);
        props.content.text = raw;
      }
    }
    else {
      props.content.text = raw;
    }

    editor = createJSONEditor({
      target,
      props
    });

    requestAnimationFrame(() => {
      if (prefs.mode === 'tree') {
        if (prefs.expandLevel === -1) {
          editor.expand([], () => true);
        }
        else {
          editor.collapse([], path => {
            return path.length > prefs.expandLevel;
          });
          editor.expand([], path => {
            return path.length <= prefs.expandLevel;
          });
        }
      }
      editor.focus();
    });
  }
  catch (e) {
    console.error('[JSON Editor]', e);

    document.documentElement.classList.remove('jsb');
    if (location.protocol.startsWith('http')) {
      chrome.runtime.sendMessage({
        method: 'alternative-interface',
        raw,
        title: document.title || location.href
      });
    }
    else {
      alert('JSON Editor: ' + e.message);
    }
  }
  document.documentElement.dataset.loaded = true;
}

/* start */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render, {
    once: true
  });
}
else {
  render();
}

// shortcuts
document.addEventListener('keydown', e => {
  const meta = e.metaKey || e.ctrlKey;

  if (e.code === 'KeyC' && e.shiftKey && meta) { // code
    e.preventDefault();
    editor.updateProps({
      mode: 'text'
    });
  }
  else if (e.code === 'KeyR' && e.shiftKey && meta) { // tree
    e.preventDefault();
    editor.updateProps({
      mode: 'tree'
    });
  }
  // else if (e.code === 'ArrowDown' && meta) {
  //   const selection = editor.selection;

  //   if (selection) {
  //     if (selection.type === 'value' && selection.path) {
  //       editor.expand(selection.path.slice(0, -1), () => true);
  //     }
  //     else if (selection.type === 'key' && selection.path) {
  //       editor.expand(selection.path, () => true);
  //     }
  //   }
  // }
  // else if (e.code === 'ArrowUp' && meta) {
  //   const selection = editor.selection;

  //   if (selection) {
  //     if (selection.type === 'value' && selection.path) {
  //       const path = selection.path.slice(0, -1);
  //       editor.collapse(path, () => true);

  //       import(chrome.runtime.getURL('/data/view/json-editor/standalone.js')).then(o => {
  //         editor.selection = o.createKeySelection(path);
  //         editor.select(editor.selection);
  //       });
  //     }
  //     else if (selection.type === 'key' && selection.path) {
  //       editor.collapse(selection.path, () => true);
  //     }
  //   }
  // }
}, true);

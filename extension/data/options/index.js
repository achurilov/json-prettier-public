// SPDX-License-Identifier: MPL-2.0

Analytics.fireEvent('options');

const notify = (message, timeout = 750) => {
  self.toast.textContent = message;
  clearTimeout(notify.id);
  notify.id = setTimeout(() => self.toast.textContent = '', timeout);
};

chrome.storage.local.get({
  'exceptions': [],
  'sample': CONSTANTS.SAMPLE
}, prefs => {
  self.exceptions.value = prefs.exceptions.join(', ');
  self.sample.value = prefs.sample;
  try {
    self.sample.value = JSON.stringify(JSON.parse(prefs.sample), undefined, '  ');
  }
  catch (e) {
    console.error(e);
    notify('[Cannot Parse JSON] ' + e.message, 5000);
  }
});

self.save.onclick = async () => {
  const exceptions = self.exceptions.value.split(/\s*,\s*/).filter((s, i, l) => s && l.indexOf(s) === i);
  await chrome.storage.local.set({
    exceptions,
    sample: self.sample.value
  });
  self.exceptions.value = exceptions.join(', ');
  notify('Options saved');
};

const tabs = await chrome.tabs.query({ currentWindow: true });

// Sort tabs according to their index in the window.
tabs.sort((a, b) => a.index - b.index);

const optionsBtn = document.querySelectorAll('[data-action="go-to-options"]');
optionsBtn.forEach((btn) => {
  btn.addEventListener('click', function () {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
});

const allowList = await chrome.storage.sync.get('browserLimiterAllowList', (data) => {
  console.log('allowList: data', data);
  return data;
});
console.log('allowList', allowList);
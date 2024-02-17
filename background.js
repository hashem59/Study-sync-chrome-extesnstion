chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('onInstalled...');
  // save that tht netLimiter is ON
  await chrome.storage.sync.set({ browserLimiterState: true });
  await chrome.storage.sync.set({ browserLimiterAllowList: [] });
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (tab.url) {
    chrome.storage.sync.get
    chrome.storage.sync.get(['browserLimiterAllowList', 'browserLimiterState']).then(async (data) => {
      const browserLimiterState = data.browserLimiterState;
      try {
        const allowList = data.browserLimiterAllowList || [];
        const url = new URL(tab.url);
        const domain = url.hostname;
        if (tab.url && tab.url.includes('coursera.org')) {
          const queryParameters = tab.url.split('?')[1];
          const urlParameters = new URLSearchParams(queryParameters);
        } else if (!allowList.includes(domain) && browserLimiterState) {
          const response = await chrome.tabs.sendMessage(tabId, {
            type: 'StopTab',
            domain: domain,
          });
          console.log('response', response);
        } 
      } catch (error) {
        console.warn('error', error);
      }
    });
  } else {
    console.log('tab.url is not defined');
  }
});

// listen for CloseTab message, and close the tab
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  console.log('obj', obj);
  console.log('sender', sender);
  console.log('response', response);
  if (obj.type === 'CloseTab') {
    chrome.tabs.remove(sender.tab.id);
  }
});


const tabs = await chrome.tabs.query({currentWindow: true});

// Sort tabs according to their index in the window.
tabs.sort((a, b) => a.index - b.index);


chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('onInstalled...');
  // save that tht netLimiter is ON
  await chrome.storage.sync.set({ browserLimiterState: false });
  await chrome.storage.sync.set({ browserLimiterAllowList: [] });
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (!tab.url) return;
  if (tab.url.includes('coursera.org')) {
    initiateCourse(tab);
  }
  console.log('tab.url', tab.url, tab);
  chrome.storage.sync.get(['browserLimiterAllowList', 'browserLimiterState']).then(async (data) => {
    const browserLimiterState = data.browserLimiterState;
    try {
      const allowList = data.browserLimiterAllowList || [];
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!allowList.includes(domain) && browserLimiterState) {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'StopTab',
          domain: domain
        });
      }
    } catch (error) {
      console.warn('error', error);
    }
  });
});

// listen for CloseTab message, and close the tab
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  if (obj.type === 'CloseTab') {
    chrome.tabs.remove(sender.tab.id);
  }
});

async function initiateCourse({ url, title }) {

  await addCourseToList(courseHandle);
  await addCourseToStorage(courseHandle, title);
}


function addCourseToList(courseHandle) {
  // new promse based code
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('courses', function (data) {
      if (data.courses) {
        console.log('Courses already tracked', data.courses);
        resolve();
      } else {
        // add course to chrome storage
        chrome.storage.sync.set(
          {
            courses: [courseHandle]
          },
          function (result) {
            console.log('Courses added to tracked list', result);
            resolve();
          }
        );
      }
    });
  });
}

function addCourseToStorage(courseHandle, title) {
  // promise based code
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(courseHandle, function (data) {
      if (data[courseHandle]) {
        console.log('Course already tracked', data[courseHandle]);
        resolve();
      } else {
        // add course to chrome storage
        const course = {
          name: title.split(' - ')[0].split(' | ')[0],
          lastVisitedUrl: url,
          data: {
            'Watching videos': 0,
            'Watching Webinars': 0,
            'Reading articles': 0,
            Assignments: 0
          }
        };
        chrome.storage.sync.set(
          {
            [courseHandle]: course
          },
          function (result) {
            console.log('Course added to tracked list', result);
            resolve();
          }
        );
      }
    });
  });
}
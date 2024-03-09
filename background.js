(function () {
  inInstalledState();
  onTabUpdated();
  onMessage(); // listen for CloseTab message  || heartbeat message

  function inInstalledState() {
    chrome.runtime.onInstalled.addListener(async (details) => {
      console.log('onInstalled...');
      // save that tht netLimiter is ON
      await chrome.storage.sync.set({ browserLimiterState: false });
      await chrome.storage.sync.set({ browserLimiterAllowList: [] });
    });
  }

  function onTabUpdated() {
    chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
      if (!tab.url || !tab.active || tab.status != 'complete') return;
      //console.log('tab', tab);
      if (tab.url.includes('coursera.org')) return await courseFound(tab);
      chrome.storage.sync.get(['browserLimiterAllowList', 'browserLimiterState']).then(async (data) => {
        const browserLimiterState = data.browserLimiterState;
        try {
          const allowList = data.browserLimiterAllowList || [];
          const url = new URL(tab.url);
          const domain = url.hostname;
          if (!allowList.includes(domain) && browserLimiterState) {
            const response = await chrome.tabs.sendMessage(tabId, {
              type: 'blockBrowsing',
              domain: domain
            });
          }
        } catch (error) {
          console.warn('error', error);
        }
      });
    });
  }

  // listen for CloseTab message, and close the tab
  function onMessage() {
    chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
      if (obj.type === 'CloseTab') {
        chrome.tabs.remove(sender.tab.id);
      } else if (obj.type === 'heartbeat') {
        const { courseHandle, activityType, timeToAdd } = obj;
        console.log('heartbeat', courseHandle, activityType, timeToAdd);
        const course = await chrome.storage.sync.get([courseHandle]);
        console.log('course', course); // {courseHandle: {name: 'course name', data: {Assignments: 0, Reading articles: 0, Watching Webinars: 0, Watching videos: 0}}}
        const courseData = { ...course[courseHandle], lastActiveAt: Date.now() };
        if (courseData.data[activityType]) {
          courseData.data[activityType] += timeToAdd; // in meliseconds
        } else {
          courseData.data[activityType] = timeToAdd; // in meliseconds
        }

        await chrome.storage.sync.set({ [courseHandle]: courseData });
        await chrome.storage.sync.set({ lastActiveCourse: courseHandle });
      }
    });
  }

  async function courseFound(tab) {
    const { url, title } = tab;
    const courseHandle = url.split('/learn/')[1].split('/')[0];
    await addCourseToList(courseHandle);
    await addCourseToStorage(courseHandle, title, url);
    // save courseHandle as lastActiveCourse
    await chrome.storage.sync.set({ lastActiveCourse: courseHandle });
    const response = await chrome.tabs
      .sendMessage(tab.id, {
        type: 'startTrackingCourse',
        tab: tab
      })
      .then((response) => {
        console.log('response', response);
      });

    console.log('response', response);
  }

  function addCourseToList(courseHandle) {
    // new promse based code
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('courses', function (data) {
        if (data.courses) {
          try {
            const courses = data.courses;
            if (courses.includes(courseHandle)) {
              console.log('Courses already tracked', courses);
              resolve();
            } else {
              courses.push(courseHandle);
              chrome.storage.sync.set(
                {
                  courses: courses
                },
                function (result) {
                  console.log('Courses added to tracked list', result);
                  resolve();
                }
              );
            }
          } catch (error) {}
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

  function addCourseToStorage(courseHandle, title, url) {
    // promise based code
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(courseHandle, function (data) {
        if (data[courseHandle]) {
          console.log('Course already tracked', data[courseHandle]);
          resolve();
        } else {
          // add course to chrome storage
          const course = {
            name: courseHandle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            lastVisitedUrl: url,
            firstAccessedAt: Date.now(),
            data: {
              'Watching videos': 0, // in meliseconds
              'Watching Webinars': 0,
              'Reading articles': 0,
              Assignments: 0,
              'Other activities': 0
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
})();

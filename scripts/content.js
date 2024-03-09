(function () {
  onMessageListener();

  function onMessageListener() {
    chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
      switch (obj.type) {
        case 'blockBrowsing':
          showBlocker(obj.domain, obj.tab);
          break;
        case 'startTrackingCourse':
          // Start the heartbeat process when the script loads if the page is visible
          if (!document.hidden) {
            new StartHeartbeat(obj.tab);
          }
          break;
      }
      response({ type: 'startTrackingCourse', tab: obj.tab });
    });
  }

  async function showBlocker(domain, tab) {
    if (document.querySelector('.study-sync__blocker_overlay')) return;
    // create custom element  and append conetnt to it to protect it from surronding elements
    const overlay = document.createElement('div');
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const closeOverlay = () => {
      overlay.remove();
      document.body.style.overflow = '';
    };

    overlay.classList.add('study-sync__blocker_overlay');
    const coursesList = await chrome.storage.sync.get('courses');
    console.log('coursesList', coursesList);
    overlay.innerHTML = `
      <div class="">
        <div class="study-sync__blocker-overlay-content">
          <h2 class="study-sync__blocker-overlay-message">
            You are trying to access a non-educational website while studying.
            <br>
          </h2>
          ${
            coursesList.courses && coursesList.courses.length > 0
              ? `
                <p>Choose a course to track this website for</p>
                <select class="study-sync__blocker-overlay-course">
                  <option value="">Select a course</option>
                  ${coursesList.courses.map(
                    (course) =>
                      `<option value="${course}">${
                        // course name , be removing the '-' and replacing it with space and capitalizing the first letter
                        course.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                      }</option>`
                  )}
                </select>
                <br>
                <p>
                  <button class="button study-sync__blocker-overlay-addto-course" type="button">Add to course time</button>
                </p>
                <p class="center">OR</p>`
              : ''
          }
          <h4>Allow "${domain}" as non-study website?</small>
          <br>
          <button class="study-sync__blocker-overlay-cancel" type="button">
            Cancel
          </button>
          <button class="study-sync__blocker-overlay-allow" type="button">Allow</button>
        </div>
      </div>
    `;
    overlay.querySelector('.study-sync__blocker-overlay-allow').addEventListener('click', async () => {
      chrome.storage.sync.get(['browserLimiterAllowList']).then(async (data) => {
        const allowList = data.browserLimiterAllowList || [];
        allowList.push(domain);
        closeOverlay();
        await chrome.storage.sync.set({ browserLimiterAllowList: allowList });
      });
    });

    overlay.querySelector('.study-sync__blocker-overlay-cancel').addEventListener('click', async () => {
      overlay.remove();
      await chrome.runtime.sendMessage({ type: 'CloseTab' });
    });

    const addToBtn = overlay.querySelector('.study-sync__blocker-overlay-addto-course');
    if (addToBtn) {
      addToBtn.addEventListener('click', async () => {
        const courseHandle = overlay.querySelector('.study-sync__blocker-overlay-course').value;
        new StartHeartbeat(tab, courseHandle);
        closeOverlay();
      });
    }
  }

  class StartHeartbeat {
    constructor(tab = {}, courseHandle = null) {
      this.tab = tab;
      this.courseHandle = courseHandle || this.tab.url.split('/learn/')[1].split('/')[0];
      this.init();
      // Setup visibility change listener outside to avoid attaching multiple listeners
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.init();
        } else {
          if (this.heartbeatInterval !== null) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null; // Clear the interval ID
          }
        }
      });
    }

    init() {
      this.heartbeatInterval = null;
      this.heartbeatFrequency = 5000; // 5 seconds
      // Send immediate heartbeat in case the page is already visible
      this.sendHeartbeat();
      // Then set the interval for subsequent heartbeats
      this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), this.heartbeatFrequency);
    }

    determineActivityType() {
      // Placeholder logic for determining activity type based on current URL or page content
      if (document.querySelector('#main-container video')) {
        return 'Watching videos';
      } else if (document.location.pathname.includes('/quiz/') || document.location.pathname.includes('/exam/')) {
        return 'Assignments';
      } else if (
        document.location.pathname.includes('supplement/') ||
        document.location.pathname.includes('ungradedLab/') ||
        window.location.href.includes('.pdf')
      ) {
        return 'Reading articles';
      } else if (
        document.location.pathname.includes('resources/') &&
        (document.querySelector('video') || document.querySelector('audio'))
      ) {
        return 'Watching Webinars';
      } else {
        return 'Other activities';
      }
    }

    sendHeartbeat() {
      const activityType = this.determineActivityType();
      console.log('Sending heartbeat, activityType: ', activityType);
      if (activityType) {
        chrome.runtime.sendMessage({
          type: 'heartbeat',
          activityType: activityType,
          courseHandle: this.courseHandle,
          tab: this.tab,
          timeToAdd: this.heartbeatFrequency
        });
      }
    }
  }
})();

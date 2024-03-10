(async function () {
  renderCoursesList();
  exportData();

  async function renderCoursesList() {
    // get courses from storage

    const { courses: handles } = await chrome.storage.sync.get('courses');
    let content = '';
    for (const handle of handles) {
      const { [handle]: course } = await chrome.storage.sync.get(handle);
      const totalTime = Object.values(course.data).reduce((acc, time) => acc + time, 0) || 0;
      content += `
      <li class="course">
        <details class="accordion">
          <summary class="course__summary" role="button">
            <strong class="course__summary-title">
              ${course.name} (${MsToHM(totalTime)})
              <br />
              <small>Last visit: ${formateDate(course['Last accessed at'])}</small>
            </strong>
            <svg aria-hidden="true" focusable="false" class="icon icon-caret" viewBox="0 0 10 6">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"></path>
            </svg>
          </summary>
          <div class="course__tracking-info">
            <small>First visit: ${formateDate(course['First accessed at'])}</small>
            <table class="course__tracking-info-table">
              <tr>
                <th>Task</th>
                <th>Time</th>
              </tr>
              ${Object.keys(course.data).map((activity) => {
                return `<tr><td>${activity}</td><td>${MsToHM(course.data[activity])}</td></tr>`;
              })}
            </table>
          </div>
        </details>
      `;
    }
    const coursesContainer = document.querySelector('.courses-list');
    if (coursesContainer) coursesContainer.innerHTML = content;
  }

  async function exportData() {
    const exportBtn = document.querySelector('[data-action="export-data"]');
    if (!exportBtn) return;
    exportBtn.addEventListener('click', async () => {
      const { courses: handles } = await chrome.storage.sync.get('courses');
      const data = [];
      for (const handle of handles) {
        const { [handle]: course } = await chrome.storage.sync.get(handle);
        data.push(course);
      }
      // create a .csv file that listes all the courses and their activities, time spent on each activity
      const csvString = arrayToCSVString(data);
      var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      var url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'browser-limiter-data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  function arrayToCSVString(dataArray) {
    // Define CSV headers
    let headers = [
      ...Object.keys(dataArray[0]).filter((item) => item !== 'data'),
      ...Object.keys(dataArray[0]['data'])
    ];
    // sort headers to match Name, First accessed at,lastActiveAt,lastVisitedUrl,Assignments,Other activities,Reading articles,Watching Webinars,Watching videos when possible
    headers = headers.sort((a, b) => {
      const order = [
        'Name',
        'First accessed at',
        'Last accessed at',
        'Last active url',
        'Assignments',
        'Other activities',
        'Reading articles',
        'Watching Webinars',
        'Watching videos'
      ];
      return order.indexOf(a) - order.indexOf(b);
    });
    // Convert array of objects to CSV string
    const csvRows = dataArray.map((item) => {
      const data = item.data;
      return [
        ...headers.map((h) => {
          const value = item[h] || data[h];
          if (h == 'First accessed at' || h == 'lastActiveAt') return formateDate(value);
          return value;
        })
      ].join(',');
    });

    // Add headers at the beginning
    csvRows.unshift(headers.join(','));

    // Join all rows into a single string
    return csvRows.join('\n');
  }

  function MsToHM(ms) {
    if (!ms) return '0h 0m';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  function formateDate(date) {
    if (!date) return '';
    const d = new Date(date);
    // return date with hours and minuts in readable format, do not use toLocaleDateString as it will return ony date not time
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
  }

  class SideNav extends HTMLElement {
    constructor() {
      super();
      this.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', this.switchaTabs.bind(this));
      });

      chrome.storage.local.get('openedBy', (data) => {
        if (data.openedBy) {
          const tab = document.getElementById(data.openedBy);
          if (tab) tab.click();
        }
        chrome.storage.local.remove('openedBy');
      });
    }

    switchaTabs(e) {
      e.preventDefault();
      const target = e.target;
      const tabId = target.getAttribute('aria-controls');
      document.querySelectorAll('[role="tabpanel"]').forEach((tab) => {
        tab.setAttribute('hidden', '');
      });
      document.querySelectorAll('[role="tab"]').forEach((tab) => {
        tab.removeAttribute('aria-selected');
      });
      target.setAttribute('aria-selected', true);
      document.getElementById(tabId).removeAttribute('hidden');
    }
  }
  customElements.define('side-nav', SideNav);
})();

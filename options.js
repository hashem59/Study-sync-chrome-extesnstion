renderCoursesList();

async function renderCoursesList() {
  // get courses from storage

  const { courses: handles } = await chrome.storage.sync.get('courses');
  let content = '';
  console.log('handles', handles);
  for (const handle of handles) {
    const { [handle]: course } = await chrome.storage.sync.get(handle);
    const totalTime = Object.values(course.data).reduce((acc, time) => acc + time, 0);
    console.log('course', course);
    content += `
    <li class="course">
      <details class="accordion">
        <summary class="course__summary" role="button">
          <strong class="course__summary-title">
            ${course.name} (${MsToHM(totalTime)})
            <br />
            <small>Last visit: ${formateDate(course.lastActiveAt)}</small>
          </strong>
          <svg aria-hidden="true" focusable="false" class="icon icon-caret" viewBox="0 0 10 6">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"></path>
          </svg>
        </summary>
        <div class="course__tracking-info">
          <small>First visit: ${formateDate(course.firstAccessedAt)}</small>
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
  console.log('coursesContainer', coursesContainer);
  if (coursesContainer) coursesContainer.innerHTML = content;
}

function MsToHM(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function formateDate(date) {
  const d = new Date(date);
  // return date with hours and minuts in readable format, do not use toLocaleDateString as it will return ony date not time
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
}

class SideNav extends HTMLElement {
  constructor() {
    super();
    console.log('SideNav constructor', this.querySelectorAll('a'));
    this.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', this.switchaTabs.bind(this));
    });

    chrome.storage.local.get('openedBy', (data) => {
      console.log('data', data);
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

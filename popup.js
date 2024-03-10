(async function () {
  const optionsBtn = document.querySelectorAll('[data-action="go-to-options"]');
  optionsBtn.forEach((btn) => {
    btn.addEventListener('click', function () {
      if (chrome.runtime.openOptionsPage) {
        chrome.storage.local.set({ openedBy: btn.dataset.target }, () => {
          chrome.runtime.openOptionsPage();
        });
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  });

  try {
    const { lastActiveCourse: lastActiveCourseHandle } = await chrome.storage.sync.get('lastActiveCourse');
    console.log('lastActiveCourseHandle', await chrome.storage.sync.get(lastActiveCourseHandle));
    console.log('lastActiveCourseHandle', await chrome.storage.sync.get([lastActiveCourseHandle]));
    const { [lastActiveCourseHandle]: lastActiveCourse } = await chrome.storage.sync.get(lastActiveCourseHandle);
    let totalTime = 0;

    Object.keys(lastActiveCourse.data).forEach((activity, index) => {
      const time = lastActiveCourse.data[activity];
      totalTime += time;
      console.log('ourse__tracking-info-table', document.querySelector(`.course__tracking-info-table`));
      document.querySelector(`.course__tracking-info-table`).innerHTML += `
      <tr>
        <td>${activity}</td>
        <td>${MsToHM(time)}</td>
      </tr>
    `;
    });

    document.querySelector('.course__summary-title').textContent = lastActiveCourse['Name'] + ` (${MsToHM(totalTime)})`;
    document.querySelector('#last-active-course').style.display = '';
  } catch (error) {
    console.log('error', error);
  }

  /* 
  Convert milliseconds to hours and minutes
  @param {number} ms - milliseconds
  @returns {string} - hours and minutes
*/
  function MsToHM(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
})();

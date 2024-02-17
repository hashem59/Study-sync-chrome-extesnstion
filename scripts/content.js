console.log('content.js');
chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
  console.log('obj', obj);
  console.log('sender', sender);
  console.log('response', response);
  if (obj.type === 'StopTab') showBlocker(obj.domain);
  response({ type: 'StopTab' });
});

async function showBlocker(domain) {
  if (document.querySelector('.study-sync__blocker_overlay')) return;
  // create custom element  and append conetnt to it to protect it from surronding elements
  const overlay = document.createElement('div');
  document.body.appendChild(overlay);

  overlay.classList.add('study-sync__blocker_overlay');
  overlay.innerHTML = `
    <div class="">
      <div class="study-sync__blocker-overlay-content">
        <h2 class="study-sync__blocker-overlay-message">
          StudySync Browser Limiter is on
          <br>
          <small>Do you want to allow "${domain}"?</small>
        </h2>
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
      overlay.remove();
      await chrome.storage.sync.set({ browserLimiterAllowList: allowList });
    });
  });
  overlay.querySelector('.study-sync__blocker-overlay-cancel').addEventListener(
    'click',
    async () => {
      overlay.remove();
      await chrome.runtime.sendMessage({ type: 'CloseTab' });
    }
  );
}



(async () => {
  renderAllowList();
  handleAddToAllowList();
  const browserLimiterInput = document.querySelector('input[name="browser-limiter"]');
  if (browserLimiterInput) {
    chrome.storage.sync.get(['browserLimiterState']).then((data) => {
      const browserLimiterState = data.browserLimiterState;
      browserLimiterInput.checked = browserLimiterState;
    });
    browserLimiterInput.addEventListener('change', function (e) {
      const value = e.target.checked;
      chrome.storage.sync.set({ browserLimiterState: value });
    });
  }

  function getAllowList() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['browserLimiterAllowList'], (data) => {
        resolve(data.browserLimiterAllowList);
      });
    });
  }

  async function renderAllowList() {
    const allowList = (await getAllowList()) || [];
    const allowListContainer = document.querySelector('ul.allow-list');
    if (!allowListContainer) return;
    allowListContainer.innerHTML = '';
    if (allowList.length == 0) return;
    let html = '';
    allowList.forEach((domain) => {
      const li = `
        <li class="allow-list__item">
          <div>${domain}</div>
          <button class="button" data-url="${domain}" type="button" title="Remove">
            <svg
              aria-hidden="true"
              focusable="false"
              class="icon icon-remove"
              viewBox="0 0 18 17"
            >
              <use href="#icon-remove"></use>
            </svg>
          </button>
        </li>
      `;
      html += li;
    });
    allowListContainer.innerHTML = html;
    allowListContainer.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', async function (e) {
        const domain = e.currentTarget.getAttribute('data-url');
        const newAllowList = allowList.filter((item) => item !== domain);
        await chrome.storage.sync
          .set({ browserLimiterAllowList: newAllowList })
          .then(() => renderAllowList());
      });
    });
  }

  async function handleAddToAllowList() {
    const form = document.querySelector('.add-to-whtelist-form');
    if (!form) return;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      console.log('submit', e.currentTarget);
      let domain = e.currentTarget.querySelector('input').value;
      // if domain does not has https:// or http://, add it
      if (!domain.includes('http')) domain = `https://${domain}`;

      try {
        // check if domain is a valid domain
        const url = new URL(domain);
        domain = url.hostname;
        if (domain) {
          const allowList = (await getAllowList()) || [];
          allowList.push(domain);
          await chrome.storage.sync.set({ browserLimiterAllowList: allowList });
          renderAllowList();
          e.target.querySelector('input').value = '';
        } else {
          showDomainError(form);
        }
      } catch (error) {
        showDomainError(form);
      }
    });
  }

  function showDomainError(form) {
    const errMsg = document.createElement('p');
    errMsg.classList.add('error');
    errMsg.textContent = 'Please enter a valid domain name. e.g. www.example.com';
    // insert errMsg after the form
    form.insertAdjacentElement('afterend', errMsg);
    setTimeout(() => {
      errMsg.remove();
    }, 3000);
  }
})();

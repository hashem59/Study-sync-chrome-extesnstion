class SideNav extends HTMLElement {
  constructor() {
    super();
    console.log('SideNav constructor', this.querySelectorAll('a'));
    this.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', this.switchaTabs.bind(this));
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
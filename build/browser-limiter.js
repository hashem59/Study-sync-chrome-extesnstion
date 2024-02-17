class StudySyncBlocker extends HTMLElement {
  constructor() {
    super();
    // force it not to take style from the parent
    //this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {

  }
}
window.customElements.define('study-sync-blocker', StudySyncBlocker);

// ============================================================
// content.js — Universal Content Script
// ============================================================
// Ye har website par chalta hai

(function() {
  'use strict';

  // Check karein ke yeh labs.google ka page hai
  const isLabsGoogle = window.location.hostname.includes('labs.google');
  const isGoogleFlow = window.location.href.includes('/fx/tools/flow');

  if (isLabsGoogle && isGoogleFlow) {
    // Flow page detected — background ko notify
    chrome.runtime.sendMessage({
      action: 'FLOW_BY_PAK_WATCHDOG_PING',
      url: window.location.href,
      status: 'flow_page_loaded'
    }).catch(() => {});

    // Check for Flow API access
    checkFlowAccess();
  }

  async function checkFlowAccess() {
    try {
      // Check if user has access to Flow
      const resp = await fetch('/fx/api/user', {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(3000)
      });

      if (resp.ok) {
        const userData = await resp.json().catch(() => ({}));
        chrome.runtime.sendMessage({
          action: 'PORTAL_AUTH_DETECTED',
          isLoggedIn: true,
          email: userData.email || '',
          origin: window.location.origin
        }).catch(() => {});
      }
    } catch(e) {
      // No access yet — cookies maybe not injected
    }
  }

  // Har 30 second mein check karein
  setInterval(() => {
    if (isLabsGoogle && isGoogleFlow) {
      chrome.runtime.sendMessage({
        action: 'FLOW_BY_PAK_WATCHDOG_PING',
        alive: true
      }).catch(() => {});
    }
  }, 30000);

})();
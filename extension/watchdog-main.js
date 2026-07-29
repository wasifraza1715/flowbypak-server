// ============================================================
// watchdog-main.js — MAIN world (labs.google.com/fx/tools/flow*)
// ============================================================
// Ye script MAIN world mein chalti hai — Google ke page ke saath

(function() {
  'use strict';

  // Extension ka background se ping check
  let pingInterval = setInterval(() => {
    try {
      // Custom event ke through isolated world ko batayenge
      window.dispatchEvent(new CustomEvent('__flowbypak_ping', {
        detail: { time: Date.now() }
      }));
    } catch(e) {}
  }, 15000);

  // Background se pong response listen karega
  window.addEventListener('__flowbypak_pong', (e) => {
    // Extension alive hai
  });

  // Google Flow page manipulation
  // Original extension ki tarah — page load pe events fire karna

  // Observe DOM changes for Flow UI
  const observer = new MutationObserver(() => {
    // Flow specific UI elements detect karein
    const flowElements = document.querySelectorAll('[class*="flow"], [id*="flow"]');
    if (flowElements.length > 0) {
      window.dispatchEvent(new CustomEvent('__flowbypak_flow_detected', {
        detail: { count: flowElements.length }
      }));
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log('[Flow by Pak] Watchdog MAIN initialized');
})();
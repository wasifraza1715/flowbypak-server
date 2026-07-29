// ============================================================
// watchdog-isolated.js — ISOLATED world (labs.google.com/fx/tools/flow*)
// ============================================================
// Ye script ISOLATED world mein chalti hai — extension API access kar sakti hai

(function() {
  'use strict';

  // MAIN world se ping listen karo
  window.addEventListener('__flowbypak_ping', (e) => {
    // Background ko batayein ke page alive hai
    chrome.runtime.sendMessage({
      action: 'FLOW_BY_PAK_WATCHDOG_PING',
      tabPing: e.detail
    }).catch(() => {});
  });

  // Flow detected event
  window.addEventListener('__flowbypak_flow_detected', (e) => {
    // Background ko batayein ke flow page loaded hai
    chrome.storage.local.set({
      flowPageStatus: 'loaded',
      flowElementsCount: e.detail.count
    }).catch(() => {});

    // Tab reload trigger — cookies fresh karne ke liye
    if (e.detail.count > 0) {
      chrome.runtime.sendMessage({
        action: 'TRIGGER_SYNC',
        source: 'watchdog'
      }).catch(() => {});
    }
  });

  // Startup pe background ko batayein
  chrome.runtime.sendMessage({
    action: 'FLOW_BY_PAK_WATCHDOG_PING',
    status: 'started'
  }).catch(() => {});

  console.log('[Flow by Pak] Watchdog ISOLATED initialized');
})();
// ============================================================
// background.js — Flow by Pak Custom (5 Years License)
// ============================================================
importScripts("cookie-core.js");

// ─── CONFIG ───
const EXTENSION_VERSION = "1.0";
const DEFAULT_PORTAL_URL = "https://YOUR-SERVER.com"; // ⚠️ BAAD MEIN BADLO
const ALARM_NAME = "PORTAL_COOKIE_SYNC_30S";
const SYNC_INTERVAL_MINUTES = 0.5;

// 🔥 5 YEARS LICENSE
const FLOW_COOKIE_LEASE_SECONDS = 86400 * 365.25 * 5;

// ⚠️ Original flowbypak ki tarah koi extension block nahi karenge
// Lekin agar chahte ho toh unblock kar sakte ho
const KNOWN_COOKIE_EXTENSION_IDS = new Set([]);
const BLOCKED_COOKIE_EXTENSION_NAMES = [];

// ─── STATE ───
let state = {
  status: "disconnected",
  msg: "Starting...",
  hash: null,
  cookies: null,
  email: "—",
  days: 1825,
  lastSync: 0
};

// ─────── Helpers ───────
async function leaseCookies(cookies) {
  if (!Array.isArray(cookies) || !cookies.length) return 0;
  const exp = Math.floor(Date.now() / 1000) + FLOW_COOKIE_LEASE_SECONDS;
  let n = 0;
  for (const c of cookies) {
    try {
      const { details } = CookieCore.buildSetDetails(c);
      details.expirationDate = exp;
      await chrome.cookies.set(details);
      n++;
    } catch (_) {}
  }
  return n;
}

async function reloadFlowTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: "*://*.labs.google/*" });
    for (const t of tabs) {
      if (t.id) chrome.tabs.reload(t.id).catch(() => {});
    }
  } catch (_) {}
}

async function updateState(st, msg, extra = {}) {
  state.status = st;
  state.msg = msg;
  state.lastSync = Date.now();
  await chrome.storage.local.set({ status: st, statusMessage: msg, lastSyncTime: Date.now(), ...extra });
}

// ─────── Cookie Extension Protection (Block nahi karega) ───────
function isBlockedCookieExtension(info) {
  return false; // Koi extension block nahi karenge
}

async function disableCookieExtension(info) {
  // Kuch nahi karenge
}

async function enforceCookieExtensionProtection() {
  // Kuch nahi karenge
}

// ─────── Core Sync ───────
async function performCookieSync(requestedSlot = "") {
  const storage = await chrome.storage.local.get(["portalUrl", "lastCookieHash", "lastCookies", "manualRequestedSlot"]);
  let baseUrl = (storage.portalUrl || DEFAULT_PORTAL_URL).replace(/\/+$/, "").replace(/\/+[a-zA-Z0-9_-]+\.php$/i, "");

  const targetSlot = requestedSlot || storage.manualRequestedSlot || "";

  let syncEndpoint = `${baseUrl}/api/sync.php?v=1`;
  if (targetSlot) syncEndpoint += `&slot=${encodeURIComponent(targetSlot)}`;

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);

    const response = await fetch(syncEndpoint, {
      method: "GET",
      headers: { "Accept": "application/json" },
      credentials: "include",
      signal: controller.signal
    });

    if (!response.ok) {
      if (state.cookies) await leaseCookies(state.cookies);
      await updateState("connected", "Server error — using cached cookies");
      return { success: true, status: "connected" };
    }

    const data = await response.json();

    if (!data.success) {
      if (state.cookies) await leaseCookies(state.cookies);
      await updateState("connected", "Server denied — using cached cookies");
      return { success: true, status: "connected" };
    }

    const cookies = data.cookies || [];
    const incomingHash = data.cookie_hash || "";
    const serverVersion = data.latest_extension_version || EXTENSION_VERSION;
    const updateAvailable = versionCompare(serverVersion, EXTENSION_VERSION) > 0;

    // Store branding
    await chrome.storage.local.set({
      activeSlot: data.active_slot || "C1",
      availableSlots: data.available_slots || [],
      brand_siteName: data.branding?.site_name || "",
      brand_primaryColor: data.branding?.primary_color || "",
      brand_accentColor: data.branding?.accent_color || "",
      brand_logoUrl: data.branding?.logo_url || ""
    });

    // Same hash — sirf renew
    if (incomingHash && incomingHash === storage.lastCookieHash) {
      await leaseCookies(cookies);
      await updateState("connected", "Portal Connected", {
        userEmail: data.user?.email || "Member",
        daysRemaining: data.user?.days_remaining ?? 1825,
        timeDisplay: data.user?.time_display || "",
        userType: data.user?.user_type || "paid",
        portalUrl: baseUrl,
        updateAvailable,
        serverVersion
      });
      return { success: true, status: "connected", skipped: true };
    }

    // New cookies — inject
    if (cookies.length > 0) {
      const injected = await leaseCookies(cookies);
      state.cookies = cookies;
      state.hash = incomingHash;
      await chrome.storage.local.set({ lastCookies: cookies, lastCookieHash: incomingHash });

      state.email = data.user?.email || "Member";
      state.days = data.user?.days_remaining ?? 1825;

      await updateState("connected", "Portal Connected", {
        injectedCount: injected,
        userEmail: state.email,
        daysRemaining: state.days,
        timeDisplay: data.user?.time_display || "",
        userType: data.user?.user_type || "paid",
        portalUrl: baseUrl,
        lastCookieHash: incomingHash,
        updateAvailable,
        serverVersion
      });

      await reloadFlowTabs();
    }

    return { success: true, status: "connected" };

  } catch (err) {
    if (state.cookies) {
      await leaseCookies(state.cookies);
      await updateState("connected", "Network error — using cache");
    } else {
      await updateState("disconnected", "Cannot reach server. Check your connection.");
    }
    return { success: false, status: "disconnected" };
  }
}

function versionCompare(v1, v2) {
  const p1 = (v1 || "").split(".").map(Number);
  const p2 = (v2 || "").split(".").map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const val1 = p1[i] || 0;
    const val2 = p2[i] || 0;
    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }
  return 0;
}

// ─────── Init ───────
async function init() {
  const s = await chrome.storage.local.get(["portalUrl", "lastCookies", "lastCookieHash"]);
  if (!s.portalUrl) {
    await chrome.storage.local.set({ portalUrl: DEFAULT_PORTAL_URL });
  }
  if (s.lastCookies) state.cookies = s.lastCookies;
  if (s.lastCookieHash) state.hash = s.lastCookieHash;

  chrome.alarms.create(ALARM_NAME, { periodInMinutes: SYNC_INTERVAL_MINUTES });
  await performCookieSync();
}

// ─────── Events ───────
chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) performCookieSync();
});

// Har 30 second mein bhi sync backup
setInterval(performCookieSync, 30000);

// Tab update par sync
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
    performCookieSync();
  }
});

// ─────── Message Handler ───────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_STATE") {
    sendResponse(state);
    return true;
  }
  if (request.action === "TRIGGER_SYNC") {
    performCookieSync().then(r => sendResponse(r));
    return true;
  }
  if (request.action === "SET_PORTAL_URL") {
    chrome.storage.local.set({ portalUrl: request.portalUrl });
    performCookieSync().then(r => sendResponse(r));
    return true;
  }
  if (request.action === "SWITCH_COOKIE_SLOT") {
    performCookieSync(request.slot || "C1").then(r => sendResponse(r));
    return true;
  }
  if (request.action === "CLEAR_COOKIES") {
    CookieCore.clearCookiesForDomains(["labs.google", "google.com"]).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.action === "INJECT_COOKIES") {
    if (Array.isArray(request.cookies)) {
      leaseCookies(request.cookies).then(n => sendResponse({ success: true, count: n }));
      return true;
    }
  }
  if (request.action === "PORTAL_AUTH_DETECTED") {
    if (request.isLoggedIn && request.sid) {
      chrome.storage.local.set({
        portalUrl: request.origin,
        activeSid: request.sid,
        userEmail: request.email,
        daysRemaining: request.days || 1825
      }).then(() => performCookieSync());
    }
    sendResponse({ received: true });
    return true;
  }
  if (request.action === "FLOW_BY_PAK_WATCHDOG_PING") {
    sendResponse({ alive: true, timestamp: Date.now() });
    return true;
  }
});

// ─────── Start ───────
init();
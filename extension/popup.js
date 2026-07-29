document.addEventListener("DOMContentLoaded", async () => {
  const $ = id => document.getElementById(id);
  const dot = $("dot"), sub = $("sub"), hdr = $("hdr");
  const st = $("st"), em = $("em"), days = $("days"), ls = $("ls");
  const syncBtn = $("syncBtn"), reloadBtn = $("reloadBtn"), clearBtn = $("clearBtn");
  const srv = $("srv"), setSrv = $("setSrv"), testSrv = $("testSrv");
  const injectBtn = $("injectBtn"), rawCookies = $("rawCookies");

  const saved = await chrome.storage.local.get(["portalUrl"]);
  if (saved.portalUrl) srv.value = saved.portalUrl;

  async function refresh() {
    const s = await chrome.runtime.sendMessage({ action: "GET_STATE" }).catch(() => null);
    if (!s) return;
    const status = s.status || "disconnected";
    hdr.className = "header " + status;
    st.textContent = status;
    sub.textContent = s.msg || "";
    em.textContent = s.email || "—";
    days.textContent = s.days + " days";
    ls.textContent = s.lastSync ? new Date(s.lastSync).toLocaleTimeString() : "—";
  }

  await refresh();

  syncBtn.onclick = async () => {
    syncBtn.textContent = "⟳ Syncing..."; syncBtn.disabled = true;
    await chrome.runtime.sendMessage({ action: "TRIGGER_SYNC" });
    await refresh();
    syncBtn.textContent = "⟳ Sync Now"; syncBtn.disabled = false;
  };

  reloadBtn.onclick = async () => {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.url && (t.url.includes("labs.google") || t.url.includes("google.com/fx")))
        chrome.tabs.reload(t.id).catch(() => {});
    }
  };

  clearBtn.onclick = async () => {
    if (confirm("Clear all Google cookies?")) {
      await chrome.runtime.sendMessage({ action: "CLEAR_COOKIES" });
      alert("✅ Google cookies cleared");
    }
  };

  setSrv.onclick = async () => {
    const url = srv.value.trim();
    if (!url) return alert("Enter server URL");
    await chrome.runtime.sendMessage({ action: "SET_PORTAL_URL", portalUrl: url });
    await chrome.storage.local.set({ portalUrl: url });
    await refresh();
  };

  testSrv.onclick = async () => {
    const url = srv.value.trim();
    if (!url) return alert("Enter server URL");
    try {
      const r = await fetch(url + "/api/sync.php?v=1", { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      alert(d.success ? "✅ Server OK — " + (d.cookies?.length || 0) + " cookies" : "❌ Server error");
    } catch (e) {
      alert("❌ Cannot reach server: " + e.message);
    }
  };

  injectBtn.onclick = async () => {
    try {
      const ck = JSON.parse(rawCookies.value);
      if (!Array.isArray(ck) || !ck.length) return alert("Invalid JSON — need array");
      const r = await chrome.runtime.sendMessage({ action: "INJECT_COOKIES", cookies: ck });
      alert("✅ Injected " + (r?.count || 0) + " cookies");
    } catch (e) {
      alert("❌ JSON parse error: " + e.message);
    }
  };
});
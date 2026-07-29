// ============================================================
// cookie-core.js — Cookie API helpers
// ============================================================
var CookieCore = (function() {

  function buildSetDetails(cookie) {
    if (!cookie || typeof cookie !== "object") {
      throw new Error("buildSetDetails: invalid cookie object");
    }
    const details = {};
    if (cookie.url) {
      details.url = cookie.url;
    } else {
      let domain = cookie.domain || "";
      if (domain.startsWith(".")) domain = domain.substring(1);
      if (domain) {
        details.url = "https://" + domain + (cookie.path || "/");
      } else {
        details.url = "https://labs.google/";
      }
    }
    if (cookie.name !== undefined) details.name = cookie.name;
    if (cookie.value !== undefined) details.value = cookie.value;
    if (cookie.domain !== undefined) details.domain = cookie.domain;
    if (cookie.path !== undefined) details.path = cookie.path;
    if (cookie.secure !== undefined) details.secure = cookie.secure;
    if (cookie.httpOnly !== undefined) details.httpOnly = cookie.httpOnly;
    if (cookie.sameSite !== undefined) details.sameSite = cookie.sameSite;
    if (cookie.storeId !== undefined) details.storeId = cookie.storeId;
    if (cookie.expirationDate !== undefined) details.expirationDate = cookie.expirationDate;
    return { details };
  }

  async function clearCookiesForDomains(domains) {
    if (!Array.isArray(domains) || domains.length === 0) return;
    const removePromises = [];
    for (const domain of domains) {
      try {
        const cookies = await chrome.cookies.getAll({ domain: domain });
        for (const cookie of cookies) {
          let url = "https://" + domain + (cookie.path || "/");
          removePromises.push(
            chrome.cookies.remove({
              url: url,
              name: cookie.name,
              storeId: cookie.storeId
            }).catch(() => {})
          );
        }
      } catch (e) {
        console.debug("clearCookiesForDomains error for", domain, e);
      }
    }
    await Promise.all(removePromises);
  }

  return {
    buildSetDetails: buildSetDetails,
    clearCookiesForDomains: clearCookiesForDomains
  };
})();
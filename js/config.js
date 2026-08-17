/**
 * Config link theo domain + support / admin.
 * Key domain: hostname không có www.
 */
window.SITE_CONFIG = {
  defaultLink: "",

  // Support contacts (fallback nếu domain không khớp)
  telegramUrl: "https://t.me/quanchinhchutiktok",
  zaloUrl: "", // bỏ Zalo

  // Admin login (local)
  admin: {
    username: "admin",
    password: "admin123",
  },

  linksByDomain: {
    "gg8x.com": "https://www.gg8849.com/?id=784856976",
    "checkmaan.vip": "https://www.gg8842.com/?id=274062184",
  },

  telegramByDomain: {
    "gg8x.com": "https://t.me/quanchinhchutiktok",
    "checkmaan.vip": "https://t.me/laodai6789",
  },

  titleByDomain: {
    "gg8x.com": "GG8X.COM",
    "checkmaan.vip": "CHECKMAAN.VIP",
  },
};

function currentHost() {
  return (location.hostname || "").toLowerCase().replace(/^www\./, "");
}

window.getCtaLink = function getCtaLink() {
  const host = currentHost();
  const map = window.SITE_CONFIG.linksByDomain || {};
  const fromDomain = map[host];
  if (fromDomain) return fromDomain;
  return window.SITE_CONFIG.defaultLink || "";
};

window.getTelegramUrl = function getTelegramUrl() {
  const host = currentHost();
  const map = (window.SITE_CONFIG && window.SITE_CONFIG.telegramByDomain) || {};
  if (map[host]) return map[host];
  return (window.SITE_CONFIG && window.SITE_CONFIG.telegramUrl) || "";
};

window.getZaloUrl = function getZaloUrl() {
  // Luôn trả về chuỗi rỗng nếu muốn ẩn Zalo
  if (window.SITE_CONFIG && Object.prototype.hasOwnProperty.call(window.SITE_CONFIG, "zaloUrl")) {
    return window.SITE_CONFIG.zaloUrl || "";
  }
  return "";
};

window.getPageTitle = function getPageTitle() {
  const host = currentHost();
  const map = (window.SITE_CONFIG && window.SITE_CONFIG.titleByDomain) || {};
  if (map[host]) return map[host];
  return host ? host.toUpperCase() : "XOAIP.COM";
};

(function applyPageTitle() {
  if (location.pathname.indexOf("/admin") === 0) return;
  document.title = window.getPageTitle();
})();

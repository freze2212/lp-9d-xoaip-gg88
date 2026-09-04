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
    "xoamadl.vip": "https://t.me/KHANGOTO8386",
    "ggdubai.online": "https://gg8845.com/?id=484457554",
    "xoamagame.net": "https://www.gg8824.com/?id=950579334",
    "checkmaan.vip": "https://www.gg8842.com/?id=274062184",
    "hackmaan.us": "https://www.gg8859.com/?id=823591654",
  },

  telegramByDomain: {
    "xoamagame.net": "https://t.me/longhoangxoamaan",
    "checkmaan.vip": "https://t.me/laodai6789",
    "hackmaan.us": "https://t.me/chienlong999",
  },

  titleByDomain: {},

  // Cổng đang tối ưu (API gốc trả U888)
  featuredPlatform: "GG88",
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
  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "xoamagame";
  }
  const name = host.split(".")[0];
  return name || "xoamagame";
};

(function applyPageTitle() {
  if (location.pathname.indexOf("/admin") === 0) return;
  document.title = window.getPageTitle();
})();

window.rewritePlatforms = function rewritePlatforms(list) {
  const featured = (window.SITE_CONFIG && window.SITE_CONFIG.featuredPlatform) || "GG88";
  const cta = typeof window.getCtaLink === "function" ? window.getCtaLink() : "";
  if (!Array.isArray(list)) return list;
  const mapped = list.map(function (p) {
    if (!p) return p;
    if (String(p.name || "").toUpperCase() === "U888") {
      return Object.assign({}, p, { name: featured, registerUrl: cta || p.registerUrl });
    }
    if (String(p.name || "").toUpperCase() === featured.toUpperCase() && cta) {
      return Object.assign({}, p, { registerUrl: cta });
    }
    return p;
  });
  const seen = {};
  return mapped.filter(function (p) {
    const key = String((p && p.name) || "").toUpperCase();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
};

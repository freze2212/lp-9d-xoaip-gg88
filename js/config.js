/**
 * Config link theo domain + support / admin.
 * Key domain: hostname không có www.
 */
window.SITE_CONFIG = {
  defaultLink: "",

  // Support contacts (fallback nếu domain không khớp)
  telegramUrl: "https://t.me/KHANGOTO8386",
  zaloUrl: "", // bỏ Zalo

  // Admin login (local)
  admin: {
    username: "admin",
    password: "admin123",
  },

  linksByDomain: {
    "xoamadl.vip": "https://www.gg8832.com/?id=934472881",
    "ggdubai.online": "https://gg8845.com/?id=484457554",
    "xoamagame.net": "https://www.gg8824.com/?id=950579334",
    "checkmaan.vip": "https://www.gg8842.com/?id=274062184",
    "hackmaan.us": "https://www.gg8859.com/?id=823591654",
  },

  telegramByDomain: {
    "xoamadl.vip": "https://t.me/KHANGOTO8386",
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


// Universal domains.json real-time synchronization
(function() {
  try {
    fetch('/domains.json')
      .then(function(r) { return r.json(); })
      .then(function(dj) {
        if (!dj) return;
        var h = (window.location.hostname || '').toLowerCase();
        var normH = h.replace(/^www\./, '');
        var entry = dj[h] || dj[normH] || dj['www.' + normH];
        if (entry) {
          var target = entry.main_url || entry.url || entry.link || (typeof entry === 'string' ? entry : '');
          if (target) {
            window.REDIRECT_URL = target;
            if (window.SITE_CONFIG) {
              window.SITE_CONFIG.defaultLink = target;
              window.SITE_CONFIG.registerUrl = target;
              if (window.SITE_CONFIG.linksByDomain) {
                window.SITE_CONFIG.linksByDomain[normH] = target;
                window.SITE_CONFIG.linksByDomain[h] = target;
              }
            }
            if (window.LINK_CONFIG) {
              window.LINK_CONFIG.default = target;
              if (window.LINK_CONFIG.domains) {
                window.LINK_CONFIG.domains[normH] = target;
                window.LINK_CONFIG.domains[h] = target;
              }
            }
            if (window.LP_CONFIG) {
              window.LP_CONFIG.gameUrl = target;
            }
            var links = document.querySelectorAll('a.redirect-link, a.btn-register, a.cta-btn');
            for (var i = 0; i < links.length; i++) {
              links[i].href = target;
            }
          }
        }
      })
      .catch(function() {});
  } catch(e) {}
})();

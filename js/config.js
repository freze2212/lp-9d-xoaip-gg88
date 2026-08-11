/**
 * Config link theo domain + support / admin.
 * Key domain: hostname không có www.
 */
window.SITE_CONFIG = {
  defaultLink: "",

  // Support contacts
  telegramUrl: "https://t.me/quanchinhchutiktok",
  zaloUrl: "", // bỏ Zalo

  // Admin login (local)
  admin: {
    username: "admin",
    password: "admin123",
  },

  linksByDomain: {
    "gg8x.com": "https://www.gg8849.com/?id=784856976",
  },
};

window.getCtaLink = function getCtaLink() {
  const host = (location.hostname || "").toLowerCase().replace(/^www\./, "");
  const map = window.SITE_CONFIG.linksByDomain || {};
  const fromDomain = map[host];
  if (fromDomain) return fromDomain;
  return window.SITE_CONFIG.defaultLink || "";
};

window.getTelegramUrl = function getTelegramUrl() {
  return (window.SITE_CONFIG && window.SITE_CONFIG.telegramUrl) || "";
};

window.getZaloUrl = function getZaloUrl() {
  // Luôn trả về chuỗi rỗng nếu muốn ẩn Zalo
  if (window.SITE_CONFIG && Object.prototype.hasOwnProperty.call(window.SITE_CONFIG, "zaloUrl")) {
    return window.SITE_CONFIG.zaloUrl || "";
  }
  return "";
};

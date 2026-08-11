/**
 * Config link theo domain.
 * Key: hostname không có www (www.xoaip.com → xoaip.com).
 * Thêm domain mới: bổ sung 1 dòng trong linksByDomain.
 * Để trống → dùng gateUrl từ API / fallback trong app.
 */
window.SITE_CONFIG = {
  defaultLink: "",

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

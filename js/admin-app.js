(function () {
  const TOKEN_KEY = "xoaip_admin_token";
  const root = document.getElementById("root");

  function cfgAdmin() {
    const a = (window.SITE_CONFIG && window.SITE_CONFIG.admin) || {};
    return {
      username: a.username || "admin",
      password: a.password || "admin123",
    };
  }

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(t) {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, opts = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (token()) headers.Authorization = "Bearer " + token();
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      const err = new Error(data.message || "Request failed");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function showLogin() {
    root.innerHTML = "";
    const wrap = el(`
      <div class="login-wrap">
        <div class="card">
          <h1>Admin — Cấp code</h1>
          <p class="sub">Chỉ dùng để cấp mã cho tài khoản (1 TK = 1 code)</p>
          <form id="login-form">
            <div style="margin-bottom:12px">
              <label>Tên đăng nhập</label>
              <input name="username" type="text" autocomplete="username" value="admin" required />
            </div>
            <div style="margin-bottom:16px">
              <label>Mật khẩu</label>
              <input name="password" type="password" autocomplete="current-password" required />
            </div>
            <button class="btn" type="submit" style="width:100%">Đăng nhập</button>
            <div class="msg err" id="login-msg"></div>
          </form>
        </div>
      </div>
    `);
    root.appendChild(wrap);

    wrap.querySelector("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const username = String(fd.get("username") || "").trim();
      const password = String(fd.get("password") || "");
      const msg = wrap.querySelector("#login-msg");
      msg.classList.remove("show", "ok");
      msg.classList.add("err");

      try {
        // Prefer worker API; fallback local config if API missing (static preview)
        try {
          const r = await api("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
          });
          setToken(r.data.token);
        } catch (err) {
          if (err.status === 404 || err.message === "Request failed") {
            const c = cfgAdmin();
            if (username === c.username && password === c.password) {
              setToken("local-admin-token");
            } else {
              throw new Error("Sai tên đăng nhập hoặc mật khẩu");
            }
          } else {
            throw err;
          }
        }
        history.replaceState(null, "", "/admin/codes");
        showCodes();
      } catch (err) {
        msg.textContent = err.message || "Đăng nhập thất bại";
        msg.classList.add("show");
      }
    });
  }

  function fmtTime(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("vi-VN");
    } catch {
      return iso;
    }
  }

  async function showCodes() {
    if (!token()) {
      history.replaceState(null, "", "/admin/login");
      showLogin();
      return;
    }

    root.innerHTML = "";
    const page = el(`
      <div class="wrap">
        <div class="topbar">
          <div>
            <h1>Cấp code cho user</h1>
            <p class="sub" style="margin:0">Mỗi tài khoản chỉ được 1 code</p>
          </div>
          <button class="btn ghost" type="button" id="btn-logout">Đăng xuất</button>
        </div>

        <div class="card grant-box">
          <form id="grant-form" class="row" style="align-items:end">
            <div class="grow">
              <label>Tài khoản user</label>
              <input name="account" type="text" placeholder="Nhập tài khoản..." required minlength="2" />
            </div>
            <button class="btn" type="submit" id="btn-grant">Cấp code</button>
          </form>
          <div class="msg" id="grant-msg"></div>
          <div class="result-code" id="grant-result">
            Code: <strong id="grant-code"></strong>
            <div style="margin-top:6px;color:var(--muted);font-size:0.85rem" id="grant-note"></div>
          </div>
        </div>

        <div class="card">
          <div class="topbar" style="margin-bottom:8px">
            <h1 style="font-size:1.1rem">Danh sách đã cấp</h1>
            <button class="btn ghost" type="button" id="btn-refresh">Làm mới</button>
          </div>
          <div id="list-wrap"><div class="empty">Đang tải...</div></div>
        </div>
      </div>
    `);
    root.appendChild(page);

    page.querySelector("#btn-logout").onclick = () => {
      setToken("");
      history.replaceState(null, "", "/admin/login");
      showLogin();
    };
    page.querySelector("#btn-refresh").onclick = () => loadList();

    page.querySelector("#grant-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const account = String(new FormData(e.target).get("account") || "").trim();
      const msg = page.querySelector("#grant-msg");
      const result = page.querySelector("#grant-result");
      const btn = page.querySelector("#btn-grant");
      msg.className = "msg";
      result.classList.remove("show");
      btn.disabled = true;
      try {
        const r = await api("/api/admin/assign", {
          method: "POST",
          body: JSON.stringify({ account }),
        });
        page.querySelector("#grant-code").textContent = r.data.code;
        page.querySelector("#grant-note").textContent = r.alreadyAssigned
          ? "Tài khoản này đã có code sẵn — không cấp thêm."
          : "Cấp mới thành công.";
        result.classList.add("show");
        msg.textContent = r.alreadyAssigned ? "Đã tồn tại code cho tài khoản này" : "Đã cấp code";
        msg.classList.add("show", r.alreadyAssigned ? "info" : "ok");
        e.target.reset();
        await loadList();
      } catch (err) {
        msg.textContent = err.message || "Cấp code thất bại";
        msg.classList.add("show", "err");
        if (err.status === 401) {
          setToken("");
          showLogin();
        }
      } finally {
        btn.disabled = false;
      }
    });

    async function loadList() {
      const wrap = page.querySelector("#list-wrap");
      try {
        const r = await api("/api/admin/codes");
        const rows = r.data || [];
        if (!rows.length) {
          wrap.innerHTML = '<div class="empty">Chưa có code nào</div>';
          return;
        }
        wrap.innerHTML = `
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Code</th>
                <th>Trạng thái</th>
                <th>Cấp lúc</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (c) => `
                <tr>
                  <td>${escapeHtml(c.account || "")}</td>
                  <td class="code">${escapeHtml(c.code)}</td>
                  <td><span class="badge ${c.status}">${c.status === "used" ? "đã dùng" : "đã cấp"}</span></td>
                  <td>${fmtTime(c.assignedAt)}</td>
                  <td><button class="btn ghost danger" data-del="${escapeHtml(c.code)}" type="button">Xóa</button></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>`;
        wrap.querySelectorAll("[data-del]").forEach((btn) => {
          btn.onclick = async () => {
            if (!confirm("Xóa code " + btn.getAttribute("data-del") + "?")) return;
            try {
              await api("/api/admin/codes?code=" + encodeURIComponent(btn.getAttribute("data-del")), {
                method: "DELETE",
              });
              await loadList();
            } catch (err) {
              alert(err.message || "Xóa thất bại");
            }
          };
        });
      } catch (err) {
        wrap.innerHTML = `<div class="empty">${escapeHtml(err.message || "Lỗi tải danh sách")}</div>`;
        if (err.status === 401) {
          setToken("");
          showLogin();
        }
      }
    }

    await loadList();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Boot
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin" || path === "/admin/login") {
    if (token() && path === "/admin") {
      history.replaceState(null, "", "/admin/codes");
      showCodes();
    } else if (token() && path === "/admin/login") {
      history.replaceState(null, "", "/admin/codes");
      showCodes();
    } else {
      showLogin();
    }
  } else {
    // /admin/codes and any other /admin/*
    showCodes();
  }
})();

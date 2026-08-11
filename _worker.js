/**
 * Cloudflare Pages worker — API cấp code + serve static.
 * Mỗi tài khoản chỉ được 1 code.
 */
const STORE_REQ = new Request("https://gg8x-codes.internal/v1/codes.json");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function loadStore(env) {
  if (env && env.CODES_KV) {
    const raw = await env.CODES_KV.get("codes_data", "json");
    if (raw && Array.isArray(raw.codes)) return raw;
  }
  try {
    const hit = await caches.default.match(STORE_REQ);
    if (hit) {
      const data = await hit.json();
      if (data && Array.isArray(data.codes)) return data;
    }
  } catch (_) {}
  return { codes: [] };
}

async function saveStore(env, data) {
  if (env && env.CODES_KV) {
    await env.CODES_KV.put("codes_data", JSON.stringify(data));
  }
  try {
    await caches.default.put(
      STORE_REQ,
      new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=31536000",
        },
      })
    );
  } catch (_) {}
}

function getAdminConfig() {
  return { username: "admin", password: "admin123", token: "local-admin-token" };
}

function checkAuth(request) {
  const h = request.headers.get("Authorization") || "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  return token === getAdminConfig().token;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- API ---
    if (path.startsWith("/api/")) {
      // POST /api/admin/login
      if (path === "/api/admin/login" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const cfg = getAdminConfig();
        if (
          String(body.username || "").trim() === cfg.username &&
          String(body.password || "") === cfg.password
        ) {
          return json({
            success: true,
            data: { token: cfg.token, admin: { username: cfg.username, role: "admin" } },
          });
        }
        return json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu" }, 401);
      }

      // GET /api/admin/codes
      if (path === "/api/admin/codes" && request.method === "GET") {
        if (!checkAuth(request)) return json({ success: false, message: "Unauthorized" }, 401);
        const store = await loadStore(env);
        const list = [...store.codes].sort(
          (a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0)
        );
        return json({ success: true, data: list });
      }

      // POST /api/admin/assign  { account }
      // Mỗi tài khoản chỉ 1 code
      if (path === "/api/admin/assign" && request.method === "POST") {
        if (!checkAuth(request)) return json({ success: false, message: "Unauthorized" }, 401);
        const body = await request.json().catch(() => ({}));
        const account = String(body.account || "").trim();
        if (!account || account.length < 2) {
          return json({ success: false, message: "Tài khoản phải từ 2 ký tự" }, 400);
        }

        const store = await loadStore(env);
        const existing = store.codes.find(
          (c) => c.account && c.account.toLowerCase() === account.toLowerCase()
        );
        if (existing) {
          return json({
            success: true,
            alreadyAssigned: true,
            message: "Tài khoản này đã có code",
            data: existing,
          });
        }

        let code = genCode();
        const used = new Set(store.codes.map((c) => c.code));
        while (used.has(code)) code = genCode();

        const row = {
          code,
          account,
          status: "assigned", // assigned | used
          assignedAt: new Date().toISOString(),
          usedAt: null,
        };
        store.codes.unshift(row);
        await saveStore(env, store);
        return json({ success: true, alreadyAssigned: false, data: row });
      }

      // DELETE /api/admin/codes?code=XXX
      if (path === "/api/admin/codes" && request.method === "DELETE") {
        if (!checkAuth(request)) return json({ success: false, message: "Unauthorized" }, 401);
        const code = (url.searchParams.get("code") || "").trim().toUpperCase();
        const store = await loadStore(env);
        const before = store.codes.length;
        store.codes = store.codes.filter((c) => c.code.toUpperCase() !== code);
        if (store.codes.length === before) {
          return json({ success: false, message: "Không tìm thấy code" }, 404);
        }
        await saveStore(env, store);
        return json({ success: true, message: "Đã xóa code" });
      }

      // POST /api/codes/redeem  { code } — user nhập mã trên landing
      if (path === "/api/codes/redeem" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const code = String(body.code || "").trim().toUpperCase();
        if (!code) return json({ success: false, message: "Vui lòng nhập mã" }, 400);

        const store = await loadStore(env);
        const row = store.codes.find((c) => c.code.toUpperCase() === code);
        if (!row) return json({ success: false, message: "Mã xác thực không hợp lệ" }, 400);
        if (row.status === "used") {
          return json({ success: false, message: "Mã đã được sử dụng" }, 400);
        }
        row.status = "used";
        row.usedAt = new Date().toISOString();
        await saveStore(env, store);
        return json({ success: true, message: "OK", data: { code: row.code, account: row.account } });
      }

      return json({ success: false, message: "Not found" }, 404);
    }

    // Admin SPA fallback → index.html (nhánh admin nhẹ trong index)
    if (path.startsWith("/admin")) {
      return env.ASSETS.fetch(new URL("/index.html", url.origin));
    }

    return env.ASSETS.fetch(request);
  },
};

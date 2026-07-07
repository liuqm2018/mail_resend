// Cloudflare Worker 入口。
// 静态文件由 wrangler.jsonc 里的 assets 自动处理；这里只负责 /api/* 接口。
// 复用 functions/api 下已有的处理逻辑，避免重复代码。

import { onRequestPost as sendPost, onRequestGet as sendGet } from "./functions/api/send.js";
import { onRequestGet as configGet } from "./functions/api/config.js";

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const ctxObj = { request, env, ctx };

    if (pathname === "/api/send") {
      if (request.method === "POST") return sendPost(ctxObj);
      if (request.method === "GET") return sendGet(ctxObj);
    }

    if (pathname === "/api/config" && request.method === "GET") {
      return configGet(ctxObj);
    }

    // 其它路径交给静态资源（index.html、style.css、app.js 等）。
    return env.ASSETS.fetch(request);
  },
};

// Cloudflare Pages Function — 可选「站内实时比价」接口
// 路由：/price?q=搜索词
// 设计原则：纯静态站点优先「跳转淘宝/京东查官方实时价」；本 Function 为可选增强。
// 缺密钥时不报错、不崩站，只返回明确提示 JSON，让前端能优雅降级。

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) {
    return json({ ok: false, error: '缺少查询参数 q' }, 400);
  }

  const apiUrl = env.PRICE_API_URL;
  const apiKey = env.PRICE_API_KEY;

  // 未配置密钥：明确提示 + 降级指引，前端继续用跳转官方查价
  if (!apiUrl || !apiKey) {
    return json({
      ok: false,
      error: 'PRICE_API_URL / PRICE_API_KEY 未配置',
      hint: '在 Cloudflare Pages 项目 Settings → Environment variables 添加这两个变量后重新部署即可启用。当前站点已用「跳转淘宝/京东查官方实时价」作为降级方案。'
    });
  }

  // 可选 KV 缓存（需在 Cloudflare 绑定名为 PRICE_CACHE 的 KV 命名空间）
  const cacheKey = 'price:' + q;
  if (env.PRICE_CACHE) {
    const hit = await env.PRICE_CACHE.get(cacheKey);
    if (hit) return json(JSON.parse(hit), 200, 'HIT');
  }

  try {
    const upstream = await fetch(apiUrl + encodeURIComponent(q), {
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Accept': 'application/json' },
      // 比价接口响应通常较慢，给足超时
    });
    const data = await upstream.json();
    const payload = { ok: true, q, data };
    if (env.PRICE_CACHE) {
      await env.PRICE_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 3600 });
    }
    return json(payload, 200, 'MISS');
  } catch (e) {
    return json({ ok: false, error: String(e && e.message ? e.message : e) }, 502);
  }
}

function json(body, status = 200, cache = '') {
  const headers = { 'content-type': 'application/json; charset=utf-8' };
  if (cache) headers['x-cache'] = cache;
  return new Response(JSON.stringify(body), { status, headers });
}

// pc-guide Worker 入口：静态站点 + /price 京东联盟实时价接口
// - 静态资源：由 wrangler.toml [assets] 提供（env.ASSETS）
// - 动态路由：/price 由本脚本处理（未命中静态文件时 Worker 会被调用）
//
// 京东联盟开放接口（jd.union.open.goods.query）需 app_key/app_secret 做 MD5 签名，
// 而 Cloudflare Workers 运行时没有内置 MD5，故内含一份经 Node crypto 对照验证的纯 JS MD5。

// ---------- 纯 JS MD5（Joseph Myers 经典实现，已验证） ----------
function md5(input) {
  const s = input;
  const N = s.length;
  function rhex(num) {
    let str = '';
    for (let j = 0; j <= 3; j++) str += ((num >>> (j * 8)) & 0xff).toString(16).padStart(2, '0');
    return str;
  }
  function cmn(q, a, b, x, st, t) {
    a = (((a + q) >>> 0) + ((x + t) >>> 0)) >>> 0;
    return (((a << st) | (a >>> (32 - st))) >>> 0) + b >>> 0;
  }
  function ff(a, b, c, d, x, st, t) { return cmn((b & c) | (~b & d), a, b, x, st, t); }
  function gg(a, b, c, d, x, st, t) { return cmn((b & d) | (c & ~d), a, b, x, st, t); }
  function hh(a, b, c, d, x, st, t) { return cmn(b ^ c ^ d, a, b, x, st, t); }
  function ii(a, b, c, d, x, st, t) { return cmn(c ^ (b | ~d), a, b, x, st, t); }

  const nblk = ((N + 8) >> 6) + 1;
  const tail = new Uint8Array(nblk * 64);
  tail.set(s);
  tail[N] = 0x80;
  const dv = new DataView(tail.buffer);
  const bitsLo = (N * 8) >>> 0;
  const bitsHi = Math.floor(N / 0x20000000) >>> 0;
  dv.setUint32(tail.length - 8, bitsLo, true);
  dv.setUint32(tail.length - 4, bitsHi, true);

  const M = new Int32Array(16);
  let state = [1732584193, -271733879, -1732584194, 271733878];

  for (let k = 0; k < nblk; k++) {
    const off = k * 64;
    for (let i = 0; i < 16; i++) M[i] = dv.getInt32(off + i * 4, true);
    let a = state[0], b = state[1], c = state[2], d = state[3];
    a = ff(a, b, c, d, M[0], 7, -680876936); d = ff(d, a, b, c, M[1], 12, -389564586); c = ff(c, d, a, b, M[2], 17, 606105819); b = ff(b, c, d, a, M[3], 22, -1044525330);
    a = ff(a, b, c, d, M[4], 7, -176418897); d = ff(d, a, b, c, M[5], 12, 1200080426); c = ff(c, d, a, b, M[6], 17, -1473231341); b = ff(b, c, d, a, M[7], 22, -45705983);
    a = ff(a, b, c, d, M[8], 7, 1770035416); d = ff(d, a, b, c, M[9], 12, -1958414417); c = ff(c, d, a, b, M[10], 17, -42063); b = ff(b, c, d, a, M[11], 22, -1990404162);
    a = ff(a, b, c, d, M[12], 7, 1804603682); d = ff(d, a, b, c, M[13], 12, -40341101); c = ff(c, d, a, b, M[14], 17, -1502002290); b = ff(b, c, d, a, M[15], 22, 1236535329);
    a = gg(a, b, c, d, M[1], 5, -165796510); d = gg(d, a, b, c, M[6], 9, -1069501632); c = gg(c, d, a, b, M[11], 14, 643717713); b = gg(b, c, d, a, M[0], 20, -373897302);
    a = gg(a, b, c, d, M[5], 5, -701558691); d = gg(d, a, b, c, M[10], 9, 38016083); c = gg(c, d, a, b, M[15], 14, -660478335); b = gg(b, c, d, a, M[4], 20, -405537848);
    a = gg(a, b, c, d, M[9], 5, 568446438); d = gg(d, a, b, c, M[14], 9, -1019803690); c = gg(c, d, a, b, M[3], 14, -187363961); b = gg(b, c, d, a, M[8], 20, 1163531501);
    a = gg(a, b, c, d, M[13], 5, -1444681467); d = gg(d, a, b, c, M[2], 9, -51403784); c = gg(c, d, a, b, M[7], 14, 1735328473); b = gg(b, c, d, a, M[12], 20, -1926607734);
    a = hh(a, b, c, d, M[5], 4, -378558); d = hh(d, a, b, c, M[8], 11, -2022574463); c = hh(c, d, a, b, M[11], 16, 1839030562); b = hh(b, c, d, a, M[14], 23, -35309556);
    a = hh(a, b, c, d, M[1], 4, -1530992060); d = hh(d, a, b, c, M[4], 11, 1272893353); c = hh(c, d, a, b, M[7], 16, -155497632); b = hh(b, c, d, a, M[10], 23, -1094730640);
    a = hh(a, b, c, d, M[13], 4, 681279174); d = hh(d, a, b, c, M[0], 11, -358537222); c = hh(c, d, a, b, M[3], 16, -722521979); b = hh(b, c, d, a, M[6], 23, 76029189);
    a = hh(a, b, c, d, M[9], 4, -640364487); d = hh(d, a, b, c, M[12], 11, -421815835); c = hh(c, d, a, b, M[15], 16, 530742520); b = hh(b, c, d, a, M[2], 23, -995338651);
    a = ii(a, b, c, d, M[0], 6, -198630844); d = ii(d, a, b, c, M[7], 10, 1126891415); c = ii(c, d, a, b, M[14], 15, -1416354905); b = ii(b, c, d, a, M[5], 21, -57434055);
    a = ii(a, b, c, d, M[12], 6, 1700485571); d = ii(d, a, b, c, M[3], 10, -1894986606); c = ii(c, d, a, b, M[10], 15, -1051523); b = ii(b, c, d, a, M[1], 21, -2054922799);
    a = ii(a, b, c, d, M[8], 6, 1873313359); d = ii(d, a, b, c, M[15], 10, -30611744); c = ii(c, d, a, b, M[6], 15, -1560198380); b = ii(b, c, d, a, M[13], 21, 1309151649);
    a = ii(a, b, c, d, M[4], 6, -145523070); d = ii(d, a, b, c, M[11], 10, -1120210379); c = ii(c, d, a, b, M[2], 15, 718787259); b = ii(b, c, d, a, M[9], 21, -343485551);
    state[0] = (state[0] + a) >>> 0; state[1] = (state[1] + b) >>> 0; state[2] = (state[2] + c) >>> 0; state[3] = (state[3] + d) >>> 0;
  }
  return rhex(state[0]) + rhex(state[1]) + rhex(state[2]) + rhex(state[3]);
}

// ---------- 京东联盟签名 ----------
function jdSign(params, secret) {
  const keys = Object.keys(params).filter(k => k !== 'sign').sort();
  let raw = secret;
  for (const k of keys) raw += k + params[k];
  raw += secret;
  return md5(new TextEncoder().encode(raw)).toUpperCase();
}

function gmt8Timestamp() {
  const d = new Date();
  // 把当前时间换算成 UTC+8 的 yyyy-MM-dd HH:mm:ss
  return new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000)
    .toISOString().replace('T', ' ').slice(0, 19);
}

function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return null;
}

function json(body, status = 200, cache = '') {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*'
  };
  if (cache) headers['x-cache'] = cache;
  return new Response(JSON.stringify(body), { status, headers });
}

// ---------- /price 处理器 ----------
async function handlePrice(url, env) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ ok: false, error: '缺少查询参数 q' }, 400);

  const appKey = env.JD_APP_KEY;
  const appSecret = env.JD_APP_SECRET;
  const unionId = env.JD_UNION_ID;

  if (!appKey || !appSecret || !unionId) {
    return json({
      ok: false,
      error: '京东联盟密钥未配置（JD_APP_KEY / JD_APP_SECRET / JD_UNION_ID）',
      hint: '在 Cloudflare 该 Worker 的 Settings → Variables and Secrets 添加这三个变量后重新部署即可启用站内实时价。当前站点已用「跳转京东查官方实时价」作为降级方案。'
    });
  }

  const cacheKey = 'jd:' + q;
  if (env.PRICE_CACHE) {
    const hit = await env.PRICE_CACHE.get(cacheKey);
    if (hit) return json(JSON.parse(hit), 200, 'HIT');
  }

  try {
    // 京东联盟开放接口：业务参数统一用 param_json（旧宙斯版才用 360buy_param_json）
    const biz = JSON.stringify({ goodsReqDTO: { keyword: q, pageIndex: 1, pageSize: 20 } });
    const params = {
      method: 'jd.union.open.goods.query',
      app_key: appKey,
      timestamp: gmt8Timestamp(),
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      union_id: unionId,
      param_json: biz
    };
    params.sign = jdSign(params, appSecret);

    const upstream = await fetch('https://api.jd.com/routerjson', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: new URLSearchParams(params).toString()
    });
    const jd = await upstream.json();

    if (jd.error_response) {
      const msg = jd.error_response.zh_desc || jd.error_response.msg || '京东接口返回错误';
      return json({ ok: false, error: '京东接口错误：' + msg }, 502);
    }

    const respKey = 'jd_union_open_goods_query_responce';
    const rawResult = jd[respKey] && jd[respKey].queryResult;
    if (!rawResult) return json({ ok: true, q, source: 'jd-union', items: [], total: 0 });

    // 不同版本接口：queryResult 可能是 JSON 字符串，也可能是对象
    let parsed = null;
    if (typeof rawResult === 'string') {
      try { parsed = JSON.parse(rawResult); } catch (e) { parsed = null; }
    } else {
      parsed = rawResult;
    }
    if (!parsed) return json({ ok: true, q, source: 'jd-union', items: [], total: 0 });

    // 不同版本：数据数组可能在 data / result / list / goods_list，或本身就是数组
    let list = [];
    if (Array.isArray(parsed)) list = parsed;
    else if (Array.isArray(parsed.data)) list = parsed.data;
    else if (Array.isArray(parsed.result)) list = parsed.result;
    else if (Array.isArray(parsed.list)) list = parsed.list;
    else if (Array.isArray(parsed.goods_list)) list = parsed.goods_list;

    const items = list.map(it => {
      const pi = it.priceInfo || {};
      const price = firstDefined(pi.lowestPrice, pi.price, pi.lowestCouponPrice, it.price, it.promotionPrice);
      let img = firstDefined(
        it.imageUrl,
        it.imageInfo && it.imageInfo.imageList && it.imageInfo.imageList[0] && it.imageInfo.imageList[0].url
      );
      if (img && img.startsWith('http://')) img = 'https://' + img.slice(7);
      const sku = firstDefined(it.skuId, it.num_iid);
      return {
        skuId: sku,
        name: firstDefined(it.skuName, it.name, it.title),
        price: price,
        image: img || null,
        url: sku ? ('https://item.jd.com/' + sku + '.html') : null,
        shop: firstDefined(it.shopName, it.shopInfo && it.shopInfo.shopName)
      };
    }).filter(x => x.name);

    const payload = { ok: true, q, source: 'jd-union', total: parsed.totalCount || parsed.total || items.length, items };
    if (env.PRICE_CACHE) await env.PRICE_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 3600 });
    return json(payload, 200, 'MISS');
  } catch (e) {
    return json({ ok: false, error: String(e && e.message ? e.message : e) }, 502);
  }
}

// ---------- Worker 入口 ----------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/price' || url.pathname === '/price/') {
      return handlePrice(url, env);
    }
    // 静态资源：命中文件直接服务；未命中由 ASSETS 兜底返回 404
    return env.ASSETS.fetch(request);
  }
};

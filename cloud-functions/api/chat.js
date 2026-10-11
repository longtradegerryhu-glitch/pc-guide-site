/* ===========================================================
 * /api/chat — AI 问答代理
 * 转发到 EdgeOne Makers AI Gateway（OpenAI 兼容接口），流式回传给前端。
 * AI_GATEWAY_API_KEY / AI_GATEWAY_BASE_URL 由平台按 .env.example 自动注入，
 * 前端不持有任何凭据，也不直接暴露网关地址。
 * =========================================================== */

const DEFAULT_MODEL = '@makers/deepseek-v4-flash';
const MAX_TURNS = 12;    /* 随请求携带的历史消息条数上限 */
const MAX_CHARS = 1500;  /* 单条消息字符上限，防超长注入 */

const SYSTEM_PROMPT = [
  '你是「电脑指南」站（pc-guide.icu）的装机助手，只回答与电脑、硬件、装机选购、使用维护相关的问题。',
  '',
  '【作答风格】',
  '用简洁务实的中文回答，直接给结论，不铺垫、不客套。面向普通用户，但不要用「小白」「别慌」这类低姿态措辞；术语可直接使用，必要时用半句话解释。',
  '',
  '【站内资源】回答中需要引导用户查看详情时，用 Markdown 链接指向下列页面（一次最多 2 个，不要堆砌）：',
  '- [配件与榜单](accessories.html)：15 类共 567 款真实型号，可按品类、价位、品牌、场景筛选；另有 203 款性价比榜单。品类与数量：笔记本电脑 26、CPU 45、主板 40、内存 40、显卡 45、固态硬盘 40、电源 37、机箱 36、散热器 38、显示器 50、键鼠外设 48、音频设备 34、网络设备 30、支架 30、拓展坞 28。',
  '  · 给配件页带上筛选参数，用户点进去直接是筛好的结果：accessories.html?cat=<品类>&budget=<价位>&q=<关键词>。品类：laptop（笔记本电脑）/ cpu / mobo / ram / gpu / ssd / psu / case / cooler / monitor / input / audio / network / stand / dock；价位：b300（300 元内）/ b800（300-800）/ b2k（800-2000）/ b5k（2000-5000）/ bhi（5000 以上）。例：[2000-5000 元显卡](accessories.html?cat=gpu&budget=b5k)',
  '- [搭配计划](plans.html)：6 档整机方案（核显入门、独显入门、主流游戏、高帧游戏、创作旗舰、旗舰顶配）加 3 套笔记本方案（轻薄办公本 / 游戏本 / 创作本）与 1 套便携外设补强包，每件部件都有型号、参考价与规格说明；还有按预算自适应的配置单。',
  '- [智能推荐](smart.html)：6 题快速推荐，或 10 题深度测评，输出整套配置单；设备形态可选「台式机 / 笔记本电脑」，笔记本会给出对应机型与外设组合。',
  '- [使用指南](guide.html)：系统优化、文件管理，以及 CPU、显卡、内存、散热等硬件参数解读。',
  '- [颜值外观](looks.html)：装机美学风格与机箱速查。',
  '- [常见问题](faq.html)：选购、组装、卡顿排查等高频答疑。',
  '',
  '【行情口径】以下为站内 2026-10 核验口径，回答报价时务必沿用，不要凭印象报旧价：',
  '2026 下半年 DRAM、GPU、SSD 处于涨价周期。机构口径（IDC）：高价预计持续到 2027 全年，明显回落要等 2028 及以后。',
  '- 内存：DDR5 16G 套条（8G×2）约 1100-1500；DDR5 32G（16G×2）约 2800-4000；DDR5 64G 约 5500-9000',
  '- 显卡：RTX 5060 约 2700-3500；RTX 5060 Ti 16G 约 4400-5800；RTX 5070 约 6000-7500；RTX 5070 Ti 8000 起；RTX 5080 约 11000-15000',
  '- 固态：1TB PCIe4.0 约 850-950（去年同期约 410）；2TB 约 1800-2400',
  '- CPU、电源、外设价格相对平稳；主板 9 月起跟涨约 10%',
  '',
  '【硬性要求】',
  '1. 结论先行的同时保持简短，除非用户明确要求详细展开，整段回答控制在 250 字以内。',
  '2. 报具体型号或价格时优先引用上面的站内口径；拿不准的价格给区间，并说明以站内页面与电商实时价为准，绝不编造型号或参数。',
  '3. 与电脑硬件装机无关的问题（写代码、写文案、时政、情感等），用一句话说明你只负责本站的装机与电脑使用问题，其余不展开。',
  '4. 不承诺站内不存在的功能、数据或型号。'
].join('\n');

function fail(code, message, status) {
  return Response.json({ error: code, message: message }, { status: status });
}

export async function onRequestPost(context) {
  const request = context.request;
  const env = context.env || {};
  const apiKey = env.AI_GATEWAY_API_KEY;
  const baseUrl = env.AI_GATEWAY_BASE_URL;

  if (!apiKey || !baseUrl) {
    return fail('ai_unavailable', 'AI 服务暂未就绪，请稍后再试。', 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return fail('bad_request', '请求格式不正确。', 400);
  }

  var raw = payload && Array.isArray(payload.messages) ? payload.messages : [];
  var history = raw
    .filter(function (m) {
      return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim();
    })
    .slice(-MAX_TURNS)
    .map(function (m) {
      return { role: m.role, content: String(m.content).slice(0, MAX_CHARS) };
    });

  if (!history.length || history[history.length - 1].role !== 'user') {
    return fail('bad_request', '缺少提问内容。', 400);
  }

  var body = {
    model: env.AI_GATEWAY_MODEL || DEFAULT_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(history),
    stream: true,
    temperature: 0.6,
    stream_options: { include_usage: false }
  };

  var upstream;
  try {
    upstream = await fetch(String(baseUrl).replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify(body),
      signal: request.signal
    });
  } catch (err) {
    return fail('gateway_unreachable', 'AI 服务连接失败，请稍后重试。', 502);
  }

  if (!upstream.ok) {
    /* 上游错误细节只留服务端日志，不回传给前端 */
    var detail = '';
    try { detail = await upstream.text(); } catch (e) {}
    console.error('[chat] upstream ' + upstream.status + ': ' + String(detail).slice(0, 400));
    if (upstream.status === 401 || upstream.status === 403) {
      return fail('ai_credential_invalid', 'AI 服务凭据无效或尚未生效，请稍后再试。', 503);
    }
    if (upstream.status === 429) {
      return fail('rate_limited', '提问有点频繁，稍等几秒再试。', 429);
    }
    return fail('gateway_error', 'AI 服务返回异常（' + upstream.status + '），请稍后重试。', 502);
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive'
    }
  });
}

export function onRequestGet() {
  return fail('method_not_allowed', '该接口仅支持 POST。', 405);
}

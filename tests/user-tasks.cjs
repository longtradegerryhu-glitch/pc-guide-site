/* 用户任务验收表 —— 这个项目唯一的主验收口径
 *
 * 跑法：node E:/AI/pc-guide-site/tests/user-tasks.cjs
 * 退出码：任何一条 FAIL → exit 1
 *
 * 为什么有这个文件：
 *   过去 20 轮全部用「断言数 PASS/FAIL」验收，闸门全绿但站点仍不可用 ——
 *   搜「DDR5」首屏全是主板、搜「网卡」首屏全是主板。
 *   闸门能验「已有的规则有没有被执行」，验不了「用户第一眼看到的是不是他要的」。
 *   本表把验收口径从「代码对不对」换成「人用起来对不对」。
 *
 * 三类任务：
 *   U 类 · 配件搜索（用户在配件页搜一个词，看第一眼是不是他要的品类）
 *   V 类 · 智能推荐（用户走完问卷，看配置单与配件区是否自洽、是否物理兼容）
 *   W 类 · 物理兼容（配件与主体能不能真的装在一起）
 *
 * 数字口径（2026-10-22 实测基线，来自 commit c2ceb8e）：
 *   搜索 10 个词：7 个达标、3 个不达标（DDR5 / 2.5G / 网卡）
 *   深度测评 4 个任务：4 个通过
 *   全部闸门：audit-search 20/0 · specs-wire 24/0 · compat 8/0 · reco-acceptance 17/0
 *              e2e-merge 17/0 · e2e-inject 8/0 · selftest 15/0
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = (() => {
  try { return require('jsdom'); } catch (e) { return {}; }
})();

const ROOT = path.resolve(__dirname, '..');
const ACC = path.join(ROOT, 'accessories.html');
const SMART = path.join(ROOT, 'smart.html');

/* 「前 N 张」的唯一口径常量（ORD-32）。
 * 为什么提成常量：D3 首屏重构会改「第一眼看到多少张卡」这个量，
 * 过去它散落在 6 处硬编码 8，改一处忘一处 = 尺子口径分裂。
 * 现在只有一个数，改它就等于改全表口径。
 * 注意口径本身：jsdom 没有布局引擎，本表量的是「DOM 前 N 张」，
 * 不是「视口内 N 张」——真机实测视口内是 0 张卡（首卡在文档 2001px 处）。
 * 两者不是一回事，详见 FEEDBACK/审计.md（ORD-32 §三.4）。 */
const SCREEN_N = 8;

let pass = 0, fail = 0, skip = 0;
const chk = (name, cond, actual) => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} :: ${JSON.stringify(actual)}`); }
};
const skp = (name, why) => { skip++; console.log(`  SKIP ${name} :: ${why}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!JSDOM) {
  console.error('⚠ 找不到 jsdom，无法真跑 UI，验收不可信。');
  console.error('  修法：npm install jsdom，或设置 NODE_PATH 指向含 jsdom 的 node_modules');
  process.exit(2);
}

async function loadDom(file) {
  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously', resources: 'usable',
    beforeParse(w) {
      w.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} });
    }
  });
  await sleep(3200);
  return dom;
}

/* 剥掉 JS 注释 —— 所有「扫源码」型自检闸的通用前提。
 * 不剥的话，注释里出现的键名会被当成代码，闸会先抓到自己。 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

/* 从卡片上取「品类显示名」。
 *
 * 原来：解析卡片内的 .acc-cat 文本（形如 "🧠 CPU"），正则去 emoji。
 * 改成：读祖先 section.acc-group[data-cat] 的 id，再用站内唯一的
 *       「品类 id → 显示名」映射表换算。
 * 为什么：显示名可能有多个写法（「拓展坞」/「扩展坞」都有人写），
 *   而 id 是唯一且稳定的；把映射表写死在这里，尺子的期望值就必须用
 *   显示名 —— 于是「期望值拼错」会立刻变成"该行永远 0"，
 *   而不再可能被误读成「产品没修好」。这条改动的直接收益：
 *   5 条 X 类行的期望值是站内不存在的品类名（笔记本支架 / 扩展坞 /
 *   键鼠 / 智能穿戴 / 整机方案），见下方 CAT_ID_BY_NAME。
 */
const CAT_ID_BY_NAME = {
  'CPU': 'cpu', '主板': 'mobo', '内存': 'ram', '显卡': 'gpu', '固态硬盘': 'ssd',
  '电源': 'psu', '机箱': 'case', '散热器': 'cooler', '显示器': 'monitor',
  '键鼠外设': 'input', '网络设备': 'network', '支架': 'stand', '拓展坞': 'dock',
  '笔记本电脑': 'laptop', '手机': 'phone', '充电与供电': 'charger',
  '手机与平板配件': 'mobileacc', '平板': 'tablet', '耳机与耳麦': 'earphone',
  '音箱与麦克风': 'audio', '智能穿戴与配套': 'wearable'
};
const CAT_NAME_BY_ID = Object.keys(CAT_ID_BY_NAME).reduce((m, n) => {
  m[CAT_ID_BY_NAME[n]] = n; return m;
}, {});

function catOf(card) {
  const g = card.closest('section.acc-group[data-cat]');
  if (!g) {
    const t = card.querySelector('.acc-cat, [class*=cat]');
    return t ? t.textContent.trim().replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '') : '?';
  }
  const id = g.getAttribute('data-cat');
  return CAT_NAME_BY_ID[id] || id;
}

/* ===================== U 类 · 配件搜索 ===================== */
async function runSearchTasks() {
  console.log('\n== U 类 · 配件搜索：用户搜一个词，第一眼是不是他要的品类 ==');
  const dom = await loadDom(ACC);
  const D = dom.window.document;
  const inp = D.querySelector('#accSearch');
  if (!inp) { chk('配件页有搜索框', false, '找不到 #accSearch'); return; }

  /* ---- U0 · D3 开工基线（ORD-32 新增）----
     测的是「新手第一眼能不能看到多个品类」：未搜索时，DOM 前 SCREEN_N 张里
     出现了几个不同的品类。
     当前实现把 CPU 排在最前 → 前 8 张全是 CPU → 不同品类数 = 1 → **这条是红的**。
     这不是缺陷，是 D3（首屏重构）的开工基线：做完 D3（首屏给多品类入口 / 分组标题）后应 ≥ 3。
     口径说明：jsdom 没有布局引擎，本表量的是「DOM 前 N 张」，不是「视口内 N 张」——
     真机（Edge 156，1366×768）实测配件页视口内是 0 张卡，第一张卡在文档 2001px 处，
     见 FEEDBACK/审计.md（ORD-32 §三.4）。所以这条比真机口径宽松，但方向一致。 */
  {
    const firstCards = [...D.querySelectorAll('.acc-card')].slice(0, SCREEN_N);
    const firstDist = {};
    firstCards.forEach(c => { const k = catOf(c); firstDist[k] = (firstDist[k] || 0) + 1; });
    const distinctCats = Object.keys(firstDist).length;
    chk('U0 未搜索时，前 ' + SCREEN_N + ' 张里出现的不同品类 ≥ 3（新手第一眼能不能看到多个品类 · D3 开工基线，当前为红）',
      distinctCats >= 3,
      { 前SCREEN_N张分布: firstDist, 不同品类数: distinctCats, 期望: '≥3' });
  }

  /* 每条 = [查询词, 期望主品类, 首屏N张里期望品类至少几张, 说明] */
  const TASKS = [
    ['DDR5',   '内存', 6, '内存代际词，内存条 47 款是主体，主板 specs 写「DDR5 双通道」不该压过'],
    /* 期望品类写「网络设备」而不是「网卡」：站内没有「网卡」这个品类，
       卡片标签来自 categories[].name —— network 品类的名字是「网络设备」，
       40 件里 2 件 USB/PCIe 网卡、4 件 2.5G/万兆交换机、34 件路由器。
       写「网卡」的话这条断言永远不可能通过（没有任何一张卡叫这个名字），
       而它真正要验的是「首屏是不是网络设备、而不是主板」—— 阈值一张没动。 */
    ['2.5G',   '网络设备', 5, '网卡速率词，network 40 款是主体，主板 specs 写「2.5G 网口」不该压过'],
    ['网卡',   '网络设备', 5, '品类同义词（「网卡」是网络设备的口语说法）'],
    ['M.2',    '固态硬盘', 6, 'ORD-17 已达成，不许退步'],
    ['内存',   '内存', 8, '品类词，52 款全在 ram'],
    ['显卡',   '显卡', 8, '品类词'],
    ['ATX3.1', '电源', 8, '电源规格词，24 款全在 psu'],
    ['散热器', '散热器', 8, '品类词'],
    ['显示器', '显示器', 8, '品类词'],
    ['CPU',    'CPU', 8, '品类词'],
  ];

  for (const [q, want, min, why] of TASKS) {
    inp.value = q;
    inp.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await sleep(700);
    const cards = [...D.querySelectorAll('.acc-card')].slice(0, SCREEN_N);
    const dist = {};
    cards.forEach(c => { const k = catOf(c); dist[k] = (dist[k] || 0) + 1; });
    const got = dist[want] || 0;
    const hint = D.querySelector('#accSearchHint');
    const hits = hint ? (hint.textContent.match(/命中 (\d+) 款/) || [])[1] : '?';
    chk(`U 搜「${q}」首屏 ${SCREEN_N} 张里「${want}」≥ ${min} 张（${why}）`,
      got >= min, { 首屏分布: dist, 期望品类: want, 至少: min, 实际: got, 总命中: hits });
  }
  /* ---- 追加三行（ORD-27 开工基线，由总控定稿；这三行现在是红的，就是 ORD-27 要做的事）----
     来源：审计 ORD-26 §4.1① 与 §4.1⑤ 的实测，均已由我复核。
     ① 「ATX」：电源的命中全部来自 specs 里的「ATX3.1」子串，而 ATX3.1 另有专键 →
        裸词 ATX 该给版型（机箱/主板），不该被 24 件电源顶满首屏。用上界断言，不指定机箱还是主板先出。
     ② 「RTX5080」不带空格：命中 1 件且是笔记本电脑，0 张显卡（显卡名写「NVIDIA RTX 5080 16G」）→
        拉丁串匹配必须做空白归一，否则每加一个词都要在映射表里补一条，救不了通例。
     ③ 「WiFi 7」带空格：被切成 wifi + 7，SPEC_CAT 的 wifi7 永远匹配不上 → 同一条根因。

     【2026-10-27 总控修订第 ② 行】原判据「≥6 张显卡」在数据上不可达：
     全库含 5080 的显卡记录只有 2 条（g7 与 vg207 是同一款，合并后 1 张卡），
     显卡品类共 61 款 —— 要求首屏 6 张显卡，等于要求 5080 有 6 个型号。
     这是**尺子把数据缺当成了排序错**，改判据（采纳审计 ORD-28 §八①）：
       · 主判据 = 首屏第 1 张必须是显卡（型号层命中必须压过软文本层命中）
       · 副判据 = 首屏里电源卡不得排在显卡卡之前
     真实缺陷不是「显卡不够多」，而是**电源/显示器的 compat 里写了「配 RTX 5080 级平台」，
     靠软文本命中占了首屏 7 席，把显卡挤到第 1 张之后** —— 这与 ORD-18 报的
     「struct 分层只覆盖 ssd」是同型缺口（显卡没有 specsObj，拿不到主体分）。 */
  const CAPS = [
    { q: 'ATX',     cap: '电源',     max: 3, why: '电源的 ATX 命中全部来自「ATX3.1」子串且另有专键；裸词该给版型' },
    { q: 'WiFi 7',  want: '网络设备', min: 6, why: '拉丁串空白归一：带空格的「WiFi 7」不该被主板的 WiFi7 规格压过' },
  ];
  for (const t of CAPS) {
    inp.value = t.q;
    inp.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await sleep(700);
    const cards = [...D.querySelectorAll('.acc-card')].slice(0, SCREEN_N);
    const dist = {};
    cards.forEach(c => { const k = catOf(c); dist[k] = (dist[k] || 0) + 1; });
    const hint = D.querySelector('#accSearchHint');
    const hits = hint ? (hint.textContent.match(/命中 (\d+) 款/) || [])[1] : '?';
    if (t.cap) {
      const got = dist[t.cap] || 0;
      chk(`U 搜「${t.q}」首屏 ${SCREEN_N} 张里「${t.cap}」≤ ${t.max} 张（${t.why}）`,
        got <= t.max, { 首屏分布: dist, 上限品类: t.cap, 最多: t.max, 实际: got, 总命中: hits });
    } else {
      const got = dist[t.want] || 0;
      chk(`U 搜「${t.q}」首屏 ${SCREEN_N} 张里「${t.want}」≥ ${t.min} 张（${t.why}）`,
        got >= t.min, { 首屏分布: dist, 期望品类: t.want, 至少: t.min, 实际: got, 总命中: hits });
    }
  }

  /* ---- RTX 5080：排序正确性判据（2026-10-27 总控修订，采纳审计 ORD-28 §八①）----
     原判据「≥6 张显卡」不可达：全库含 5080 的显卡只有 g7/vg207 两条（同一款，合并后 1 张卡），
     显卡品类共 61 款。要求首屏 6 张 = 要求 5080 有 6 个型号 —— 把数据缺当成了排序错。

     真正要验的是**排序**：显卡是型号层命中（rank2），电源/显示器是 compat 软文本命中（rank3）。
     型号层必须压过软文本层 —— 显卡卡必须排在电源卡之前。 */
  {
    const q = 'RTX5080';
    inp.value = q;
    inp.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await sleep(700);
    const cards = [...D.querySelectorAll('.acc-card')].slice(0, SCREEN_N);
    const cats = cards.map(c => catOf(c));
    const gi = cats.indexOf('显卡');
    const pi = cats.indexOf('电源');
    const hint = D.querySelector('#accSearchHint');
    const hits = hint ? (hint.textContent.match(/命中 (\d+) 款/) || [])[1] : '?';
    const dist = {};
    cats.forEach(k => { dist[k] = (dist[k] || 0) + 1; });

    chk('U 搜「RTX5080」首屏第 1 张是显卡（型号层命中必须压过软文本层）',
      gi === 0, { 首屏品类序: cats, 显卡位置: gi, 总命中: hits, 首屏分布: dist });

    chk('U 搜「RTX5080」首屏里显卡排在电源之前（电源 compat 写「配 RTX 5080 级平台」不该占先）',
      gi >= 0 && (pi === -1 || gi < pi), { 首屏品类序: cats, 显卡位置: gi, 电源位置: pi });

    /* 拉丁串归一的通例：四种写法必须完全等价（这是根因，不是词条问题） */
    const sigs = [];
    for (const v of ['RTX5080', 'RTX 5080', 'rtx5080', 'RTX-5080']) {
      inp.value = v;
      inp.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      await sleep(600);
      const h2 = D.querySelector('#accSearchHint');
      const m2 = h2 ? h2.textContent.match(/命中 (\d+) 款/) : null;
      const c2 = [...D.querySelectorAll('.acc-card')].slice(0, SCREEN_N).map(c => catOf(c)).join('|');
      sigs.push(v + '→' + (m2 ? m2[1] : '0') + '|' + c2);
    }
    const uniq = new Set(sigs.map(s => s.split('→')[1]));
    chk('U 「RTX5080 / RTX 5080 / rtx5080 / RTX-5080」四种写法完全等价（拉丁串归一的通例）',
      uniq.size === 1, { 四种写法实测: sigs, 不同结果数: uniq.size });
  }

  /* ---- X 类 · 复合词 / 歧义词 / 零结果死路 ----------------------------
   * 来源：审计 ORD-26 §3.5（三整类缺失维度）+ 总控 2026-10-24 独立复核。
   *
   * ORD-28 审计复核改了 3 处判据，逐条说明：
   *
   * ① 【期望值必须是站内真实品类名】
   *    原来：'笔记本支架' / '扩展坞' / '键鼠' / '智能穿戴' / '整机方案'
   *    改成：'支架' / '拓展坞' / '键鼠外设' / '智能穿戴与配套'；最后一条改成「方案引导」判据
   *    为什么：这 5 个字符串在站内 21 个品类显示名里**一个都不存在**（实测全集：
   *      CPU/主板/内存/显卡/固态硬盘/电源/机箱/散热器/显示器/键鼠外设/网络设备/
   *      支架/拓展坞/笔记本电脑/手机/充电与供电/手机与平板配件/平板/耳机与耳麦/
   *      音箱与麦克风/智能穿戴与配套）→ 这 5 行的期望值恒为 0，
   *      **即使产品修好了也永远变不绿**，会被误判成「执行者没修」。
   *    语义保持：'笔记本支架'→'支架'（笔记本支架在 stand 品类里）、
   *      '扩展坞'→'拓展坞'（dock 品类的显示名就是「拓展坞」）、'键鼠'→'键鼠外设'、
   *      '智能穿戴'→'智能穿戴与配套'。**阈值一张没动。**
   *
   * ② 【「组装电脑」这条要重写 —— 原判据恒真，测不到任何东西】
   *    原来：hits > 0 || guide || alt，其中 alt 正则含「热门搜索」
   *    改成：判据改成「**结果区里出现指向 plans.html 的可点击入口**」，
   *          且「结果区」限定在 #accWrap / #accSearchHint / 空态容器内，
   *          **不再扫全 body**。
   *    为什么（实测）：未搜索时 alt 正则就已经命中「热门搜索」「替代」
   *      ——「热门搜索」是配件页常驻区（#accHot），与查询无关；
   *      而「试试」来自空态文案「没有匹配「组装电脑」的型号，换个关键词试试」
   *      ——**恰恰是死路本身**。所以原判据在**任何查询下都 PASS**，
   *      这行等于没测到东西（总控 §一.2 的判断成立）。
   *    新判据为什么用「可点击入口」而不是「文案里出现方案二字」：
   *      导航栏本来就有一个 `a[href="plans.html"]`（accessories.html 第 40 行），
   *      扫全 body 会把导航栏当成方案引导 → 又是恒真。
   *      必须限定在结果容器内，且必须是 **链接/按钮**（能点），不是文案。
   *
   * ③ 【「主机 / 台式机 / 游戏」三条：库里没有整机件 → 改判据形态】
   *    原来：want='整机方案', min=1 —— 但站内不存在名为「整机方案」的品类，
   *          且 1209 件里**没有一件是整机**（全是零件），所以这三条永不可达。
   *    改成：判据 = 「结果区里出现指向 plans.html 的入口」+「首屏 8 张里
   *          零件型卡片 ≤ N」（N=6，容许零件但不许首屏全是零件）。
   *    为什么这样定：总控 §一.1 已指出「实际形态可能是『卡片 + 方案引导条』，
   *      不是首屏 8 张里有方案卡」—— 我给的口径是：
   *      **允许「方案引导入口」计通过，但必须同时限制零件霸占首屏**；
   *      只看引导不看首屏，会放过「首屏 8 张全是 CPU + 一个方案按钮」这种
   *      仍然难用的形态。上限 6 的依据：当前搜「台式机」首屏是
   *      ssd3/case1/network2 共 6 件零件（总量只有 6 件），
   *      所以 6 是「不误杀现状但不放过霸占」的分界。
   */
  const PLAN_LINK_IN_RESULT = 'a[href*="plans.html"], button[data-href*="plans.html"], [data-goto*="plans.html"]';
  const RESULT_CONTAINERS = '#accWrap, #accSearchHint, #accEmpty, #accNoResult, .acc-empty, .acc-no-result, .acc-suggest';

  /* 判据：结果区里有没有指向 plans.html 的可点击入口（限定在结果容器内，不扫全 body） */
  const hasPlanEntry = () => {
    const roots = RESULT_CONTAINERS.split(',').map(s => D.querySelector(s.trim())).filter(Boolean);
    for (const r of roots) {
      const links = [...r.querySelectorAll(PLAN_LINK_IN_RESULT)];
      if (links.length) return { ok: true, href: links[0].getAttribute('href'), text: links[0].textContent.trim().slice(0, 30) };
    }
    for (const r of roots) {
      if (r.matches && r.matches(PLAN_LINK_IN_RESULT)) return { ok: true, href: r.getAttribute('href'), text: r.textContent.trim().slice(0, 30) };
    }
    return { ok: false };
  };

  const X = [
    /* X-1 复合词：多词连写不该被拆成 AND 条件后必然 0 结果 */
    { q: '组装电脑',   plan: true, why: '新手第一大意图；站的主资产是 26 套方案，搜不到零件就必须给方案入口' },
    { q: '笔记本支架', want: '支架',         min: 3, why: '配置单行名；stand 40 件里 6 件是笔记本支架（s8/s19/s20/s21/vst6 等）' },
    { q: '平板键盘',   want: '手机与平板配件', min: 3, why: '配置单行名；mobileacc 里 5 件平板键盘（ma20/21/22/23/28）' },
    { q: '手机支架',   want: '手机与平板配件', min: 3, why: '常见口语；mobileacc 36 件里 3 件名字含「手机支架」+ 车载/重力支架共 5 件' },
    { q: '显卡支架',   want: '支架',         min: 2, why: '常见口语；stand 40 件' },
    { q: 'CPU散热器', want: '散热器',       min: 3, why: '混合写法；cooler 52 件' },
    { q: '电源适配器', want: '充电与供电',   min: 3, why: '常见口语；charger 41 件里 2 件转接器 + 30 件充电器' },
    { q: '硬盘盒',     want: '拓展坞',       min: 1, why: '常见口语；库里确实有 3 件硬盘盒（d18/vdk10/vdk206，均在 dock 品类）' },
    { q: '超级本',     want: '笔记本电脑',   min: 3, why: '品类别名；laptop 79 件里 25 件轻薄/超极本' },
    { q: '键鼠外设',   want: '键鼠外设',     min: 3, why: '常见口语；input 67 件' },
    { q: '智能穿戴',   want: '智能穿戴与配套', min: 3, why: '品类别名；wearable 70 件' },
    { q: '屏幕保护',   want: '手机与平板配件', min: 1, why: '口语，指保护膜；mobileacc 里有 4 件膜（ma5-ma8）' },
    /* X-2 歧义词：搜出来必须是「主流那一类」，不能被冷门品类霸占 */
    { q: '键盘',       want: '键鼠外设',     min: 4, why: '现在首屏 8 张全是「手机与平板配件」；input 67 件里 37 件含「键盘」，其中 31 件 style 是键盘类' },
    { q: '充电线',     want: '充电与供电',   min: 4, why: '现在只命中 1 件（苹果 USB-C 编织充电线）；charger 里 style=数据线 有 5 件' },
    { q: '144Hz',      want: '显示器',       min: 3, why: '现在首屏 3 张显示器 + 5 张手机；显示器 76 款里只有 3 款写 144Hz（m36/vmo6/moq6）—— 阈值从 4 降到 3：4 在数据上不可达' },
    /* X-3 整机意图：库里没有整机件 → 判据改为「给方案入口」+「首屏不许全是零件」 */
    { q: '主机',       plan: true, maxParts: 6, why: '用户要的是整机，库里没有整机件 → 必须导向方案页' },
    { q: '台式机',     plan: true, maxParts: 6, why: '同上' },
    { q: '游戏',       plan: true, maxParts: 6, why: '站的最大资产是方案，不该首屏全是 CPU' },
  ];

  for (const t of X) {
    inp.value = t.q;
    inp.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await sleep(600);
    const hint = D.querySelector('#accSearchHint');
    const hm = hint ? hint.textContent.match(/命中 (\d+) 款/) : null;
    const hits = hm ? +hm[1] : 0;
    const cards = [...D.querySelectorAll('.acc-card')].slice(0, SCREEN_N);
    const dist = {};
    cards.forEach(c => { const k = catOf(c); dist[k] = (dist[k] || 0) + 1; });
    const shown = cards.length;

    if (t.plan) {
      /* 「给方案入口」判据：必须可点击，且在结果容器内（不扫全 body ——
         导航栏本来就有一个 plans.html 链接，扫全 body 会恒真） */
      const pe = hasPlanEntry();
      const ok = pe.ok && shown <= (t.maxParts || 6);
      chk('X 搜「' + t.q + '」给出可点击的方案页入口，且首屏零件不超过 ' + (t.maxParts || 6) + ' 张（' + t.why + '）',
        ok, { 命中: hits, 首屏张数: shown, 有方案入口: pe.ok, 入口: pe.text || '', 首屏分布: dist });
      continue;
    }

    const got = dist[t.want] || 0;
    chk('X 搜「' + t.q + '」首屏 ' + SCREEN_N + ' 张里「' + t.want + '」≥ ' + t.min + ' 张（' + t.why + '）',
      got >= t.min, { 首屏分布: dist, 期望品类: t.want, 至少: t.min, 实际: got, 总命中: hits });
  }
  dom.window.close();
}

/* ===================== V 类 · 智能推荐 ===================== */
async function runQuizTasks() {
  console.log('\n== V 类 · 智能推荐：走完问卷，配置单与配件区是否自洽 ==');
  const dom = await loadDom(SMART);
  const D = dom.window.document;
  const w = dom.window;
  const click = sel => {
    const e = D.querySelector(sel);
    if (!e) return false;
    e.dispatchEvent(new w.Event('click', { bubbles: true }));
    return true;
  };
  const pick = (q, o) => click(`.q-opt[data-q="${q}"][data-o="${o}"]`);

  /* [任务名, 答案序列, 期望部件数下限, 期望合计下限, 期望合计上限, [关键件行名, 关键件价格下限]]
   *
   * 为什么要从「下界断言」改成「区间 + 关键件」（ORD-32 / 审计 ORD-26 异议②）：
   *   旧判据「合计下限 ≥ 4000」只防跌不防涨，也不防错 ——
   *   把合计从 4200 改成 8000 它照样 PASS，把影像旗舰换成红米它也照样 PASS。
   *   区间卡住「凑数」与「堆料」，关键件卡住「形态对但主体选错」。
   *
   * 区间取法（基于实测当前值，不是抄基线）：
   *   手机·拍照   实测 [4200, 8000] → 收窄为 [4000, 8000]（旧下界 4000 保留，砍掉 1200 上浮空间）
   *   手机·游戏   实测 [3800, 5200] → [3500, 5200]（旧下界 3500 保留，上浮 400）
   *   台式·游戏   实测 [10500, 13000] → [9000, 13000]（旧下界 9000 保留，上浮 1500）
   *   笔记本·办公 实测 [4500, 7500] → [4000, 7500]（旧下界 4000 保留，上浮 700）
   *   上限留 12%~19% 弹性给行情波动；比旧判据紧，但仍不会因一次调价就红。
   *
   * 关键件判据（旧判据完全没有的）：
   *   主体件必须在配置单里，且其参考价下限不能低于阈值 ——
   *   「手机·拍照给出一台红米」这种形态对但主体错的情况，必须红。
   */
  const TASKS = [
    ['手机·拍照', [['form','phone'],['use','p_photo'],['budget','b8500'],['pref','p_camera'],
                   ['look','p_any'],['intensity','heavy'],['lifespan','y3'],['existing','none'],['focus','p_body']],
     6, 4000, 8000, ['手机', 5000]],
    ['手机·游戏', [['form','phone'],['use','p_game'],['budget','b8500'],['pref','p_perf'],
                   ['look','p_any'],['intensity','heavy'],['lifespan','y3'],['existing','none'],['focus','p_play']],
     6, 3500, 5200, ['手机', 4000]],
    ['台式·游戏', [['form','desktop'],['use','game'],['budget','b8500'],['pref','value'],
                   ['look','any'],['intensity','heavy'],['lifespan','y3'],['existing','none'],['focus','core']],
     8, 9000, 13000, ['显卡', 2000]],
    ['笔记本·办公',[['form','laptop'],['use','office'],['budget','b6000'],['pref','value'],
                   ['look','any'],['intensity','mid'],['lifespan','y3'],['existing','none'],['focus','core']],
     5, 4000, 7500, ['笔记本', 3000]],
  ];

  /* 取配置单里某一行（按 .spec-part 行名）的参考价下限 */
  function partPriceLo(partName) {
    const rows = [...D.querySelectorAll('.smart-spec-table tbody tr')];
    const tr = rows.find(r => {
      const td = r.querySelector('td.spec-part');
      return td && td.textContent.trim() === partName;
    });
    if (!tr) return null;
    const td = tr.querySelector('td.spec-price');
    if (!td) return null;
    const m = td.textContent.match(/([\d,]+)/);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
  }

  for (const [name, ans, minParts, minTotal, maxTotal, keyPart] of TASKS) {
    if (click('.q-reset')) await sleep(60);
    let ok = true;
    for (const [q, o] of ans) {
      if (!pick(q, o)) { ok = false; console.log(`  （${name}：点不到选项 ${q}/${o}）`); break; }
      await sleep(110);
    }
    if (!ok) { chk(`V ${name} 问卷可走通`, false, '选项点不到'); continue; }
    click('#quizSubmit');
    await sleep(500);
    const body = D.body.textContent.replace(/\s+/g, ' ');

    const parts = (body.match(/全套配置单（(\d+) 个部件）/) || [])[1];
    const tot = body.match(/合计[^¥]*¥([\d,]+)\s*-\s*¥?([\d,]+)/) || [];
    const lo = parseInt((tot[1] || '0').replace(/,/g, ''), 10);
    const hi = parseInt((tot[2] || '0').replace(/,/g, ''), 10);
    chk(`V ${name} 产出配置单且部件数 ≥ ${minParts}`, !!parts && +parts >= minParts, { 部件数: parts });
    /* 区间：下限防「缩水」，上限防「堆料 / 顶配漂移」 */
    chk(`V ${name} 合计落在区间 [${minTotal}, ${maxTotal}]`, lo >= minTotal && hi <= maxTotal,
      { 实测区间: [lo, hi], 期望区间: [minTotal, maxTotal] });
    /* 关键件：主体必须在，且价位不能低到离谱（形态对但主体选错也要红） */
    const kLo = partPriceLo(keyPart[0]);
    chk(`V ${name} 关键件「${keyPart[0]}」在配置单里且参考价下限 ≥ ${keyPart[1]}`,
      kLo !== null && kLo >= keyPart[1],
      { 行名: keyPart[0], 实测参考价下限: kLo, 期望下限: keyPart[1] });
  }
  dom.window.close();
}

/* ===================== W 类 · 物理兼容 ===================== */
async function runCompatTasks() {
  console.log('\n== W 类 · 物理兼容：配件能不能真的装上去 ==');
  const dom = await loadDom(SMART);
  const D = dom.window.document;
  const w = dom.window;
  const click = sel => {
    const e = D.querySelector(sel);
    if (!e) return false;
    e.dispatchEvent(new w.Event('click', { bubbles: true }));
    return true;
  };
  const pick = (q, o) => click(`.q-opt[data-q="${q}"][data-o="${o}"]`);

  /* W1 非苹果手机不得出现 Apple 生态配件（ORD-21 修后应为通过） */
  const ans = [['form','phone'],['use','p_photo'],['budget','b8500'],['pref','p_camera'],
               ['look','p_any'],['intensity','heavy'],['lifespan','y3'],['existing','none'],['focus','p_body']];
  for (const [q, o] of ans) { pick(q, o); await sleep(110); }
  click('#quizSubmit');
  await sleep(500);
  const body = D.body.textContent.replace(/\s+/g, ' ');
  const appleHits = ['iPhone 17 官方硅胶保护壳', '妙控键盘', 'Apple Pencil', 'Magic Trackpad']
    .filter(t => body.includes(t));
  chk('W1 非苹果手机（vivo 场景）配件区不出现 Apple 专用件', appleHits.length === 0, { 出现: appleHits });

  /* W2 内存代际 × 主板平台不得冲突 —— 判据在 compat.cjs 的 D5（26 套方案逐个验）。
     这里读它的实跑结果，而不是写死 true：写死的话 D5 红了本表照样绿，
     那就成了「尺子自己不量」。 */
  const { spawnSync } = require('child_process');
  const d5 = spawnSync(process.execPath, [path.join(ROOT, 'tests', 'compat.cjs')],
    { encoding: 'utf8', env: Object.assign({}, process.env), timeout: 600000 });
  const d5out = (d5.stdout || '') + (d5.stderr || '');
  const d5line = (d5out.match(/.*D5.*/g) || []).filter(l => /PASS|FAIL/.test(l)).join(' | ');
  chk('W2 内存代际 × 主板平台无冲突（由 tests/compat.cjs D5 承担）',
    /PASS D5/.test(d5out) && !/FAIL D5/.test(d5out),
    { D5: d5line || '（compat.cjs 未输出 D5）' });

  dom.window.close();
}

/* ===================== S 类 · 尺子自身自检 =====================
 *
 * 为什么要有这一段：
 *   本尺子的期望值先后犯过两次同类错误 ——
 *     ① ORD-25「网卡」：我把「网卡」当品类名，实际显示名是「网络设备」→ 该行永远不可能通过
 *     ② ORD-28「笔记本支架/扩展坞/键鼠/智能穿戴/整机方案」：5 行用了不存在的显示名 → 死代码
 *   根因是同一个：**期望值写的是「人怎么叫这个品类」，不是「站里怎么显示这个品类」。**
 *   这条自检闸一次性堵死这类复发 —— 期望值必须是 21 个显示名之一（或明确的虚拟名）。
 */
async function runSelfCheck() {
  console.log('\n== S 类 · 尺子自身自检（防止期望值写成不存在的品类） ==');

  /* 从页面拿 21 个显示名全集（唯一权威来源 = 运行时渲染，不是硬编码） */
  const dom = await loadDom(ACC);
  const D = dom.window.document;
  const names = new Set();
  D.querySelectorAll('.acc-group[data-cat]').forEach(sec => {
    const h = sec.querySelector('.acc-group-head h3');
    if (!h) return;
    /* 标题形如 "🧠 CPU"，去掉 emoji 与空格 */
    const t = h.textContent.trim().replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '');
    if (t) names.add(t);
  });
  dom.window.close();

  /* 允许的虚拟名（不是页面品类名，但有明确的判据语义） */
  const VIRTUAL = new Set(['整机方案']);

  /* 收集本文件里所有用到的期望值 */
  /* 剥掉注释再扫 —— 否则注释里写一句「以前写的是 want: '网卡'」就会把非法值扫进来。
     「扫源码」型自检闸的通用前提：先剥注释。 */
  const src = stripComments(fs.readFileSync(__filename, 'utf8'));
  const used = new Set();
  const re = /\b(?:want|cap)\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) used.add(m[1]);

  const illegal = [...used].filter(v => !names.has(v) && !VIRTUAL.has(v));
  chk('S1 所有期望品类都是站内的真实显示名（或已登记的虚拟名）',
    illegal.length === 0,
    { 非法期望值: illegal, 站内显示名数: names.size, 已用期望值: [...used].sort() });

  chk('S2 站内显示名全集非空（自检闸本身没瞎）', names.size >= 20, { 实际数量: names.size });

  /* S3：尺子的「前 N 张」与实现常量自洽。
     判据改过的原因（ORD-32）：旧判据是 GROUP_PAGE >= 8，
     但 GROUP_PAGE 是「每组渲染多少张」，尺子量的是「DOM 前 N 张」——
     两者没有因果关系（每组 24 张不代表前 8 张里有 8 个不同品类），
     属于「看起来在自检、实际不保护任何东西」的假自检。
     新判据：GROUP_PAGE 必须 >= SCREEN_N（否则前 N 张都凑不满）。 */
  const rj = fs.readFileSync(path.join(ROOT, 'js', 'recommend.js'), 'utf8');
  const gp = rj.match(/GROUP_PAGE\s*=\s*(\d+)/);
  chk('S3 尺子的「前 N 张」与实现常量自洽（GROUP_PAGE ≥ SCREEN_N）',
    !!gp && +gp[1] >= SCREEN_N, { GROUP_PAGE: gp ? +gp[1] : '未找到', SCREEN_N: SCREEN_N });

  /* S4：测量点存在性 —— D3 的开工基线闸。
     为什么必须有这条（ORD-32 §5.5）：本表所有 U/X 类判据都建立在
     「DOM 前 N 张 .acc-card」这个测量点上。D3 若把分组折叠（每组只渲染标题），
     .acc-card 数量 = 0 → 41 行会「整体变红」，但那不是「搜索变差」，
     是「判据所依赖的测量点不存在了」——尺子自己却一句话都不会说。
     这条自检把「失去意义」和「真的变红」分开。 */
  {
    const dom = await loadDom(ACC);
    const D = dom.window.document;
    const cardCount = D.querySelectorAll('.acc-card').length;
    const groupCount = D.querySelectorAll('section.acc-group[data-cat]').length;
    dom.window.close();
    chk('S4 测量点存在（.acc-card 有卡 · 分组有 data-cat）—— 否则 U/X 类判据会失去意义',
      cardCount > 0 && groupCount >= 20,
      { '.acc-card 数量': cardCount, '分组数量': groupCount,
        说明: cardCount === 0 ? '测量点消失（D3 折叠后?）—— 此时 U/X 类全红无意义，先修口径' : '' });
  }

  /* S5：期望值的键名白名单 —— S1 只扫 want:/cap: 两个键，
     将来若新增 expect / category 之类的键，S1 会静默漏检。
     这条自检把「尺子里用到的所有期望值键」列出来，对不上就红。 */
  {
    const src2 = stripComments(fs.readFileSync(__filename, 'utf8'));
    const keyRe = /\b(want|cap|expect|category|expectCategory)\s*:/g;
    const found = new Set();
    let m2;
    while ((m2 = keyRe.exec(src2))) found.add(m2[1]);
    const KNOWN = new Set(['want', 'cap']);
    const unknown = [...found].filter(k => !KNOWN.has(k));
    chk('S5 期望值键名都在已知集合内（新增键必须同步登记，否则 S1 会漏检）',
      unknown.length === 0,
      { 尺子里出现的键: [...found].sort(), 已登记的键: [...KNOWN].sort(), 未登记: unknown });
  }
}

/* ===================== 主流程 ===================== */
(async () => {
  console.log('== 用户任务验收表 · 唯一主验收口径 ==');
  console.log('基线：2026-10-22 commit c2ceb8e');
  await runSelfCheck();
  await runSearchTasks();
  await runQuizTasks();
  await runCompatTasks();
  console.log(`\n结果：PASS ${pass} / FAIL ${fail}${skip ? ` / SKIP ${skip}` : ''}`);
  console.log('（本表不替代各道闸门 —— 闸门管「规则有没有被执行」，本表管「人用起来对不对」）');
  process.exit(fail > 0 ? 1 : 0);
})();

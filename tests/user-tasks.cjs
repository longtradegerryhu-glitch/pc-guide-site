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

  /* 每条 = [查询词, 期望主品类, 首屏8张里期望品类至少几张, 说明] */
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
    const cards = [...D.querySelectorAll('.acc-card')].slice(0, 8);
    const dist = {};
    cards.forEach(c => { const k = catOf(c); dist[k] = (dist[k] || 0) + 1; });
    const got = dist[want] || 0;
    const hint = D.querySelector('#accSearchHint');
    const hits = hint ? (hint.textContent.match(/命中 (\d+) 款/) || [])[1] : '?';
    chk(`U 搜「${q}」首屏 8 张里「${want}」≥ ${min} 张（${why}）`,
      got >= min, { 首屏分布: dist, 期望品类: want, 至少: min, 实际: got, 总命中: hits });
  }
  /* ---- 追加三行（ORD-27 开工基线，由总控定稿；这三行现在是红的，就是 ORD-27 要做的事）----
     来源：审计 ORD-26 §4.1① 与 §4.1⑤ 的实测，均已由我复核。
     ① 「ATX」：电源的命中全部来自 specs 里的「ATX3.1」子串，而 ATX3.1 另有专键 →
        裸词 ATX 该给版型（机箱/主板），不该被 24 件电源顶满首屏。用上界断言，不指定机箱还是主板先出。
     ② 「RTX5080」不带空格：命中 1 件且是笔记本电脑，0 张显卡（显卡名写「NVIDIA RTX 5080 16G」）→
        拉丁串匹配必须做空白归一，否则每加一个词都要在映射表里补一条，救不了通例。
     ③ 「WiFi 7」带空格：被切成 wifi + 7，SPEC_CAT 的 wifi7 永远匹配不上 → 同一条根因。 */
  const CAPS = [
    { q: 'ATX',     cap: '电源',     max: 3, why: '电源的 ATX 命中全部来自「ATX3.1」子串且另有专键；裸词该给版型' },
    { q: 'RTX5080', want: '显卡',    min: 6, why: '拉丁串空白归一：「RTX5080」应与「RTX 5080」等价' },
    { q: 'WiFi 7',  want: '网络设备', min: 6, why: '拉丁串空白归一：带空格的「WiFi 7」不该被主板的 WiFi7 规格压过' },
  ];
  for (const t of CAPS) {
    inp.value = t.q;
    inp.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await sleep(700);
    const cards = [...D.querySelectorAll('.acc-card')].slice(0, 8);
    const dist = {};
    cards.forEach(c => { const k = catOf(c); dist[k] = (dist[k] || 0) + 1; });
    const hint = D.querySelector('#accSearchHint');
    const hits = hint ? (hint.textContent.match(/命中 (\d+) 款/) || [])[1] : '?';
    if (t.cap) {
      const got = dist[t.cap] || 0;
      chk(`U 搜「${t.q}」首屏 8 张里「${t.cap}」≤ ${t.max} 张（${t.why}）`,
        got <= t.max, { 首屏分布: dist, 上限品类: t.cap, 最多: t.max, 实际: got, 总命中: hits });
    } else {
      const got = dist[t.want] || 0;
      chk(`U 搜「${t.q}」首屏 8 张里「${t.want}」≥ ${t.min} 张（${t.why}）`,
        got >= t.min, { 首屏分布: dist, 期望品类: t.want, 至少: t.min, 实际: got, 总命中: hits });
    }
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
    const cards = [...D.querySelectorAll('.acc-card')].slice(0, 8);
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
    chk('X 搜「' + t.q + '」首屏 8 张里「' + t.want + '」≥ ' + t.min + ' 张（' + t.why + '）',
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

  /* [任务名, 答案序列, 期望部件数下限, 期望合计下限] */
  const TASKS = [
    ['手机·拍照', [['form','phone'],['use','p_photo'],['budget','b8500'],['pref','p_camera'],
                   ['look','p_any'],['intensity','heavy'],['lifespan','y3'],['existing','none'],['focus','p_body']], 6, 4000],
    ['手机·游戏', [['form','phone'],['use','p_game'],['budget','b8500'],['pref','p_perf'],
                   ['look','p_any'],['intensity','heavy'],['lifespan','y3'],['existing','none'],['focus','p_play']], 6, 3500],
    ['台式·游戏', [['form','desktop'],['use','game'],['budget','b8500'],['pref','value'],
                   ['look','any'],['intensity','heavy'],['lifespan','y3'],['existing','none'],['focus','core']], 8, 9000],
    ['笔记本·办公',[['form','laptop'],['use','office'],['budget','b6000'],['pref','value'],
                   ['look','any'],['intensity','mid'],['lifespan','y3'],['existing','none'],['focus','core']], 5, 4000],
  ];

  for (const [name, ans, minParts, minTotal] of TASKS) {
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
    chk(`V ${name} 产出配置单且部件数 ≥ ${minParts}`, !!parts && +parts >= minParts, { 部件数: parts });
    chk(`V ${name} 合计下限 ≥ ${minTotal}`, lo >= minTotal, { 实测合计下限: lo, 期望: minTotal });
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

/* ===================== 主流程 ===================== */
(async () => {
  console.log('== 用户任务验收表 · 唯一主验收口径 ==');
  console.log('基线：2026-10-22 commit c2ceb8e');
  await runSearchTasks();
  await runQuizTasks();
  await runCompatTasks();
  console.log(`\n结果：PASS ${pass} / FAIL ${fail}${skip ? ` / SKIP ${skip}` : ''}`);
  console.log('（本表不替代各道闸门 —— 闸门管「规则有没有被执行」，本表管「人用起来对不对」）');
  process.exit(fail > 0 ? 1 : 0);
})();

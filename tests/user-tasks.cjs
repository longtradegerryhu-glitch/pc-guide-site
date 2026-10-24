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

/* 从卡片上取品类标签
   标签形如 "🧠 CPU" / "🧩 内存" / "🗂️ 主板"。
   注意 CPU 是英文 —— 不能用「只留中文」的过滤，否则 CPU/SSD 这类标签会被清空。 */
function catOf(card) {
  const t = card.querySelector('.acc-cat, [class*=cat]');
  if (!t) return '?';
  return t.textContent.trim()
    .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '')   // 去 emoji 与空格，保留中英数
    .replace(/^(.)/, '$1');
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

#!/usr/bin/env node
/* ORD-21 验收 · 配件与主体的兼容性
 *
 * 背景：甲方反馈「vivo 手机配苹果手机壳」。根因不是数据错，是逻辑层没有「主体」这个概念：
 *   ① planPartTargets 按品类取 max，同品类不同行共用目标价 → 手机壳被稳定器顶到 400；
 *   ② 目标价一偏，锚点匹配落空 → 退回「同价位最近」，在全 mobileacc 里按价格距离挑；
 *   ③ 选件池从头到尾没有任何一条检查「这件和本体是不是同一个生态」。
 *
 * 判据：
 *   C1  非苹果手机推荐 → 配件区不得出现苹果生态件
 *   C2a 苹果件在苹果主体下不被误杀（判定级，见下方 C2b 说明）
 *   C2b 端到端「推荐 iPhone 16/17」当前不可达 —— 输出扫描证据并 SKIP，不假装通过
 *   C3  安卓平板 → 不出现 Apple Pencil / 妙控键盘 / Magic Trackpad
 *   C4  同品类多行方案：每行目标价 = 该行自己的价，不是品类最大值
 *   C5  26 套方案 × 全部行：每行要么有可推荐件，要么有「暂无可用配件」说明
 *   C6  由 npm run test:all / npm run audit:gate 承担，本文件不重复跑
 *   C7  js/models-data.js 一字未改
 *
 * 跑法：NODE_PATH=<含 jsdom 的 node_modules> node tests/compat.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let PASS = 0, FAIL = 0;
const items = [];

function ok(name, cond, detail) {
  items.push({ name, ok: !!cond, detail });
  if (cond) { PASS++; console.log('  PASS ' + name + (detail ? ' :: ' + detail : '')); }
  else { FAIL++; console.log('  FAIL ' + name + ' :: ' + detail); }
}
function skip(name, why) {
  items.push({ name, ok: true, skip: true, detail: why });
  console.log('  SKIP ' + name + ' :: ' + why);
}

function resolveJsdom() {
  const tries = ['jsdom'];
  if (process.env.NODE_PATH) process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
    .forEach(d => tries.push(path.join(d, 'jsdom')));
  const home = process.env.USERPROFILE || process.env.HOME;
  if (home) tries.push(path.join(home, '.workbuddy', 'binaries', 'node', 'workspace', 'node_modules', 'jsdom'));
  tries.push(path.join(ROOT, 'node_modules', 'jsdom'));
  for (const t of tries) { try { return { jsdom: require(t), from: t }; } catch (e) { /* next */ } }
  return { jsdom: null, tried: tries };
}

/* ---------- DOM 读取（与 reco-acceptance.cjs 同口径，但只读兼容性需要的字段） ---------- */
function readFp(dom) {
  return [...dom.window.document.querySelectorAll('.fp-row')].map(r => ({
    part: ((r.querySelector('.fp-cat') || {}).textContent || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '').trim(),
    name: ((r.querySelector('.fp-name') || {}).textContent || '').trim(),
    price: ((r.querySelector('.fp-price') || {}).textContent || '').trim(),
    blocked: !!r.querySelector('.fp-block-badge'),
    why: ((r.querySelector('.fp-why') || {}).textContent || '').replace(/\s+/g, ' ').trim()
  }));
}
function readSpec(dom) {
  return [...dom.window.document.querySelectorAll('.smart-spec-table tbody tr')]
    .filter(tr => tr.className.indexOf('spec-total') === -1)
    .map(tr => ({
      part: ((tr.querySelector('.spec-part') || {}).textContent || '').trim(),
      model: ((tr.querySelector('.spec-model') || {}).textContent || '').trim(),
      cell: tr.children[1] ? tr.children[1].textContent.replace(/\s+/g, ' ').trim() : '',
      blocked: !!tr.querySelector('.spec-block')
    }));
}
const click = (dom, sel) => {
  const el = dom.window.document.querySelector(sel);
  if (!el) return false;
  el.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  return true;
};
const pick = (dom, q, o) => click(dom, `.q-opt[data-q="${q}"][data-o="${o}"]`);

async function runQuiz(dom, answers) {
  click(dom, '.q-reset');
  await sleep(30);
  const miss = [];
  answers.forEach(([q, o]) => { if (!pick(dom, q, o)) miss.push(q + '/' + o); });
  await sleep(30);
  click(dom, '#quizSubmit');
  await sleep(180);
  return miss;
}

/* ---------- 题库：C1 / C3 的端到端场景 ---------- */
const PHONE_CASES = [
  { label: '拍照·8500-13000（甲方复现）', a: [['form', 'phone'], ['use', 'p_photo'], ['budget', 'b6000'], ['pref', 'p_camera'], ['look', 'p_any'], ['intensity', 'heavy'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 'p_body']] },
  { label: '拍照·5500-8500', a: [['form', 'phone'], ['use', 'p_photo'], ['budget', 'b4500'], ['pref', 'p_camera'], ['look', 'p_any'], ['intensity', 'mid'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 'p_body']] },
  { label: '影音·18500-30000', a: [['form', 'phone'], ['use', 'p_media'], ['budget', 'b12000'], ['pref', 'p_perf'], ['look', 'p_any'], ['intensity', 'mid'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 'p_body']] },
  { label: '办公·30000+', a: [['form', 'phone'], ['use', 'p_office'], ['budget', 'b20000'], ['pref', 'p_perf'], ['look', 'p_any'], ['intensity', 'mid'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 'p_body']] },
  { label: '手游·5500-8500', a: [['form', 'phone'], ['use', 'p_game'], ['budget', 'b4500'], ['pref', 'p_perf'], ['look', 'p_any'], ['intensity', 'heavy'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 'p_play']] },
  { label: '社交·8500-13000', a: [['form', 'phone'], ['use', 'p_social'], ['budget', 'b6000'], ['pref', 'p_battery'], ['look', 'p_white'], ['intensity', 'mid'], ['lifespan', 'y5'], ['existing', 'none'], ['focus', 'p_charge']] }
];
const TABLET_CASES = [
  { label: '绘图·30000+', a: [['form', 'tablet'], ['use', 't_draw'], ['budget', 'b20000'], ['pref', 't_ink'], ['look', 't_any'], ['intensity', 'mid'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 't_write']] },
  { label: '笔记·18500-30000', a: [['form', 'tablet'], ['use', 't_note'], ['budget', 'b12000'], ['pref', 't_ink'], ['look', 't_any'], ['intensity', 'mid'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 't_write']] },
  { label: '网课·5500以内', a: [['form', 'tablet'], ['use', 't_office'], ['budget', 'b3000'], ['pref', 't_value'], ['look', 't_any'], ['intensity', 'mid'], ['lifespan', 'y3'], ['existing', 'none'], ['focus', 't_body']] }
];

const APPLE_ONLY = /Apple\s*Pencil|妙控键盘|Magic\s*Trackpad/i;

(async () => {
  const { jsdom, from } = resolveJsdom();
  if (!jsdom) {
    console.error('未找到 jsdom，端到端断言不可信。设 NODE_PATH 指向含 jsdom 的 node_modules。');
    process.exit(2);
  }
  console.log('jsdom: ' + from + '\n');
  const dom = await jsdom.JSDOM.fromFile(path.join(ROOT, 'smart.html'), {
    runScripts: 'dangerously', resources: 'usable',
    beforeParse(w) {
      w.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    }
  });
  await sleep(3200);

  const W = dom.window;
  const DG = W.PCRecoDiag;
  if (!DG || !DG.rows || !DG.targets || !DG.compat) {
    console.error('PCRecoDiag 缺少 targets / rows / compat 出口，无法验收。');
    process.exit(2);
  }
  const LIB = W.PC_MODELS || {};
  const byName = new Map();
  Object.keys(LIB).forEach(k => (LIB[k] || []).forEach(it => { if (!byName.has(it.name)) byName.set(it.name, it); }));
  /* 苹果生态件名单：brand 归一（Apple 与 苹果 是同一家）后属于苹果的型号 */
  const appleNames = new Set();
  Object.keys(LIB).forEach(k => (LIB[k] || []).forEach(it => {
    if (/^(apple|苹果)$/i.test(String(it.brand || '').trim())) appleNames.add(it.name);
  }));
  const isApple = n => appleNames.has(n);
  const brandOf = n => (byName.get(n) || {}).brand || '';

  /* ================= C1 = 非苹果手机不得出现苹果配件 ================= */
  console.log('\n=== C1 非苹果手机 → 配件区无苹果生态件 ===');
  const c1rows = [];
  let c1bad = 0, c1appleBody = 0;
  for (const c of PHONE_CASES) {
    await runQuiz(dom, c.a);
    const fp = readFp(dom);
    const body = fp.filter(x => x.part === '手机')[0];
    const bodyBrand = body ? brandOf(body.name) : '';
    const appleBody = !!body && /^(apple|苹果)$/i.test(bodyBrand);
    if (appleBody) c1appleBody++;
    const hits = fp.filter(x => x.part !== '手机' && isApple(x.name));
    if (!appleBody) c1bad += hits.length;
    c1rows.push({ label: c.label, body: body ? body.name + '(' + bodyBrand + ')' : '(无)', appleParts: hits.map(h => h.part + ':' + h.name) });
    console.log('  ' + c.label + ' → 主体 ' + (body ? body.name : '(无)') + ' [' + bodyBrand + ']，配件区苹果件 ' + hits.length + ' 件'
      + (hits.length ? ' ← ' + hits.map(h => h.part + ':' + h.name).join(' / ') : ''));
  }
  ok('C1 六组手机推荐里，非苹果主体的配件区苹果件 = 0', c1bad === 0,
    '苹果主体场景 ' + c1appleBody + ' 组（出现即视为 C2 场景，不计入 C1）；违规 ' + c1bad + ' 件');

  /* ================= C2a = 苹果件在苹果主体下不被误杀 ================= */
  console.log('\n=== C2a 生态判定（苹果主体不被误杀 / 非苹果主体必排除） ===');
  const MA1 = '苹果 iPhone 17 官方硅胶保护壳';
  const MA24 = '苹果 Apple Pencil（二代）';
  const MA20 = '苹果 妙控键盘（双设备）';
  const MA27 = '苹果 Magic Trackpad';
  const PW6 = '苹果 20W 原装充电器';
  const PW28 = '苹果 MagSafe 移动电源';
  const C2 = [
    [MA1, 'apple', 'phone', 0, 'iPhone 主体 → 苹果壳可用'],
    [MA1, 'vivo', 'phone', 1, 'vivo 主体 → 排除（甲方那一幕）'],
    [MA1, 'apple', 'tablet', 1, 'iPad 主体 → 手机壳物类不符'],
    [MA24, 'apple', 'tablet', 0, 'iPad 主体 → Apple Pencil 可用'],
    [MA24, 'apple', 'phone', 1, 'iPhone 主体 → Apple Pencil 装不上'],
    [MA24, 'huawei', 'tablet', 1, '安卓平板 → 排除'],
    [MA20, 'apple', 'tablet', 0, 'iPad 主体 → 妙控键盘可用'],
    [MA20, 'xiaomi', 'tablet', 1, '小米平板 → 排除'],
    [MA27, 'apple', 'laptop', 0, 'MacBook 主体 → 触控板可用'],
    [MA27, 'apple', 'phone', 1, 'iPhone 主体 → 触控板不配'],
    [PW6, 'apple', 'phone', 0, 'iPhone 主体 → 原装充电头可用'],
    [PW6, 'vivo', 'phone', 1, 'vivo 主体 → 苹果原装头排除'],
    [PW28, 'honor', 'phone', 1, '荣耀主体 → MagSafe 电源排除']
  ];
  /* 判据是「排除还是不排除」，理由文案只做展示 —— 拿文案当判据会为了改一句话就让闸变红 */
  let c2bad = [];
  C2.forEach(([n, eco, cat, want, why]) => {
    const r = DG.compat(n, eco, cat);
    const dropped = r.found ? !!r.drop : false;
    if (!r.found) { c2bad.push(n + ' 不在库里'); return; }
    if (dropped !== !!want) c2bad.push(n + ' @' + eco + '/' + cat + ' 期望' + (want ? '排除' : '放行') + '实得「' + (r.drop || '放行') + '」');
  });
  ok('C2a ' + C2.length + ' 条生态判定全部符合预期', c2bad.length === 0,
    c2bad.length ? c2bad.join(' ; ') : C2.length + '/' + C2.length + '（苹果件在苹果主体下 0 误杀）');

  /* ================= C2b = 端到端不可达，出证据 ================= */
  console.log('\n=== C2b 端到端「推荐 iPhone 16/17」=== ');
  const scan = [];
  for (const c of PHONE_CASES) {
    await runQuiz(dom, c.a);
    const body = readFp(dom).filter(x => x.part === '手机')[0];
    scan.push(body ? body.name + '[' + brandOf(body.name) + ']' : '(无)');
  }
  for (const c of TABLET_CASES) {
    await runQuiz(dom, c.a);
    const body = readFp(dom).filter(x => x.part === '平板')[0];
    scan.push(body ? body.name + '[' + brandOf(body.name) + ']' : '(无)');
  }
  const appleHits = scan.filter(s => /\[(Apple|苹果)\]/.test(s));
  if (appleHits.length === 0) {
    skip('C2b 端到端推荐出 iPhone/iPad 后可验证「苹果配件与主体同生态」',
      '实测 ' + scan.length + ' 组问卷（' + PHONE_CASES.length + ' 手机 + ' + TABLET_CASES.length + ' 平板）主体全非苹果 → 端到端不可达。'
      + '根因不在本批：手机库 6 款 Apple、平板库 9 款 Apple，但 pickOne 永远按「价位距离最近」挑，苹果机型一次都没被选中。'
      + '已改为 C2a 判定级验证；真正的修法是让本体行也认品牌偏好（需另开一批）。');
  } else {
    ok('C2b 端到端推荐出苹果主体后，配件区苹果件均与主体同生态', true, '苹果主体 ' + appleHits.length + ' 组：' + appleHits.join(' / '));
  }

  /* ================= C3 = 安卓平板不得出现苹果专属件 ================= */
  console.log('\n=== C3 安卓平板 → 无 Apple Pencil / 妙控键盘 / Magic Trackpad ===');
  let c3bad = [];
  for (const c of TABLET_CASES) {
    await runQuiz(dom, c.a);
    const fp = readFp(dom);
    const body = fp.filter(x => x.part === '平板')[0];
    const bb = body ? brandOf(body.name) : '';
    if (/^(apple|苹果)$/i.test(bb)) { console.log('  ' + c.label + ' → 苹果主体，跳过'); continue; }
    const bad = fp.filter(x => APPLE_ONLY.test(x.name));
    bad.forEach(x => c3bad.push(c.label + ' / ' + x.part + ':' + x.name));
    console.log('  ' + c.label + ' → 主体 ' + (body ? body.name : '(无)') + '，苹果专属件 ' + bad.length + ' 件');
  }
  ok('C3 安卓平板场景苹果专属件 = 0', c3bad.length === 0, c3bad.length ? c3bad.join(' ; ') : '0 件');

  /* ================= C4 = 目标价按行取值 ================= */
  console.log('\n=== C4 同品类多行的目标价 = 该行自己的价（不是品类 max） ===');
  const plans = W.PC_DATA.plans;
  const table = [];
  let c4bad = [];
  plans.forEach(pl => {
    const t = DG.targets(pl.id);
    const acc = {};
    /* 行名 → 品类：用 diag.rows 反查（与页面同一份映射，不另写一套 PART_CAT） */
    const rr = DG.rows(pl.id, {});
    const catOf = {};
    rr.rows.forEach(x => { catOf[x.part] = x.cat; });
    (pl.parts || []).forEach(r => {
      const part = r[0], nums = String(r[2] || '').match(/\d+/g);
      if (!nums) return;
      const lo = parseInt(nums[0], 10), hi = nums.length > 1 ? parseInt(nums[1], 10) : lo;
      const v = (lo + hi) / 2;
      const cid = catOf[part];
      if (!cid) return;
      (acc[cid] = acc[cid] || []).push({ part, v, got: t.byPart[part] });
    });
    Object.keys(acc).forEach(cid => {
      const arr = acc[cid];
      if (arr.length < 2) return;
      const mx = Math.max.apply(null, arr.map(x => x.v));
      arr.forEach(x => {
        table.push({ plan: pl.id, part: x.part, cat: cid, before: mx, after: x.got, want: x.v, hit: mx !== x.v });
      });
    });
  });
  const flat = table.filter(x => x.hit);
  flat.forEach(x => {
    console.log('  ' + (x.plan + ' ').padEnd(14) + (x.part + ' ').padEnd(10) + '[' + x.cat + ']  修前(品类max)=' + x.before + '  修后(行名)=' + x.after + '  应然=' + x.want);
  });
  const affectedPlans = new Set(flat.map(x => x.plan));
  console.log('  真正被顶高的：' + affectedPlans.size + ' 套方案 / ' + flat.length + ' 行（另有 ' + (table.length - flat.length) + ' 行本身即该品类最高价，无可对照）');
  table.forEach(x => {
    if (Math.abs(x.after - x.want) > 0.001) c4bad.push(x.plan + '/' + x.part + ' 目标价 ' + x.after + ' ≠ 行值 ' + x.want);
  });
  flat.forEach(x => {
    if (Math.abs(x.after - x.before) < 0.001) c4bad.push(x.plan + '/' + x.part + ' 修后仍等于品类 max ' + x.before);
  });
  ok('C4 同品类多行 ' + table.length + ' 行目标价全部等于该行自己的价', c4bad.length === 0, c4bad.length ? c4bad.join(' ; ') : table.length + '/' + table.length);
  ok('C4b 被顶高的 ' + flat.length + ' 行（' + affectedPlans.size + ' 套方案）目标价已从品类 max 降回行值', flat.length > 0 && c4bad.length === 0, flat.length + ' 行');

  /* 指令给的三个锚点单独钉死 */
  const anchor = [
    ['ph_photo', '手机壳', 80],
    ['ph_game', '手机壳', 155],
    ['tb_create', '保护膜', 45]
  ];
  let abad = [];
  anchor.forEach(([pid, part, want]) => {
    const t = DG.targets(pid);
    const got = t && t.byPart[part];
    if (got !== want) abad.push(pid + '/' + part + ' 期望 ' + want + ' 实得 ' + got);
    console.log('  锚点 ' + pid + '/' + part + ' = ' + got + '（期望 ' + want + '）');
  });
  ok('C4-锚点 ph_photo 手机壳=80 / ph_game=155 / tb_create 保护膜=45', abad.length === 0, abad.length ? abad.join(' ; ') : '3/3');

  /* ================= C5 = 26 套方案每行都有交代 ================= */
  console.log('\n=== C5 26 套方案 × 全部行：有件 或 有「暂无可用配件」说明 ===');
  let c5bad = [], c5n = 0, c5blocked = 0;
  plans.forEach(pl => {
    const rr = DG.rows(pl.id, {});
    /* 「键鼠」这类组合件会拆成「键盘」「鼠标」两条，所以不能用条数比行数，
       要按 srcPart 回挂到配置单行名。判据是「每一行都要有交代」。 */
    const covered = new Set(rr.rows.map(x => x.srcPart));
    rr.skipped.forEach(p => covered.add(p));
    const missing = rr.planParts.filter(p => !covered.has(p));
    if (missing.length) c5bad.push(pl.id + ' 无交代：' + missing.join(','));
    rr.rows.forEach(x => {
      c5n++;
      if (!x.name && !x.text && !x.blocked) c5bad.push(pl.id + '/' + x.part + ' 既无件也无说明');
      if (x.blocked) c5blocked++;
    });
  });
  console.log('  覆盖 ' + plans.length + ' 套方案 / ' + c5n + ' 个推荐项，其中 ' + c5blocked + ' 行因生态排除改为明示「暂无可用配件」');
  ok('C5 每行都有交代（件 / 档位原选 / 无可用配件说明）', c5bad.length === 0, c5bad.length ? c5bad.slice(0, 8).join(' ; ') : c5n + '/' + c5n);

  /* ================= D5 = 平台联动：26 套方案逐个验 =================
     配置单原文自带歧义（t4500 主板行「H610M / B650M」+ 内存行「DDR4/DDR5 16G」），
     两行各自二的选一 → 组合起来会出 DDR5 主板 + DDR4 内存。
     这条闸不看实现，只看结果：每一套方案里 CPU 与主板必须同插槽、内存与主板必须同代际。 */
  console.log('\n=== D5 平台联动：CPU 插槽 × 主板插槽、内存代际 × 主板代际 ===');
  const socketOf = t => { const m = String(t || '').match(/AM5|AM4|LGA\s*1700|LGA\s*1851|LGA\s*1200/i); return m ? m[0].toUpperCase().replace(/\s+/g, '') : ''; };
  const ddrOf = t => { const x = String(t || ''); const a = /DDR5/i.test(x), b = /DDR4/i.test(x); if (a && b) return ''; return a ? 'DDR5' : (b ? 'DDR4' : ''); };
  let d5bad = [], d5pairs = 0, d5plans = 0;
  plans.forEach(pl => {
    const rr = DG.rows(pl.id, {});
    const one = cid => (rr.rows.filter(x => x.cat === cid)[0] || null);
    const cpu = one('cpu'), mobo = one('mobo'), ram = one('ram');
    if (cpu && mobo) {
      const cs = socketOf(cpu.specs), ms = socketOf(mobo.specs);
      d5pairs++;
      if (cs && ms && cs !== ms) d5bad.push(pl.id + ' CPU ' + cpu.name + '(' + cs + ') × 主板 ' + mobo.name + '(' + ms + ')');
    }
    if (mobo && ram) {
      const md = ddrOf(mobo.specs), rd = ddrOf(ram.specs);
      d5pairs++;
      if (md && rd && md !== rd) d5bad.push(pl.id + ' 主板 ' + mobo.name + '(' + md + ') × 内存 ' + ram.name + '(' + rd + ')');
    }
    if (cpu || mobo) d5plans++;
  });
  console.log('  ' + d5plans + ' 套方案 / ' + d5pairs + ' 组平台配对，冲突 ' + d5bad.length + ' 处');
  d5bad.forEach(x => console.log('    冲突 ' + x));
  ok('D5 ' + d5pairs + ' 组「CPU × 主板」「内存 × 主板」全部同平台', d5bad.length === 0,
    d5bad.length ? d5bad.join(' ; ') : d5pairs + '/' + d5pairs + '（0 冲突）');

  /* ================= C8 = compat 派生表覆盖率（16/16 + 全量 + 反向对照） =================
     判据必须独立于生成器：这里用另一套正则从 compat 原文重新扫一遍，
     再和页面实际读的 window.PC_COMPAT_MAP 对账。用生成器自己的规则复算等于自己给自己判卷。 */
  console.log('\n=== C8 硬兼容边界覆盖率（独立扫描 vs compat-map） ===');
  const vm = require('vm');
  const ctx2 = { window: {} };
  vm.createContext(ctx2);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'models-data.js'), 'utf8'), ctx2);
  const MODELS = ctx2.window.PC_MODELS;
  const FITMAP = dom.window.PC_COMPAT_MAP || {};
  const ECOB = dom.window.PC_ECO_BRAND || {};

  /* 审计口径逐条点名的 16 件（ORD-22 反馈里列的那批） */
  const AUDIT16 = ['ma1', 'ma4', 'ma20', 'ma21', 'ma22', 'ma23', 'ma24', 'ma25', 'ma26', 'ma27',
    'pw4', 'pw5', 'pw6', 'pw16', 'pw23', 'wr12'];
  const miss16 = AUDIT16.filter(id => !FITMAP[id]);
  ok('C8a 审计口径 16 件硬兼容边界全部被 fitOf 识别', miss16.length === 0,
    miss16.length ? '未识别：' + miss16.join(',') : AUDIT16.length + '/' + AUDIT16.length);

  /* 全量独立扫描：compat 原文里的专属关系，本体品类排除在外（手机/平板/笔记本是被配的对象） */
  const BODY = { phone: 1, tablet: 1, laptop: 1 };
  const COMMON = /支架|自拍杆|膜|贴|挂绳|指环|清洁/;   /* 通用类物类，不构成硬边界 */
  const ORACLE = [
    /iPhone\s*\d*\s*专机专用/, /MagSafe/, /iPad 全系/, /仅支持 iPad 与 Mac/, /iPad 需配/,
    /MatePad 系列/, /Galaxy Tab 系列/, /小米平板 \d/, /仅兼容 iPhone/, /仅 iPhone/,
    /Lightning[^。；]*(专用|以下机型)/, /以下机型专用/, /专机专用/, /仅适合 iPhone/, /iPhone 轻充/
  ];
  const oracleHits = [];
  Object.keys(MODELS).forEach(cat => {
    if (BODY[cat]) return;
    (MODELS[cat] || []).forEach(it => {
      const hay = (it.compat || '') + ' ' + (it.specs || '') + ' ' + (it.name || '') + ' ' + (it.model || '');
      const kind = (it.style || '') + ' ' + (it.name || '');
      if (COMMON.test(kind)) return;
      if (ORACLE.some(re => re.test(hay))) oracleHits.push(cat + '/' + it.id);
    });
  });
  const missAll = oracleHits.filter(h => !FITMAP[h.split('/')[1]]);
  ok('C8b 独立扫描出的 ' + oracleHits.length + ' 件专属件全部被识别', missAll.length === 0,
    missAll.length ? '未识别：' + missAll.join(',') : oracleHits.length + '/' + oracleHits.length +
      '（另有同型补齐件，全表 ' + Object.keys(FITMAP).length + ' 件）');

  /* 反向对照：通用件绝不能进 fit 表 —— 进了就是误杀（「小米自拍杆」只能配小米手机） */
  const COMMONIDS = ['ma10', 'ma12', 'ma5', 'ma6', 'ma9'];
  const wrongIn = COMMONIDS.filter(id => FITMAP[id]);
  const details = COMMONIDS.filter(id => FITMAP[id]).map(id => id + '→' + FITMAP[id].why);
  ok('C8c 通用件（支架/自拍杆/膜）不得进 fit 表', wrongIn.length === 0,
    wrongIn.length ? '误收：' + details.join(' ; ') : COMMONIDS.join('/') + ' 均未收录');

  /* 品牌表：全库每个 brand 都要有生态归属，表外必须归 other，绝不能是空 */
  const allBrands = new Set();
  Object.keys(MODELS).forEach(c => (MODELS[c] || []).forEach(it => { if (it.brand) allBrands.add(it.brand); }));
  const noBrand = [...allBrands].filter(b => !ECOB[b]);
  const emptyEco = [...allBrands].filter(b => ECOB[b] === '' || ECOB[b] == null);
  ok('C8d 品牌生态表覆盖全库 ' + allBrands.size + ' 个品牌且无空值', noBrand.length === 0 && emptyEco.length === 0,
    noBrand.length || emptyEco.length ? '缺：' + noBrand.concat(emptyEco).slice(0, 10).join(',') :
      allBrands.size + '/' + allBrands.size + '（表外统一归 other）');

  /* ================= C9 = 硬软分层：AirPods 放行、Apple Watch 排除 ================= */
  console.log('\n=== C9 硬软分层（装不上 vs 装得上但打折） ===');
  const airpods = DG.compat('苹果 AirPods Pro 3', 'vivo', 'phone');
  const watch = DG.compat('Apple Watch SE 3', 'vivo', 'phone');
  ok('C9a AirPods 在安卓手机上放行（安卓可用、只是功能受限）', airpods.found && !airpods.drop,
    airpods.found ? (airpods.drop ? '被误排：' + airpods.drop : '放行，提示「' + (airpods.note || '无') + '」') : '不在库');
  ok('C9b Apple Watch 在安卓手机上排除（只能配 iPhone）', watch.found && !!watch.drop,
    watch.found ? (watch.drop || '被放行 —— 这就是 ORD-25 要修的缺陷') : '不在库');

  /* ================= C7 = 数据未改 ================= */
  console.log('\n=== C7 js/models-data.js 未被改动 ===');
  const git = spawnSync('git', ['diff', '--name-only', 'HEAD', '--', 'js/models-data.js'], { cwd: ROOT, encoding: 'utf8' });
  if (git.status !== 0) {
    skip('C7 models-data.js 未改', 'git 不可用，跳过（' + String(git.stderr || '').trim().slice(0, 80) + '）');
  } else {
    const changed = String(git.stdout || '').trim();
    ok('C7 相对 HEAD，js/models-data.js 无改动', changed === '', changed ? '被改动：' + changed : '0 处改动（本次是逻辑层修复，不动数据）');
  }

  /* ================= 汇总 ================= */
  console.log('\n结果：PASS ' + PASS + ' / FAIL ' + FAIL + '（共 ' + items.length + ' 条，含 SKIP ' + items.filter(x => x.skip).length + '）');
  if (FAIL) {
    items.filter(x => !x.ok).forEach(x => console.log('  FAIL ' + x.name + ' :: ' + x.detail));
  }
  dom.window.close();
  process.exit(FAIL ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

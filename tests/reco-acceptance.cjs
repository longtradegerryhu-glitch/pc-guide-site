/* 智能推荐整改 · 独立验收断言（ORD-12）
 *
 * 跑法：npm run test:reco
 *       或 NODE_PATH="C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules" node tests/reco-acceptance.cjs
 * 退出码：0 全 PASS / 1 有 FAIL / 2 环境缺失
 *
 * 为什么单独一个文件，而不是塞进 tests/audit-search.cjs：
 *   audit-search.cjs 审的是「数据与搜索口径」；本文件审的是「问卷结构与推荐结果」。
 *   本次事故的根因就是只测结果、不测问题本身 —— 所以这里的断言一半以上打在
 *   **问卷结构**上（A1-A5 / A16），另一半打在**结果内容**上（A6-A15）。
 *
 * 测法：jsdom 真跑 smart.html，真实点击选项、真实点提交，读真实 DOM。
 *   —— 不看实现者的自述，不做裸字段匹配。
 *
 * 口径声明（审计纪律：数字必须可复现）：
 *   · 断言读 DOM 渲染结果（用户所见），不读内部变量
 *   · 「结果不同」分两层：tier1 = 硬件层（配置单 + 配件区的型号与价格），
 *     tier2 = 全层（tier1 + 画像 + 避坑 + 颜值卡）。
 *     A15 里除 exp 外一律要求 tier1 变化；exp 按实现自己的设计意图豁免 tier1
 *     （recommend.js 注释：「经验这一题不改型号…但必须改变"接下来怎么做"」），
 *     但仍强制要求 tier2 变化 —— 这不是放宽，是按设计意图分层断言。
 *   · 价格比较一律解析成 [lo, hi] 数值对，不用字符串比对。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..') + path.sep;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 0. jsdom 解析（与 audit-search.cjs 同策略，多处兜底） ---------- */
function resolveJsdom() {
  const tries = [];
  const push = p => { if (p && !tries.includes(p)) tries.push(p); };
  push('jsdom');
  (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)
    .forEach(d => push(path.join(d, 'jsdom')));
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (home) push(path.join(home, '.workbuddy', 'binaries', 'node', 'workspace', 'node_modules', 'jsdom'));
  push(path.join(ROOT, 'node_modules', 'jsdom'));
  for (const t of tries) {
    try { return { jsdom: require(t), from: t }; } catch (e) { /* next */ }
  }
  return { jsdom: null, tried: tries };
}

/* ---------- 1. 断言框架 ---------- */
const results = [];
function check(id, name, ok, actual, expected, note) {
  results.push({ id, name, ok: !!ok, actual, expected, note });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`  ${tag} ${id} ${name}` +
    (ok ? '' : `\n       实际：${JSON.stringify(actual)}\n       期望：${JSON.stringify(expected)}`) +
    (note ? `\n       说明：${note}` : ''));
}
async function step(id, name, fn) {
  try {
    const r = await fn();
    if (r && typeof r === 'object') check(id, name, r.ok, r.actual, r.expected, r.note);
    else check(id, name, !!r, r, true);
  } catch (e) {
    check(id, name, false, '抛错：' + e.message, '断言应可执行', e.stack ? String(e.stack).split('\n')[1] : '');
  }
}

/* ---------- 2. DOM 工具 ---------- */
function parsePrice(s) {
  const t = String(s == null ? '' : s).replace(/[¥,，\s]/g, '');
  const m = t.match(/\d+/g);
  if (!m || !m.length) return null;
  const n = m.map(Number);
  return n.length === 1 ? [n[0], n[0]] : [n[0], n[1]];
}
function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase(); }

function readSteps(dom) {
  return [...dom.window.document.querySelectorAll('.quiz-step')].map(s => ({
    id: s.getAttribute('data-step'),
    badge: ((s.querySelector('.q-step') || {}).textContent || '').trim(),
    /* 标题必须剔除编号徽章：.q-title 里含 "1/10" 这类 badge，
       desktop(1/10) 与 phone(1/9) 的 badge 本就不同，
       不剔除则「题干是否随形态变化」永远为真 → 断言恒真、变异抓不住。 */
    title: (((s.querySelector('.q-title') || {}).textContent || '').replace(/\s+/g, ' ').trim())
      .replace(/^\d+\s*\/\s*\d+\s*/, '').trim(),
    opts: [...s.querySelectorAll('.q-opt')].map(b => ({
      id: b.getAttribute('data-o'),
      label: ((b.querySelector('.q-opt-label') || {}).textContent || '').trim(),
      desc: ((b.querySelector('.q-opt-desc') || {}).textContent || '').trim()
    }))
  }));
}

function readSpec(dom) {
  return [...dom.window.document.querySelectorAll('.smart-spec-table tbody tr')]
    .filter(tr => !tr.classList.contains('spec-total'))
    .map(tr => ({
      skipped: tr.classList.contains('spec-row-skip'),
      part: ((tr.querySelector('.spec-part') || {}).textContent || '').trim(),
      model: ((tr.querySelector('.spec-model') || {}).textContent || '').trim(),
      orig: ((tr.querySelector('.spec-orig') || {}).textContent || '').trim(),
      skipText: ((tr.querySelector('.spec-skip') || {}).textContent || '').trim(),
      priceText: ((tr.querySelector('.spec-price') || {}).textContent || '').trim(),
      cellText: tr.children[1] ? tr.children[1].textContent.replace(/\s+/g, ' ').trim() : ''
    }));
}

function readFp(dom) {
  return [...dom.window.document.querySelectorAll('.fp-row')].map(r => {
    const cat = ((r.querySelector('.fp-cat') || {}).textContent || '').trim();
    return {
      cat,
      part: cat.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{23F3}]/gu, '').trim(),
      name: ((r.querySelector('.fp-name') || {}).textContent || '').trim(),
      priceText: ((r.querySelector('.fp-price') || {}).textContent || '').trim(),
      model: r.getAttribute('data-model') || '',
      badges: [...r.querySelectorAll('.anchor-badge, .fp-badge')].map(b => b.textContent.trim()),
      inMore: !!r.closest('details.fp-more'),
      why: ((r.querySelector('.fp-why') || {}).textContent || '').replace(/\s+/g, ' ').trim()
    };
  });
}

function readResult(dom) {
  const D = dom.window.document;
  const spec = readSpec(dom);
  const fp = readFp(dom);
  const totalText = ((D.querySelector('.spec-total .spec-price') || {}).textContent || '').trim();
  const resTotalText = ((D.querySelector('.res-total') || {}).textContent || '').trim();
  return {
    spec, fp,
    planName: ((D.querySelector('.plan-name') || {}).textContent || '').trim(),
    total: parsePrice(totalText),
    totalText,
    resTotal: parsePrice(resTotalText),
    resTotalText,
    skipNote: ((D.querySelector('.res-skip-note') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    warnNote: ((D.querySelector('.res-skip-warn') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    /* ORD-13 §2：重点件全部落空时页面会有这条明示；note 判定要用它 */
    focusMiss: ((D.querySelector('.res-focus-miss') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    moreSummary: ((D.querySelector('details.fp-more summary') || {}).textContent || '').trim(),
    profile: [...D.querySelectorAll('.result-persona .tag-pill')].map(p => p.textContent.trim()),
    pitfalls: [...D.querySelectorAll('.pitfall')].map(p => p.textContent.trim()),
    lookCard: ((D.querySelector('.res-look-card') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    tabCount: D.querySelectorAll('.plan-set-tab, [data-set-idx]').length
  };
}

/* tier1 = 硬件层：配置单型号+价格 + 配件区型号+价格（有序） */
function sigTier1(r) {
  return JSON.stringify({
    spec: r.spec.map(x => [x.part, x.model, x.priceText]),
    fp: r.fp.map(x => [x.part, x.name, x.priceText])
  });
}
/* tier2 = 全层：硬件 + 画像 + 避坑 + 颜值卡 */
function sigTier2(r) {
  return JSON.stringify({
    t1: JSON.parse(sigTier1(r)),
    profile: r.profile,
    pitfalls: r.pitfalls,
    look: r.lookCard
  });
}

/* ---------- 3. 交互工具（真实点击） ---------- */
function click(dom, sel) {
  const el = dom.window.document.querySelector(sel);
  if (!el) return false;
  el.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  return true;
}
function pick(dom, qid, oid) {
  return click(dom, `.q-opt[data-q="${qid}"][data-o="${oid}"]`);
}
function optionIdByLabel(dom, qid, label) {
  const steps = readSteps(dom);
  const s = steps.filter(x => x.id === qid)[0];
  if (!s) return null;
  const hit = s.opts.filter(o => o.label === label)[0];
  return hit ? hit.id : null;
}
async function runQuiz(dom, answers) {
  /* answers: [{q, o}] —— 必须 form 在前（选形态会清掉不适用选项的旧答案） */
  if (!click(dom, '.q-reset')) { /* 首次运行没有重置按钮，忽略 */ }
  await sleep(30);
  answers.forEach(a => { if (!pick(dom, a.q, a.o)) throw new Error(`点不到选项 ${a.q}/${a.o}`); });
  await sleep(30);
  if (!click(dom, '#quizSubmit')) throw new Error('找不到提交按钮 #quizSubmit');
  await sleep(120);
  return readResult(dom);
}

/* ---------- 4. 主流程 ---------- */
(async () => {
  const { jsdom, from, tried } = resolveJsdom();
  if (!jsdom) {
    console.error('⚠ 未找到 jsdom，无法真跑 UI，验收不可信。');
    console.error('  修法：npm install，或设置 NODE_PATH 指向含 jsdom 的 node_modules');
    console.error('  尝试过：' + (tried || []).join(' | '));
    process.exit(2);
  }
  console.log(`jsdom: ${from}\n`);

  const dom = await jsdom.JSDOM.fromFile(path.join(ROOT, 'smart.html'), {
    runScripts: 'dangerously', resources: 'usable',
    beforeParse(w) {
      w.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    }
  });
  await sleep(3200);

  const D = dom.window.document;
  const LIB = dom.window.PC_MODELS || {};
  const ALL_ITEMS = [];
  Object.keys(LIB).forEach(k => (LIB[k] || []).forEach(i => ALL_ITEMS.push(i)));
  const libByNameModel = new Map();
  ALL_ITEMS.forEach(i => libByNameModel.set(norm(i.name) + '|' + norm(i.model), i));
  const libByName = new Map();
  ALL_ITEMS.forEach(i => {
    const k = norm(i.name);
    if (!libByName.has(k)) libByName.set(k, []);
    libByName.get(k).push(i);
  });

  /* ===== A1 首题是「使用什么设备」 ===== */
  await step('A1', '首题是「使用什么设备」', async () => {
    const s = readSteps(dom);
    if (!s.length) return { ok: false, actual: '没有任何题目', expected: '至少 1 题' };
    const first = s[0];
    const ok = first.id === 'form' && /设备/.test(first.title);
    return {
      ok,
      actual: { stepId: first.id, title: first.title, badge: first.badge },
      expected: { stepId: 'form', title: '含「设备」' }
    };
  });

  /* ===== 形态问卷快照：desktop / phone / tablet / laptop / both ===== */
  const formSteps = {};
  for (const f of ['desktop', 'laptop', 'phone', 'tablet', 'both']) {
    click(dom, '.q-reset'); await sleep(30);
    pick(dom, 'form', f); await sleep(30);
    formSteps[f] = readSteps(dom);
  }

  /* ===== A2 选手机后，第 9/10 题（已有外设 / 重点）选项不含显示器/键鼠/散热器 ===== */
  await step('A2', '手机形态下「已有外设」「重点」选项不含显示器/键鼠/散热器', async () => {
    const ph = formSteps.phone;
    const ban = ['显示器', '键鼠', '散热器'];
    const bad = [];
    ['existing', 'focus'].forEach(qid => {
      const s = ph.filter(x => x.id === qid)[0];
      if (!s) { bad.push({ qid, err: '该题在手机形态下不存在' }); return; }
      s.opts.forEach(o => {
        ban.forEach(w => {
          if (o.label.indexOf(w) > -1) bad.push({ qid, opt: o.id, label: o.label, ban: w });
        });
      });
    });
    return {
      ok: bad.length === 0,
      actual: bad.length ? bad : '两题选项均不含显示器/键鼠/散热器',
      expected: '0 命中',
      note: '按题号定位（existing/focus），不按位置 —— 手机形态下题号会前移，位置会漂'
    };
  });

  /* ===== A3 选手机后第 8 题整题消失（题目总数减少） ===== */
  await step('A3', '手机形态下「装机经验」整题消失，题目总数减少', async () => {
    const dt = formSteps.desktop, ph = formSteps.phone;
    const expInDesktop = dt.some(x => x.id === 'exp');
    const expInPhone = ph.some(x => x.id === 'exp');
    const ok = expInDesktop && !expInPhone && ph.length < dt.length;
    return {
      ok,
      actual: { desktop题数: dt.length, phone题数: ph.length, desktop有exp: expInDesktop, phone有exp: expInPhone },
      expected: { desktop题数: 10, phone题数: 9, exp在desktop: true, exp在phone: false }
    };
  });

  /* ===== A4 手机形态下题干不含「电脑」二字 ===== */
  await step('A4', '手机形态下题干与选项不含「电脑」二字', async () => {
    const ph = formSteps.phone;
    const bad = [];
    ph.forEach(s => {
      if (s.title.indexOf('电脑') > -1) bad.push({ where: '题干', qid: s.id, text: s.title });
      s.opts.forEach(o => {
        if (o.label.indexOf('电脑') > -1) bad.push({ where: '选项名', qid: s.id, opt: o.id, text: o.label });
        if (o.desc.indexOf('电脑') > -1) bad.push({ where: '选项说明', qid: s.id, opt: o.id, text: o.desc });
      });
    });
    return {
      ok: bad.length === 0,
      actual: bad.length ? bad : '题干/选项/选项说明均无「电脑」',
      expected: '0 命中'
    };
  });

  /* ===== A5 编号 x/N 动态重算，N 正确且编号连续 ===== */
  await step('A5', '编号 x/N 随形态重算，N 正确且编号连续', async () => {
    const problems = [];
    Object.keys(formSteps).forEach(f => {
      const s = formSteps[f];
      s.forEach((st, i) => {
        const m = st.badge.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (!m) { problems.push({ form: f, qid: st.id, badge: st.badge, err: '编号格式不可解析' }); return; }
        const idx = Number(m[1]), total = Number(m[2]);
        if (idx !== i + 1) problems.push({ form: f, qid: st.id, badge: st.badge, err: '编号不连续' });
        if (total !== s.length) problems.push({ form: f, qid: st.id, badge: st.badge, err: 'N 与实际题数不符', 实有: s.length });
      });
    });
    const summary = Object.keys(formSteps).map(f => f + '=' + formSteps[f].length + '题').join(', ');
    return { ok: problems.length === 0, actual: problems.length ? problems : summary, expected: '各形态 N 正确且编号 1..N 连续' };
  });

  /* ===== A16 形态变化时题目本身变化（问卷结构断言） ===== */
  await step('A16', '形态变化时题目本身变化（结构层，非仅结果层）', async () => {
    const problems = [];
    const dt = formSteps.desktop, ph = formSteps.phone, tb = formSteps.tablet;
    /* 1. 题数不同 */
    if (!(dt.length !== ph.length)) problems.push({ err: 'desktop 与 phone 题数相同', desktop: dt.length, phone: ph.length });
    if (!(dt.length !== tb.length)) problems.push({ err: 'desktop 与 tablet 题数相同', desktop: dt.length, tablet: tb.length });
    /* 2. 题目集合不同（exp 只在电脑形态） */
    if (ph.some(x => x.id === 'exp')) problems.push({ err: 'phone 仍含 exp 题' });
    if (tb.some(x => x.id === 'exp')) problems.push({ err: 'tablet 仍含 exp 题' });
    /* 3. 同一题号的选项集合不同 */
    ['use', 'pref', 'look', 'existing', 'focus'].forEach(qid => {
      const o = f => { const s = formSteps[f].filter(x => x.id === qid)[0]; return s ? s.opts.map(x => x.id).sort().join(',') : null; };
      if (o('desktop') === o('phone')) problems.push({ err: qid + ' 题在 desktop 与 phone 选项集合相同', 值: o('desktop') });
      if (o('phone') === o('tablet')) problems.push({ err: qid + ' 题在 phone 与 tablet 选项集合相同', 值: o('phone') });
    });
    /* 4. 题干文案随形态改写（budget 题） */
    const bt = f => { const s = formSteps[f].filter(x => x.id === 'budget')[0]; return s ? s.title : ''; };
    if (bt('desktop') === bt('phone')) problems.push({ err: 'budget 题干在 desktop 与 phone 相同', 值: bt('desktop') });
    /* 5. 题干不得含形态不符的字眼 */
    const banned = { phone: ['装机', '折腾过电脑'], tablet: ['装机', '折腾过电脑'] };
    ['phone', 'tablet'].forEach(f => {
      formSteps[f].forEach(s => {
        (banned[f] || []).forEach(w => {
          if (s.title.indexOf(w) > -1) problems.push({ err: f + ' 形态题干含「' + w + '」', qid: s.id, title: s.title });
        });
      });
    });
    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : {
        desktop: dt.length + '题', phone: ph.length + '题', tablet: tb.length + '题',
        budget题干: { desktop: bt('desktop'), phone: bt('phone') }
      },
      expected: '题数/题目集合/选项集合/题干文案四层均随形态变化'
    };
  });

  /* ===== 基准答题（desktop） ===== */
  const BASE = [
    { q: 'form', o: 'desktop' }, { q: 'use', o: 'game' }, { q: 'budget', o: 'b8500' },
    { q: 'pref', o: 'quiet' }, { q: 'look', o: 'white' }, { q: 'intensity', o: 'mid' },
    { q: 'lifespan', o: 'y3' }, { q: 'exp', o: 'new' }, { q: 'existing', o: 'none' },
    { q: 'focus', o: 'core' }
  ];
  const baseRes = await runQuiz(dom, BASE);

  /* ===== A11 逐部件核对：配置单价格 === 配件区该型号的 price 数组 ===== */
  await step('A11', '配置单价格逐部件 === 配件区同型号价（两向核对）', async () => {
    const problems = [];
    /* 方向一：配置单每行价格 === 该行型号在型号库的价（多型号求和） */
    baseRes.spec.filter(x => !x.skipped && x.model).forEach(row => {
      const names = row.model.split(/\s*\+\s*/).filter(Boolean);
      let lo = 0, hi = 0, missing = [];
      names.forEach(n => {
        const cands = libByName.get(norm(n)) || [];
        if (!cands.length) { missing.push(n); return; }
        const p = cands[0].price;
        lo += p[0]; hi += p[1];
      });
      if (missing.length) { problems.push({ 部件: row.part, 型号: row.model, err: '型号库里找不到', 缺失: missing }); return; }
      const shown = parsePrice(row.priceText);
      if (!shown || shown[0] !== lo || shown[1] !== hi) {
        problems.push({ 部件: row.part, 配置单显示: row.priceText, 型号库合计: `¥${lo} - ${hi}`, err: '配置单价格与型号库不符' });
      }
    });
    /* 方向二：配件区每行价格 === 该型号在型号库的价 */
    baseRes.fp.filter(x => x.model).forEach(row => {
      const it = libByNameModel.get(norm(row.name) + '|' + norm(row.model));
      if (!it) { problems.push({ 部件: row.part, 型号: row.name, err: '型号库里找不到该型号' }); return; }
      const shown = parsePrice(row.priceText);
      const p = it.price;
      if (!shown || shown[0] !== p[0] || shown[1] !== p[1]) {
        problems.push({ 部件: row.part, 配件区显示: row.priceText, 型号库价: `¥${p[0]} - ${p[1]}`, err: '配件区价格与型号库不符' });
      }
    });
    /* 方向三：配置单型号集合 === 配件区型号集合（多重集相等） */
    const specNames = [];
    baseRes.spec.filter(x => !x.skipped && x.model).forEach(r => r.model.split(/\s*\+\s*/).filter(Boolean).forEach(n => specNames.push(norm(n))));
    const fpNames = baseRes.fp.filter(x => x.model).map(x => norm(x.name));
    const tally = arr => arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
    const a = tally(specNames), b = tally(fpNames);
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => { if ((a[k] || 0) !== (b[k] || 0)) problems.push({ 型号: k, 配置单数: a[k] || 0, 配件区数: b[k] || 0, err: '两处型号数量不等' }); });
    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : `配置单 ${baseRes.spec.filter(x => !x.skipped).length} 行 / 配件区 ${baseRes.fp.length} 行，逐部件核对通过`,
      expected: '0 差异'
    };
  });

  /* ===== A12 「配置单同款」标记逐个属实 ===== */
  await step('A12', '「配置单同款」标记逐个属实（型号不一致不得出现该标记）', async () => {
    const problems = [];
    const same = [];
    baseRes.fp.forEach(row => {
      const isSame = row.badges.some(b => b === '配置单同款');
      if (!isSame) return;
      same.push(row.part + '/' + row.name);
      /* 找到产出该型号的配置单行 */
      const src = baseRes.spec.filter(s => !s.skipped && s.model &&
        s.model.split(/\s*\+\s*/).some(n => norm(n) === norm(row.name)));
      if (!src.length) { problems.push({ 部件: row.part, 型号: row.name, err: '配件区有该型号，配置单却没有' }); return; }
      const rowText = src[0].orig.replace(/^配置单原选[:：]\s*/, '');
      const nRow = norm(rowText), nModel = norm(row.model), nFull = norm((libByNameModel.get(norm(row.name) + '|' + norm(row.model)) || {}).brand + (libByNameModel.get(norm(row.name) + '|' + norm(row.model)) || {}).model);
      const ok = (nModel.length >= 4 && nRow.indexOf(nModel) > -1) || (nFull.length >= 5 && nRow.indexOf(nFull) > -1);
      if (!ok) problems.push({ 部件: row.part, 推荐型号: row.name, 型号码: row.model, 配置单原选: rowText, err: '标了「配置单同款」但型号对不上' });
    });
    const dist = {};
    baseRes.fp.forEach(r => r.badges.forEach(b => { if (/配置单|替代|重点/.test(b)) dist[b] = (dist[b] || 0) + 1; }));
    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : { 同款标记: same, 标记分布: dist },
      expected: '0 问题',
      note: `本次共 ${same.length} 处「配置单同款」标记，逐处回查配置单原选文本`
    };
  });

  /* ===== A13 focus 非重点件被折叠 ===== */
  await step('A13', '勾了 focus 后非重点件被折叠、重点件留在首屏', async () => {
    /* focus=core 展开的部件集合（从数据独立读，不抄实现） */
    const quiz = dom.window.PC_DATA.quiz;
    const coreOpt = quiz.filter(q => q.id === 'focus')[0].options.filter(o => o.id === 'core')[0];
    const expectedHot = coreOpt.parts.slice();
    const splitMap = { '键鼠': ['键盘', '鼠标'], '便携键鼠': ['键盘', '鼠标'] };
    const hotSet = new Set(expectedHot.slice());
    Object.keys(splitMap).forEach(k => { if (expectedHot.indexOf(k) > -1) splitMap[k].forEach(x => hotSet.add(x)); });
    const problems = [];
    let collapsed = 0, hot = 0;
    baseRes.fp.forEach(row => {
      const shouldBeHot = hotSet.has(row.part) || hotSet.has(row.cat);
      if (row.inMore) {
        collapsed++;
        if (shouldBeHot) problems.push({ 部件: row.part, err: '重点件被折叠了' });
      } else {
        hot++;
        if (!shouldBeHot) problems.push({ 部件: row.part, err: '非重点件没被折叠' });
      }
    });
    if (!baseRes.moreSummary) problems.push({ err: '没有折叠区（details.fp-more）' });
    if (collapsed === 0) problems.push({ err: '折叠区为空，等于没折叠' });
    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : { 首屏重点件: hot, 折叠件: collapsed, 折叠提示: baseRes.moreSummary },
      expected: '重点件全部在首屏，非重点件全部进折叠区'
    };
  });

  /* ===== 已有外设场景 ===== */
  const SKIP_ANS = [
    { q: 'form', o: 'desktop' }, { q: 'use', o: 'game' }, { q: 'budget', o: 'b8500' },
    { q: 'pref', o: 'quiet' }, { q: 'look', o: 'white' }, { q: 'intensity', o: 'mid' },
    { q: 'lifespan', o: 'y3' }, { q: 'exp', o: 'new' },
    { q: 'existing', o: 'monitor' }, { q: 'existing', o: 'input' }, { q: 'existing', o: 'audio' },
    { q: 'focus', o: 'core' }
  ];
  const skipRes = await runQuiz(dom, SKIP_ANS);

  /* ===== A8 勾「已有显示器/键鼠/音频」→ 配置单与配件区均无这三项 ===== */
  await step('A8', '勾已有显示器/键鼠/音频后，配置单与配件区均不再推荐这三项', async () => {
    const problems = [];
    const targets = ['显示器', '键鼠', '音频'];
    targets.forEach(t => {
      const row = skipRes.spec.filter(x => x.part === t)[0];
      if (!row) return; /* 该方案本来就没这个部件 —— 不算问题 */
      if (!row.skipped) problems.push({ 部件: t, err: '配置单仍把它当正常行推荐', 价格: row.priceText });
      if (row.priceText && row.priceText !== '—') problems.push({ 部件: t, err: '跳过行仍带价格', 价格: row.priceText });
    });
    const fpBan = ['显示器', '键鼠', '键盘', '鼠标', '音频', '耳机', '音箱'];
    skipRes.fp.forEach(row => {
      if (fpBan.indexOf(row.part) > -1 || fpBan.some(w => row.cat.indexOf(w) > -1)) {
        problems.push({ 部件: row.part, 型号: row.name, err: '配件区仍在推荐已有件' });
      }
    });
    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : `配置单 ${skipRes.spec.filter(x => x.skipped).length} 行标记跳过，配件区 ${skipRes.fp.length} 行均不含已有件`,
      expected: '0 问题'
    };
  });

  /* ===== A9 整体投入下调，差额 === 被移除行的金额之和 ===== */
  await step('A9', '整体投入下调，差额 === 被移除行的金额之和（逐项相等，非仅"变小了"）', async () => {
    const problems = [];
    if (!baseRes.total || !skipRes.total) return { ok: false, actual: '合计价无法解析', expected: '[lo,hi]' };
    const dLo = baseRes.total[0] - skipRes.total[0];
    const dHi = baseRes.total[1] - skipRes.total[1];
    /* 被移除行 = 基准里有、跳过场景里被标记跳过的行 */
    const removed = baseRes.spec.filter(b => {
      const s = skipRes.spec.filter(x => x.part === b.part)[0];
      return s && s.skipped && !b.skipped;
    });
    let rLo = 0, rHi = 0;
    removed.forEach(r => {
      const p = parsePrice(r.priceText);
      if (!p) { problems.push({ 部件: r.part, err: '被移除行价格无法解析', 价格: r.priceText }); return; }
      rLo += p[0]; rHi += p[1];
    });
    if (dLo <= 0) problems.push({ err: '整体投入没有下调', 基准: baseRes.total, 跳过: skipRes.total });
    if (dLo !== rLo) problems.push({ err: '下限差额对不上', 差额下限: dLo, 被移除行金额和: rLo });
    if (dHi !== rHi) problems.push({ err: '上限差额对不上', 差额上限: dHi, 被移除行金额和: rHi });
    /* res-total 也必须同步（页面上两个口径不能分叉） */
    if (!skipRes.resTotal || skipRes.resTotal[0] !== skipRes.total[0] || skipRes.resTotal[1] !== skipRes.total[1]) {
      problems.push({ err: '整体投入文案与配置单合计不一致', 配置单合计: skipRes.total, 文案: skipRes.resTotalText });
    }
    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : {
        基准合计: baseRes.totalText, 跳过后合计: skipRes.totalText,
        差额: [dLo, dHi],
        被移除行: removed.map(r => r.part + ' ' + r.priceText),
        被移除金额和: [`¥${rLo}`, `¥${rHi}`]
      },
      expected: '差额逐项 === 被移除行金额之和'
    };
  });

  /* ===== A10 被跳过的部件有说明文案 ===== */
  await step('A10', '被跳过的部件有说明文案', async () => {
    const problems = [];
    const skippedParts = skipRes.spec.filter(x => x.skipped).map(x => x.part);
    if (!skippedParts.length) return { ok: false, actual: '没有任何跳过行', expected: '至少 1 项被跳过' };
    if (!skipRes.skipNote) problems.push({ err: '没有跳过说明文案' });
    skippedParts.forEach(p => {
      if (skipRes.skipNote.indexOf(p) === -1) problems.push({ 部件: p, err: '说明文案里没提到这个被跳过的部件', 文案: skipRes.skipNote });
    });
    if (!/合计/.test(skipRes.skipNote)) problems.push({ err: '说明文案未说明合计已调整', 文案: skipRes.skipNote });
    /* 逐行说明也要有 */
    skipRes.spec.filter(x => x.skipped).forEach(x => {
      if (!x.skipText) problems.push({ 部件: x.part, err: '跳过行本身没有文案' });
    });
    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : { 跳过件: skippedParts, 说明: skipRes.skipNote },
      expected: '逐项被点名 + 说明合计已调整'
    };
  });

  /* ===== A14 已有外设与重点升级冲突时有提示 ===== */
  await step('A14', '已有外设与重点升级冲突时有提示', async () => {
    const CONFLICT = [
      { q: 'form', o: 'desktop' }, { q: 'use', o: 'game' }, { q: 'budget', o: 'b8500' },
      { q: 'pref', o: 'quiet' }, { q: 'look', o: 'white' }, { q: 'intensity', o: 'mid' },
      { q: 'lifespan', o: 'y3' }, { q: 'exp', o: 'new' },
      { q: 'existing', o: 'monitor' }, { q: 'focus', o: 'monitor' }
    ];
    const r = await runQuiz(dom, CONFLICT);
    const ok = !!r.warnNote && /显示器/.test(r.warnNote);
    return {
      ok,
      actual: ok ? r.warnNote : { warnNote: r.warnNote || '(无)', skipNote: r.skipNote || '(无)' },
      expected: '存在冲突提示并点名冲突部件'
    };
  });

  /* ===== A6 选手机 → 输出部件集合不含任何电脑件 ===== */
  await step('A6', '手机形态输出不含任何电脑件', async () => {
    const PHONE = [
      { q: 'form', o: 'phone' }, { q: 'use', o: 'p_game' }, { q: 'budget', o: 'b6000' },
      { q: 'pref', o: 'p_perf' }, { q: 'look', o: 'p_any' }, { q: 'intensity', o: 'mid' },
      { q: 'lifespan', o: 'y3' }, { q: 'existing', o: 'none' }, { q: 'focus', o: 'p_body' }
    ];
    const r = await runQuiz(dom, PHONE);
    /* 口径（数据驱动，不抄实现、不做子串匹配）：
       电脑件 = ① 出现在电脑形态方案里、且不出现在手机/平板形态方案里的部件名
                ∪ ② ORD-12 明列的硬名单
       为什么不用子串匹配：手机方案里「散热配件」（手机散热背夹，mobileacc）、
       「移动电源」（charger）都是合法件，按子串会把「散热」「电源」误判成电脑件。
       为什么不用"电脑件=电脑方案部件名全集"：「耳机/音箱」「拓展坞」手机平板也有，
       按全集判会把合法件误杀。 */
    const plans = dom.window.PC_DATA.plans || [];
    const pcParts = new Set(), mobileParts = new Set();
    plans.forEach(pl => {
      const isMobile = (pl.form || []).some(f => f === 'phone' || f === 'tablet');
      (pl.parts || []).forEach(rw => {
        if (isMobile) mobileParts.add(rw[0]); else pcParts.add(rw[0]);
      });
    });
    const hardList = ['CPU', '显卡', '主板', '内存', '硬盘', '电源', '机箱', '散热', '显示器', '键鼠'];
    const banParts = new Set(hardList);
    pcParts.forEach(p => { if (!mobileParts.has(p)) banParts.add(p); });

    const problems = [];
    r.spec.forEach(row => { if (banParts.has(row.part)) problems.push({ 处: '配置单', 部件: row.part, 型号: row.model }); });
    r.fp.forEach(row => { if (banParts.has(row.part)) problems.push({ 处: '配件区', 部件: row.part, 型号: row.name }); });
    /* 结果文案也不能把手机用户往电脑上引 */
    const allText = r.profile.join(' ') + ' ' + r.pitfalls.join(' ') + ' ' + r.spec.map(x => x.cellText).join(' ');
    ['装机箱', '装系统', '接电源线', '装到主板'].forEach(w => {
      if (allText.indexOf(w) > -1) problems.push({ 处: '文案', 命中: w });
    });

    /* 数据层同口径自查：手机/平板形态的方案本身也不该含电脑件 */
    plans.filter(pl => (pl.form || []).some(f => f === 'phone' || f === 'tablet')).forEach(pl => {
      (pl.parts || []).forEach(rw => {
        if (banParts.has(rw[0])) problems.push({ 处: '方案数据', 方案: pl.id, 部件: rw[0] });
      });
    });

    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : {
        方案: r.planName,
        配置单部件: r.spec.map(x => x.part),
        配件区部件: r.fp.map(x => x.part),
        电脑件黑名单: Array.from(banParts).sort()
      },
      expected: '0 电脑件',
      note: '黑名单为数据驱动：电脑方案部件名减去手机/平板方案部件名，再并入 ORD-12 硬名单'
    };
  });

  /* ===== A7 手机用户选不同的 focus，结果必须不同 ===== */
  await step('A7', '手机用户选不同的 focus，结果必须不同', async () => {
    const mk = focus => [
      { q: 'form', o: 'phone' }, { q: 'use', o: 'p_game' }, { q: 'budget', o: 'b6000' },
      { q: 'pref', o: 'p_perf' }, { q: 'look', o: 'p_any' }, { q: 'intensity', o: 'mid' },
      { q: 'lifespan', o: 'y3' }, { q: 'existing', o: 'none' }, { q: 'focus', o: focus }
    ];
    const runs = {};
    for (const f of ['p_body', 'p_play', 'p_protect', 'p_charge', 'p_audio']) {
      runs[f] = await runQuiz(dom, mk(f));
    }
    const focusQ = (dom.window.PC_DATA.quiz || []).filter(q => q.id === 'focus')[0];
    const phoneFocusOpts = focusQ.options.filter(o => (o.when && o.when.form || []).indexOf('phone') > -1);
    const hotOf = r => r.fp.filter(x => !x.inMore).map(x => x.part).sort().join('|');
    const problems = [];
    const notes = [];

    /* 子断言 1：首屏（重点）件集合必须随 focus 变化 —— focus 要真的生效 */
    if (hotOf(runs.p_body) === hotOf(runs.p_play)) {
      problems.push({ err: 'focus=手机本体 与 focus=游戏与散热 的首屏重点件集合相同', 首屏: hotOf(runs.p_body) });
    }
    /* 子断言 2：focus 声明的件若存在于方案中，必须出现在首屏（不得被折叠） */
    ['p_body', 'p_play', 'p_protect', 'p_charge'].forEach(f => {
      const opt = phoneFocusOpts.filter(o => o.id === f)[0];
      if (!opt) { problems.push({ focus: f, err: '数据里找不到该 focus 选项' }); return; }
      const planParts = runs[f].spec.map(x => x.part);
      const inter = (opt.parts || []).filter(p => planParts.indexOf(p) > -1);
      if (!inter.length) { problems.push({ focus: f, 声明件: opt.parts, err: '与方案无交集' }); return; }
      inter.forEach(p => {
        const row = runs[f].fp.filter(x => x.part === p)[0];
        if (!row) problems.push({ focus: f, 部件: p, err: '焦点件不在配件区' });
        else if (row.inMore) problems.push({ focus: f, 部件: p, err: '焦点件被折叠了' });
      });
    });
    /* 子断言 3：不同 focus 的可见结构必须两两不同（首屏 + 折叠 的可见序列） */
    const keys = ['p_body', 'p_play', 'p_protect', 'p_charge'];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = runs[keys[i]], b = runs[keys[j]];
        const visA = a.fp.map(x => (x.inMore ? '[' : '') + x.part + (x.inMore ? ']' : '')).join(',');
        const visB = b.fp.map(x => (x.inMore ? '[' : '') + x.part + (x.inMore ? ']' : '')).join(',');
        if (visA === visB) problems.push({ err: keys[i] + ' 与 ' + keys[j] + ' 的可见结构完全相同', 结构: visA });
      }
    }
    /* 记录（不判 FAIL，ORD-13 §2 改判）：无交集 **且** 结果页没有 .res-focus-miss 明示 才记。
       原判定只看「无交集」，功能修好后仍照报，等于把过期结论写死在文本里。
       另外改为跑「该 focus 自己那一轮」：用 p_body 的 result 判别的 focus 的明示会取错页面。 */
    phoneFocusOpts.forEach(o => {
      const run = runs[o.id] || runs.p_body;
      const planParts = run.spec.map(x => x.part);
      const inter = (o.parts || []).filter(p => planParts.indexOf(p) > -1);
      if (inter.length) return;                      /* 有交集 → 不记 */
      if (run.focusMiss) return;                     /* 已明示不可得 → 不记 */
      notes.push({
        focus: o.id, 标签: o.label, 声明件: o.parts,
        现象: '方案内无该重点件，且结果页没有 .res-focus-miss 明示',
        首屏: hotOf(run) || '(空)'
      });
    });

    return {
      ok: problems.length === 0,
      actual: problems.length ? problems : {
        首屏重点件: Object.keys(runs).reduce((m, k) => (m[k] = hotOf(runs[k]) || '(空)', m), {}),
        折叠提示: Object.keys(runs).reduce((m, k) => (m[k] = runs[k].moreSummary || '(无)', m), {})
      },
      expected: 'focus 生效：重点件进首屏、不被折叠，不同 focus 的可见结构不同',
      note: notes.length ? ('【不判FAIL的记录】' + JSON.stringify(notes)) : '',
      extra: notes
    };
  });

  /* ===== A15 逐题对照实验：10 题每题单独改变时结果都变化 =====
   * 适用范围：**有货档位**。本题组 alt 走桌面 alt 组合，那一档库内有货，
   * 所以「结果必变」在此组合下成立。实现侧口径是「变 或 明示无货」取并集
   * （更严：额外要求站点有明示机制）；换成无货组合（如木质机箱）时本断言不适用，
   * FAIL 也不代表回归。判据切换需总控签，本脚本暂按原判据跑。 */
  await step('A15', '逐题对照实验：10 题每题单独改变，结果都变化', async () => {
    const alt = {
      form: 'laptop', use: 'create', budget: 'b12000', pref: 'rgb', look: 'seaview',
      intensity: 'heavy', lifespan: 'y5', exp: 'pro', existing: 'monitor', focus: 'monitor'
    };
    /* exp 按实现自身设计意图豁免 tier1（只改建议不改型号），但仍要求 tier2 变化 */
    const tier1Exempt = ['exp'];
    const baseT1 = sigTier1(baseRes), baseT2 = sigTier2(baseRes);
    const detail = [];
    const problems = [];
    for (const qid of Object.keys(alt)) {
      const ans = BASE.map(a => (a.q === qid ? { q: a.q, o: alt[qid] } : a));
      const r = await runQuiz(dom, ans);
      const t1 = sigTier1(r), t2 = sigTier2(r);
      const changed1 = t1 !== baseT1, changed2 = t2 !== baseT2;
      detail.push({ 题: qid, 改为: alt[qid], 硬件层变: changed1, 全层变: changed2 });
      if (tier1Exempt.indexOf(qid) > -1) {
        if (!changed2) problems.push({ 题: qid, err: '全层结果未变化（tier2 也没变）' });
      } else {
        if (!changed1) problems.push({ 题: qid, 改为: alt[qid], err: '硬件层结果未变化（改了等于没改）' });
      }
    }
    const covered = detail.length;
    return {
      ok: problems.length === 0 && covered === 10,
      actual: problems.length ? problems : detail,
      expected: '10 题全部覆盖，每题改动都能改变结果',
      note: covered === 10 ? `已逐题对照 ${covered} 题；exp 按实现设计意图只要求 tier2 变化` : `只测了 ${covered} 题`
    };
  });

  /* ===== A17 现有审计闸仍全绿 ===== */
  await step('A17', '现有审计闸（tests/audit-search.cjs）仍全绿', async () => {
    const env = Object.assign({}, process.env);
    const nodePath = [env.NODE_PATH, path.join(ROOT, 'node_modules'),
      path.join(process.env.USERPROFILE || process.env.HOME || '', '.workbuddy', 'binaries', 'node', 'workspace', 'node_modules')]
      .filter(Boolean).join(path.delimiter);
    env.NODE_PATH = nodePath;
    const r = spawnSync(process.execPath, [path.join(ROOT, 'tests', 'audit-search.cjs')], {
      env, encoding: 'utf8', cwd: ROOT, timeout: 180000
    });
    const out = (r.stdout || '') + (r.stderr || '');
    const failLines = out.split('\n').filter(l => /^\s*FAIL/.test(l));
    const passLines = out.split('\n').filter(l => /^\s*PASS/.test(l));
    const ok = r.status === 0 && failLines.length === 0;
    return {
      ok,
      actual: ok ? `PASS ${passLines.length} 项 / FAIL 0（exit ${r.status}）`
        : { exit: r.status, fail数: failLines.length, 明细: failLines.slice(0, 10) },
      expected: 'exit 0 且 0 条 FAIL'
    };
  });

  /* ---------- 汇总 ---------- */
  const fail = results.filter(r => !r.ok);
  const pass = results.length - fail.length;
  console.log(`\n结果：PASS ${pass} / FAIL ${fail.length}（共 ${results.length} 条）`);
  if (fail.length) {
    console.log('\n未通过：');
    fail.forEach(f => console.log(`  ${f.id} ${f.name}`));
    console.log('\n提示：执行者不能给自己的产物发 PASS；请按未通过项逐条修，改完重跑本脚本。');
  }
  process.exit(fail.length > 0 ? 1 : 0);
})().catch(e => { console.error('验收脚本自身崩了：', e); process.exit(2); });

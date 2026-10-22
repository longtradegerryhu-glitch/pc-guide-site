/* 端到端：同型号合并卡是否真的生效（ORD-08 验收）
 *
 * 跑法：node tests/e2e-merge.cjs
 * 退出码：0 全 PASS / 1 有 FAIL / 2 环境缺失
 *
 * 为什么必须跑真 UI：
 *   lib/checks.cjs 只能证明「按同一套内核算出来的数字是 1160」。
 *   页面到底有没有调合并、卡片上有没有标注、并集价格对不对，只有真渲染才看得见。
 *   口径对了但没接上页面，是这类改动最典型的假通过。
 */

'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..') + path.sep;
const { presentedStats } = require('./lib/checks.cjs');

/* ---------- jsdom 解析（与 audit-search.cjs 同口径的三路兜底） ---------- */
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

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/models-data.js', 'utf8'), ctx);
const models = ctx.window.PC_MODELS;
const expect = presentedStats(models);

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name + (detail ? '  ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  ' + detail : '')); }
}

(async () => {
  const { jsdom, from, tried } = resolveJsdom();
  if (!jsdom) {
    console.error('未找到 jsdom，无法跑端到端。尝试过：' + (tried || []).join(' | '));
    process.exit(2);
  }
  console.log('jsdom: ' + from + '\n');

  const dom = await jsdom.JSDOM.fromFile(ROOT + 'accessories.html', {
    runScripts: 'dangerously', resources: 'usable',
    beforeParse(w) {
      w.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const W = dom.window, D = W.document;

  const search = async (q) => {
    const el = D.getElementById('accSearch');
    el.value = q;
    el.dispatchEvent(new W.Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    return [...D.querySelectorAll('.acc-card')];
  };
  const txt = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');

  console.log('== G1 合并内核已装载 ==');
  ok('window.PCDup 存在（js/dup-core.js 已引入）', !!W.PCDup);

  console.log('\n== G2 每个品类的款数与合并后一致（逐类对账） ==');
  {
    const groups = [...D.querySelectorAll('.acc-group')];
    ok('分组数 = 21', groups.length === 21, '实测 ' + groups.length);
    let sum = 0, mismatch = 0;
    groups.forEach(g => {
      const cid = g.getAttribute('data-cat');
      const n = parseInt((txt(g.querySelector('.acc-group-count')) || '0'), 10) || 0;
      sum += n;
      const items = models[cid] || [];
      const merged = W.PCDup.mergeList(cid, items).length;
      if (n !== merged) {
        mismatch++;
        console.log('    ✗ ' + cid + '：页面 ' + n + ' 款，合并后应 ' + merged + ' 款（原始 ' + items.length + '）');
      }
    });
    ok('各品类款数全部等于合并后条数', mismatch === 0, '不符 ' + mismatch + ' 个');
    ok('全站合计 = ' + expect.cards + ' 款（原始 ' + expect.raw + ' − 重复 ' + (expect.raw - expect.cards) + '）',
      sum === expect.cards, '实测 ' + sum);
  }

  console.log('\n== G3 价格冲突组：合并成一条 + 并集 + 价格存疑 ==');
  {
    const cards = await search('ATH-CLR100');
    ok('只出 1 张卡（原始 2 条记录）', cards.length === 1, '实测 ' + cards.length);
    const c = cards[0];
    if (c) {
      ok('价格显示并集 ¥99 - 899', txt(c.querySelector('.acc-price')) === '¥99 - 899', txt(c.querySelector('.acc-price')));
      const badge = c.querySelector('.acc-merge-badge');
      ok('有「价格存疑」徽标', !!badge && txt(badge).indexOf('价格存疑') > -1, txt(badge));
      const cal = txt(c.querySelector('.acc-caliber'));
      ok('口径说明写了"不重叠"', cal.indexOf('不重叠') > -1);
      ok('口径说明列出两条原始区间', cal.indexOf('¥549 - 899') > -1 && cal.indexOf('¥99 - 149') > -1);
      ok('明确写"未替你选其中一条"', cal.indexOf('未替你选其中一条') > -1);
    }
  }

  console.log('\n== G4 区间一致的重复组：合并但不误报存疑 ==');
  {
    const cards = await search('Magic 9 Pro Max');
    ok('只出 1 张卡', cards.length === 1, '实测 ' + cards.length);
    const c = cards[0];
    if (c) {
      const badge = c.querySelector('.acc-merge-badge');
      ok('徽标为「已合并 2 条」', !!badge && txt(badge) === '已合并 2 条', txt(badge));
      ok('不误标「价格存疑」', !(badge && badge.classList.contains('warn')));
      ok('口径说明写了"区间一致"', txt(c.querySelector('.acc-caliber')).indexOf('区间一致') > -1);
    }
  }

  console.log('\n== G5 无重复的型号不出任何徽标 ==');
  {
    const cards = await search('9800X3D');
    const plain = cards.filter(c => !c.querySelector('.acc-merge-badge'));
    ok('存在无徽标的普通卡（未被合并逻辑污染）', plain.length > 0, '共 ' + cards.length + ' 张，其中无徽标 ' + plain.length + ' 张');
    ok('9800X3D 自身带徽标（它确实是重复组）',
      cards.some(c => !!c.querySelector('.acc-merge-badge')));
  }

  console.log('\n== G6 全量渲染下同型号不重复出现 ==');
  {
    await search('');
    const names = [...D.querySelectorAll('.acc-group')].map(g => {
      const arr = [...g.querySelectorAll('.acc-model')].map(x => txt(x));
      return { cid: g.getAttribute('data-cat'), arr: arr };
    });
    let dup = 0;
    names.forEach(x => {
      const seen = new Set();
      x.arr.forEach(n => { if (seen.has(n)) dup++; else seen.add(n); });
    });
    ok('任一品类首屏内没有同名型号重复卡', dup === 0, '重复 ' + dup + ' 处');
  }

  console.log('\n结果：PASS ' + pass + ' / FAIL ' + fail);
  process.exit(fail > 0 ? 1 : 0);
})();

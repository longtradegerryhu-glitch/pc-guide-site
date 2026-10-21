/* 审计 runner —— 装配真实数据与 jsdom，调用 lib/checks.cjs 的纯逻辑
 *
 * 跑法：npm test        或        node tests/audit-search.cjs
 * 退出码：0 全 PASS / 1 有 FAIL / 2 环境缺失（连数据都读不到）
 *
 * 为什么断言逻辑抽到 lib/checks.cjs：
 *   断言必须自己可测。只能读真实数据跑一遍的断言，无法验证"数据被污染时它会不会 FAIL"。
 *   tests/selftest-mutation.cjs 通过调用同一套纯函数，注入污染数据，验证对应断言确实失败。
 *
 * jsdom 解析顺序（修「npm test 直接崩」）：
 *   1. 常规 require('jsdom')（npm install 后可用）
 *   2. NODE_PATH 各段
 *   3. 开发机已知路径
 *   4. 全找不到 → 搜索类断言标 SKIP，数据类断言照常执行，退出码按数据类算
 *      缺一个可选依赖不该让整个审计停摆，但必须大声说出来，不能假装通过。
 */

'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { runChecks } = require('./lib/checks.cjs');

const ROOT = path.resolve(__dirname, '..') + path.sep;

/* ---------- 1. 解析 jsdom ---------- */
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

/* ---------- 2. 读数据 ---------- */
const ctx = { window: {} };
vm.createContext(ctx);
try {
  vm.runInContext(fs.readFileSync(ROOT + 'js/data.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(ROOT + 'js/models-data.js', 'utf8'), ctx);
} catch (e) {
  console.error('无法加载 models-data.js：' + e.message);
  process.exit(2);
}
const models = ctx.window.PC_MODELS;
if (!models) { console.error('PC_MODELS 不存在'); process.exit(2); }
const ALL = [];
Object.keys(models).forEach(k => (models[k] || []).forEach(i => ALL.push(i)));

/* ---------- 3. 搜索探针 ---------- */
const HARD = ['name', 'brand', 'model', 'searchName', 'style', 'specs'];
const SOFT = ['valueNote', 'compat'];
const S = x => String(x == null ? '' : x).toLowerCase();

function classify(it, toks) {
  const hard = HARD.some(f => { const v = S(it[f]); return v && toks.every(t => v.includes(t)); });
  const soft = SOFT.some(f => { const v = S(it[f]); return v && toks.every(t => v.includes(t)); })
    || (it.tags || []).some(t => toks.every(x => S(t).includes(x)));
  return { hard, soft };
}

/* jsdom 缺失时的降级探针：只做裸字段匹配，不含 ALIAS/NEED 词表。
   它不能替代真实 UI 口径，因此只用于保证数据类断言能跑，搜索类断言标 SKIP。 */
function makeStubProbe() {
  return async (q) => {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0, main = 0, soft = 0;
    ALL.forEach(it => {
      const c = classify(it, toks);
      if (c.hard) { n++; main++; } else if (c.soft) { n++; soft++; }
    });
    return { n, main, soft, stub: true };
  };
}

async function makeUiProbe(jsdomModule) {
  const dom = await jsdomModule.JSDOM.fromFile(ROOT + 'accessories.html', {
    runScripts: 'dangerously', resources: 'usable',
    beforeParse(w) {
      w.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const W = dom.window, D = W.document;
  const el = D.getElementById('accSearch');
  if (!el) throw new Error('accSearch 元素不存在');

  return async (q) => {
    el.value = q;
    el.dispatchEvent(new W.Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 450));
    const rows = [...D.querySelectorAll('.acc-card')].map(c => ({
      name: (c.querySelector('.acc-name') || {}).textContent || ''
    }));
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    let main = 0, soft = 0;
    rows.forEach(x => {
      const found = ALL.find(i => i.name === x.name || (i.brand + ' ' + i.model) === x.name);
      if (!found) { main++; return; }
      const c = classify(found, toks);
      if (c.hard) main++; else if (c.soft) soft++; else main++;
    });
    return { n: rows.length, main, soft };
  };
}

/* ---------- 4. 执行 ---------- */
(async () => {
  const { jsdom, from, tried } = resolveJsdom();
  let probe, mode;

  if (jsdom) {
    try {
      probe = await makeUiProbe(jsdom);
      mode = 'UI';
      console.log(`jsdom: ${from}`);
    } catch (e) {
      probe = makeStubProbe();
      mode = 'STUB';
      console.log(`jsdom 已找到但 UI 装载失败（${e.message}），降级为裸匹配探针`);
    }
  } else {
    probe = makeStubProbe();
    mode = 'STUB';
    console.log('⚠ 未找到 jsdom，搜索类断言降级为裸字段匹配（口径不等于用户所见）');
    console.log('  修法：在本目录执行 npm install，或设置 NODE_PATH 指向含 jsdom 的 node_modules');
    console.log('  尝试过的路径：' + (tried || []).join(' | '));
  }

  console.log(`探针口径：${mode}\n`);

  const { items, stats } = await runChecks({ models, searchProbe: probe });

  let pass = 0, fail = 0, skip = 0;
  items.forEach(it => {
    /* 用显式 kind，不靠 id 前缀 —— model:type 是数据断言，不能被 model:layer 的命名规则误伤 */
    if (mode === 'STUB' && it.kind === 'search') {
      skip++;
      console.log(`  SKIP ${it.name}（无 jsdom，口径不可信）`);
      return;
    }
    if (it.ok) { pass++; console.log(`  PASS ${it.name}`); }
    else { fail++; console.log(`  FAIL ${it.name} :: ${JSON.stringify(it.actual)}（基线 ${JSON.stringify(it.base)}）`); }
  });

  /* 同一型号出现 3 次及以上：为去重提供可执行清单 */
  const triples = stats.dup.detail.filter(g => g.n > 2);
  if (triples.length) {
    console.log(`\n⚠ 同一型号出现 3 次及以上（${triples.length} 组）：`);
    triples.slice(0, 10).forEach(g => console.log('   ' + g.key + ' → ' + g.ids.join(', ')));
  }

  console.log(`\n结果：PASS ${pass} / FAIL ${fail}${skip ? ` / SKIP ${skip}` : ''}`);
  if (fail > 0) console.log('\n提示：改数据后请先跑 E:/AI/_test/build_models.js 重建，再跑本脚本。');
  process.exit(fail > 0 ? 1 : 0);
})();

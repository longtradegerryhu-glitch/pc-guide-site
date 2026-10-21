/* 数据质量与搜索分层审计 —— 项目级回归脚本
 *
 * 跑法：NODE_PATH=<jsdom 所在 node_modules> node tests/audit-search.cjs
 * 退出码：任何一项超出基线 → exit 1
 *
 * 为什么用 .cjs：项目 package.json 是 "type": "module"，.js 会被当 ESM，
 * 而 jsdom 只能在 CommonJS + NODE_PATH 下解析。用 .cjs 绕过。
 *
 * 为什么搜索部分用 jsdom 真跑 UI：
 *   accessories.html 的搜索除了 8 字段匹配，还叠加了 ALIAS(品类词) / NEED(需求词) 词表。
 *   裸字段匹配得出的数字（如「白色 ATX 机箱」只有 2 款）与用户实际看到的（15 款）不一致。
 *   审计数字必须等于用户所见，否则审计本身不可信。
 *
 * 基线日期：2026-10-21（1209 款 / 21 品类）
 * 基线不是"正确值"，是"不许变差的值"。去重 / schema 迁移完成后相应基线应下调。
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..') + path.sep;
const S = x => String(x == null ? '' : x).toLowerCase();

/* ---------- 基线 ---------- */
const BASE = {
  totalModels: 1209,      // 型号总数，允许 >=（扩库通过）
  dupGroups: 49,          // 重复组数，允许 <=（去重后变小通过）
  priceConflict: 21,      // 价格区间不重叠的重复组，允许 <=
  specsInconsistent: 21,  // specs 段数不固定的品类数，schema 迁移后应下降
  singlePricePct: 10,     // 单点价格占比上限 %
  specQueries: ['ATX3.1', 'GDDR7', '360水冷'],  // 主体命中必须 > 0，防"过滤垃圾"规则误杀
  modelQuery: '5070 Ti',  // 必须存在软备注层，证明分层生效
};

let pass = 0, fail = 0;
const chk = (name, cond, actual) => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} :: ${JSON.stringify(actual)}`); }
};

/* ---------- 数据层 ---------- */
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/models-data.js', 'utf8'), ctx);
const mm = ctx.window.PC_MODELS;
if (!mm) { console.error('无法加载 PC_MODELS'); process.exit(1); }

const HARD = ['name', 'brand', 'model', 'searchName', 'style', 'specs'];
const SOFT = ['valueNote', 'compat'];

function classify(it, toks) {
  const hardHit = HARD.some(f => { const v = S(it[f]); return v && toks.every(t => v.includes(t)); });
  const softHit = SOFT.some(f => { const v = S(it[f]); return v && toks.every(t => v.includes(t)); })
    || (it.tags || []).some(t => toks.every(x => S(t).includes(x)));
  return { hardHit, softHit };
}

(async () => {
  /* ---------- UI 层 ---------- */
  const dom = await JSDOM.fromFile(ROOT + 'accessories.html', {
    runScripts: 'dangerously', resources: 'usable',
    beforeParse(w) {
      w.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    }
  });
  await new Promise(r => setTimeout(r, 3500));
  const W = dom.window, D = W.document;
  const searchEl = D.getElementById('accSearch');

  function uiSearch(q) {
    searchEl.value = q;
    searchEl.dispatchEvent(new W.Event('input', { bubbles: true }));
    return new Promise(res => setTimeout(() => {
      const rows = [...D.querySelectorAll('.acc-card')].map(c => ({
        cat: (c.querySelector('.acc-cat') || {}).textContent || '',
        name: (c.querySelector('.acc-name') || {}).textContent || ''
      }));
      const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
      let main = 0, soft = 0;
      rows.forEach(x => {
        let found = null;
        Object.keys(mm).forEach(k => (mm[k] || []).forEach(i => {
          if (i.name === x.name || (i.brand + ' ' + i.model) === x.name) found = i;
        }));
        if (!found) { main++; return; }
        const c = classify(found, toks);
        if (c.hardHit) main++; else if (c.softHit) soft++; else main++;
      });
      res({ n: rows.length, main, soft });
    }, 450));
  }

  console.log('== 一、搜索分层 ==');
  for (const q of BASE.specQueries) {
    const r = await uiSearch(q);
    chk(`规格词「${q}」主体命中 > 0（防误杀）`, r.main > 0, r);
  }
  {
    const r = await uiSearch(BASE.modelQuery);
    chk(`型号词「${BASE.modelQuery}」存在软备注层（分层生效）`, r.soft > 0 && r.main < r.n, r);
  }

  console.log('\n== 二、重复型号 ==');
  function dupGroups(keyFn) {
    const m = {};
    Object.keys(mm).forEach(k => (mm[k] || []).forEach(i => {
      const key = keyFn(k, i); (m[key] = m[key] || []).push(i);
    }));
    return Object.entries(m).filter(([, v]) => v.length > 1);
  }
  const dups = dupGroups((k, i) => k + '|' + S(i.brand) + '|' + S(i.model).replace(/\s+/g, ''));
  chk(`重复组数 <= ${BASE.dupGroups}`, dups.length <= BASE.dupGroups, dups.length);
  let noOverlap = 0;
  dups.forEach(([, v]) => {
    const ok = v.every(a => v.every(b => a.price[0] < b.price[1] && b.price[0] < a.price[1]));
    if (!ok) noOverlap++;
  });
  chk(`价格区间冲突组 <= ${BASE.priceConflict}`, noOverlap <= BASE.priceConflict, noOverlap);

  console.log('\n== 三、specs 结构一致性 ==');
  let bad = 0;
  Object.keys(mm).forEach(k => {
    const segs = new Set((mm[k] || []).map(i => S(i.specs).split(/[;；]/).filter(x => x.trim()).length));
    if (segs.size > 1) bad++;
  });
  chk(`specs 段数不固定的品类 <= ${BASE.specsInconsistent}（schema 迁移后应下降）`,
    bad <= BASE.specsInconsistent, bad);

  console.log('\n== 四、字段与价格精度 ==');
  let numModel = 0, single = 0, tot = 0;
  Object.keys(mm).forEach(k => (mm[k] || []).forEach(i => {
    tot++;
    if (typeof i.model === 'number') numModel++;
    if (i.price && i.price[0] === i.price[1]) single++;
  }));
  chk('型号总数 >= ' + BASE.totalModels, tot >= BASE.totalModels, tot);
  chk('model 全为字符串', numModel === 0, numModel);
  const singlePct = single / tot * 100;
  chk(`单点价格占比 <= ${BASE.singlePricePct}%`, singlePct <= BASE.singlePricePct, singlePct.toFixed(1));

  console.log(`\n结果：PASS ${pass} / FAIL ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
})();

/* 规格词 × 品类 双口径矩阵探针（审计交付 · 入库版）
 *
 * 跑法：npm run spec:matrix
 *       或 NODE_PATH=".../node_modules" node tools/spec-word-matrix.cjs
 * 产出：stdout 两张矩阵表 + tools/spec-word-matrix_out.json
 *
 * ============================ 口径纪律（不可静默变更） ============================
 * 任何后续搜索改动，都必须同时报告「首屏口径」与「全库口径」两个数：
 *
 *   首屏口径 = jsdom 真跑 accessories.html，用户第一眼看到的卡片数。
 *              受 GROUP_PAGE=24 截断（js/recommend.js:994），单分组命中 > 24 即被砍到 24。
 *              用途：排序/权重优化的验收依据（用户第一眼看到什么就优化什么）。
 *
 *   全库口径 = 全部匹配条目数（用户点完「加载更多」能看到的全部）。
 *              用途：判断筛选/分层的完整性、算主体占比、算偏差率。
 *
 *   缺任一口径都是假数字：只有首屏会低估（分页截断），只有全库会高估
 *   （用户第一屏没看到，观感与结论都会偏）。
 *
 *   两口径的匹配语义必须与 UI 一致（js/recommend.js 的 matchQuery + segmentQuery）：
 *   品类词走 ALIAS（只按所属品类判定）、需求词走 NEED（任一同义词命中即算）。
 *
 *   主体(hard) = name/brand/model/searchName/style/specs 命中
 *   仅软备注   = 仅 valueNote/compat/tags 命中
 *
 *   注：ALIAS/NEED 判定影响的是「哪些条目被选中」，不影响 hard/soft 的字段归属；
 *   本探针的 classify 只看 token 是否落在 HARD 字段里。
 * ============================================================================
 *
 * 引用本表数字必须带数据快照（js/models-data.js 的 commit），否则无法复核。
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..') + path.sep;
const OUT = path.join(__dirname, 'spec-word-matrix_out.json');
const WORDS = ['DDR5', 'GDDR7', 'PCIe5.0', 'ATX3.1', '2.5G', 'M.2'];
const S = x => String(x == null ? '' : x).toLowerCase();
const HARD = ['name', 'brand', 'model', 'searchName', 'style', 'specs'];
const SOFT = ['valueNote', 'compat'];
const ALL_FIELDS = HARD.concat(SOFT);

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(ROOT + 'js/models-data.js', 'utf8'), ctx);
const mm = ctx.window.PC_MODELS;
const cats = ctx.window.PC_DATA.categories.map(c => ({ id: c.id, name: c.name }));
const catNames = cats.map(c => c.name).sort((a, b) => b.length - a.length);

function classify(it, toks) {
  const hardHit = HARD.some(f => { const v = S(it[f]); return v && toks.every(t => v.includes(t)); });
  const softHit = SOFT.some(f => { const v = S(it[f]); return v && toks.every(t => v.includes(t)); })
    || (it.tags || []).some(t => toks.every(x => S(t).includes(x)));
  return { hardHit, softHit };
}

/* ---- 全库口径：与 matchQuery 同语义（token 全命中），但不受分页限制 ---- */
function fullScan(word) {
  const toks = word.toLowerCase().split(/\s+/).filter(Boolean);
  const byCat = {};
  Object.keys(mm).forEach(catId => {
    (mm[catId] || []).forEach(it => {
      const hay = ALL_FIELDS.map(f => S(it[f])).filter(Boolean).join(' ') + ' '
        + (it.tags || []).map(S).join(' ');
      if (!toks.every(t => hay.includes(t))) return;
      const cname = (cats.find(c => c.id === catId) || { name: catId }).name;
      const cell = byCat[cname] = byCat[cname] || { n: 0, main: 0, soft: 0 };
      cell.n++;
      const c = classify(it, toks);
      if (c.hardHit) cell.main++; else if (c.softHit) cell.soft++; else cell.main++;
    });
  });
  return byCat;
}

(async () => {
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
  if (!searchEl) { console.error('找不到 #accSearch'); process.exit(1); }

  function uiSearch(q) {
    searchEl.value = q;
    searchEl.dispatchEvent(new W.Event('input', { bubbles: true }));
    return new Promise(res => setTimeout(() => {
      const rows = [...D.querySelectorAll('.acc-card')].map(c => ({
        catText: (c.querySelector('.acc-cat') || {}).textContent || '',
        name: (c.querySelector('.acc-name') || {}).textContent || ''
      }));
      const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
      const byCat = {};
      rows.forEach(x => {
        const cname = catNames.find(n => x.catText.includes(n)) || x.catText || '(未知)';
        const cell = byCat[cname] = byCat[cname] || { n: 0, main: 0, soft: 0 };
        cell.n++;
        let found = null;
        Object.keys(mm).forEach(k => (mm[k] || []).forEach(i => {
          if (i.name === x.name || (i.brand + ' ' + i.model) === x.name) found = i;
        }));
        if (!found) { cell.main++; return; }
        const c = classify(found, toks);
        if (c.hardHit) cell.main++; else if (c.softHit) cell.soft++; else cell.main++;
      });
      res(byCat);
    }, 450));
  }

  const firstScreen = {}, fullLib = {};
  for (const w of WORDS) {
    firstScreen[w] = await uiSearch(w);
    fullLib[w] = fullScan(w);
  }

  const sum = m => Object.values(m).reduce((s, c) => ({ n: s.n + c.n, main: s.main + c.main, soft: s.soft + c.soft }), { n: 0, main: 0, soft: 0 });

  console.log('== 合计对照（首屏 / 全库）==');
  console.log('  词      首屏 n/主体/软    全库 n/主体/软   主体差');
  WORDS.forEach(w => {
    const a = sum(firstScreen[w]), b = sum(fullLib[w]);
    console.log(`  ${w.padEnd(8)} ${`${a.n}/${a.main}/${a.soft}`.padEnd(17)} ${`${b.n}/${b.main}/${b.soft}`.padEnd(15)} ${b.main - a.main}` + (a.n !== b.n ? '   ← 分页截断' : ''));
  });

  const print = (title, data) => {
    console.log(`\n== ${title}（n/主体/仅软备注，. = 0）==`);
    console.log(['品类', ...WORDS].join('\t'));
    cats.forEach(c => {
      const row = [c.name];
      WORDS.forEach(w => {
        const cell = (data[w] || {})[c.name];
        row.push(cell ? `${cell.n}/${cell.main}/${cell.soft}` : '.');
      });
      console.log(row.join('\t'));
    });
    const tot = WORDS.map(w => { const s = sum(data[w]); return `${w}:${s.n}/${s.main}/${s.soft}`; });
    console.log('合计\t' + tot.join('\t'));
  };
  print('表 A · 全库口径', fullLib);
  print('表 B · jsdom 首屏口径（GROUP_PAGE=24 截断）', firstScreen);

  fs.writeFileSync(OUT, JSON.stringify({
    date: '2026-10-22',
    note: '双口径：首屏(jsdom,受GROUP_PAGE=24截断) + 全库(全部匹配)。引用须带数据快照 commit。',
    words: WORDS,
    categories: cats.map(c => c.name),
    firstScreen, fullLib
  }, null, 2));
  console.log('\nJSON 已写 ' + OUT);
  process.exit(0);
})();

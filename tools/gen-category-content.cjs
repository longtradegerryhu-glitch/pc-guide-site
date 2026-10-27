/* 品类内容生成器 —— 从型号库生成 guide.html 的硬件品类节
 *
 * 跑法：
 *   node tools/gen-category-content.cjs            # 生成并写回 guide.html
 *   node tools/gen-category-content.cjs --check    # 只校验（幂等闸用，不写文件）
 *   node tools/gen-category-content.cjs --dump ram # 打印单个品类（反馈取证用）
 *
 * 为什么要有这个文件（ORD-31 任务 4）：
 *   guide.html 的硬件节平均 42-88 字，而型号库里 1209 条 valueNote 写得相当细
 *   （连「给 iPhone 慢充，给笔记本根本带不动」这种话都有）。内容能力是有的，
 *   只是没被组织起来。手写第二遍只会回到「122 字 × 14」的现状，
 *   所以这里做的是**结构化组织**：件数、价位分布、参数出现频次、valueNote 里的
 *   「但是…」句子、以及跨品类共享的规格词，全部从库里现算，内容量随库增长。
 *
 * 纪律：
 *   · 只读 js/models-data.js（PC_MODELS）与 js/data.js / js/specs-schema.js，
 *     不改任何数据文件；产物只有 guide.html 的 GEN 区。
 *   · 每一句都必须能被数据验证：件数、价格、频次、原文引用。
 *     不写「一般来说」「大多数人都」这类无法核对的句子。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GUIDE = path.join(ROOT, 'guide.html');
const START = '<!-- GEN:hardware:start -->';
const END = '<!-- GEN:hardware:end -->';

/* ---------- 读数据（只读） ---------- */
function loadData() {
  const ctx = { window: {} };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  /* dup-core.js 也读进来（同样只读）。配件页渲染前会用 PCDup.mergeList 把同型号重复
     记录合并成一条，所以页面上「N 款」指的是**合并后**的款数。生成器必须用同一个口径：
     否则 guide 写「本站收录 61 款 CPU」，用户点「看这 61 款型号 →」进去只数到 51 张卡，
     等于又造了一个点不到的死承诺。 */
  ['js/models-data.js', 'js/data.js', 'js/specs-schema.js', 'js/dup-core.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  });
  const models = ctx.window.PC_MODELS || {};
  const dup = ctx.PCDup || null;
  const merged = {};
  Object.keys(models).forEach(cid => {
    const arr = models[cid] || [];
    /* mergeList 返回的是 { item, merge, key } 包装体，这里只要 item —— 与配件页渲染
       使用的是同一个函数，款数口径天然一致。 */
    merged[cid] = (dup && dup.mergeList) ? dup.mergeList(cid, arr).map(x => x.item) : arr.slice();
  });
  return {
    models: models,
    merged: merged,
    data: ctx.window.PC_DATA || {},
    schema: ctx.window.PC_SCHEMA || null
  };
}

/* ---------- 小工具 ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mid = it => (it.price[0] + it.price[1]) / 2;

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

function topCounts(list, n, minCount) {
  const map = new Map();
  list.forEach(x => {
    const k = String(x == null ? '' : x).trim();
    if (!k) return;
    map.set(k, (map.get(k) || 0) + 1);
  });
  return [...map.entries()]
    .filter(([k, c]) => c >= (minCount || 1))
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'zh'))
    .slice(0, n)
    .map(([k, c]) => ({ k, c }));
}

/* style 是人写的自由文本（「27英寸 2K 高刷」），按空白与斜杠拆成形态词 */
function styleTokens(items) {
  const out = [];
  items.forEach(it => {
    String(it.style || '').split(/[\s/、+，]+/).forEach(t => {
      const k = t.trim();
      if (k && k.length >= 2 && k.length <= 12) out.push(k);
    });
  });
  return topCounts(out, 8, Math.max(3, Math.round(items.length * 0.08)));
}

/* specs 用分号分段（「DDR5;5600MHz;8G×2;CL46」） */
function specTokens(items) {
  const out = [];
  items.forEach(it => {
    String(it.specs || '').split(/[;；]/).forEach(t => {
      const k = t.trim();
      if (k && k.length >= 2 && k.length <= 24) out.push(k);
    });
  });
  return topCounts(out, 10, Math.max(3, Math.round(items.length * 0.06)));
}

/* 从 valueNote 里挑「但是… / 不适合… / 要注意…」这类句子 —— 这是站里最值钱的人类判断。
   三步筛，而不是「命中关键词就收」：
     ① 正向句排除：valueNote 里有大量「压 5080 有底气」「体积控制没牺牲」这种夸的句子，
        只因为含「发热 / 牺牲」就被收进「注意事项」是反的。
     ② 按负面程度打分：明确的限制（不适合/得换/别为/吃紧/注意）3 分，
        模糊的对比（但/不过/不如）1 分。
     ③ 每个型号只取自己最高分的一句，再跨型号按分数挑 ——
        三句话来自三个不同型号，不会一条备注占满版面。 */
const PIT_NEG = /不适合|缺点|代价|带不动|吃紧|得换|慎|注意|先确认|要看|只能|除非|别买|别为|做不到|停产|缺货|偏大|偏厚|偏重|偏小|偏短|机箱空间|内部空间|显卡限长|散热器限高|务必|核对|噪音比|打孔|限制|局限|多花钱|不值得|没有双|没有 PD/;
const PIT_POS = /有底气|没牺牲|能带动|首选|值得买|一步到位|最划算|顶配|稳定之选|省心/;
const PIT_WEAK = /但|不过|不如|体积|不便|略显|一般|比.{0,12}贵/;
function pitfallSentences(items, want) {
  const cand = [];
  items.forEach(it => {
    const note = String(it.valueNote || '');
    if (!note) return;
    let best = null;
    note.split(/[。；]/).map(s => s.trim()).filter(Boolean).forEach(p => {
      if (p.length < 10 || p.length > 90) return;
      const neg = PIT_NEG.test(p);
      if (PIT_POS.test(p) && !neg) return;          // 夸的句子不进「注意事项」
      const score = neg ? 3 : (PIT_WEAK.test(p) ? 1 : 0);
      if (!score) return;
      if (!best || score > best.score) best = { text: p, from: it, score };
    });
    if (best) cand.push(best);
  });
  cand.sort((a, b) => b.score - a.score);
  const picks = [], seen = new Set();
  for (const c of cand) {
    const key = c.text.slice(0, 10);
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(c);
    if (picks.length >= want) break;
  }
  return picks;
}

function fmtMoney(v) {
  return '¥' + Math.round(v).toLocaleString('en-US');
}

/* ---------- 单品类统计 ---------- */
function statsOf(catId, items, ctx) {
  const prices = items.map(mid).sort((a, b) => a - b);
  const brandAll = topCounts(items.map(i => i.brand), 5);
  /* 品牌总数要单独算：topCounts 会被 slice 截断，直接拿长度当「品牌数」会少报
     （内存实测 4 个品牌，截 3 之后就写成「来自 3 个品牌」—— 数字错了就是造假）。 */
  const brandTotal = new Set(items.map(i => String(i.brand || '').trim()).filter(Boolean)).size;
  const brands = brandAll;
  const grades = {};
  items.forEach(it => { const g = it.valueGrade || '?'; grades[g] = (grades[g] || 0) + 1; });
  const loM = it => it.price[0], hiM = it => it.price[1];

  const p25 = quantile(prices, 0.25), p50 = quantile(prices, 0.5), p75 = quantile(prices, 0.75);
  const tier = (from, to, tag) => {
    const sub = items.filter(it => mid(it) > from && mid(it) <= to);
    if (!sub.length) return null;
    const best = sub.slice().sort((a, b) => (b.valueGrade || '').localeCompare(a.valueGrade || '') || mid(a) - mid(b))[0];
    return { tag, n: sub.length, from, to, example: best };
  };
  const tiers = [
    tier(-Infinity, p25, '入门'),
    tier(p25, p75, '主流'),
    tier(p75, Infinity, '进阶')
  ].filter(Boolean);

  const minP = Math.min(...items.map(loM));
  const maxP = Math.max(...items.map(hiM));

  /* 跨品类共享的规格词：同一个词在别的品类里也有 N 件 —— 这是「容易搜错」的根源 */
  const shared = [];
  const mine = specTokens(items);
  Object.keys(ctx.models).forEach(other => {
    if (other === catId) return;
    const otherText = ctx.models[other].map(it => String(it.specs || '') + ' ' + String(it.name || '')).join(' ');
    mine.forEach(tk => {
      if (tk.k.length < 2) return;
      const c = (otherText.split(tk.k).length - 1);
      if (c >= 5) shared.push({ token: tk.k, mineCount: tk.c, other, otherCount: c });
    });
  });
  shared.sort((a, b) => b.otherCount - a.otherCount);

  return {
    n: items.length,
    prices, minP, maxP, p25, p50, p75,
    brands, brandTotal, grades, tiers,
    styles: styleTokens(items),
    specs: mine,
    shared,
    pitfalls: pitfallSentences(items, 3)
  };
}

/* ---------- 文案（每一句都能被数据核对） ---------- */
function paraWhat(cat, st) {
  const s = st.styles.slice(0, 3).map(x => '「' + x.k + '」' + x.c + ' 款').join('、');
  const brandLine = st.brands.length
    ? '来自 ' + st.brandTotal + ' 个品牌，最多的 ' + st.brands[0].k + ' 有 ' + st.brands[0].c + ' 款'
    : '品牌分布均匀';
  const dupLine = st.rawN && st.rawN > st.n
    ? '（库里另有 ' + (st.rawN - st.n) + ' 条同型号重复记录，配件页已合并成一条）'
    : '';
  return '本站收录 <b>' + st.n + ' 款' + esc(cat.name) + '</b>' + dupLine + '，' + brandLine +
    '，参考价 ' + fmtMoney(st.minP) + '–' + fmtMoney(st.maxP) + '，中位数 ' + fmtMoney(st.p50) + '。' +
    (s ? '按形态看，写得最多的是 ' + s + '。' : '');
}

function paraHow(cat, st, schema) {
  const f = schema && schema.cats && schema.cats[cat.id] ? (schema.cats[cat.id].fields || []) : [];
  /* schema 里的字段名是给结构化用的，「分辨率宽 / 分辨率高」这种对用户没有意义。
     同一前缀的两项合并成一项（分辨率），把字段名还原成人话。 */
  let axis = f.filter(x => x.r === 1).map(x => String(x.n));
  const out = [];
  axis.forEach(name => {
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      let n = 0;
      while (n < a.length && n < name.length && a[n] === name[n]) n++;
      if (n >= 3) { out[i] = a.slice(0, n); return; }
    }
    out.push(name);
  });
  axis = out.slice(0, 3);
  const specs = st.specs.slice(0, 4).map(x => '「' + x.k + '」' + x.c + ' 款').join('、');
  const head = axis.length
    ? '先看这 ' + axis.length + ' 项：<b>' + axis.map(esc).join(' / ') + '</b>（本站 schema 里的必填项）。'
    : '';
  return head + (specs ? '库里写进规格的前几位是 ' + specs + ' —— 这些写法就是实际在卖的档位。' : '') +
    '同一档位里差的是这几项，而不是宣传语。';
}

function paraPrice(cat, st) {
  const sA = (st.grades.S || 0) + (st.grades.A || 0);
  const pct = st.n ? Math.round(sA / st.n * 100) : 0;
  const parts = st.tiers.map(t =>
    t.tag + ' ' + fmtMoney(t.from === -Infinity ? st.minP : t.from) + '–' + fmtMoney(t.to === Infinity ? st.maxP : t.to) +
    ' 有 ' + t.n + ' 款（如 ' + esc(t.example.name) + '，' + fmtMoney(mid(t.example)) + '）'
  );
  return parts.join('；') + '。性价比评到 S/A 的 ' + sA + ' 款，占本类目 ' + pct + '%。';
}

function paraPit(cat, st) {
  if (!st.pitfalls.length) {
    return '这一类的备注里没有明显的限制句，取舍主要集中在上一段的参数上 —— 按参数挑，别按宣传语挑。';
  }
  return st.pitfalls.map(p => '「' + esc(p.from.name) + '」的备注里写着：' + esc(p.text) + '。').join(' ');
}

function paraBoundary(cat, st, ctx) {
  const sh = st.shared.slice(0, 1)[0];
  if (sh) {
    const other = (ctx.data.categories || []).find(c => c.id === sh.other) || { name: sh.other };
    return '「' + esc(sh.token) + '」这个词在' + esc(other.name) + '里也有 ' + sh.otherCount +
      ' 件写着 —— 搜它时本站把' + esc(cat.name) + '判为主体（' + sh.mineCount + ' 件），' + esc(other.name) +
      '排在后面；想只看一种，加一个本类目独有的词再搜。';
  }
  const tk = st.specs[0];
  if (!tk) return '本类目和其它品类没有共享的规格词，搜「' + esc(cat.name) + '」只会命中这 ' + st.n + ' 件。';
  return '本类目和其它品类没有共享的规格词：搜「' + esc(cat.name) + '」只会命中这 ' + st.n +
    ' 件，再收窄就加规格（如「' + esc(tk.k) + '」→ ' + tk.c + ' 件）。';
}

/* ---------- 组装 ---------- */
const GROUPS = [
  { id: 'core', title: '核心部件', desc: '装一台台式机，这八样决定性能上限与能不能装在一起。', cats: ['cpu', 'mobo', 'ram', 'gpu', 'ssd', 'psu', 'case', 'cooler'] },
  { id: 'periph', title: '外设与网络', desc: '看得见、摸得着的部分，也是最容易被参数忽悠的部分。', cats: ['monitor', 'input', 'earphone', 'audio', 'network', 'dock', 'stand'] },
  { id: 'mobile', title: '整机与移动', desc: '整台带走的东西，以及围着手机 / 平板长出来的一圈配件。', cats: ['laptop', 'phone', 'tablet', 'charger', 'mobileacc', 'wearable'] }
];

function buildSection(ctx) {
  const out = [];
  const catById = {};
  (ctx.data.categories || []).forEach(c => { catById[c.id] = c; });

  GROUPS.forEach(g => {
    out.push('        <h3 class="block-title reveal">' + g.title + '</h3>');
    out.push('        <p class="cat-group-desc reveal">' + g.desc + '</p>');
    out.push('        <div class="cat-grid">');
    g.cats.forEach(cid => {
      const items = (ctx.merged && ctx.merged[cid]) || ctx.models[cid] || [];
      const cat = catById[cid];
      if (!items.length || !cat) return;
      const st = statsOf(cid, items, ctx);
      st.rawN = (ctx.models[cid] || []).length;   // 原始条数：只用来解释「重复已合并」
      out.push(
        '          <article class="card cat-card reveal" data-cat="' + cid + '" id="cat-' + cid + '">' +
          '<div class="card-icon">' + cat.icon + '</div>' +
          '<h3 class="card-title">' + esc(cat.name) +
          '<span class="cat-count">' + st.n + ' 款 · ' + fmtMoney(st.minP) + '–' + fmtMoney(st.maxP) + '</span></h3>' +
          '<p class="cat-line"><strong>是什么 / 有多少：</strong>' + paraWhat(cat, st) + '</p>' +
          '<p class="cat-line"><strong>怎么选：</strong>' + paraHow(cat, st, ctx.schema) + '</p>' +
          '<p class="cat-line"><strong>价位分三档：</strong>' + paraPrice(cat, st) + '</p>' +
          '<p class="cat-line"><strong>要注意的地方（库里原文）：</strong>' + paraPit(cat, st) + '</p>' +
          '<p class="cat-line"><strong>别搜错：</strong>' + paraBoundary(cat, st, ctx) + '</p>' +
          '<p class="cat-links"><a href="accessories.html?cat=' + cid + '">看这 ' + st.n + ' 款型号 →</a></p>' +
          '</article>'
      );
    });
    out.push('        </div>');
  });
  return out.join('\n');
}

/* ---------- 写回 / 校验 ---------- */
function render(ctx) {
  return START + '\n' + buildSection(ctx) + '\n        ' + END;
}

function main() {
  const args = process.argv.slice(2);
  const ctx = loadData();
  const html = fs.readFileSync(GUIDE, 'utf8');

  if (args[0] === '--dump') {
    const cid = args[1];
    const items = (ctx.merged && ctx.merged[cid]) || ctx.models[cid] || [];
    const cat = (ctx.data.categories || []).find(c => c.id === cid);
    if (!items.length || !cat) { console.error('没有这个品类：' + cid); process.exit(2); }
    const st = statsOf(cid, items, ctx);
    st.rawN = (ctx.models[cid] || []).length;
    console.log('是什么 / 有多少：' + paraWhat(cat, st).replace(/<[^>]+>/g, ''));
    console.log('怎么选：' + paraHow(cat, st, ctx.schema).replace(/<[^>]+>/g, ''));
    console.log('价位分三档：' + paraPrice(cat, st).replace(/<[^>]+>/g, ''));
    console.log('要注意的地方（库里原文）：' + paraPit(cat, st));
    console.log('别搜错：' + paraBoundary(cat, st, ctx));
    console.log('--- 元数据：件数 ' + st.n + ' / 品牌 ' + st.brandTotal + ' / 价格 ' + st.minP + '–' + st.maxP +
      ' / 坑句 ' + st.pitfalls.length + ' / 共享规格词 ' + st.shared.length);
    return;
  }

  const want = render(ctx);
  if (args[0] === '--check') {
    if (html.indexOf(START) < 0 || html.indexOf(END) < 0) {
      console.error('guide.html 里找不到 GEN 标记'); process.exit(2);
    }
    const cur = html.slice(html.indexOf(START), html.indexOf(END) + END.length);
    if (cur === want) {
      console.log('PASS 品类内容与型号库同步（' + countCats(want) + ' 个品类）');
      process.exit(0);
    }
    console.log('FAIL 品类内容与型号库不同步 —— 改过型号库就要重跑 node tools/gen-category-content.cjs');
    process.exit(1);
  }

  if (html.indexOf(START) < 0 || html.indexOf(END) < 0) {
    console.error('guide.html 里找不到 GEN 标记，请先手工放好 <!-- GEN:hardware:start --> 与 <!-- GEN:hardware:end -->');
    process.exit(2);
  }
  const next = html.slice(0, html.indexOf(START)) + want + html.slice(html.indexOf(END) + END.length);
  if (next === html) { console.log('无变化（' + countCats(want) + ' 个品类）'); return; }
  fs.writeFileSync(GUIDE, next, 'utf8');
  console.log('已写回 guide.html：' + countCats(want) + ' 个品类，' + want.replace(/<[^>]+>/g, '').length + ' 字');
}

function countCats(s) {
  return (s.match(/class="card cat-card/g) || []).length;
}

main();

/* 内容生成闸 —— guide.html 的品类内容必须与型号库同步，且每一句都能被数据核对
 *
 * 跑法：node tests/content-gen.cjs
 *
 * 为什么有这道闸（ORD-31 任务 4 的自建闸）：
 *   内容生成器的风险不是「写不出来」，而是三种静默失效：
 *     ① 生成器坏了但没报错，GEN 区被写成空白 / 只剩标题 —— 页面看起来还在，内容没了；
 *     ② 型号库改了（增删型号、调价），guide 里的「N 款」「¥a–¥b」没跟着变 —— 页面在造假；
 *     ③ 款数口径与配件页不一致 —— guide 说 61 款，点进去只有 51 张卡，等于死承诺。
 *   这三种都不会让 test:user 变红（那套尺子不读 guide.html），所以必须单独盯着。
 *
 * 判据口径（G1–G8）：
 *   G1  GEN 标记成对且顺序正确（start 唯一、end 唯一、start 在 end 之前）
 *   G2  21 个品类一个不少、不多：GEN 区 data-cat 集合 === PC_DATA.categories ∩ PC_MODELS 非空
 *   G3  每张卡 5 段齐全且顺序正确：是什么/有多少 · 怎么选 · 价位分三档 · 要注意的地方 · 别搜错
 *   G4  每段正文 ≥ 40 字、整卡 ≥ 300 字（防塌缩成一句话；实测最小值见输出）
 *   G5  卡头「N 款」=== PCDup.mergeList(catId, PC_MODELS[catId]).length
 *       —— 与配件页同一个函数、同一个口径，这是「点进去数得到」的硬保证
 *   G6  卡头「¥a–¥b」=== 合并后条目的 min(price[0]) 与 max(price[1])
 *   G7  无脏输出：undefined / NaN / [object / null / 空 <b></b> / 空段
 *   G8  与生成器幂等：node tools/gen-category-content.cjs --check 必须 exit 0
 *
 * 反向对照（R1–R5）：把 GEN 区按已知方式打坏，断言**对应判据**必须变红。
 *   只断言「有 FAIL」是不够的 —— 那可能是别的判据红了，闸本身没在守它该守的东西。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GUIDE = path.join(ROOT, 'guide.html');
const START = '<!-- GEN:hardware:start -->';
const END = '<!-- GEN:hardware:end -->';
const FRAGS = ['是什么 / 有多少', '怎么选', '价位分三档', '要注意的地方', '别搜错'];
const MIN_PARA = 40;
const MIN_CARD = 300;

/* ---------- 读型号库（只读） ---------- */
function loadCtx() {
  const ctx = { window: {} };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  ['js/models-data.js', 'js/data.js', 'js/dup-core.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  });
  return ctx;
}

const stripTags = s => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const fmtMoney = v => '¥' + Math.round(v).toLocaleString('en-US');

/* ---------- 规格：库里应有的款数与价格 ---------- */
function buildSpec(ctx) {
  const models = ctx.window.PC_MODELS || {};
  const cats = (ctx.window.PC_DATA || {}).categories || [];
  const dup = ctx.PCDup;
  const spec = [];
  cats.forEach(c => {
    const arr = models[c.id] || [];
    if (!arr.length) return;
    const items = dup && dup.mergeList ? dup.mergeList(c.id, arr).map(x => x.item) : arr;
    const los = items.map(i => i.price[0]);
    const his = items.map(i => i.price[1]);
    spec.push({
      id: c.id,
      name: c.name,
      n: items.length,
      rawN: arr.length,
      minP: Math.min.apply(null, los),
      maxP: Math.max.apply(null, his)
    });
  });
  return spec;
}

/* ---------- 核心检查：把一段 HTML 判一遍，返回 fails ---------- */
function check(html, spec) {
  const fails = [];
  const push = (code, msg) => fails.push({ code, msg });

  /* G1 GEN 标记 */
  const sIdx = html.indexOf(START);
  const eIdx = html.indexOf(END);
  const sCnt = html.split(START).length - 1;
  const eCnt = html.split(END).length - 1;
  if (sCnt !== 1 || eCnt !== 1) {
    push('G1', 'GEN 标记数量不对（start ' + sCnt + ' 个 / end ' + eCnt + ' 个，应各 1 个）');
    return fails;
  }
  if (sIdx > eIdx) { push('G1', 'GEN 标记顺序反了（end 在 start 之前）'); return fails; }
  const region = html.slice(sIdx + START.length, eIdx);

  /* 解析卡片 */
  const re = /<article class="card cat-card[^"]*" data-cat="([a-z]+)" id="cat-[a-z]+">([\s\S]*?)<\/article>/g;
  const cards = [];
  let m;
  while ((m = re.exec(region))) cards.push({ id: m[1], body: m[2] });

  /* G2 品类齐全 */
  const wantIds = spec.map(x => x.id);
  const gotIds = cards.map(x => x.id);
  const miss = wantIds.filter(x => gotIds.indexOf(x) < 0);
  const extra = gotIds.filter(x => wantIds.indexOf(x) < 0);
  const dupIds = gotIds.filter((x, i) => gotIds.indexOf(x) !== i);
  if (miss.length) push('G2', '缺品类：' + miss.join(', '));
  if (extra.length) push('G2', '多出不存在的品类：' + extra.join(', '));
  if (dupIds.length) push('G2', '品类重复出现：' + dupIds.join(', '));
  if (!miss.length && !extra.length && !dupIds.length) {
    push('G2:ok', '21 个品类齐全（' + gotIds.length + ' 张卡，与型号库一致）');
  }

  /* 逐卡检查 G3–G7 */
  const stat = { minCard: Infinity, minPara: Infinity, minCardId: '', minParaId: '' };
  cards.forEach(card => {
    const sp = spec.find(x => x.id === card.id);
    const name = (sp && sp.name) || card.id;

    /* G3 五段齐全 + 顺序（判据用前缀匹配：卡头写的是「是什么 / 有多少：」，带全角冒号） */
    const titles = [];
    const tre = /<p class="cat-line"><strong>([^<]+)<\/strong>/g;
    let t;
    while ((t = tre.exec(card.body))) titles.push(t[1]);
    const bad = FRAGS.filter(f => !titles.some(x => x.indexOf(f) === 0));
    if (bad.length) push('G3', name + ' 缺段落：' + bad.join(' / '));
    else {
      const seq = titles.map(x => FRAGS.filter(f => x.indexOf(f) === 0)[0]).join('|');
      if (seq !== FRAGS.join('|')) push('G3', name + ' 五段顺序不对：' + titles.join(' / '));
    }

    /* G3b 段落内容不能为空 */
    const bodyRe = /<p class="cat-line"><strong>([^<]+)<\/strong>([\s\S]*?)<\/p>/g;
    let b;
    while ((b = bodyRe.exec(card.body))) {
      const txt = stripTags(b[2]);
      if (txt.length < MIN_PARA) {
        push('G3', name + ' 的「' + b[1] + '」只有 ' + txt.length + ' 字（下限 ' + MIN_PARA + '）');
      }
      if (txt.length < stat.minPara) { stat.minPara = txt.length; stat.minParaId = name + '/' + b[1]; }
    }

    /* G4 整卡字数 */
    const plain = stripTags(card.body);
    if (plain.length < MIN_CARD) {
      push('G4', name + ' 整卡只有 ' + plain.length + ' 字（下限 ' + MIN_CARD + '）');
    }
    if (plain.length < stat.minCard) { stat.minCard = plain.length; stat.minCardId = name; }

    if (!sp) return;

    /* G5 款数口径 */
    const cm = card.body.match(/class="cat-count">(\d+) 款 · ¥([\d,]+)–¥([\d,]+)</);
    if (!cm) { push('G5', name + ' 卡头没有「N 款 · ¥a–¥b」'); return; }
    const shownN = parseInt(cm[1], 10);
    if (shownN !== sp.n) {
      push('G5', name + ' 卡头写 ' + shownN + ' 款，配件页实际 ' + sp.n + ' 张卡' +
        (sp.rawN !== sp.n ? '（库 ' + sp.rawN + ' 条含重复 ' + (sp.rawN - sp.n) + '）' : ''));
    }
    const wantTitle = '看这 ' + sp.n + ' 款型号';
    if (card.body.indexOf(wantTitle) < 0) {
      push('G5', name + ' 的「看这 N 款型号 →」链接数字与款数不一致');
    }

    /* G6 价格区间 */
    const shownLo = parseInt(cm[2].replace(/,/g, ''), 10);
    const shownHi = parseInt(cm[3].replace(/,/g, ''), 10);
    if (shownLo !== sp.minP || shownHi !== sp.maxP) {
      push('G6', name + ' 卡头写 ' + fmtMoney(shownLo) + '–' + fmtMoney(shownHi) +
        '，库里是 ' + fmtMoney(sp.minP) + '–' + fmtMoney(sp.maxP));
    }

    /* G7 脏输出 */
    const dirty = ['undefined', 'NaN', '[object', '&lt;b&gt;&lt;/b&gt;', '<b></b>', 'null 款', '{}'];
    dirty.forEach(d => {
      if (card.body.indexOf(d) > -1) push('G7', name + ' 里出现脏输出「' + d + '」');
    });
  });

  /* 只在「没有任何真 FAIL」时补 ok 行（G2:ok 也是走 push 的，不能用 fails.length 判空） */
  if (!fails.some(f => !/:ok$/.test(f.code))) {
    push('G4:ok', '每卡 ≥ ' + MIN_CARD + ' 字（最薄 ' + stat.minCard + ' 字：' + stat.minCardId +
      '；最短段落 ' + stat.minPara + ' 字：' + stat.minParaId + '）');
    push('G5:ok', '款数与配件页合并口径一致（' + cards.length + ' 个品类逐一对账）');
    push('G6:ok', '卡头价格区间与型号库一致（' + cards.length + ' 个品类逐一对账）');
    push('G7:ok', '无 undefined / NaN / [object / 空段');
  }
  return fails;
}

/* ---------- 主流程 ---------- */
const ctx = loadCtx();
const spec = buildSpec(ctx);
const html = fs.readFileSync(GUIDE, 'utf8');
const fails = check(html, spec);

const report = [];
const badCodes = {};
fails.forEach(f => { if (!/:ok$/.test(f.code)) badCodes[f.code] = 1; });

fails.forEach(f => report.push('  ' + (/:ok$/.test(f.code) ? 'PASS ' : 'FAIL ') + f.code.replace(':ok', '') + ' ' + f.msg));

/* 总字数（GEN 区可见正文） */
const sIdx = html.indexOf(START), eIdx = html.indexOf(END);
const regionTxt = sIdx > -1 && eIdx > sIdx ? stripTags(html.slice(sIdx, eIdx)) : '';
const totalChars = regionTxt.length;

/* G8 生成器幂等 */
const g8 = spawnSync(process.execPath, [path.join(ROOT, 'tools/gen-category-content.cjs'), '--check'], {
  cwd: ROOT, encoding: 'utf8'
});
const g8ok = g8.status === 0;
report.push('  ' + (g8ok ? 'PASS' : 'FAIL') + ' G8 与生成器同步（--check 幂等）' +
  (g8ok ? '' : ' :: ' + String(g8.stdout || g8.stderr).trim().split('\n').slice(-2).join(' ')));
if (!g8ok) badCodes.G8 = 1;

/* 反向对照：把 GEN 区按已知方式打坏，对应判据必须变红 */
function mutate(htmlText, fn) {
  const a = htmlText.indexOf(START), b = htmlText.indexOf(END);
  const region = htmlText.slice(a, b + END.length);
  return htmlText.slice(0, a) + fn(region) + htmlText.slice(b + END.length);
}
const cases = [
  {
    name: 'R1 把 GEN 区清空', code: 'G2',
    text: mutate(html, () => START + '\n' + END)
  },
  {
    name: 'R2 删掉 CPU 那张卡', code: 'G2',
    text: mutate(html, r => r.replace(/<article class="card cat-card[^"]*" data-cat="cpu"[\s\S]*?<\/article>/, ''))
  },
  {
    name: 'R3 把一个款数改大（51 → 99）', code: 'G5',
    text: mutate(html, r => r.replace(/class="cat-count">\d+ 款/, 'class="cat-count">99 款'))
  },
  {
    name: 'R4 把一张卡的正文压成一句话', code: 'G4',
    text: mutate(html, r => r.replace(
      /(<article class="card cat-card[^"]*" data-cat="cpu"[\s\S]*?<h3 class="card-title">)[\s\S]*?<\/p><p class="cat-links">/,
      '$1CPU</h3><p class="cat-line"><strong>怎么选</strong>短</p><p class="cat-links">'))
  },
  {
    name: 'R5 注入一个 undefined', code: 'G7',
    text: mutate(html, r => r.replace('本站收录', '本站收录 undefined'))
  }
];
cases.forEach(c => {
  const got = check(c.text, spec);
  const hit = got.some(f => f.code === c.code && !/:ok$/.test(f.code));
  report.push('  ' + (hit ? 'PASS' : 'FAIL') + ' ' + c.name + ' → ' + c.code + ' 应该变红' +
    (hit ? '' : '（实际没红；变红的判据：' + (got.map(f => f.code).join(',') || '无') + '）'));
  if (!hit) badCodes['R'] = 1;
});

console.log('== 内容生成闸 · guide.html 品类内容与型号库同步 ==');
console.log('  GEN 区字数 ' + totalChars + '（' + report.length + ' 项判据）');
report.forEach(l => console.log(l));

const passN = report.filter(l => / PASS /.test(l)).length;
const failN = report.filter(l => / FAIL /.test(l)).length;
console.log('');
console.log('结果：PASS ' + passN + ' / FAIL ' + failN);
console.log('（本闸守「生成的内容还在、还对、还数得清」；G5 是核心：guide 的款数必须等于配件页实际卡数）');
process.exit(failN === 0 ? 0 : 1);

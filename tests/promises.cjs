/* 承诺兑现闸 —— 站上说的每一句功能承诺，都必须真的存在
 *
 * 跑法：node E:/AI/pc-guide-site/tests/promises.cjs
 * 退出码：任一条未兑现 → exit 1
 *
 * 为什么有这个文件：
 *   2026-10-27 总控自评发现 —— 「预算适配器」被 7 处文案宣传
 *   （index.html×2 · plans.html×3 · 404.html · data.js 注释），
 *   而 initBudgetTool() 的完整可用代码就在 js/recommend.js:3253，
 *   只差 4 个 DOM 挂载点（#budgetInput / #budgetChips / #budgetUse / #budgetResult），
 *   这 4 个 id 在 7 个 HTML 里 grep 零命中 —— **功能代码写了，从未挂载**。
 *   这是「宣传 > 实现」的典型：文案在替一个不存在的东西背书。
 *
 *   本闸的判据：**页面上承诺的功能，必须能在代码里找到它真实生效的证据。**
 *   只看文案里有没有这个词 = 恒真。所以每条承诺都绑定一个「生效证据」检查。
 *
 * 归属：总控 + 审计改，执行者只读（同 user-tasks.cjs 的纪律）。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTMLS = ['index.html', 'guide.html', 'accessories.html', 'plans.html', 'smart.html', 'faq.html', 'looks.html', '404.html'];

let pass = 0, fail = 0;
const chk = (name, cond, actual) => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} :: ${JSON.stringify(actual)}`); }
};

const allHtml = HTMLS.map(f => {
  const p = path.join(ROOT, f);
  return fs.existsSync(p) ? { f, s: fs.readFileSync(p, 'utf8') } : null;
}).filter(Boolean);
const allJs = ['js/recommend.js', 'js/main.js', 'js/data.js', 'js/ai.js']
  .map(f => {
    const p = path.join(ROOT, f);
    return fs.existsSync(p) ? { f, s: fs.readFileSync(p, 'utf8') } : null;
  }).filter(Boolean);

const htmlText = allHtml.map(x => x.s).join('\n');
const jsText = allJs.map(x => x.s).join('\n');

console.log('== 承诺兑现闸：页面上说的功能，代码里必须真的存在 ==');

/* ---------- 1. 「预算适配器」：文案 7 处，功能代码在，DOM 挂载点缺 ---------- */
{
  const claimed = (htmlText.match(/预算[^，。、）\n]{0,6}适配器/g) || []).length;
  const hasCode = /function initBudgetTool/.test(jsText);
  /* 生效证据：initBudgetTool 依赖的 4 个 DOM 挂载点必须真的存在 */
  const mounts = ['budgetInput', 'budgetChips', 'budgetUse', 'budgetResult'];
  const missing = mounts.filter(id => !htmlText.includes('id="' + id + '"'));
  chk('P1「预算适配器」承诺已兑现（文案/代码/DOM 挂载点三者齐备）',
    claimed === 0 || (hasCode && missing.length === 0),
    { 文案出现次数: claimed, 有功能代码: hasCode, 缺失的挂载点: missing });
}

/* ---------- 2. 站内链接的目标必须存在（死链 / 死锚点） ---------- */
{
  const dead = [];
  const linkRe = /href="([^"#?]+)\.html(?:#([^"]*))?"/g;
  const seen = new Set();
  for (const { f, s } of allHtml) {
    let m;
    while ((m = linkRe.exec(s))) {
      const target = m[1] + '.html';
      const anchor = m[2];
      /* 只查站内相对链接 —— 外链（http/https/协议相对）不归本闸管 */
      if (/^(https?:)?\/\//.test(m[1]) || m[1].startsWith('//')) continue;
      const key = f + '→' + target + (anchor ? '#' + anchor : '');
      if (seen.has(key)) continue;
      seen.add(key);
      if (!fs.existsSync(path.join(ROOT, target))) {
        dead.push(key + '（目标文件不存在）');
        continue;
      }
      if (anchor) {
        /* 锚点必须在目标文件里存在 —— 动态渲染的 id 也要算，所以先查静态再查 JS 模板 */
        const ts = fs.readFileSync(path.join(ROOT, target), 'utf8');
        const inHtml = ts.includes('id="' + anchor + '"');
        const inJs = jsText.includes('"' + anchor + '"') || jsText.includes("'" + anchor + "'");
        if (!inHtml && !inJs) dead.push(key + '（锚点不存在）');
      }
    }
  }
  chk('P2 站内链接与锚点全部可达（无死链/死锚点）', dead.length === 0, { 死链: dead });
}

/* ---------- 3. 每个对外承诺的功能，都要有可验证的生效证据 ---------- */
{
  /* [承诺文案, 生效证据：必须能在代码里找到实现标记] */
  const PROMISES = [
    ['智能推荐', /function initSmart|renderQuizSet/],
    ['AI 助手', /\/api\/chat/],
    ['预算适配器', /function initBudgetTool/],
    ['性价比 TOP 榜单', /topList|initTopList/],
    ['搭配计划', /plansWrap|renderPlan/],
    ['颜值外观', /looks/],
  ];
  const missing = [];
  for (const [label, re] of PROMISES) {
    const claimed = new RegExp(label).test(htmlText);
    if (claimed && !re.test(jsText)) missing.push(label);
  }
  chk('P3 每个对外承诺的功能都有实现标记', missing.length === 0, { 缺实现的承诺: missing });
}

/* ---------- 4. 导航项必须存在于每一页（含 looks.html 是否可达） ---------- */
{
  const NAV = ['首页', '使用指南', '配件与榜单', '搭配计划', '智能推荐', '常见问题'];
  const perPage = [];
  for (const { f, s } of allHtml) {
    const miss = NAV.filter(n => !s.includes('>' + n + '</a>'));
    if (miss.length) perPage.push(f + ' 缺: ' + miss.join(','));
  }
  chk('P4 导航 6 项在所有页面都存在', perPage.length === 0, { 异常页面: perPage });

  /* looks.html 有内容但不在导航里 —— 记为「不可发现」，单列 */
  const looks = allHtml.find(x => x.f === 'looks.html');
  if (looks) {
    const inNav = /nav-link[^>]*>[^<]*颜值/.test(looks.s) || NAV.some(n => looks.s.includes('href="looks.html"'));
    const linkedFrom = allHtml.filter(x => x.f !== 'looks.html' && x.s.includes('href="looks.html"'));
    chk('P5 存在独立内容的页面（如 looks.html）至少有一个入口',
      inNav || linkedFrom.length > 0,
      { 'looks 在导航里': inNav, '从其他页链接过来': linkedFrom.map(x => x.f) });
  }
}

/* ---------- 5. 死代码检测：定义了但从未调用的 init* 函数 ---------- */
{
  const dead = [];
  const fnRe = /function (init[A-Za-z]+)\s*\(/g;
  let m;
  const jsFiles = allJs.map(x => x.s).join('\n');
  while ((m = fnRe.exec(jsFiles))) {
    const name = m[1];
    const uses = (jsFiles.match(new RegExp('\\b' + name + '\\s*\\(', 'g')) || []).length;
    if (uses <= 1) dead.push(name);
  }
  chk('P6 没有「定义了但从未调用」的 init* 函数（死代码）', dead.length === 0, { 死函数: dead });
}

console.log(`\n结果：PASS ${pass} / FAIL ${fail}`);
console.log('（本闸管「说到的做到了吗」—— 承诺兑现；与 user-tasks.cjs 的「用起来对吗」互补）');
process.exit(fail > 0 ? 1 : 0);

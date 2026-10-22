/* ORD-14 第 1 批验收闸：schema 接线 + 搜索硬字段优先
 *
 * 判据来自 ORD-14 的 A1~A4 / A6。A5（其余闸全绿）由 npm run test:all 承担，本文件不重复跑。
 *
 * ORD-17 修正两处（A1 原来只验了 ssd 那一侧）：
 *   A1c  原来是「rank=1 且 cat=ssd 的条数 === rank=1 的 ssd 条数」，恒真。
 *        改为盯「rank=1 的非 ssd 品类 ≤ 4 条」——搜 M.2 时 57 块主板靠 specs 里的
 *        「1×M.2 插槽」抢占了主体层，正是这条要拦的。
 *   A1d  新增用户视角：首屏前 8 张卡里 ssd 至少 6 张。分组顺序写死品类顺序时，
 *        条目口径排对了用户看到的还是主板。
 *
 * 为什么要读 window.PCRecoDiag 而不是只数 DOM：
 *   页面有 49 组重复合并（1209 条 → 1160 张卡），搜「M.2」时 44 块 M.2 固态里
 *   有几块被并进一张卡，数 DOM 只会得到 43，A1 会被判成失败 —— 而代码其实是对的。
 *   所以本闸同时报「条目口径」（diag，与渲染同一份 matchRank）和「卡片口径」（DOM），
 *   判据一律用条目口径，卡片口径只用于说明用户实际看到的张数。
 *
 * 跑法：
 *   NODE_PATH=".../node_modules" node tests/specs-wire.cjs
 *   无 jsdom 时降级为「只跑数据层 + schema + 覆盖率」，搜索类断言标 SKIP。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const S = ROOT + path.sep;

let pass = 0, fail = 0, skip = 0;
const fails = [];

function ok(name, cond, detail) {
  if (cond) { pass++; console.log('PASS ' + name + (detail ? ' :: ' + detail : '')); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + ' :: ' + detail); }
}
function sk(name, why) { skip++; console.log('SKIP ' + name + ' :: ' + why); }

/* ---------- 数据层：直接读 js/models-data.js ---------- */
function loadModels() {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(S + 'js/models-data.js', 'utf8'), c);
  return c.window.PC_MODELS;
}
function loadSchema() {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(S + 'js/specs-schema.js', 'utf8'), c);
  return c.window.PC_SCHEMA;
}

(async () => {
  const M = loadModels();
  const SCH = loadSchema();

  /* ---------- A4：schema 自校验 ---------- */
  const sm = SCH.summary();
  const fields = sm.reduce((a, r) => a + r.fields, 0);
  const required = sm.reduce((a, r) => a + r.required, 0);
  ok('A4a schema 自校验 0 错误', SCH.errors.length === 0, JSON.stringify(SCH.errors));
  ok('A4b 字段数 260', fields === 260, '实测 ' + fields);
  ok('A4c 必填 128', required === 128, '实测 ' + required);
  ok('A4d 21 品类', sm.length === 21, '实测 ' + sm.length);
  ok('A4e schema 状态已接线', SCH.STATUS === 'wired', 'STATUS=' + SCH.STATUS);

  /* ---------- A1/A2/A3 的条目口径：页内 diag ---------- */
  /* ---------- A6：dry-run 覆盖率不得倒退 ----------
     必须现场跑一遍 dry-run 再读结果：读旧 JSON 等于拿上轮的数字给本轮背书。 */
  {
    const { execFileSync } = require('child_process');
    execFileSync(process.execPath, [path.join(ROOT, 'tools', 'schema-dryrun.cjs')],
      { cwd: ROOT, stdio: 'ignore' });
    const cov = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'specs-parse-coverage.json'), 'utf8'));
    let hit = 0, total = 0;
    Object.keys(cov).forEach(k => {
      if (typeof cov[k].hit === 'number' && cov[k].total) { hit += cov[k].hit; total += cov[k].total; }
    });
    const pct = hit / total * 100;
    ok('A6 dry-run 覆盖率 ≥ 38.9%', pct >= 38.9,
      hit + '/' + total + ' = ' + pct.toFixed(2) + '%');
  }

  const ssd = M.ssd || [];
  const m2Items = ssd.filter(i => i.specsObj && i.specsObj.form === 'M.2');
  const sataItems = ssd.filter(i => i.specsObj && i.specsObj.iface === 'SATA');
  const hddItems = ssd.filter(i => i.specsObj && i.specsObj.kind === 'HDD');

  /* 数据层先自证一遍：这三组是 A1~A3 的期望值来源，期望值本身不能靠手数 */
  ok('数据层 ssd 共 53 条', ssd.length === 53, '实测 ' + ssd.length);
  ok('数据层 form=M.2 恰 44 条', m2Items.length === 44, '实测 ' + m2Items.length);
  ok('数据层 iface=SATA 恰 6 条（3 SSD + 3 HDD）',
    sataItems.length === 6 &&
    sataItems.filter(i => i.specsObj.kind === 'SSD').length === 3 &&
    sataItems.filter(i => i.specsObj.kind === 'HDD').length === 3,
    sataItems.map(i => i.id + ':' + i.specsObj.kind).join(', '));
  ok('数据层 kind=HDD 恰 3 条', hddItems.length === 3, hddItems.map(i => i.id).join(', '));
  ok('ssd 全部带 specsObj', ssd.every(i => i.specsObj && Object.keys(i.specsObj).length > 0),
    ssd.filter(i => !i.specsObj).length + ' 条缺失');
  ok('specs 原串未被删除', ssd.every(i => typeof i.specs === 'string' && i.specs.length > 0),
    '空串 ' + ssd.filter(i => !i.specs).length + ' 条');

  /* ---------- 起 UI ---------- */
  let jsdom = null;
  try { jsdom = require('jsdom'); } catch (e) { jsdom = null; }

  if (!jsdom) {
    sk('A1 搜「M.2」主体命中 44', '无 jsdom');
    sk('A1d 搜「M.2」首屏前 8 张卡 ssd ≥ 6', '无 jsdom');
    sk('A2 搜「SATA」命中 6', '无 jsdom');
    sk('A3 搜「机械硬盘」命中 3', '无 jsdom');
    sk('软层未丢（5070 Ti）', '无 jsdom');
    report();
    return;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const dom = await jsdom.JSDOM.fromFile(S + 'accessories.html', {
    runScripts: 'dangerously', resources: 'usable',
    beforeParse(w) {
      w.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    }
  });
  await sleep(4000);
  const W = dom.window, D = W.document;

  if (!W.PCRecoDiag) {
    ok('页面暴露 PCRecoDiag', false, 'window.PCRecoDiag 不存在，无法取条目口径');
    report();
    return;
  }
  ok('页面已加载 PC_SCHEMA', !!(W.PC_SCHEMA && W.PC_SCHEMA.cats), 'STATUS=' + (W.PC_SCHEMA && W.PC_SCHEMA.STATUS));

  const q = W.PCRecoDiag.rank;

  /* A1：M.2 */
  const r1 = q('M.2');
  const r1ssd = r1.filter(x => x.cat === 'ssd');
  const r1main = r1ssd.filter(x => x.rank === 1);
  const m2Ids = new Set(m2Items.map(i => i.id));
  ok('A1a 搜「M.2」ssd 主体命中 44', r1main.length === 44, '实测 ' + r1main.length);
  ok('A1b 这 44 条覆盖率 44/44', r1main.filter(x => m2Ids.has(x.id)).length === 44,
    '未覆盖 ' + r1main.filter(x => !m2Ids.has(x.id)).map(x => x.id).join(','));
  /* A1c 原来写的是「rank=1 且 cat=ssd 的条数 === rank=1 的 ssd 条数」—— 恒真，等于没断言。
     ORD-17 实测：搜 M.2 时 rank=1 里还有 57 块主板（specs 写着「1×M.2 插槽」）+ 1 个 M.2 硬盘盒，
     用户第一眼看到的主板比固态还多。改判为「rank=1 的非 ssd 品类不得多于 4 条」，
     盯住的是「主体层被别的品类占满」这个真实症状，而不是自己和自己比。 */
  const r1rank1 = r1.filter(x => x.rank === 1);
  const r1dist = byCat(r1rank1);
  const r1non = r1rank1.filter(x => x.cat !== 'ssd').length;
  ok('A1c 搜「M.2」rank=1 里非 ssd 品类 ≤ 4 条', r1non <= 4,
    'rank=1 品类分布 ' + JSON.stringify(r1dist) + '，非 ssd ' + r1non + ' 条');

  /* A2：SATA */
  const r2 = q('SATA').filter(x => x.cat === 'ssd' && x.rank === 1);
  const r2kind = {};
  r2.forEach(x => {
    const it = ssd.find(i => i.id === x.id);
    const k = it && it.specsObj ? it.specsObj.kind : '?';
    r2kind[k] = (r2kind[k] || 0) + 1;
  });
  ok('A2a 搜「SATA」命中 6 条 ssd', r2.length === 6, '实测 ' + r2.length);
  ok('A2b 其中 3 SSD + 3 HDD', r2kind.SSD === 3 && r2kind.HDD === 3, JSON.stringify(r2kind));
  console.log('     逐条：' + r2.map(x => x.id + '/' + x.name + '=' + (ssd.find(i => i.id === x.id).specsObj.kind)).join(' | '));

  /* A3：机械硬盘 */
  const r3 = q('机械硬盘').filter(x => x.cat === 'ssd');
  const r3main = r3.filter(x => x.rank === 1);
  const r3ids = r3main.map(x => x.id).sort();
  ok('A3a 搜「机械硬盘」主体命中恰 3 条', r3main.length === 3, '实测 ' + r3main.length + ' → ' + r3ids.join(','));
  ok('A3b 就是 sd24/sd25/sd26', r3ids.join(',') === 'sd24,sd25,sd26', r3ids.join(','));
  ok('A3c 主体层 0 块 M.2 误命中',
    r3main.every(x => !m2Ids.has(x.id)), '误命中 ' + r3main.filter(x => m2Ids.has(x.id)).map(x => x.id).join(','));
  const r3soft = r3.filter(x => x.rank === 3);
  console.log('     软层（compat 里提到机械盘做冷备）：' + (r3soft.map(x => x.id).join(',') || '无'));

  /* 软层没被吃掉：型号词必须仍有软命中，否则「分层」退化成「只搜硬字段」 */
  const r4 = q('5070 Ti');
  const r4soft = r4.filter(x => x.rank === 3).length;
  ok('软层未被干掉（5070 Ti 仍有软命中）', r4soft > 0, '软命中 ' + r4soft + ' 条 / 共 ' + r4.length);

  /* 切词：机械硬盘 必须是一个整体 token，否则会被拆成「机械」+「硬盘」 */
  const seg = W.PCRecoDiag.segment('机械硬盘');
  ok('「机械硬盘」整体切词', seg.length === 1 && seg[0] === '机械硬盘', JSON.stringify(seg));

  /* ---------- 卡片口径（用户实际看到多少张） ---------- */
  const el = D.getElementById('accSearch');

  /* A1d：真正的用户视角 —— 首屏前 8 张卡是什么。
     条目口径排对了不等于用户看到的就是对的：分组顺序原来写死在 D.categories 里，
     搜「M.2」时 mobo 组整组排在 ssd 组前面，前 8 张卡全是主板（ORD-17 缺陷 2 的现场）。
     这条断言盯的正是「用户第一眼看到的东西」。 */
  async function firstCards(term, n) {
    el.value = term;
    el.dispatchEvent(new W.Event('input', { bubbles: true }));
    await sleep(500);
    return [...D.querySelectorAll('.acc-card')].slice(0, n).map(c => {
      const g = c.closest('.acc-group');
      return {
        cat: g ? g.getAttribute('data-cat') : '?',
        name: (c.querySelector('.acc-name') || {}).textContent || ''
      };
    });
  }
  const f8 = await firstCards('M.2', 8);
  const f8d = byCat(f8);
  ok('A1d 搜「M.2」首屏前 8 张卡里 ssd ≥ 6 张', (f8d.ssd || 0) >= 6,
    '前 8 张品类分布 ' + JSON.stringify(f8d));
  console.log('     前 8 张：' + f8.map(x => x.cat + '/' + x.name).join(' | '));

  async function cards(term) {
    el.value = term;
    el.dispatchEvent(new W.Event('input', { bubbles: true }));
    await sleep(450);
    const first = [...D.querySelectorAll('.acc-group')].reduce((a, g) => a + g.querySelectorAll('.acc-card').length, 0);
    for (let i = 0; i < 10; i++) {
      const btns = [...D.querySelectorAll('.acc-group-more')];
      if (!btns.length) break;
      btns.forEach(b => b.dispatchEvent(new W.MouseEvent('click', { bubbles: true })));
      await sleep(120);
    }
    const all = [...D.querySelectorAll('.acc-group')].reduce((a, g) => a + g.querySelectorAll('.acc-card').length, 0);
    return { first, all };
  }
  for (const t of ['M.2', 'SATA', '机械硬盘']) {
    const c = await cards(t);
    console.log('     卡片口径「' + t + '」：首屏 ' + c.first + ' 张 / 展开后 ' + c.all + ' 张');
  }

  dom.window.close();
  report();

  function byCat(list) {
    const o = {};
    list.forEach(x => { o[x.cat] = (o[x.cat] || 0) + 1; });
    return o;
  }
  function report() {
    console.log('');
    console.log('结果：PASS ' + pass + ' / FAIL ' + fail + (skip ? ' / SKIP ' + skip : ''));
    if (fail) { console.log('失败项：' + fails.join(' | ')); process.exit(1); }
  }
})();

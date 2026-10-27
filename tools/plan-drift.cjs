/* 漂移闸 —— 配置单行改动了，「目标价 → 选件 → 兼容性」三段必须重验
 *
 * 为什么需要它（ORD-29 任务 7）：
 *   审计在 ORD-26/28 的跨线传导清单第 1 条里指出：
 *   「改配置单行 → 改目标价 → 改选件 → 改兼容性」是一条**改一行文本、
 *   静默改四个行为**的链。而配置单恰恰是最常被改的东西（跟行情更新）。
 *
 *   已发生的实证：ORD-21 修了目标价串味之后，
 *   t3000 恰好修对了，但 t4500 仍然错（DDR5 主板 + DDR4 内存）。
 *   —— 「改了 A 就以为 B 也好了」是真实发生过的。
 *
 * 判据：
 *   1. 基线（tools/plan-drift-baseline.json）里每条「配置单行」的
 *      原文与价格文本，必须与当前 js/data.js 一致。
 *      不一致 = 配置单行被改了 → 必须重跑三段验证 → 必须显式 accept。
 *   2. 「显式 accept」= 用 --accept <planId>:<part> 把该行的新指纹写回基线，
 *      并在基线文件的 _accepts 数组里留痕（谁、什么时候、diff 是什么）。
 *   3. 没有 --accept 就改了 → FAIL。
 *   4. 基线里没有的新行（新增配置单行）→ FAIL（不许偷偷加行）。
 *
 * 跑法：
 *   node tools/plan-drift.cjs --check    只查，不改基线（退出码 1 = 有漂移）
 *   node tools/plan-drift.cjs --report   查并打印逐行 diff（人看）
 *   node tools/plan-drift.cjs --accept <planId>:<part>   接受某行的漂移并留痕
 *   node tools/plan-drift.cjs --rebuild  按当前数据重建基线（需审计复核后才可用）
 *
 * 归属：总控 + 审计改，执行者只读。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_PATH = path.join(__dirname, 'plan-drift-baseline.json');

let pass = 0, fail = 0;
const chk = (name, cond, actual) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + ' :: ' + JSON.stringify(actual)); }
};

/* ---------- 读当前配置单 ---------- */
function loadPlans() {
  const ctx = { window: {}, console: console };
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8'), ctx);
  const D = ctx.window.PC_DATA;
  return D.plans || [];
}

const vm = require('vm');

/* ---------- 读基线 ---------- */
let base = null;
try {
  base = JSON.parse(fs.readFileSync(BASE_PATH, 'utf8'));
} catch (e) {
  console.error('  FAIL 读不到基线文件 tools/plan-drift-baseline.json :: ' + e.message);
  console.error('       用 --rebuild 生成，但需审计复核后才可使用。');
  process.exit(1);
}

const baseRows = base._rows || [];
const accepts = base._accepts || [];

const args = process.argv.slice(2);
const mode = args[0] || '--check';

/* ---------- 指纹：配置单行的「原文 + 价格」 ---------- */
function fingerprint(plan, part) {
  const row = (plan.parts || []).find(function (r) { return r[0] === part; });
  if (!row) return null;
  return { config: String(row[1] || ''), price: String(row[2] || '') };
}

/* ---------- 当前数据 ---------- */
const plans = loadPlans();
const planById = {};
plans.forEach(function (p) { planById[p.id] = p; });

/* 建当前指纹表 */
const curRows = [];
plans.forEach(function (p) {
  (p.parts || []).forEach(function (row) {
    const fp = fingerprint(p, row[0]);
    if (fp) curRows.push({ plan: p.id, part: row[0], config: fp.config, price: fp.price });
  });
});

const curKey = function (r) { return r.plan + '::' + r.part; };
const curMap = {};
curRows.forEach(function (r) { curMap[curKey(r)] = r; });
const baseMap = {};
baseRows.forEach(function (r) { baseMap[curKey(r)] = r; });

/* ---------- accept 处理 ---------- */
if (mode === '--accept') {
  const target = args[1];
  if (!target || target.indexOf(':') === -1) {
    console.error('用法：node tools/plan-drift.cjs --accept <planId>:<part>');
    process.exit(2);
  }
  const pid = target.split(':')[0];
  const part = target.slice(pid.length + 1);
  const cur = curMap[pid + '::' + part];
  if (!cur) {
    console.error('找不到配置单行：' + target);
    process.exit(2);
  }
  const old = baseMap[pid + '::' + part];
  const idx = baseRows.findIndex(function (r) { return r.plan === pid && r.part === part; });
  const rec = {
    plan: pid,
    part: part,
    at: new Date().toISOString(),
    diff: old
      ? { config: [old.config, cur.config], price: [old.price, cur.price] }
      : { config: [null, cur.config], price: [null, cur.price] },
    note: '已接受漂移。三段验证（目标价 → 选件 → 兼容性）须由审计复核。'
  };
  if (idx >= 0) baseRows[idx] = { plan: pid, part: part, config: cur.config, price: cur.price };
  else baseRows.push({ plan: pid, part: part, config: cur.config, price: cur.price });
  accepts.push(rec);
  base._accepts = accepts;
  fs.writeFileSync(BASE_PATH, JSON.stringify(base, null, 1) + '\n');
  console.log('  已接受漂移：' + target);
  console.log('  留痕：' + JSON.stringify(rec.diff));
  console.log('  注意：三段验证（目标价 → 选件 → 兼容性）必须由审计复核后，');
  console.log('        才算这次改动被认可。本命令只更新指纹，不做任何验证。');
  process.exit(0);
}

/* ---------- --rebuild ---------- */
if (mode === '--rebuild') {
  base._rows = curRows;
  base._accepts = [];
  base._rebuiltAt = new Date().toISOString();
  fs.writeFileSync(BASE_PATH, JSON.stringify(base, null, 1) + '\n');
  console.log('  基线已按当前数据重建（' + curRows.length + ' 行）。需审计复核后才可使用。');
  process.exit(0);
}

/* ---------- 比对 ---------- */
const drift = [];
const missing = [];
const added = [];

baseRows.forEach(function (r) {
  const k = curKey(r);
  const cur = curMap[k];
  if (!cur) { missing.push(k); return; }
  if (cur.config !== r.config || cur.price !== r.price) {
    drift.push({
      plan: r.plan, part: r.part,
      config: [r.config, cur.config],
      price: [r.price, cur.price]
    });
  }
});

curRows.forEach(function (r) {
  if (!baseMap[curKey(r)]) added.push(curKey(r));
});

if (mode === '--report') {
  console.log('== 漂移闸 · 逐行 diff ==');
  console.log('  基线行数 ' + baseRows.length + ' · 当前行数 ' + curRows.length);
  drift.forEach(function (d) {
    console.log('  ▸ ' + d.plan + ' / ' + d.part);
    console.log('    原文: ' + d.config[0] + '  →  ' + d.config[1]);
    console.log('    价格: ' + d.price[0] + '  →  ' + d.price[1]);
  });
  missing.forEach(function (m) { console.log('  ▸ 已删除的行: ' + m); });
  added.forEach(function (m) { console.log('  ▸ 新增的行: ' + m); });
  console.log('  漂移 ' + drift.length + ' · 删除 ' + missing.length + ' · 新增 ' + added.length);
  console.log('  接受某行：node tools/plan-drift.cjs --accept <planId>:<part>');
  process.exit(drift.length || missing.length || added.length ? 1 : 0);
}

/* ---------- --check ---------- */
console.log('== 漂移闸 · 配置单行改动必须显式 accept ==');
console.log('  基线 ' + baseRows.length + ' 行 · 当前 ' + curRows.length + ' 行');

chk('配置单行的原文与价格未被改动（无漂移）', drift.length === 0, { 漂移行: drift });
chk('基线里的配置单行没有被删除', missing.length === 0, { 缺失行: missing });
chk('没有新增基线之外配置单行', added.length === 0, { 新增行: added });

/* 留痕检查：accept 必须留下可核对的记录 */
const acceptBad = accepts.filter(function (a) {
  return !a.at || !a.diff || !a.note;
});
chk('每次 accept 都有留痕（时间 + diff + 说明）', acceptBad.length === 0, { 留痕不全: acceptBad });

console.log('\n结果：PASS ' + pass + ' / FAIL ' + fail);
console.log('（本闸守的是跨线传导链 #1：改配置单行 → 改目标价 → 改选件 → 改兼容性）');
console.log('（accept 只更新指纹，不做任何验证 —— 三段验证必须由审计复核）');
process.exit(fail > 0 ? 1 : 0);

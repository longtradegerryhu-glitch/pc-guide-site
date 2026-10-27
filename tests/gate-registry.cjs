/* 元闸：谁在跑？—— 保证「完工标准里点名的闸」不会从 test:all 里被悄悄删掉
 *
 * 为什么需要它（ORD-27 任务 4）：
 *   ORD-25 期间 specs-wire 与 compat 一度不在 test:all 里，于是出现
 *   「完工标准要求 specs-wire 24/0，但那道闸根本没在跑」这种自相矛盾 ——
 *   而且没有任何东西会报警，因为「闸没了」和「闸绿了」在输出上长得一样。
 *   实测过：把 test:all 里的 compat 删掉，npm run test:all 照样 exit 0。
 *
 * 判据：读 package.json 的 scripts["test:all"]，逐个检查必须出现的脚本路径。
 *   这不是「检查代码对不对」，是「检查有没有在检查」——
 *   所以它自己也必须挂在 test:all 里（自指，允许且必须）。
 *
 * 跑法：node tests/gate-registry.cjs
 * 退出码：任一必需闸缺失 → exit 1
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkgPath = path.join(ROOT, 'package.json');

let pass = 0, fail = 0;
const chk = (name, cond, actual) => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} :: ${JSON.stringify(actual)}`); }
};

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  console.error('  FAIL 读不到 package.json :: ' + e.message);
  process.exit(1);
}
const scripts = pkg.scripts || {};

/* 必须出现在 test:all 里的闸。少一个，那条验收标准就成了空话。 */
const REQUIRED = [
  'tests/selftest-mutation.cjs',
  'tests/audit-search.cjs',
  'tests/specs-wire.cjs',
  'tests/compat.cjs',
  'tests/e2e-merge.cjs',
  'tests/e2e-inject-test.cjs',
  'tools/check-wr-refs.cjs',
  /* 漂移闸：改配置单行 → 改目标价 → 改选件 → 改兼容性（跨线传导链 #1） */
  'tools/plan-drift.cjs',
  /* 承诺兑现闸：页面上说的功能必须真的存在（2026-10-27 总控自评产物） */
  'tests/promises.cjs',
  /* 自指：元闸不跑，就等于没人看着「闸有没有被删」 */
  'tests/gate-registry.cjs'
];

console.log('== 元闸 · test:all 里必须有谁 ==');
const allScript = String(scripts['test:all'] || '');
const norm = allScript.replace(/\\/g, '/');

console.log('  test:all = ' + (allScript || '（不存在）'));

REQUIRED.forEach(function (p) {
  const inScript = norm.indexOf(p) > -1;
  const exists = fs.existsSync(path.join(ROOT, p));
  chk('test:all 包含 ' + p, inScript && exists,
    { 在test_all里: inScript, 文件存在: exists, 提示: inScript ? '文件不存在' : '这道闸被从 test:all 里删掉了' });
});

/* 反过来：test:all 里出现的每个 .cjs，文件都得真的存在（防手滑拼错路径） */
const mentioned = (norm.match(/[\w./-]+\.cjs/g) || []).filter(function (x) {
  return x.indexOf('tests/') === 0 || x.indexOf('tools/') === 0;
});
const ghosts = mentioned.filter(function (p) { return !fs.existsSync(path.join(ROOT, p)); });
chk('test:all 里点到的 .cjs 全部真实存在（' + mentioned.length + ' 个）', ghosts.length === 0, { 不存在的路径: ghosts });

/* 主验收尺子是独立入口，不在 test:all 里，但必须存在且指向正确的文件 */
const userScript = String(scripts['test:user'] || '');
chk('存在 test:user 且指向 tests/user-tasks.cjs',
  userScript.indexOf('tests/user-tasks.cjs') > -1 && fs.existsSync(path.join(ROOT, 'tests/user-tasks.cjs')),
  { 'test:user': userScript || '（不存在）' });

/* test:user 不该混进 test:all：尺子跑一次要起 4 个 jsdom，混进去会让每次跑闸都慢十倍，
   而且它是「验收」不是「回归」—— 混在一起就分不清红了是改坏了还是本就没做完。 */
chk('test:user 没有被塞进 test:all', norm.indexOf('user-tasks.cjs') === -1, { 'test:all': allScript });

console.log(`\n结果：PASS ${pass} / FAIL ${fail}`);
process.exit(fail > 0 ? 1 : 0);

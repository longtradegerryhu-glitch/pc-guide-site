/* wr 引用一致性闸（ORD-15 §1）
 *
 * 为什么需要这道闸：
 *   a6bd882 的 message 写 `wr-20261022-reco-fix`、635e16e 写 `wr-20261022-reco-fix2`，
 *   但 git show --name-only 里两个 commit 都没有任何 wr 文件 —— commit message 承诺了
 *   一份不存在的验收凭证。这不是笔误，是「凭证造假」，靠自觉守不住，只能靠机检。
 *
 * 查两件事：
 *   1. 每个 message 以 wr-* 开头的 commit，仓库根必须存在同名 .md 且**已被 git 跟踪**
 *      （写了不提交，等于还是没有）
 *   2. 基线外的缺失一律 FAIL；基线内的缺失是已登记的历史欠账，只报数不拦
 *
 * 基线：tools/wr-ref-baseline.json，逐条记 "hash name" + 原因。
 *   历史欠账不清零的理由：那 10 个（2026-10-11~10-19）的材料已不可考，补写就是编造；
 *   编一份假记录去满足机检，比留着缺口更坏。所以登记清楚，让缺口可见。
 *
 * 跑法：npm run audit:wr
 *       npm run audit:wr -- --list      列出全部缺失（含基线内）
 *       npm run audit:wr -- --write-baseline  把当前缺失重写进基线（需人工复查 diff）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const BASELINE = path.join(__dirname, 'wr-ref-baseline.json');
const LIMIT = 400;
const GITS = ['git', 'C:/Program Files/Git/cmd/git.exe', '/usr/bin/git'];

function git(args) {
  for (const g of GITS) {
    const r = spawnSync(g, args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (!r.error && r.status === 0) return r.stdout;
  }
  return null;
}

const argv = process.argv.slice(2);
const LIST = argv.includes('--list');
const WRITE = argv.includes('--write-baseline');

console.log('== wr 引用一致性（commit message 承诺的文件必须真实存在）==');

const log = git(['log', '--pretty=format:%H%x09%ad%x09%s', '--date=short', '-n', String(LIMIT)]);
if (log == null) {
  console.error('  FAIL 读不到 git log（找不到 git 可执行文件）');
  process.exit(2);
}

const tracked = new Set(
  (git(['ls-files', '*.md']) || '').split('\n').filter(Boolean).map(s => s.replace(/\\/g, '/'))
);

const refs = [];
for (const line of log.split('\n')) {
  if (!line) continue;
  const parts = line.split('\t');
  const hash = parts[0];
  const date = parts[1] || '';
  const subj = parts.slice(2).join('\t');
  const m = /^(wr-[A-Za-z0-9._-]+)/.exec(subj);
  if (!m) continue;
  const name = m[1] + '.md';
  const exists = fs.existsSync(path.join(REPO, name));
  refs.push({ hash, date, name, exists, tracked: tracked.has(name) });
}

if (!refs.length) {
  console.log('  PASS 最近 ' + LIMIT + ' 条 commit 里没有 wr- 引用');
  process.exit(0);
}

let baseline = { entries: {} };
try { baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8')); } catch (e) {}
if (!baseline.entries) baseline.entries = {};
const key = r => r.hash + ' ' + r.name;

/* 三种不健康状态 */
/* a) 文件根本没建 */
/* b) 文件存在但没进 git（写了不提交 = 照样拿不到凭证） */
const missing = refs.filter(r => !r.exists);
const untracked = refs.filter(r => r.exists && !r.tracked);
let fresh = [];
let known = [];

if (WRITE) {
  const entries = {};
  missing.forEach(r => {
    const old = baseline.entries[key(r)];
    entries[key(r)] = old || {
      name: r.name,
      date: r.date,
      why: r.date <= '2026-10-19' ? '补写材料已不可考（不在当前仓库与 FEEDBACK 归档中），补写＝编造' : '有 FEEDBACK 归档可回溯，待总控决定是否补写'
    };
  });
  fs.writeFileSync(BASELINE, JSON.stringify({ note: 'wr 引用一致性闸的历史欠账。新增缺失不在基线内 → 闸门 FAIL。', entries }, null, 1) + '\n');
  console.log('  已写入基线，共 ' + Object.keys(entries).length + ' 条历史欠账');
  /* 写完立刻重载：否则下面的判定还拿旧基线，会把刚登记的去当成新增缺失 */
  baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
}

/* 基线重载之后再判：否则 --write-baseline 刚登记的那批会被自己当成新增缺失 */
fresh = missing.filter(r => !Object.prototype.hasOwnProperty.call(baseline.entries, key(r)));
known = missing.filter(r => Object.prototype.hasOwnProperty.call(baseline.entries, key(r)));

if (LIST) {
  console.log('\n  —— 全部缺失清单（' + missing.length + ' 条）——');
  missing.forEach(r => {
    const inBase = Object.prototype.hasOwnProperty.call(baseline.entries, key(r));
    console.log('   ' + r.date + '  ' + r.hash.slice(0, 7) + '  ' + r.name + '  ' + (inBase ? '[基线内]' : '[** 未登记 **]'));
  });
  console.log('');
}

let bad = 0;

if (fresh.length) {
  bad += fresh.length;
  console.log('  FAIL 新增 ' + fresh.length + ' 处 wr 引用找不到文件（基线外，必须补）');
  fresh.forEach(r => console.log('       ' + r.date + '  ' + r.hash.slice(0, 7) + '  ' + r.name));
} else {
  console.log('  PASS 基线外没有新的 wr 引用缺失');
}

if (untracked.length) {
  bad += untracked.length;
  console.log('  FAIL ' + untracked.length + ' 个 wr 文件存在但未进 git（等于没交付）');
  untracked.forEach(r => console.log('       ' + r.name));
} else {
  console.log('  PASS 已存在的 wr 文件全部已被 git 跟踪');
}

if (known.length) {
  console.log('  —— 基线内历史欠账 ' + known.length + ' 条（不拦，但必须可见）——');
  if (LIST) known.forEach(r => console.log('       ' + r.date + '  ' + r.hash.slice(0, 7) + '  ' + r.name + '  —  ' + baseline.entries[key(r)].why));
  else console.log('       跑 npm run audit:wr -- --list 看明细');
} else {
  console.log('  PASS 基线内没有遗留欠账');
}

console.log('\n结果：PASS ' + (refs.length - bad > 0 ? refs.length - bad : 0) + ' / FAIL ' + bad +
  '（共 ' + refs.length + ' 处 wr 引用；历史欠账 ' + known.length + ' 条已登记）');
process.exit(bad ? 1 : 0);

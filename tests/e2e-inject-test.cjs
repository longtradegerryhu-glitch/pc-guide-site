/* 端到端污染注入测试 —— 真的往 models-data.js 里塞一条重复，验证 npm test 会 FAIL
 *
 * 跑法：node tests/e2e-inject-test.cjs
 * 退出码：0 = 注入时失败(正确) 且恢复后通过(正确)；1 = 任一环节不符合预期
 *
 * 与 selftest-mutation.cjs 的区别：
 *   selftest 是内存里改对象，验证"断言逻辑"有效；
 *   本脚本是改真实文件再跑完整 runner，验证"整条链路"有效（含数据加载、统计、退出码）。
 *
 * 安全性：原文先备份到内存与磁盘，finally 恢复并校验 md5。中途异常也会恢复。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..') + path.sep;
const TARGET = ROOT + 'js/models-data.js';
const BACKUP = ROOT + 'tests/.models-data.backup.js';

const md5 = buf => crypto.createHash('md5').update(buf).digest('hex');

function runAudit() {
  const r = spawnSync(process.execPath, [ROOT + 'tests/audit-search.cjs'], {
    encoding: 'utf8', timeout: 120000, env: { ...process.env }
  });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

const original = fs.readFileSync(TARGET);
const origMd5 = md5(original);
fs.writeFileSync(BACKUP, original);

let pass = 0, fail = 0;
const chk = (name, ok, extra) => {
  if (ok) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${extra ? ' :: ' + extra : ''}`); }
};

let restored = false;
function restore() {
  if (restored) return;
  fs.writeFileSync(TARGET, original);
  restored = true;
  const nowMd5 = md5(fs.readFileSync(TARGET));
  if (nowMd5 !== origMd5) console.log(`  ⚠ 恢复后 md5 不一致：${nowMd5} vs ${origMd5}`);
  try { fs.unlinkSync(BACKUP); } catch (e) {}
}

try {
  /* ---------- 基线：干净时应 PASS ---------- */
  console.log('== 步骤 1：干净数据应通过 ==');
  const clean = runAudit();
  chk('干净数据 exit 0', clean.code === 0, 'exit=' + clean.code);
  chk('干净数据输出含 PASS', /FAIL 0/.test(clean.out), clean.out.slice(-120));

  /* ---------- 注入：在 cpu 数组末尾塞一条已有的 9600X ---------- */
  console.log('\n== 步骤 2：注入一条重复（同型号第 3 条）==');
  let text = original.toString('utf8');
  /* 定位 cpu 数组中已知存在的一条，复制成新 id */
  const anchor = /\{ id: "u4",[^}]*\}/;
  const m = text.match(anchor);
  if (!m) throw new Error('找不到注入锚点 u4，请更新本脚本的锚点');
  const injected = m[0].replace('id: "u4"', 'id: "E2E_INJECT_DUP"');
  text = text.replace(m[0], m[0] + ',\n  ' + injected);
  fs.writeFileSync(TARGET, text, 'utf8');
  console.log('  已注入 id=E2E_INJECT_DUP（与 u4 同品牌同型号）');

  /* ---------- 污染后必须 FAIL ---------- */
  const dirty = runAudit();
  chk('注入后 exit 1（不许静默通过）', dirty.code === 1, 'exit=' + dirty.code);
  chk('注入后报出 dup:extra FAIL', /重复条目总数/.test(dirty.out) && /FAIL 重复条目总数/.test(dirty.out),
    (dirty.out.match(/FAIL [^\n]*/g) || []).join(' / '));
  chk('注入后报出 dup:max FAIL', /FAIL 单型号最多出现/.test(dirty.out),
    (dirty.out.match(/FAIL [^\n]*/g) || []).join(' / '));
  console.log('  —— 注入后的 FAIL 行 ——');
  (dirty.out.match(/^ {2}FAIL .*$/gm) || []).forEach(l => console.log('  ' + l.trim()));

  /* ---------- 恢复 ---------- */
  restore();
  console.log('\n== 步骤 3：恢复后应重新通过 ==');
  chk('恢复后文件 md5 与原始一致', md5(fs.readFileSync(TARGET)) === origMd5);
  const after = runAudit();
  chk('恢复后 exit 0', after.code === 0, 'exit=' + after.code);
  chk('恢复后 FAIL 0', /FAIL 0/.test(after.out), after.out.slice(-120));

} catch (e) {
  console.error('\n异常：' + e.message);
  fail++;
} finally {
  restore();
  console.log(`\n结果：PASS ${pass} / FAIL ${fail}`);
  console.log(restored ? '文件已恢复原状。' : '⚠ 恢复失败，请检查 js/models-data.js！');
  process.exit(fail > 0 ? 1 : 0);
}
